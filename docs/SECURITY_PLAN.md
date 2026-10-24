# Security Plan & Threat Modeling: Smart Hostel & Mess Management System

> **Document Version**: 1.0.0  
> **Status**: Approved for Technical Planning (Phase 1)  
> **Security Objective**: Proactive defense-in-depth, zero client trust, and comprehensive threat mitigation.

---

> [!CAUTION]
> **Architectural Notice**:  
> Documenting security policies does not automatically make an application secure. True security requires rigorous implementation, continuous automated testing, automated static analysis (SAST), penetration testing, and hardened infrastructure deployment. This document defines the threat baseline, planned controls, and the verification checklist to be executed in subsequent phases.

---

## 1. Threat Modeling (STRIDE Methodology)

The system manages sensitive student personally identifiable information (PII), academic records, financial transactions, and physical residency data. Below is our threat analysis mapped to the **STRIDE** model:

| Threat Category | Specific System Risk | Threat Vector & Impact | Proposed Architectural Countermeasure |
| :--- | :--- | :--- | :--- |
| **Spoofing Identity** | Attacker impersonates a student or administrator | Brute force or credential stuffing on `/api/v1/auth/login`. Interception of activation tokens. | Argon2id memory-hard password hashing; strict rate limiting (5 attempts/15 min); single-use SHA-256 hashed activation tokens with 72-hour expiration; rotating JWT refresh tokens with reuse detection. |
| **Tampering with Data** | Student tampers with dues balance, room assignment, or lunch selection after cutoff | Client modifies `amountPaid` or `balanceDue` in HTTP payload; student scripts requests to change lunch from Dine-in to Tiffin at 11:30 AM. | Zero client trust: balances dynamically computed by server ledger; Zod schemas strictly strip unauthorized fields; meal selection cutoff strictly validated against server clock; changes post-cutoff require admin override logged in `auditLogs`. |
| **Repudiation** | Administrator denies changing meal selection or reversing a fee payment | Rogue or mistaken staff member overrides dining count or edits records without auditability. | Immutable `auditLogs` collection capturing actor ID, timestamp, IP address, previous value, new value, and mandatory reason for all sensitive overrides and reversals. Append-only financial ledger. |
| **Information Disclosure** | IDOR vulnerability exposes Aadhaar, PAN, or financial receipts of other residents | Malicious student calls `GET /api/v1/profile/documents/doc_999` or `GET /api/v1/finances/receipts/REC-1002`. | `verifyOwnershipOrAdmin` middleware validates that the authenticated token matches the requested resource owner; complete Aadhaar/PAN/bank numbers masked at service layer (`XXXX-XXXX-1234`); documents served through authenticated streams, never static public folders. |
| **Denial of Service (DoS)** | Concurrent student admissions flood system, causing duplicate IDs or crashing database | Hundreds of students submit room allocations simultaneously during admission day; attackers flood file uploads with large files. | Atomic MongoDB `$inc` counters; multi-document ACID transactions with concurrency locks; `express-rate-limit`; strict 5MB upload limits and memory buffers via Multer. |
| **Elevation of Privilege** | Student grants themselves `HOSTEL_ADMIN` role or approves own leave request | Student injects `{ "role": "HOSTEL_ADMIN" }` or `{ "status": "APPROVED" }` into `PATCH /api/v1/profile/me` or `/api/v1/leave/app_123`. | Backend Zod schemas reject unknown fields; role assignments are completely excluded from profile update schemas; endpoint authorization asserts exact required permissions derived from verified JWT. |

---

## 2. Comprehensive Security Controls

### 2.1 Cryptographic & Password Standards
* **Algorithm**: **Argon2id** (configured with memory cost 64MB, time cost 3 iterations, parallelism 4 threads) or **bcrypt** (salt rounds: 12) if Argon2 binary bindings are unavailable in a restricted evaluation environment.
* **Token Hashing**:
  * One-time activation tokens and password reset tokens are generated as 32-byte cryptographically secure random values (`crypto.randomBytes(32).toString('hex')`).
  * Only the SHA-256 hash (`crypto.createHash('sha256').update(rawToken).digest('hex')`) is persisted in the database. If the database is compromised, the attacker cannot use the stored hashes to activate accounts or reset passwords.
* **JWT Signing & Rotation**:
  * Access tokens signed using HMAC-SHA256 (`HS256`) with a 64-character high-entropy secret (`JWT_ACCESS_SECRET`).
  * Refresh tokens signed with a distinct secret (`JWT_REFRESH_SECRET`) and stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
  * Refresh token rotation with breach detection: any presentation of a revoked refresh token triggers immediate session termination across all devices for that user.

---

### 2.2 Input Validation & Injection Mitigation
* **Schema Enforcement**: Every incoming request payload (body, query, params) must pass through a strict **Zod** validator before reaching the controller.
* **Strict Stripping**: Zod schemas use `.strict()` or `.strip()`, ensuring unapproved fields (e.g., `role`, `isAdmin`, `isPaid`) are purged.
* **NoSQL Injection Defense**:
  * Mongoose schemas enforce typed casting (preventing `{ "$gt": "" }` query object injection).
  * Input sanitization converts any user-supplied query parameters to primitive types (`String`, `Number`, `Boolean`).

---

### 2.3 File Upload Security & Privacy Protection
* **Storage Isolation**: Files are saved to a protected directory outside the web server's static root (`./uploads/private/`), or private cloud object storage (S3).
* **MIME Type & Magic Byte Validation**:
  * File extensions can be spoofed (e.g., renaming `malware.exe` to `photo.jpg`).
  * Upload validation checks both the `Content-Type` header and the file's binary signature (magic bytes) to ensure only valid JPEG, PNG, WEBP, and PDF files are ingested.
* **Filename Sanitization**: Original client filenames are discarded. Files are renamed using UUIDv4 (`${uuidv4()}.${extension}`) to eliminate Path Traversal (`../../etc/passwd`) attacks.
* **Restricted Serving**: KYC and complaint attachments are served via an authenticated streaming endpoint (`GET /api/v1/profile/documents/:id`) that enforces ownership or admin authorization.

---

### 2.4 Race Condition & Concurrency Hardening
* **Atomic Bed Allocations**: Allocations and room transfers run inside MongoDB multi-document transactions (`session.withTransaction()`).
  * The transaction explicitly queries the bed status with the session active.
* **Atomic Student ID Increment & Auto-Expanding Sequence**: Counter generation leverages atomic `$inc` on `studentIdCounters` with upsert race-condition retries. The monthly sequence is strictly monotonically increasing and **never rolled back**. When registrations in a month exceed 999, the sequence expands automatically (`STU-YYYYMM1000`, `STU-YYYYMM1001`, ...) without rejection. Unique partial index on `users.studentId` guarantees database-level uniqueness for students while allowing administrator and staff accounts without student IDs.

---

### 2.5 HTTP Security Hygiene
* **Helmet.js**: Sets security headers including `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (HSTS), and `Content-Security-Policy`.
* **CORS Whitelist**: Configured to accept requests exclusively from the designated client origin (`CLIENT_ORIGIN=http://localhost:5173` in development). `Access-Control-Allow-Credentials: true` enabled for secure cookie transmission.
* **Rate Limiting**:
  * Global API: 100 requests / 15 minutes per IP.
  * Authentication endpoints (`/login`, `/activate`, `/refresh`): 5 requests / 15 minutes per IP/identifier.

---

## 3. Verification & Security Testing Checklist

This checklist must be executed during development and verified before production release:

### Authentication & Session Security
- [ ] Attempting to login with wrong password 5 times triggers HTTP `429 Too Many Requests` (Rate limit verification).
- [ ] Attempting to reuse an expired activation token returns HTTP `400 Bad Request`.
- [ ] Attempting to activate an account with a password missing special characters fails Zod validation.
- [ ] Refresh token cookie has `HttpOnly: true`, `SameSite: Strict`, and `Path: /api/v1/auth`.
- [ ] Manually replaying a previously consumed refresh token invalidates all active sessions for that user (Reuse detection).

### Authorization & IDOR Resistance
- [ ] Student A attempting to call `GET /api/v1/profile/:studentB_Id` receives HTTP `403 Forbidden`.
- [ ] Student A attempting to call `GET /api/v1/finances/receipts/:studentB_Receipt` receives HTTP `403 Forbidden`.
- [ ] Student A attempting to stream Student B's KYC document receives HTTP `403 Forbidden`.
- [ ] Student attempting to call `POST /api/v1/allocations` receives HTTP `403 Forbidden` (`ROLE_PERMISSIONS` check).
- [ ] Student attempting to pass `"role": "HOSTEL_ADMIN"` in `PATCH /api/v1/profile/me` finds the field stripped with no privilege escalation.

### Business Logic & Tampering Defense
- [ ] Submitting lunch selection after configured cutoff time (e.g., 09:31 AM) returns HTTP `422 Unprocessable Entity`.
- [ ] Admin overriding lunch selection successfully creates an entry in `auditLogs` containing the previous selection, new selection, and mandatory reason.
- [ ] Student checkout with outstanding balance > 0 is blocked with HTTP `422 Unprocessable Entity`.
- [ ] Attempting to record a payment with an already-used bank reference number fails with HTTP `409 Conflict`.
- [ ] Client attempting to pass a fabricated `outstandingBalance` in payment requests is ignored (server computes balance).

### Concurrency & Data Integrity
- [ ] Two simultaneous requests allocating the same bed result in exactly 1 success (`201 Created`) and 1 conflict (`409 Conflict`).
- [ ] 20 simultaneous student registrations within a month generate strictly sequential, non-colliding `STU-YYYYMM` IDs with zero duplicates.

### File Upload Hardening
- [ ] Uploading an `.exe` renamed to `.jpg` is rejected by magic byte inspection.
- [ ] Uploading a file > 5 MB is rejected with HTTP `400 Bad Request`.
- [ ] Uploaded files are given UUID filenames and stored outside the public document root.
- [ ] Uploaded files cannot be accessed via direct static URLs.

---

## 4. What Still Needs Verification (Post-Phase 1)

While this plan covers architectural defenses, the following must be verified once code is implemented:
1. **Automated Penetration Test Suite**: Integration tests simulating IDOR, SQL/NoSQL injection, and JWT tampering using tools like Jest / Supertest.
2. **Dynamic Application Security Testing (DAST)**: Running OWASP ZAP against the running Express application.
3. **Static Code Analysis (SAST)**: Configuring `npm audit` and SonarQube / ESLint security plugins to catch vulnerable dependencies or unsafe regexes.
4. **Environment Secret Audits**: Ensuring no `.env` files, production database connection strings, or JWT secrets are ever committed to GitHub.

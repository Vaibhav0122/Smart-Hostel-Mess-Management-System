# Requirements Specification: Smart Hostel & Mess Management System

> **Document Version**: 1.0.0  
> **Target Audience**: BTech CSE-AIML Engineering Team, Mentors, Evaluators  
> **Status**: Approved for Technical Planning (Phase 1)

---

## 1. System Vision & Objective

The **Smart Hostel & Mess Management System** is a unified, secure web platform engineered to eliminate paper-based hostel logs, optimize dining hall meal planning to prevent massive food waste, maintain auditable financial records, and streamline student residence logistics.

### 1.1 Key Stakeholders
* **Hostel Residents (Students)**: Need transparent access to room contracts, dues records, meal selection, maintenance ticketing, and leave requests without visiting office staff in person.
* **Hostel Wardens / Administrators**: Require real-time operational visibility over occupancy, bed allocation, bulk onboarding, meal forecasting, complaint dispatching, and gate security.
* **Mess Catering Staff**: Require exact, reliable headcounts for daily dining (Dine-in vs. Packed Tiffin) before preparation deadlines.
* **Institutional Accounts Team**: Require an immutable financial ledger tracking rent, security deposits, and adjustments without manual calculation errors.

---

## 2. Functional Requirements by Module

### Module 1: Initial System Setup & Administrator Bootstrap
* **FR-1.1 (Secure Bootstrap)**: The system must provide a one-time bootstrap mechanism (`POST /api/v1/setup/initial-admin`) guarded by a high-entropy secret (`ADMIN_SETUP_SECRET`) configured via environment variables.
* **FR-1.2 (Default Credential Prohibition)**: No hardcoded admin credentials or default passwords shall ever exist in source code or database seed files.
* **FR-1.3 (Permanent Route Sealing)**: Once the initial Super Admin / Warden account is created, the bootstrap endpoint must immediately and permanently lock down, returning HTTP `403 Forbidden` on all subsequent attempts.

---

### Module 2: Student Registration, Onboarding & CSV Bulk Import
* **FR-2.1 (Individual Registration)**: Authorized administrators can register an individual student by providing their full name, email, phone number, academic branch, and optional hostel assignment.
* **FR-2.2 (Standardized Student ID Generation)**:
  * Student IDs must strictly follow the format: `STU-YYYYMM` followed by a sequential number (e.g., `STU-202610001` for the first student registered in October 2026).
  * `YYYY` represents the 4-digit registration year.
  * `MM` represents the 2-digit zero-padded registration month (`01`–`12`).
  * The monthly sequence starts zero-padded to at least 3 digits (`001` through `999`), and automatically expands beyond three digits (`1000`, `1001`, ...) when monthly registrations exceed 999.
* **FR-2.3 (Atomic Counter & Concurrency Protection)**:
  * Generation of the sequential number relies on MongoDB's atomic `findOneAndUpdate` with `$inc` on the `studentIdCounters` collection.
  * First-time month counter upsert race conditions (`E11000`) are handled safely with an automated retry loop (up to 3 attempts).
  * The database enforces a **unique partial index** on `users.studentId` with `{ partialFilterExpression: { studentId: { $type: "string" } } }`, guaranteeing student ID uniqueness while permitting administrators and staff to exist without student IDs.
* **FR-2.4 (Automatic Sequence Expansion & ID Permanence)**:
  * The monthly sequence automatically expands beyond 3 digits (`1000`, `1001`, ...) when registrations exceed 999. Registrations are never rejected due to sequence overflow.
  * **Never Reuse Issued IDs**: Once an ID is generated and issued, it is strictly permanent and never reused, rolled back, or decremented under any circumstance (even if a registration fails or is cancelled later in the workflow), ensuring monotonic audit safety.
* **FR-2.5 (Bulk CSV Import with Two-Stage Validation)**:
  * **Stage 1 (Upload & Validate)**: The admin uploads a `.csv` file. The backend parses and validates all rows against a strict Zod schema (headers, required fields, email formats, phone length).
  * **Stage 2 (Dry-Run Preview & Error Reporting)**: The API returns a preview response detailing:
    1. Valid rows ready for ingestion.
    2. Invalid rows with exact row numbers and field-level failure reasons.
    3. Duplicate detection against existing database emails or student IDs (Note: phone numbers are permitted to be shared across family members).
  * **Stage 3 (Atomic Commit)**: The admin confirms the import. Valid records are committed within an isolated batch, and accounts are staged for activation.
* **FR-2.6 (Data Privacy in Listing)**: Admin listing endpoints must support pagination, search, and field-filtering to prevent leaking all student PII in single bulk API responses.

---

### Module 3: Authentication & Account Activation Lifecycle
* **FR-3.1 (First-Time Activation Token Flow)**:
  * When an admin creates a student record, the student account is initialized in `PENDING_ACTIVATION` status with no password set.
  * The system generates a cryptographically random, 32-byte hexadecimal token.
  * The raw token is hashed (SHA-256) and saved in the database with an expiration timestamp (`ACTIVATION_TOKEN_TTL_HOURS`, default: 72 hours). The raw token is never stored in the database.
* **FR-3.2 (Activation Delivery & Local Dev Fallback)**:
  * In production, the activation link (`https://<domain>/activate?token=<raw_token>`) is dispatched via email to the student's registered unique email address.
  * In local development (`NODE_ENV=development` with `EMAIL_PROVIDER=development_log`), the activation link is output solely to secure developer logs or a dedicated inspection API, preventing accidental disclosure in production logs.
* **FR-3.3 (Password Creation & Token Invalidation)**:
  * The student submits their new permanent password along with the raw activation token.
  * The system verifies token expiration, matches the SHA-256 hash, enforces strong password complexity (min 8 chars, uppercase, lowercase, number, symbol), stores the hashed password using Argon2id (default) or bcrypt (optional for documented compatibility), sets account status to `ACTIVE`, and atomically clears the activation token.
  * Phone numbers are never accepted as proof of identity to bypass or substitute this tokenized cryptographic activation flow.
* **FR-3.4 (Standard Login)**:
  * Subsequent logins require `studentId` and `password` (or `email` and `password` for administrators). Phone numbers are strictly treated as contact profile fields, never as authentication secrets.
* **FR-3.5 (Dual-Token Session Architecture)**:
  * Upon successful authentication, the server issues:
    1. **Short-lived Access Token**: JWT with a 15-minute lifespan, transmitted in client memory or Authorization header.
    2. **Long-lived Refresh Token**: Signed JWT with a 7-day lifespan, stored in a secure, `HttpOnly`, `SameSite=Strict` cookie, with its hash recorded in the database.
* **FR-3.6 (Token Rotation & Reuse Detection)**:
  * Each refresh operation generates a new refresh token and invalidates the previous token.
  * If a revoked or previously used refresh token is presented, the system detects a potential token-theft breach and revokes all active sessions for that user.
* **FR-3.7 (Brute-Force & Rate Limiting)**:
  * Authentication endpoints (`/login`, `/activate`, `/refresh`) are strictly rate-limited (e.g., maximum 5 attempts per 15-minute window per IP/account).

---

### Module 4: Student Profile & KYC Management
* **FR-4.1 (Field Classification & Access Segregation)**:
  * **Student-Editable Fields**: Full Name, Alternate Phone, Current/Permanent Address, Blood Group, Dietary Preferences, Emergency Contact Name & Phone, Profile Picture.
  * **Admin-Only / Read-Only Fields**: `role`, `studentId`, `academicRollNumber`, `branch`, `hostelId`, `roomId`, `bedId`, `contractStatus`, `paymentStatus`, `accountStatus`.
  * **Phone Number Policy**: Registered phone numbers are non-unique in `studentProfiles` to permit family members or siblings residing in the hostel to share a primary family contact phone number. Account ownership and authentication are verified independently through unique credentials (`studentId`, `email`) and password hashes.
* **FR-4.2 (Zero Trust Client Validation)**: Any client attempt to inject admin-only fields in profile update payloads is strictly stripped and rejected by backend Zod schemas.
* **FR-4.3 (KYC Document Handling & Privacy)**:
  * Optional student verification may collect Aadhaar, PAN, or Institutional ID documents.
  * Full Aadhaar or PAN numbers must never be displayed in general API responses. The API returns strictly masked values (e.g., `XXXX-XXXX-1234`).
  * Documents must be uploaded through a controlled storage abstraction, validated for magic-byte MIME types (PDF, JPEG, PNG) and file size (max 5 MB).
  * Direct public directory access to KYC documents is strictly forbidden. Files are served through authenticated streaming routes (`GET /api/v1/profile/documents/:docId`) subject to role and ownership authorization checks.

---

### Module 5: Hostel, Building, Room, Bed & Allocation Logistics
* **FR-5.1 (Structural Hierarchy)**:
  * The infrastructure models: **Hostel (Campus/Property) -> Building / Wing -> Floor -> Room -> Bed**.
* **FR-5.2 (Inventory Metadata & Capacity Invariant)**:
  * Rooms capture room number, floor, room type (Single, Double, Triple, Four-Bed), base monthly fee, capacity (1, 2, 3, 4), occupied bed count, and operational status (`AVAILABLE`, `FULL`, `UNDER_MAINTENANCE`, `DECOMMISSIONED`).
  * Beds capture unique identifiers within the room (e.g., Bed A, Bed B) and allocation status (`VACANT`, `OCCUPIED`, `UNDER_MAINTENANCE`, `BLOCKED`).
  * **Capacity Invariant**: The count of physical beds configured for any room must strictly match its capacity: `count(beds) === room.capacity`, and `0 <= occupiedBeds <= capacity`.
* **FR-5.3 (Three-Tier Allocation Defense & Concurrency Protection)**:
  * Bed allocations must execute inside a MongoDB multi-document transaction (`session.startTransaction()`).
  * **Tier 1 (Application Validation)**: Verifies target bed is `VACANT`, target room is `AVAILABLE`, and student has no active allocation.
  * **Tier 2 (ACID Database Transaction)**: Updates bed status to `OCCUPIED`, increments room `occupiedBeds`, inserts `bedAllocations` record, and updates the contract atomically. If concurrent requests target the same bed, MongoDB's write-conflict detection rolls back one transaction cleanly.
  * **Tier 3 (Database Partial Unique Indexes)**: Engine-level partial unique indexes on `bedAllocations` (`{ bedId: 1 }` and `{ studentId: 1 }` with `{ status: "ACTIVE" }`) guarantee it is physically impossible for a bed to be double-allocated or for a student to hold two active beds.
* **FR-5.4 (Safe Room Transfer Protocol)**:
  * Room transfers execute atomically inside an ACID transaction: previous allocation status is set to `TRANSFERRED` (`endDate = now()`), previous bed set to `VACANT`, previous room occupancy decremented, target bed set to `OCCUPIED`, target room occupancy incremented, new active `bedAllocations` record created, and contract updated.
* **FR-5.5 (Check-In & Safe Checkout Procedure)**:
  * Physical check-in and check-out timestamps are recorded in UTC.
  * **Checkout Dues Gate**: Final checkout is strictly blocked if the student's dynamic ledger balance is greater than zero (`outstandingBalance > 0`).
  * Upon checkout approval, an atomic transaction transitions the active allocation to `CHECKED_OUT` (`endDate = now()`), releases the bed to `VACANT`, decrements room occupancy, marks the contract `COMPLETED`, and initiates security deposit refund workflows.
  * **Allocation History Preservation**: `bedAllocations` records are permanent and append-only. They are never deleted, ensuring full auditability of past room residencies.

---

### Module 6: Contract & Residency Tenure Management
* **FR-6.1 (Contract Lifecycle)**:
  * Every admitted student is bound to a `contracts` document defining `startDate`, `endDate`, `tenureMonths`, `lockInDate`, `noticePeriodDays` (default: 30 days), and `status` (`DRAFT`, `ACTIVE`, `EXIT_REQUESTED`, `COMPLETED`, `TERMINATED`).
* **FR-6.2 (Student Exit Request Protocol)**:
  * A resident student can submit an exit request specifying their planned exit date and reason.
  * The system verifies if the planned exit date violates the agreed `lockInDate` or `noticePeriodDays`, calculating any applicable early-termination penalty or forfeit amount for admin review.
* **FR-6.3 (Financial Dues Clearance Verification)**:
  * An administrator cannot approve an exit request or execute final checkout until the system verifies that the student's outstanding financial balance in the ledger is exactly zero (`outstandingBalance <= 0`).
* **FR-6.4 (Checkout Automation)**:
  * Upon admin approval of checkout, the contract status transitions to `COMPLETED`, the assigned bed is atomically released to `VACANT`, and security deposit refund workflows are initiated.

---

### Module 7: Payment Management & Financial Ledger
* **FR-7.1 (Double-Entry Inspired Transaction Ledger & Mutability Boundaries)**:
  * Financial records are separated into:
    1. `chargeRecords`: Represents debits / receivables billed to the student (Monthly Rent, Security Deposit, Mess Fees, Late Fines, Damage Penalties, Credit Waivers).
    2. `paymentTransactions`: Represents credits / receipts recorded against charges.
    3. `refundRecords`: Represents refund payouts (e.g. security deposit returns).
  * **Strict Immutability Rules**:
    * `paymentTransactions` and `refundRecords` are **100% immutable append-only records**. They are never updated or deleted. Corrections require an offsetting reversal transaction (`isReversal: true`, `status: "REVERSED"`, mandatory reason).
    * Billed financial amounts on `chargeRecords` (`amount`, `chargeType`, `billingPeriod`, `dueDate`) are immutable. Fees cannot be overwritten; corrections require an administrative Credit Adjustment record or setting `status: "CANCELLED"` with mandatory cancellation reason.
    * Status projection fields on `chargeRecords` (`status`, `amountPaid`) are updated **strictly inside multi-document ACID transactions** simultaneously with the recording of a `paymentTransaction`.
* **FR-7.2 (Partial Payment Tracking)**:
  * Payments may cover charges partially. The transaction atomically increments `chargeRecords.amountPaid` and transitions `status` to `PARTIALLY_PAID` (or `PAID` when fully settled).
* **FR-7.3 (Dynamic Balance Calculation)**:
  * Outstanding balance is dynamically derived from the immutable ledger on the server:
    $$\text{Outstanding Balance} = \sum_{\substack{\text{charges} \\ \text{status} \neq \text{"CANCELLED"}}} \text{amount} - \sum_{\substack{\text{payments} \\ \text{status} = \text{"SUCCESS"}}} \text{amountPaid} + \sum_{\substack{\text{payments} \\ \text{isReversal} = \text{true}}} \text{amountPaid} + \sum \text{refunds}$$
  * Client-supplied balances or payment totals are strictly rejected.
* **FR-7.4 (Receipt Generation & Verification)**:
  * Every recorded payment generates a system-verified receipt with a unique serial number (`REC-YYYYMM-XXXXX`).
  * Students can download and print receipts directly from their portal.
* **FR-7.5 (Refund Tracking)**:
  * Security deposit or excess payment refunds are modeled in `refundRecords`, linked to the original payment transaction, and require administrative approval notes.

---

### Module 8: Food & Mess Operations
* **FR-8.1 (Menu Curation & Timezone Principles)**:
  * Administrators can define day-wise, weekly rotating menus for all meal periods: `BREAKFAST`, `LUNCH`, `SNACKS`, and `DINNER`.
  * **Operational Dates & Timezones**: All meal selection and menu dates are stored as ISO local calendar date strings (`YYYY-MM-DD`) mapped to the hostel's configured IANA timezone (`applicationSettings.timezone`, e.g., `"Asia/Kolkata"`). All system timestamps are stored in UTC.
* **FR-8.2 (Daily Lunch Preference: Dine-in vs. Tiffin)**:
  * For lunch, active residential students must have a daily selection: `DINE_IN` or `TIFFIN` (packed lunch for college/internship).
* **FR-8.3 (The Default Dine-In Rule)**:
  * If a student makes no explicit selection before the cutoff time, the system automatically defaults to `DINE_IN`.
  * The database record explicitly tags whether a record was `USER_SELECTED` or `SYSTEM_DEFAULT`, ensuring kitchen reporting accuracy.
* **FR-8.4 (Selection Cutoff Time Enforcement)**:
  * Cutoff time is configurable in `applicationSettings.lunchCutoffTime` (default: `"09:30"` local hostel time).
  * To evaluate cutoff, the backend converts current UTC time `Date.now()` to the hostel's local timezone.
  * Requests for past dates or requests for today's date after the cutoff time are strictly rejected with HTTP `422 Unprocessable Entity`.
* **FR-8.5 (Authorized Administrator Overrides & Audit Trail)**:
  * In genuine emergencies (e.g., sudden student illness or schedule change), an authorized admin can override a student's meal selection after the cutoff.
  * The system mandates recording: `adminId`, `timestamp`, `previousValue`, `newValue`, and a mandatory `reasonForOverride` (logged in `auditLogs`).
* **FR-8.6 (Daily Kitchen Preparation Reports)**:
  * Administrators and mess staff can generate real-time aggregated reports for the day: total resident count, confirmed `DINE_IN` count, confirmed `TIFFIN` count, and a printable dispatch roster of students requesting tiffins with room numbers.

---

### Module 9: Complaints & Facility Maintenance
* **FR-9.1 (Grievance Submission)**:
  * Students can lodge complaints categorized under `PLUMBING`, `ELECTRICAL`, `CARPENTRY`, `MESS_FOOD`, `CLEANLINESS`, `WIFI_INTERNET`, or `OTHER`.
  * Submissions include a title, detailed description, priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and up to 3 optional photo attachments.
* **FR-9.2 (Assignment & Status Workflow)**:
  * Status transitions: `OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED` (or `REJECTED`).
  * Admins can assign complaints to specific internal or contracted technicians, accompanied by internal administrative remarks.
* **FR-9.3 (Status History Audit)**:
  * Every status transition is appended to a `statusHistory` array containing the updater's user ID, old status, new status, remarks, and timestamp.
* **FR-9.4 (Student Resolution Feedback)**:
  * Once marked `RESOLVED`, the student can rate the resolution (1 to 5 stars) and confirm whether the physical issue was satisfactorily fixed.

---

### Module 10: Student Leave & Gate Visitor Management
* **FR-10.1 (Leave Application Workflow)**:
  * Students apply for leave by specifying `leaveType` (`NIGHT_OUT`, `WEEKEND`, `VACATION`, `EMERGENCY`), `departureTime`, `expectedReturnTime`, destination address, and emergency contact confirmation.
  * Status options: `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, `COMPLETED` (checked back into hostel).
* **FR-10.2 (Parental / Emergency Notification)**:
  * For overnight leave, the system logs whether parental consent was acknowledged, with optional notification triggers.
* **FR-10.3 (Visitor Pre-Registration & Gate Check-in)**:
  * Students or admins can pre-register visitors (Visitor Name, Relationship, Contact Number, ID Proof Type, Purpose, Expected Date/Time).
  * When the visitor arrives at the gate, authorized staff record `actualCheckIn` timestamp. Upon departure, `actualCheckOut` timestamp is logged.
  * A real-time "Visitors Currently Inside" live filter is available to wardens.

---

### Module 11: Notices & Multi-Channel Notifications
* **FR-11.1 (Targeted Digital Notice Board)**:
  * Admins can publish notices with markdown content and attachments.
  * Notices can be targeted: `ALL_RESIDENTS`, `HOSTEL_SPECIFIC`, or `BUILDING_SPECIFIC`.
* **FR-11.2 (In-App Notification Dispatcher)**:
  * Events trigger persistent in-app notifications (e.g., Leave Approved, New Bill Generated, Complaint Status Updated, Lunch Cutoff Approaching).
  * Tracks `isRead` and `readAt` states.
* **FR-11.3 (Pluggable Email Notification Service)**:
  * Dispatches critical notifications (Account Activation, Fee Receipts, Leave Approvals) via email.
  * Implements an adapter pattern: operates with SMTP/SendGrid in staging/production, and falls back to a clean console logger in local development without breaking offline workflows.

---

### Module 12: Administrative Analytics & Reporting
* **FR-12.1 (Executive KPI Cards)**:
  * Real-time metrics: Total Admitted Students, Total Rooms, Occupied Beds, Vacant Beds, Current Occupancy Rate (%), Unresolved Complaints, Active Leaves Today, Visitors On-Campus, Outstanding Fee Arrears.
* **FR-12.2 (Exportable Operational Reports)**:
  * Server-side generated CSV/Excel export for:
    1. Bed Occupancy & Vacancy Directory.
    2. Monthly Fee Collection Ledger with Outstanding Arrears.
    3. Daily Kitchen Meal Preparation & Tiffin Dispatch Roster.
    4. Monthly Complaint Resolution SLA Report.

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Security & Data Protection
* **NFR-1.1 (OWASP Top 10 Mitigation)**: Zero trust validation on all inputs, parameter tampering prevention, protection against Insecure Direct Object References (IDOR), NoSQL injection mitigation via Mongoose typing, and XSS sanitization.
* **NFR-1.2 (Cryptographic Standards)**: Passwords hashed via Argon2id by default (or bcrypt with salt factor 12 for documented compatibility requirements). One-time activation tokens stored strictly as SHA-256 hashes.
* **NFR-1.3 (PII & Sensitive Data Masking)**: Complete Aadhaar, PAN, and student bank account details are never stored unencrypted or exposed in standard REST responses. Masking (e.g., `XXXX-XXXX-1234`) is applied at the service layer.
* **NFR-1.4 (HTTP Security Hygiene)**: Helmet HTTP security headers enabled, CORS restricted to designated client origins, `HttpOnly` and `SameSite=Strict` flags for refresh cookies.

### 3.2 Reliability, ACID Consistency & Concurrency
* **NFR-2.1 (Transactional Integrity)**: Multi-document MongoDB transactions (`session.withTransaction()`) are mandatory for room allocations, room transfers, student checkouts, and financial payment entries. Standalone instances are permitted only for non-transactional development; critical operations must fail safely if transaction requirements are unmet.
* **NFR-2.2 (Race Condition Elimination)**: Atomic counters (`$inc`) ensure that concurrent student admissions or meal choices can never result in duplicate identifiers or negative stock.

### 3.3 Performance & Response Times
* **NFR-3.1 (API Latency)**: 95% of standard CRUD read/write API requests must complete in under 200ms under a nominal load of 1,000 active residents.
* **NFR-3.2 (Database Indexing)**: Mandatory compound and unique indexes on foreign keys (`studentId`, `roomId`, `hostelId`, `status`) to eliminate full collection scans.
* **NFR-3.3 (Pagination)**: All collection endpoints (`/students`, `/complaints`, `/payments`, `/audit-logs`) must enforce pagination with default limit of 20 and max limit of 100 records.

### 3.4 Usability & Accessibility
* **NFR-4.1 (Responsive Design)**: Seamless user experience across mobile phones (360px+), tablets, and high-resolution desktop displays (1920px).
* **NFR-4.2 (Accessibility Standards)**: WCAG 2.1 AA compliant color contrast ratios, screen-reader friendly semantic HTML tags, keyboard navigability, and clear visual loading and error states.

---

## 4. Architectural Decisions & Alignment Review

1. **[DECISION 1: Student ID Generation & Automatic Sequence Expansion — APPROVED]**:
   * *Format*: Student IDs strictly follow `STU-YYYYMM` followed by a sequence counter starting at `001` each month (`STU-YYYYMM001` through `STU-YYYYMM999`).
   * *Automatic Expansion*: When monthly registrations reach or exceed 1,000, the sequence counter automatically expands beyond three digits (`STU-YYYYMM1000`, `STU-YYYYMM1001`, ...) without artificial registration stoppage.
   * *Never Reuse Issued IDs*: Once an ID sequence is incremented, it is strictly permanent and never rolled back or decremented, guaranteeing monotonic auditability.

2. **[DECISION 2: MongoDB Replica Set & Safe Standalone Development — APPROVED]**:
   * *Replica Set Support*: MongoDB supports replica-set multi-document ACID transactions for critical operations (room allocations, room transfers, checkouts, and financial payment settling). Production and staging environments must run replica sets.
   * *Permitted Standalone Development*: Standalone development is permitted only for non-transactional features where ACID multi-document guarantees are not required.
   * *Fail-Safe Protection*: Critical financial and room-allocation operations must fail safely with an operational error (`TRANSACTION_REPLICA_SET_REQUIRED`) if transaction requirements are unmet, preventing uncommitted or partial dirty writes.

3. **[DECISION 3: Configurable Lunch Cutoff & Timezone Policy — APPROVED]**:
   * *Configurable Policy*: Daily lunch cutoff is configurable per hostel or globally via `applicationSettings.lunchCutoffTime`, defaulting to `09:30 AM` local time (`"09:30"` in 24-hr format).
   * *Hostel Timezone Scoping*: All dining cutoff calculations use the hostel's configured IANA timezone (`applicationSettings.timezone`, defaulting to `"Asia/Kolkata"`). The server converts UTC `Date.now()` to the hostel's local time before evaluating cutoff thresholds, eliminating midnight normalization ambiguities.

4. **[DECISION 4: Password Hashing with Argon2id Default & Bcrypt Compatibility — APPROVED]**:
   * *Default Standard*: **Argon2id** is the official default password-hashing algorithm across the system, configured with memory cost 64MB, time cost 3 iterations, and parallelism 4 threads.
   * *Documented Compatibility*: **Bcrypt** (salt rounds: 12) is optional and permitted strictly for documented compatibility requirements (e.g., development environments where native C++ compilation tools for Argon2 binary bindings are unavailable).


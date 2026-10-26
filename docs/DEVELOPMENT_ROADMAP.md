# Development Roadmap & Implementation Plan: Smart Hostel & Mess Management System

> **Document Version**: 1.0.0  
> **Target Audience**: BTech CSE-AIML Student Developer, Mentors, Evaluators  
> **Status**: Approved for Technical Planning (Phase 1)

---

## 1. Overview & Phased Execution Strategy

To build this production-grade system without becoming overwhelmed by its scope, the development is divided into **11 sequential, testable phases**. 

Each phase builds directly upon the validated foundation of the previous phase. **No phase proceeds without satisfying its acceptance criteria.**

```mermaid
gantt
    title Smart Hostel & Mess Management System Roadmap
    dateFormat  YYYY-MM-DD
    section Completed Milestones
    Phase 1: Architecture & Planning           :done, p1, 2026-10-24, 2d
    Phase 2: Scaffolding & Base Setup          :done, p2, after p1, 2d
    Phase 3: Auth, Activation & RBAC           :done, p3, after p2, 3d
    Phase 4: Student Onboarding & CSV Import   :done, p4, after p3, 3d
    Phase 5: Hostel, Room & Bed Inventory      :done, p5, after p4, 3d
    Phase 6: Student Profiles & Contracts      :done, p6, after p5, 3d
    Phase 7: Fees, Payments & Financial Ledger :done, p7, after p6, 3d
    Phase 8: Daily Mess & Meal Selections      :done, p8, after p7, 3d
    section Active & Upcoming Roadmap
    Phase 10: User Portals (React + Tailwind)  :active, p10, after p8, 6d
    Phase 11: End-to-End Testing & Polish      :p11, after p10, 3d
    section Postponed / Deferred to Post-v1
    Phase 9: Complaints, Leave, Visitors & Notifications :crit, p9, after p11, 5d
```

---

## 2. Detailed Phase Breakdowns & Acceptance Criteria

---

### Phase 1: Requirements Analysis & Technical Architecture (CURRENT)
* **Goal**: Establish crystal-clear system requirements, comprehensive data schemas, REST API contracts, RBAC security matrices, and architectural threat models before writing application code.
* **Deliverables**:
  * `README.md`
  * `.gitignore` & `.env.example`
  * `docs/REQUIREMENTS.md`
  * `docs/ARCHITECTURE.md`
  * `docs/DATABASE_SCHEMA.md`
  * `docs/API_SPECIFICATION.md`
  * `docs/ROLE_PERMISSIONS.md`
  * `docs/SECURITY_PLAN.md`
  * `docs/DEVELOPMENT_ROADMAP.md`
* **Acceptance Criteria**:
  * [x] All 8 foundational architecture documents created with zero contradictions.
  * [x] Open questions identified and explicitly marked for mentor approval.
  * [x] No application source code prematurely generated.

---

### Phase 2: Monorepo Scaffolding, Core Models & One-Time Admin Setup
* **Goal**: Scaffold the Node.js/Express TypeScript backend, configure database connectivity with MongoDB replica set support, establish global error handling, and build the one-time admin bootstrap.
* **Core Tasks**:
  * Initialize `package.json` with strict TypeScript configuration (`tsconfig.json`).
  * Set up Express server with Helmet, CORS, Morgan logger, and body-parsers.
  * Implement Mongoose connection with automatic replica set verification for transaction readiness.
  * Implement `studentIdCounters` model and atomic `CounterService`.
  * Implement one-time bootstrap route `POST /api/v1/setup/initial-admin` guarded by `ADMIN_SETUP_SECRET`.
  * Implement centralized error-handling middleware with structured JSON error responses.
* **Acceptance Criteria**:
  * Server boots cleanly on `PORT=5000`.
  * Calling the bootstrap endpoint with the secret creates the first admin and returns `201 Created`.
  * Subsequent calls to the bootstrap endpoint return `403 Forbidden` (permanent lockdown).
  * Requesting invalid routes returns standard JSON `404 Not Found`.

---

### Phase 3: Authentication, Activation Lifecycle & RBAC Engine
* **Goal**: Implement dual-token authentication (Access JWT + Refresh Cookie), single-use account activation, password hashing, and the authorization middleware stack.
* **Core Tasks**:
  * Configure Argon2id (or bcrypt) password hashing utility.
  * Implement `users` model with activation token hashes and refresh token hashes.
  * Implement `POST /api/v1/auth/activate` (first-time password setting).
  * Implement `POST /api/v1/auth/login` (rate-limited, returns Access Token + sets `HttpOnly` Refresh Cookie).
  * Implement `POST /api/v1/auth/refresh` (token rotation with reuse/theft detection).
  * Implement `POST /api/v1/auth/logout`.
  * Build `requireAuth`, `requirePermission`, and `verifyOwnershipOrAdmin` middlewares.
  * Build pluggable `EmailService` (with `development_log` fallback).
* **Acceptance Criteria**:
  * Student can activate account using raw token; raw token is never stored in DB.
  * Activated student can log in and receives short-lived access token and secure refresh cookie.
  * Presenting an expired access token returns `401 Unauthorized`.
  * Refresh route issues new access token and rotates refresh cookie.
  * Tampering with refresh cookie revokes all active sessions for that user.

---

### Phase 4: Student Management, Profile & CSV Bulk Import
* **Goal**: Build student registration, the `STU-YYYYMM` + auto-expanding sequence atomic ID generator, CSV bulk onboarding with dry-run preview, and student profile management.
* **Core Tasks**:
  * Build `studentProfiles` model with personal, academic, emergency, and masked KYC fields.
  * Implement `POST /api/v1/students` (creates User + Profile, atomically generates Student ID).
  * Implement `POST /api/v1/students/import-csv/preview` (validates CSV, returns row-level error breakdown and valid preview).
  * Implement `POST /api/v1/students/import-csv/commit` (persists valid batch).
  * Implement `GET /api/v1/students` with search, filter, and pagination.
  * Implement `GET /api/v1/profile/me` and `PATCH /api/v1/profile/me` (student updates permitted fields; admin fields strictly stripped).
  * Implement controlled file upload for KYC documents with magic-byte validation and private streaming.
* **Acceptance Criteria**:
  * Simultaneous student creations generate consecutive IDs (`STU-202610001`, `STU-202610002`) with zero collisions.
  * CSV preview correctly flags invalid emails and short phone numbers with exact line numbers.
  * Student updating profile cannot elevate role or change room/dues data.
  * Direct file URLs do not exist; files stream only to authorized owners or admins.

---

### Phase 5: Hostel, Building, Room, Bed Management & ACID Allocations
* **Goal**: Build structural hostel inventory and multi-document ACID transactions for bed allocations and transfers.
* **Core Tasks**:
  * Implement `hostels`, `buildings`, `rooms`, and `beds` models with compound unique indexes.
  * Implement `bedAllocations` model.
  * Implement `AllocationService.allocateBed()` wrapped inside `session.withTransaction()`.
  * Enforce constraints: target bed must be `VACANT`, student cannot hold another active allocation.
  * Implement room/bed transfer protocol (atomically vacates old bed, occupies new bed, logs transfer).
  * Implement real-time room vacancy and occupancy queries.
* **Acceptance Criteria**:
  * Attempting to allocate an already-occupied bed aborts with `409 Conflict`.
  * Concurrent allocation requests for the same bed result in exactly one success and one conflict rollback.
  * Room `occupiedBeds` counter precisely mirrors active bed allocations.

---

### Phase 6: Student Profiles & Residency Contracts (COMPLETED)
* **Goal**: Implement complete resident profiles with address, emergency contacts, academic info, masked KYC documents, and legally binding residency contracts.
* **Core Tasks**:
  * Implement `StudentProfile` model with personal, emergency, academic, and masked KYC fields.
  * Implement `Contract` model with start/end dates, tenure, monthly rent, security deposit, lock-in period, and notice period.
  * Implement resident self-service profile updates (`PATCH /api/v1/profile/me`) strictly guarded against unauthorized field injection.
  * Implement admin KYC verification flow (`PATCH /api/v1/profile/:userId/documents/:docId/verify`).
  * Implement `POST /api/v1/contracts/:id/exit-request` and admin approval `POST /api/v1/contracts/:id/approve-exit`.
* **Acceptance Criteria**:
  * [x] Students update only permitted personal fields; cannot alter role, room, or dues.
  * [x] Sensitive fields (bank accounts, KYC IDs) are masked (`XXXXXX1234`).
  * [x] Overlapping active contracts for the same resident are strictly prevented.
  * [x] 117/117 automated tests passing across 8 suites.

---

### Phase 7: Fees, Payments, Dues & Financial History (COMPLETED)
* **Goal**: Implement an immutable append-only financial ledger, billing invoices, duplicate payment prevention, payment reversals, and refunds.
* **Core Tasks**:
  * Implement `ChargeRecord` model (`MONTHLY_RENT`, `SECURITY_DEPOSIT`, `MESS_FEE`, `LATE_FINE`, `DAMAGE_PENALTY`, etc.) with sequential invoice numbers (`CHG-YYYYMM-XXXX`).
  * Implement `PaymentTransaction` model (append-only ledger, duplicate bank reference/UTR prevention, serial receipt generation `REC-YYYYMM-XXXXX`).
  * Implement `RefundRecord` model (`REF-YYYYMM-XXXX`) for deposits, overpayments, and cancellations.
  * Implement atomic database transactions updating charge balances and statuses (`UNPAID`, `PARTIALLY_PAID`, `PAID`) with overpayment rejection (`422 Unprocessable Entity`).
  * Implement auditable payment reversals (`POST /api/v1/finances/payments/:id/reverse`) creating distinct offsetting records (`REV-...`) with automatic balance rollback.
  * Implement server-side dynamic balance calculation:
    $$\text{Outstanding Balance} = \sum(\text{Charges}) - \sum(\text{Payments}) - \sum(\text{Refunds})$$
* **Acceptance Criteria**:
  * [x] Financial records are append-only; in-place payment edits are strictly prohibited.
  * [x] Duplicate reference numbers return `409 Conflict`.
  * [x] IDOR defense prevents cross-student financial ledger or receipt inspection.
  * [x] 151/151 automated tests passing across 9 suites.

---

### Phase 8: Daily Mess Operations, Lunch Cutoffs, Roster & Feedback (COMPLETED)
* **Goal**: Implement rotational meal menus, daily lunch choice (Tiffin vs. Dine-in), cutoff enforcement, administrative kitchen rosters, and student food feedback.
* **Core Tasks**:
  * Implement `Menu` model (day-wise, meal-type menus with items and allergen tags).
  * Implement `MealSelection` model with `isDefault` distinction.
  * Implement daily fallback: active residents default to `DINE_IN`.
  * Implement `POST /api/v1/mess/selection` (allows student choice prior to `lunchCutoffTime` in configured timezone).
  * Implement `PATCH /api/v1/mess/selection/override` (admin override post-cutoff with mandatory reason and audit log).
  * Implement `auditLogs` recording actor, previous value, new value, and reason for all overrides.
  * Implement `GET /api/v1/mess/reports/daily-kitchen` (aggregated Dine-in vs. Tiffin counts + packing roster).
  * Implement `FoodFeedback` model for meal ratings and comments with admin aggregate analytics.
* **Acceptance Criteria**:
  * [x] Student attempting to change lunch choice past cutoff receives `422 Unprocessable Entity`.
  * [x] Admin override updates selection and creates an unalterable audit log entry.
  * [x] Kitchen report displays exact headcounts and lists room numbers for students requesting tiffins.
  * [x] Student food ratings (1–5) and feedback submitted and aggregated accurately.
  * [x] 171/171 automated unit & integration tests passing across 10 suites.

---

### Phase 9: Complaints, Student Leave, Gate Visitors & Notifications (POSTPONED / DEFERRED)
* **Status**: **DEFERRED TO POST-v1 RELEASE**
* **Directive**: Do not implement these features now. Keep the architecture modular and extensible so they can be added later without major changes. Avoid unnecessary models, APIs, dependencies, or placeholder implementations. Preserve existing functionality and update the roadmap documentation only. Do not modify unrelated code.
* **Rationale**: To maintain laser focus on core residency, room inventory, contracts, financial auditing, and mess operations, Phase 9 features are postponed to post-v1.
* **Architectural Extensibility & Preservation Guidelines**:
  * *Zero Code Pollution*: No dummy models, unused API routes, or placeholder stub controllers are introduced into the codebase, preserving clean and minimal code.
  * *RBAC Readiness*: Granular permission tokens (`complaints:create`, `complaints:view_self`, `complaints:resolve`, `leave:apply`, `leave:approve`, `visitors:register`, `visitors:gate_log`, `notices:publish`, `notices:view`) are already defined in `src/constants/permissions.ts` and supported by `requirePermission`.
  * *Pluggable Modular Design*: When implemented, new domain sub-routers (`/complaints`, `/leave`, `/visitors`, `/notices`) can be mounted cleanly into `src/routes/index.ts` without touching existing inventory, contract, financial, or mess modules.
  * *Standard Envelopes & Audit Logging*: All future operations will reuse the existing `AppError` hierarchy, `validateRequest` Zod wrappers, and `AuditLog.create` hooks without structural refactoring.
* **Scope for Future Implementation (Post-v1)**:
  * Maintenance ticketing lifecycle (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`) with priority and feedback ratings.
  * Student leave applications with departure/return dates, emergency contact, and warden approvals.
  * Gate visitor pre-registration and physical security check-in/out logging.
  * Broadcast notices targeted by hostel and in-app notifications with read/unread tracking.

---

### Phase 10: Frontend Architecture & User Interfaces (React + Tailwind)
* **Goal**: Develop polished, responsive, and accessible SPAs for both Admin and Student dashboards covering all completed core modules (Phases 1–8).
* **Core Tasks**:
  * Scaffold Vite + React + TypeScript project with Tailwind CSS.
  * Implement design system tokens (colors, cards, typography, badges, dark/light theme).
  * Build authentication flows: Login, Account Activation, Forgot Password.
  * Build Axios client with transparent `401` token refresh interceptor.
  * Build **Admin Portal**:
    * Executive dashboard with KPI metric cards and charts.
    * Student directory with search, filter, and CSV bulk import wizard with live preview.
    * Room & bed occupancy visual grid with allocation/transfer modal.
    * Financial ledger with manual payment entry and receipt preview.
    * Mess planner with weekly menu editor and live kitchen preparation rosters.
  * Build **Student Portal**:
    * Personal resident dashboard (room summary, dues alert).
    * "Stay" tab (contract terms, payment history, download receipts, request exit).
    * "Food" tab (3-day menus, lunch Dine-in vs. Tiffin selector with countdown timer, feedback submission).
    * "Profile" tab (view and edit personal details, view masked KYC).
* **Acceptance Criteria**:
  * UI is fully responsive across mobile (360px) and desktop (1920px).
  * Token refresh executes seamlessly in the background without user logout.
  * Accessible color contrast and clear loading/error feedback states across all forms.

---

### Phase 11: End-to-End Integration, Security Audits & Capstone Polish
* **Goal**: Verify complete system end-to-end, execute security checklists, and prepare project documentation for evaluation.
* **Core Tasks**:
  * Execute the comprehensive verification checklist from `docs/SECURITY_PLAN.md`.
  * Validate Postman / Thunder Client collection covering all endpoints.
  * Ensure sample non-sensitive seed data is available for instant evaluator testing.
  * Finalize setup and demonstration instructions in `README.md`.
* **Acceptance Criteria**:
  * All integration workflows pass cleanly.
  * Zero security secrets or personal student data present in Git history.
  * Application can be launched cleanly on a fresh machine following setup instructions.

---

## 3. Academic Capstone Value & Future AI/ML Extensions

As a BTech CSE-AIML major project, this system provides direct opportunities for future intelligent enhancements:

1. **Mess Demand Forecasting (Time-Series ML)**:
   * Use historical `mealSelections` data (day of week, exams, holidays, weather) to train an XGBoost or LSTM model that predicts exact dining hall attendance 7 days in advance, reducing food waste by up to 25%.
2. **Automated Grievance Classification & Priority NLP**:
   * Fine-tune a lightweight BERT or transformer model to automatically categorize student complaint descriptions (`PLUMBING`, `ELECTRICAL`, `WIFI`) and assign dynamic priority scores based on sentiment urgency.
3. **Smart Roommate Allocation Engine (Clustering)**:
   * Apply K-Means or hierarchical clustering on student lifestyle survey responses (sleep schedule, study habits, dietary preferences) to suggest optimal roommate pairings with minimal friction.

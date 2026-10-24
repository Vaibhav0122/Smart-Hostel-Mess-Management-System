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
    section Architectural Design
    Phase 1: Architecture & Planning (Current) :done, p1, 2026-10-24, 2d
    section Backend Foundation
    Phase 2: Backend Scaffolding & Setup        :active, p2, after p1, 2d
    Phase 3: Auth, Activation & RBAC            :p3, after p2, 3d
    Phase 4: Student Onboarding & CSV Import    :p4, after p3, 3d
    section Core Operations
    Phase 5: Hostel, Room & ACID Allocations   :p5, after p4, 3d
    Phase 6: Contracts & Financial Ledger       :p6, after p5, 4d
    Phase 7: Mess Management & Lunch Cutoffs    :p7, after p6, 3d
    Phase 8: Complaints, Leave & Visitors       :p8, after p7, 3d
    Phase 9: Notices, Notifications & Reports   :p9, after p8, 2d
    section Frontend & Delivery
    Phase 10: React + Tailwind User Portals     :p10, after p9, 6d
    Phase 11: End-to-End Testing & Polish       :p11, after p10, 3d
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

### Phase 6: Residency Contracts & Financial Ledger
* **Goal**: Implement contract lifecycles, dues calculations, and an immutable append-only financial ledger.
* **Core Tasks**:
  * Implement `contracts` model (tenure, lock-in date, notice period, exit requests).
  * Implement `chargeRecords` model (monthly rent, deposits, mess dues, late fines).
  * Implement `paymentTransactions` model (append-only ledger, unique bank reference UTRs).
  * Implement `refundRecords` model.
  * Implement server-side dynamic balance calculation:  
    $$\text{Balance} = \sum(\text{Charges}) - \sum(\text{Payments}) + \sum(\text{Refunds})$$
  * Implement `POST /api/v1/contracts/exit-request` and `POST /api/v1/contracts/:id/approve-exit` (blocks checkout if dues > 0).
  * Implement printable PDF / JSON receipt generation with serial receipt numbers (`REC-YYYYMM-XXXXX`).
* **Acceptance Criteria**:
  * Financial records are append-only; in-place payment edits are impossible.
  * Recording duplicate bank reference numbers fails with `409 Conflict`.
  * Student checkout is strictly rejected with `422 Unprocessable Entity` if outstanding dues > 0.

---

### Phase 7: Mess Management & Daily Meal Selections
* **Goal**: Implement rotational meal menus, daily lunch choice (Tiffin vs. Dine-in), cutoff enforcement, and administrative overrides.
* **Core Tasks**:
  * Implement `menus` model (day-wise, meal-type menus with items and allergen tags).
  * Implement `mealSelections` model with `isDefault` distinction.
  * Implement automated daily initialization: active residents default to `DINE_IN`.
  * Implement `POST /api/v1/mess/selection` (allows student choice prior to `lunchCutoffTime`).
  * Implement `PATCH /api/v1/mess/selection/override` (admin override post-cutoff with mandatory reason).
  * Implement `auditLogs` recording actor, previous value, new value, and reason for all overrides.
  * Implement `GET /api/v1/mess/reports/daily-kitchen` (aggregated Dine-in vs. Tiffin counts + packing roster).
  * Implement `foodFeedback` model for meal ratings and taste complaints.
* **Acceptance Criteria**:
  * Student attempting to change lunch choice past cutoff receives `422 Unprocessable Entity`.
  * Admin override updates selection and creates an unalterable audit log entry.
  * Kitchen report displays exact headcounts and lists room numbers for students requesting tiffins.

---

### Phase 8: Complaints, Student Leave & Gate Visitors
* **Goal**: Implement maintenance ticketing, leave applications, and gate visitor security.
* **Core Tasks**:
  * Implement `complaints` model (categories, priority, photo attachments, status history array).
  * Implement complaint status transitions (`OPEN` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`).
  * Implement student resolution rating feedback.
  * Implement `leaveRequests` model (departure, return, emergency contact, parent consent).
  * Implement admin leave approval/rejection.
  * Implement `visitors` model with pre-registration and gate check-in/out timestamps.
* **Acceptance Criteria**:
  * Students can only view their own complaints, leave applications, and visitors.
  * Admin status changes append to `statusHistory` with timestamps and remarks.
  * Real-time query displays visitors currently inside hostel grounds.

---

### Phase 9: Notices, In-App Notifications & Executive Reports
* **Goal**: Build communication channels and administrative reporting tools.
* **Core Tasks**:
  * Implement `notices` model with targeting (`ALL_HOSTELS`, `HOSTEL_SPECIFIC`).
  * Implement `notifications` model with read/unread flags and 90-day TTL cleanup.
  * Implement `GET /api/v1/dashboard/admin-metrics` (occupancy %, pending complaints, dues, meal counts).
  * Implement streaming CSV report generation for occupancy, fee collections, and kitchen rosters.
* **Acceptance Criteria**:
  * Targeted notices display only to relevant hostel residents.
  * Exported CSV files match server ledger data and download with correct headers.

---

### Phase 10: Frontend Architecture & User Interfaces (React + Tailwind)
* **Goal**: Develop polished, responsive, and accessible SPAs for both Admin and Student dashboards.
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
    * Complaint Kanban board / list with staff assignment and status updates.
    * Leave request management and gate visitor logs.
  * Build **Student Portal**:
    * Personal resident dashboard (room summary, active notices, dues alert).
    * "Stay" tab (contract terms, payment history, download receipts, request exit).
    * "Food" tab (3-day menus, lunch Dine-in vs. Tiffin selector with countdown timer).
    * "Support" tab (raise complaint with image preview, submit leave, register visitor).
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

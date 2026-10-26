# Smart Hostel & Mess Management System 🏢🍽️

> **A Production-Grade, Full-Stack Hostel Operations and Mess Allocation Platform**  
> *Academic Capstone Project — BTech Computer Science & Engineering (AI & ML)*

---

## 📌 Project Overview

The **Smart Hostel & Mess Management System** is a modern, responsive web application designed to digitize and automate the day-to-day operational workflows of university and private residential hostels. 

Traditional hostel administration heavily relies on manual paper registers, disconnected spreadsheets, physical complaint drop-boxes, and guesswork for kitchen cooking quantities. This leads to common institutional challenges:
* **Over-allocation and Room Allocation Conflicts**: Double-booking rooms or assigning beds that are undergoing maintenance.
* **Mess Food Wastage & Budget Overruns**: Inability to forecast exact student dining counts vs. packed tiffin requirements before daily cutoff times.
* **Financial Discrepancies**: Lack of an immutable payment audit trail, leading to disputes over security deposits, monthly rent, and outstanding dues.
* **Student Welfare & Safety Gaps**: Clunky leave approvals, unmonitored visitor logs, and untracked maintenance grievances.

This project delivers a robust, secure, and extensible platform featuring two dedicated portals:
1. **Admin Dashboard (Warden / Hostel Administration)**: Complete command-and-control over hostel buildings, room inventory, student admissions, contract lifecycles, ledger-based financial transactions, mess menu curation, daily lunch choices (Tiffin vs. Dine-in) with audit-logged overrides, complaint dispatching, leave approvals, and visitor logs.
2. **Student Portal (Hostel Residents)**: A streamlined self-service interface where students track their room tenure, submit lunch dining preferences before the daily cutoff, record maintenance grievances, apply for night/weekend leave, register visitors, and view verified payment receipts.

The system is engineered following enterprise software standards: **layered architecture, Role-Based Access Control (RBAC), ACID transactions for allocation and financial ledgers, Zod boundary validation, and defense-in-depth security**.

---

## 🏗️ Technology Stack

| Layer | Technology | Rationale & Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React 18 + TypeScript + Vite** | Fast compilation, strong type-safety, modular component architecture, and modern single-page application (SPA) performance. |
| **Styling** | **Tailwind CSS** | Utility-first CSS framework enabling a polished, responsive, and accessible dashboard UI with modern dark/light styling tokens. |
| **Backend** | **Node.js + Express.js + TypeScript** | High-performance asynchronous runtime with end-to-end type safety shared between API contracts and business logic. |
| **Database** | **MongoDB with Mongoose** | Flexible document store capable of handling nested state histories, with native multi-document ACID transactions for critical operations. |
| **Schema Validation** | **Zod** | Runtime input validation guaranteeing that malformed client payloads are rejected before reaching business services. |
| **Authentication** | **JWT (Access & Refresh) + Argon2id (default) / bcrypt (optional)** | Short-lived in-memory access tokens paired with rotating, HTTP-only secure refresh tokens and Argon2id memory-hard password hashing (bcrypt optional for documented compatibility). |
| **File Storage** | **Controlled Storage Abstraction** | Pluggable file storage (local disk driver for development, cloud object storage for production) with strict MIME validation and private authenticated serving. |
| **API Testing** | **Postman / Thunder Client** | Standardized REST collection with environment variables for local testing. |
| **Version Control** | **Git & GitHub** | Feature-branching workflow with clean commit hygiene and no leaked secrets. |

---

## 🎯 Key Architectural Pillars (For CSE-AIML Students)

As an engineering capstone, this project emphasizes foundational backend and distributed systems concepts:

1. **Defense-in-Depth & Zero Client Trust**:
   The backend never trusts role tags, user IDs, prices, or room numbers sent in client request bodies. All authorization and business rules are verified on the server.
2. **Immutable Financial Ledger**:
   Hostel charges and payments follow an append-only transaction ledger pattern. Payment records are never updated or overwritten in-place, ensuring forensic auditability.
3. **Atomic MongoDB Allocation & Safe Transactions**:
   Bed allocation, room transfers, and payment settlements leverage MongoDB multi-document ACID transactions (`session.withTransaction()`). A replica set is supported for transaction guarantees; standalone development is permitted only where transaction guarantees are not required, while critical operations fail safely if transaction requirements are unmet. Student ID generation uses atomic monthly counters (`STU-YYYYMM`) with automatic expansion beyond three digits, ensuring issued IDs are strictly permanent and never reused.
4. **Graceful Degradation & Local-First Development**:
   External dependencies (such as transactional email providers) are wrapped in configurable service adapters so the application operates seamlessly offline or during local classroom evaluation.
5. **Configurable Dining Operations**:
   Daily lunch cutoffs default to 09:30 AM local time and dynamically evaluate against the hostel's configured IANA timezone, supporting emergency administrative overrides with mandatory audit logging.
6. **AIML Expansion Ready**:
   The database structures structured meal selections, complaints, and occupancy patterns, providing clean historical datasets for future machine learning additions (e.g., meal demand forecasting, automated complaint NLP routing).

---

## 📂 Project Documentation Directory

Detailed specifications, requirements, and engineering designs have been compiled in the [`docs/`](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/docs) folder:

* 📄 [**REQUIREMENTS.md**](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/docs/REQUIREMENTS.md): Comprehensive functional requirements (all 15 modules) and non-functional guarantees.
* 🏛️ [**ARCHITECTURE.md**](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/docs/ARCHITECTURE.md): System architecture, layered design patterns, MongoDB transaction requirements, and storage abstractions.
* 🗄️ [**DATABASE_SCHEMA.md**](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/docs/DATABASE_SCHEMA.md): Complete collection schemas, field definitions, unique/compound indexes, and data retention models for all 22 collections.
* 🔌 [**API_SPECIFICATION.md**](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/docs/API_SPECIFICATION.md): REST endpoint contracts, RBAC requirements, request schemas, response envelopes, and error codes.
* 🛡️ [**ROLE_PERMISSIONS.md**](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/docs/ROLE_PERMISSIONS.md): Complete granular permission matrix (`resource:action`) across initial and future extensible roles.
* 🔒 [**SECURITY_PLAN.md**](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/docs/SECURITY_PLAN.md): Threat modeling (STRIDE), IDOR mitigation, cryptographic standards, file upload hygiene, and security verification checklists.
* 🗺️ [**DEVELOPMENT_ROADMAP.md**](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/docs/DEVELOPMENT_ROADMAP.md): Phase-by-phase implementation schedule, milestone acceptance criteria, and student guidance.

---

## 👥 User Roles & Access Scope

* **Hostel Admin / Warden (Initial Scope)**: Manages hostel buildings, room inventory, admissions, bulk CSV import, room allocations, payments, meal menus, complaint resolutions, leave approvals, and visitor logs.
* **Student Resident (Initial Scope)**: Accesses personal room status, contract details, fee payment records, meal selection before daily cutoffs, maintenance grievances, and leave applications.
* **Super Admin (Extensible Design)**: Multi-hostel governance, institution-wide audit log access, and administrative role creation.
* **Accounts Manager (Extensible Design)**: Fee structure configuration, reconciliation reports, and fine management.
* **Mess Staff (Extensible Design)**: Dedicated kitchen screen showing live headcounts for Lunch (Dine-in vs. Tiffin packing) and meal feedback summaries.
* **Security Staff (Extensible Design)**: Gate portal for real-time visitor check-in/out and verification of student leave gate passes.

---

## 📁 Repository & Folder Structure

The project employs a clean, maintainable structure separating frontend and backend applications while centralizing shared specifications in `docs/`:

```text
smart-hostel-mess-management-system/
├── frontend/                     # Frontend Application (React 18 + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/           # Reusable UI components (Navbar, StatusCard, Badges, Footer)
│   │   ├── services/             # Configurable API client (api.ts)
│   │   ├── App.tsx               # Minimal application shell & live status landing page
│   │   ├── index.css             # Tailwind base and custom typography
│   │   └── main.tsx              # React DOM entrypoint
│   ├── .env.example              # Frontend environment variables template
│   ├── index.html                # Single page app entry HTML
│   ├── package.json              # Frontend dependencies and Vite build scripts
│   ├── tailwind.config.js        # Tailwind styling theme & tokens
│   ├── tsconfig.json             # Frontend TypeScript configuration
│   └── vite.config.ts            # Vite bundler configuration & local API reverse proxy
│
├── src/                          # Backend Application (Node.js + Express + TypeScript)
│   ├── __tests__/                # Automated Jest test suites (151 tests passing across 9 suites)
│   │   ├── auth.test.ts          # Authentication, token lifecycle, activation & RBAC tests
│   │   ├── counter.service.test.ts # Unlimited student ID sequence & atomic expansion tests
│   │   ├── env.test.ts           # Zod schema validation tests
│   │   ├── finance.test.ts       # Charges, payments, dues, reversals, refunds & RBAC tests
│   │   ├── health.routes.test.ts # Live /api/v1/health & root welcome tests
│   │   ├── hostel.test.ts        # Hostel, Building, Room, Bed & Allocation tests
│   │   ├── mess.test.ts          # Menus, cutoff enforcement, lunch choice, kitchen roster & feedback tests
│   │   ├── notFound.test.ts      # 404 standard envelope tests
│   │   ├── profileAndContract.test.ts # Student profiles, KYC & residency contract tests
│   │   └── student.test.ts       # Student registration & bulk CSV import tests
│   ├── config/                   # Configuration & Infrastructure modules
│   │   ├── database.ts           # Mongoose connection & Replica Set ACID transaction detector
│   │   └── env.ts                # Zod runtime environment validation & dotenv loader
│   ├── constants/                # HTTP status codes, permissions & system constants
│   ├── controllers/              # Request controllers (auth, contract, finance, health, hostel, mess, profile, setup, student)
│   ├── errors/                   # Operational AppError hierarchy
│   ├── middlewares/              # Security, auth/RBAC, CORS, 404, rate limiting & error handlers
│   ├── models/                   # Mongoose schemas (AuditLog, Bed, BedAllocation, Building, ChargeRecord, Contract, FoodFeedback, Hostel, MealSelection, Menu, PaymentTransaction, RefundRecord, Room, StudentProfile, User, etc.)
│   ├── routes/                   # Express routes (/health, /setup, /auth, /students, /hostels, /buildings, /rooms, /beds, /allocations, /profile, /contracts, /finances, /mess)
│   ├── services/                 # Business services (auth, contract, counter, finance, hostel, mess, profile, setup, student)
│   ├── utils/                    # Password hashing, JWT token generation & CSV parser
│   ├── validations/              # Zod validation schemas (auth, contract, finance, hostel, mess, profile, setup, student)
│   ├── app.ts                    # Express application instantiation & middleware stack
│   └── server.ts                 # Server startup listener & graceful shutdown handlers
│
├── docs/                         # Phase 1 Architectural & Engineering Specifications
│   ├── REQUIREMENTS.md           # 15 core functional modules & non-functional requirements
│   ├── ARCHITECTURE.md           # Layered architecture, transaction patterns, storage adapters
│   ├── DATABASE_SCHEMA.md        # 22 collection schemas, indexes, and retention rules
│   ├── API_SPECIFICATION.md      # REST contracts, envelopes, and RBAC requirements
│   ├── ROLE_PERMISSIONS.md       # Granular role-to-permission matrix
│   ├── SECURITY_PLAN.md          # STRIDE threat model, IDOR defenses, cryptographic standards
│   └── DEVELOPMENT_ROADMAP.md    # 11-phase implementation plan & milestone criteria
│
├── .env.example                  # Backend environment template (safe placeholders)
├── .gitignore                    # Git ignore rules for node_modules, dist, secrets, and uploads
├── jest.config.js                # Jest + ts-jest configuration
├── package.json                  # Root package scripts coordinating backend and frontend
└── tsconfig.json                 # Backend TypeScript compiler configuration
```

---

## 🛠️ Prerequisites

Before getting started, ensure you have the following installed on your machine:

* **Node.js**: `v18.x` or higher (`v20+` LTS recommended). Check with `node -v`.
* **npm**: `v9.x` or higher. Check with `npm -v`.
* **MongoDB Community Server**: `v6.x` or higher (or MongoDB Atlas connection string).
  * *Important*: MongoDB **Replica Set** must be enabled for multi-document ACID transactions (see setup instructions below).

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Vaibhav0122/Smart-Hostel-Mess-Management-System.git
cd "Smart Hostel Mess Management System"
```

### 2. Install Dependencies

Install root backend dependencies:
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

---

## ⚙️ Environment Configuration

### Backend Environment (`.env`)

Copy the example template to create your local `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your `.env` variables:
* `PORT`: Server port (default: `5000`).
* `NODE_ENV`: Set to `development`.
* `CLIENT_ORIGIN`: Frontend URL for CORS (default: `http://localhost:5173`).
* `MONGODB_URI`: MongoDB connection string.
  * Standalone (dev only): `mongodb://127.0.0.1:27017/smart_hostel_db`
  * Replica Set (recommended): `mongodb://127.0.0.1:27017/smart_hostel_db?replicaSet=rs0`
* `ADMIN_SETUP_SECRET`: A secure string (min 16 chars) for one-time initialization.
* `JWT_ACCESS_SECRET` & `JWT_REFRESH_SECRET`: Secure secret strings for authentication.

### Frontend Environment (`frontend/.env`)

Copy the frontend template:
```bash
cp frontend/.env.example frontend/.env
```
*(On Windows PowerShell: `Copy-Item frontend/.env.example frontend/.env`)*

Variables:
* `VITE_API_BASE_URL`: Base URL of the backend API (default: `http://localhost:5000/api/v1`).

---

## 💻 Running the Application

### Running Backend (Development)

```bash
# From the root directory:
npm run dev:backend
```
The Express backend starts at `http://localhost:5000`. You can verify by visiting:
* Root Welcome: `http://localhost:5000/`
* Health Check: `http://localhost:5000/api/v1/health`

### Running Frontend (Development)

```bash
# In a separate terminal from root:
npm run dev:frontend

# Or directly from the frontend directory:
cd frontend && npm run dev
```
The Vite React application starts at `http://localhost:5173`. It automatically queries `/api/v1/health` and displays the real-time system status.

---

## 🧪 Testing & Type Checking

### Running Backend Automated Tests

Run the full Jest test suite (in-band):
```bash
npm test
```
This runs 30 unit and integration tests across 4 suites:
1. `counter.service.test.ts`: STU-YYYYMM atomic generation, unlimited sequence scaling (>999), concurrency, and race-condition retries.
2. `health.routes.test.ts`: Health check endpoint responses, DB connection state reporting, and root welcome route.
3. `notFound.test.ts`: 404 handler structured error envelope validation.
4. `env.test.ts`: Zod schema validation, default assignments, and rejection of invalid environment variables.

### Checking TypeScript Types (Linting)

```bash
# Check backend TypeScript errors:
npm run lint:backend

# Check frontend TypeScript errors:
npm run lint:frontend
```

### Production Builds

```bash
# Build backend (compiles TS to dist/):
npm run build:backend

# Build frontend (compiles React SPA to frontend/dist/):
npm run build:frontend

# Build both applications:
npm run build:all
```

---

## 🍃 MongoDB Replica Set Setup Notes

MongoDB multi-document ACID transactions (`session.withTransaction()`) require a replica set or supported sharded cluster.

### Option A: Local Single-Node Replica Set (Windows / macOS / Linux)

1. Stop any standalone mongod service:
   ```bash
   # Windows PowerShell (as Admin):
   net stop MongoDB
   ```
2. Start mongod with `--replSet rs0`:
   ```bash
   mongod --port 27017 --dbpath "C:\data\db" --replSet rs0
   ```
3. In a separate terminal, open the MongoDB shell (`mongosh`) and initiate the replica set:
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [{ _id: 0, host: "localhost:27017" }]
   });
   ```
4. Verify by running `rs.status()`. Update `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/smart_hostel_db?replicaSet=rs0
   ```

### Option B: Docker (Recommended for Local Dev)

Run a single-node replica set in Docker with one command:
```bash
docker run -d --name mongo-rs -p 27017:27017 mongo:6 --replSet rs0
docker exec -it mongo-rs mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"
```

### Option C: MongoDB Atlas (Cloud)

MongoDB Atlas clusters (including Free M0 tier) automatically run as 3-node replica sets with transaction support out-of-the-box. Simply set `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/smart_hostel_db?retryWrites=true&w=majority` in `.env`.

---

## 🚦 Status & Implementation Roadmap

* [x] **Phase 1: Requirements Analysis and Technical Architecture** (Completed)
  * All 7 foundational specification documents in `docs/`.
* [x] **Phase 2: Project Foundation & Environment Setup** (Completed)
  * Express + TypeScript backend with Helmet, CORS, body-parsers, Zod env validation, and structured error handling.
  * Health check API (`GET /api/v1/health`) with live MongoDB & replica set detection.
  * Atomic student ID generator with auto-expansion beyond 999.
  * React 18 + Vite + Tailwind CSS responsive frontend shell with real-time connectivity feedback.
* [x] **Phase 3: Authentication, Activation Lifecycle & RBAC Engine** (Completed)
  * Dual-token JWT (access + refresh) rotation, argon2/bcrypt password hashing, rate limiting, and brute-force lockout.
  * Student activation lifecycle with cryptographically secure single-use activation tokens.
  * Role-Based Access Control (RBAC) middleware verifying granular permissions with IDOR defense.
* [x] **Phase 4: Student Onboarding & Bulk CSV Import** (Completed)
  * Admin-driven single student registration with input validation (Zod) and initial inactive state (`PENDING_ACTIVATION`).
  * Atomic auto-expanding student ID generator (`STU-YYYYMMNNN`).
  * Bulk CSV import engine with column validation, duplicate detection (intra-file and DB-level), row-wise error isolation, and audit logging.
  * 78/78 automated unit & integration tests passing across 6 suites.
* [x] **Phase 5: Hostel, Building, Room & Bed Management** (Completed)
  * Full CRUD APIs for Hostels, Buildings, Rooms, and Beds with role-based access control.
  * Room capacity derivation (SINGLE, DOUBLE, TRIPLE, FOUR_BED) with automatic bed provisioning and real-time vacancy tracking.
  * Allocation, transfer, and checkout workflows preventing duplicate active assignments and overcapacity.
  * 100/100 automated unit & integration tests passing across 7 suites.
* [x] **Phase 6: Student Profiles & Hostel Contracts** (Completed)
  * Complete student profile lifecycle with address, emergency contact, institute academic info, and bank details with automated data masking.
  * Self-service student profile updates guarded against unauthorized field injection, plus admin KYC verification workflow.
  * Legally binding residency contracts with tenure dates, monthly rent, deposit, lock-in period enforcement, and early exit request/approval flows.
  * 117/117 automated unit & integration tests passing across 8 suites.
* [x] **Phase 7: Fees, Payments, Dues & Financial History** (Completed)
  * Full charge/invoice generation with billing periods, due dates, and cancellation controls.
  * Append-only payment transactions with sequential receipt generation (`REC-YYYYMM-XXXXX`) and duplicate reference / UTR detection.
  * Atomic database transactions updating charge balances and statuses (`UNPAID`, `PARTIALLY_PAID`, `PAID`) with overpayment rejection.
  * Auditable payment reversals generating offsetting transaction records (`REV-...`) with automatic balance rollback.
  * Refund management for deposit returns, overpayments, and cancellations (`REF-YYYYMM-XXXX`).
  * Live financial ledger computing total charges, total paid, total refunded, and outstanding balance with strict IDOR protection.
  * 151/151 automated unit & integration tests passing across 9 suites.
* [x] **Phase 8: Daily Mess Operations, Lunch Cutoffs, Roster & Feedback** (Completed)
  * Daily rotational meal menus for breakfast, lunch, snacks, and dinner with dietary/allergen tags and upcoming 3-day projection.
  * Student lunch selection (Dine-in vs. Tiffin) with automatic fallback to Dine-in when no selection exists.
  * Timezone-aware daily morning cutoff enforcement (default 09:30 AM Asia/Kolkata) with strict post-cutoff locking.
  * Authorized administrator lunch choice overrides with mandatory justification and audit logging.
  * Daily kitchen preparation report and real-time tiffin dispatch roster calculating exact resident headcounts and reducing meal waste.
  * Student food rating (1–5) and feedback submission with admin aggregate analytics.
  * 171/171 automated unit & integration tests passing across 10 suites.
* [⏸️] **Phase 9: Complaints, Leave Applications, Visitors & Notifications** (Postponed / Deferred to Post-v1)
  * *Status*: Deferred to post-v1 release to maintain laser focus on core residency, room inventory, contracts, financial auditing, and mess operations.
  * *Architecture Preservation*: The existing modular architecture (granular RBAC tokens in `src/constants/permissions.ts`, extensible Express router, and standard audit logging) allows these features to be plugged in later via dedicated sub-routers without altering existing modules. No placeholder models, routes, or dead dependencies are added now.
* [x] **Phase 10: Dashboards, Reports & Frontend Integration** (Completed)
  * Real-time Student Dashboard displaying resident profile, active room/bed allocation, contract status, live financial ledger (charges, payments, dues), today's lunch choice (Dine-in vs. Tiffin) with cutoff validation, and upcoming 3-day meal menus.
  * Real-time Admin Dashboard calculating executive KPIs from real database collections: student counts, hostel occupancy/vacancy, active/vacated room allocations, financial totals (charges, collections, refunds, pending dues), and live today's kitchen headcounts.
  * Interactive Admin Reports module with server-side validation and pagination:
    * Student Directory Report with KYC filter and full-text search.
    * Hostel Occupancy & Vacancy Breakdown Report by building and room.
    * Financial Summary Report with detailed student ledger balances.
    * Daily Mess Dining Roster with student lunch choices and headcounts.
    * Streamed RFC 4180 compliant CSV export with injection defense and server-side authorization.
  * Responsive React 18 + Vite + Tailwind CSS frontend integration with authentication modal, role-based navigation tabs (`overview`, `student`, `admin`, `reports`), live loading skeletons, empty states, error banners, and cutoff notices.
  * 179/179 automated unit and integration tests passing across 11 test suites.
  * Clean production builds verified for both backend (`npm run build:backend`) and frontend (`npm run build:frontend`).
* [x] **Phase 11: Final Security Audit, Bug Fixes, and Deployment Preparation** (Completed)
  * End-to-end security audit covering dual-token JWT authentication, RBAC permission tokens, IDOR mitigation, Zod boundary validation, KYC masking, and CSV formula-injection defense.
  * Resolved PaymentStatus query filter mismatch (`COMPLETED` → `SUCCESS`) and corrected net payment / refund ledger arithmetic across admin metrics, student dashboard summaries, and financial reports.
  * MongoDB multi-document ACID transactions validated with replica set detection.
  * Verified environment variables security: `.env` excluded from version control, safe `.env.example` template provided.
  * 179/179 automated unit and integration tests passing across all 11 test suites.
  * Verified production builds: `npm run build:backend`, `npm run build:frontend`, and `npm run lint:frontend` passing cleanly with zero errors.
  * Production deployment guide and security pre-flight checklist documented below.

---

## 🚀 Production Deployment & Operations Guide

### 1. Production Architecture Overview

The system is designed for containerized or PaaS deployment (Render, Railway, Fly.io, AWS ECS, or DigitalOcean App Platform):
* **Backend**: Node.js + Express + TypeScript running in cluster or single-process mode (`dist/server.js`) behind an HTTPS reverse proxy (Nginx, Cloudflare, or AWS ALB).
* **Frontend**: React 18 + Vite SPA built to static HTML/CSS/JS (`frontend/dist/`), served via Nginx, Cloudflare Pages, Vercel, or as static assets from Express.
* **Database**: MongoDB 6.0+ 3-node replica set (MongoDB Atlas M10+ recommended for automatic failover, ACID transactions, and automated snapshots).

### 2. Required Production Environment Variables

Ensure all required production variables are set in your hosting platform's secrets manager:

| Variable | Requirement | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables Express production optimizations, secure cookie headers, and disables stack trace leakage. |
| `PORT` | `5000` (or platform default) | Port Express listens on. |
| `CLIENT_ORIGIN` | `https://hostel.yourinstitution.edu` | Allowed CORS origin. Wildcards (`*`) are strictly blocked in production. |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB connection URI. **Must point to a replica set** for transaction support. |
| `JWT_ACCESS_SECRET` | 64+ char random hex | Secret for signing short-lived access tokens (15m TTL). |
| `JWT_REFRESH_SECRET` | 64+ char random hex | Secret for signing rotating refresh tokens (7d TTL). |
| `ADMIN_SETUP_SECRET` | 32+ char random string | One-time bootstrap secret for `POST /api/v1/setup/initial-admin`. |
| `STORAGE_DRIVER` | `local` or `s3` | Storage backend for KYC documents and photos. |
| `HOSTEL_TIMEZONE` | `Asia/Kolkata` | IANA timezone for meal cutoffs and daily rosters. |

> Generate cryptographic secrets via:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Production Build & Execution Commands

```bash
# 1. Install production dependencies
npm ci

# 2. Compile TypeScript backend to dist/
npm run build:backend

# 3. Build frontend SPA to frontend/dist/
npm run build:frontend

# 4. Verify test suite
npm test

# 5. Start production server
npm start
```

### 4. Production Security Pre-Flight Checklist

* [x] **CORS Configuration**: Restrict `CLIENT_ORIGIN` to exact production frontend domains (no `*`).
* [x] **Rate Limiting**: Express rate limiters active on general endpoints (100 req/15m) and authentication routes (5 req/15m).
* [x] **Helmet Security Headers**: Active on all HTTP routes with HSTS, CSP, and XSS filtering.
* [x] **Secret Hygiene**: Real secrets never committed to Git; `.gitignore` strictly excludes `.env` and `uploads/`.
* [x] **IDOR & Authorization**: Student profile and ledger endpoints enforce ownership match (`req.user.id === studentId`).
* [x] **Sensitive KYC Masking**: Bank accounts and government IDs masked in all API responses.
* [x] **CSV Injection Prevention**: Export streams sanitize formula characters (`=`, `+`, `-`, `@`).
* [x] **Database Transactions**: Bed allocations, checkout workflows, and payments require MongoDB replica set sessions.





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

## ⚙️ Environment Configuration

Refer to [`.env.example`](file:///c:/Users/vaibh/OneDrive/Desktop/Smart%20Hostel%20Mess%20Management%20System/.env.example) for the exhaustive list of configuration parameters. **Never commit actual `.env` files or secrets to source control.**

Key configuration groups include:
* Application Port & Environment (`PORT`, `NODE_ENV`)
* Database Connection String (`MONGODB_URI` — replica set required for multi-document ACID transactions; standalone permitted only for non-transactional development)
* Authentication Secrets & Expiry (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACTIVATION_TOKEN_TTL_HOURS`)
* One-Time Admin Setup Token (`ADMIN_SETUP_SECRET`)
* File Upload Storage Paths & Size Limits
* Email Service Adapter (`EMAIL_PROVIDER`, `SMTP_HOST`, `DEV_EMAIL_CONSOLE_LOG`)

---

## 🚦 Phase 1 Status: Ready for Architecture Review

This repository is currently in **Phase 1 (Requirements Analysis and Technical Architecture)**. All planning, schema models, API specifications, and security plans are codified in `docs/`.

> **Note for Evaluators & Mentors**:  
> Application source code will be generated iteratively starting with Phase 2 once the technical architecture and open decision points are formally approved.

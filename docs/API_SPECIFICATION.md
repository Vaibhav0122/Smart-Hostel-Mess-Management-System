# REST API Specification: Smart Hostel & Mess Management System

> **Document Version**: 1.0.0  
> **Base URL**: `/api/v1`  
> **API Protocol**: REST over HTTPS with JSON Payloads  
> **Status**: Approved for Technical Planning (Phase 1)

---

## 1. Global API Conventions & Standards

### 1.1 Response Envelope Structure
All API responses adhere to a consistent JSON envelope:

#### Successful Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource fetched successfully",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 84,
    "totalPages": 5
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "One or more input fields failed validation",
    "details": [
      {
        "field": "registeredPhone",
        "issue": "Must be a valid 10-digit Indian phone number"
      }
    ]
  }
}
```

### 1.2 Standard HTTP Status Codes
* `200 OK`: Successful read or update.
* `201 Created`: Successful resource creation.
* `400 Bad Request`: Schema validation failure or malformed input.
* `401 Unauthorized`: Missing, expired, or invalid JWT access token.
* `403 Forbidden`: Authenticated, but lacking sufficient role or ownership rights.
* `404 Not Found`: Target resource does not exist.
* `409 Conflict`: Unique constraint violation (e.g., duplicate email, bed already occupied).
* `422 Unprocessable Entity`: Business logic violated (e.g., meal selection past cutoff).
* `429 Too Many Requests`: Rate limit exceeded.
* `500 Internal Server Error`: Unexpected server exception (unhandled).

---

## 2. API Endpoints by Domain

---

### Group 1: Initial Setup & Authentication

#### 1.1 One-Time Administrator Bootstrap
* **Route**: `POST /api/v1/setup/initial-admin`
* **Purpose**: Creates the primary root administrator account. Permanently locks down upon completion.
* **Access**: Public, but requires `x-setup-secret` header matching `ADMIN_SETUP_SECRET`.
* **Request Body**:
  ```json
  {
    "fullName": "Chief Warden Sharma",
    "email": "warden@hostel.internal",
    "password": "StrongPassword@2026",
    "phone": "9876543210"
  }
  ```
* **Validation**: Email format, password min 8 chars (1 uppercase, 1 lowercase, 1 number, 1 special), phone format.
* **Success (201 Created)**: Returns `{ success: true, message: "Initial administrator bootstrapped successfully. Setup route is now sealed." }`
* **Errors**: `403 Forbidden` (Invalid secret or admin already exists), `400 Bad Request`.

---

#### 1.2 User Login
* **Route**: `POST /api/v1/auth/login`
* **Purpose**: Authenticates a user and issues dual tokens.
* **Access**: Public (Strictly rate-limited: 5 attempts / 15 mins).
* **Request Body**:
  ```json
  {
    "identifier": "STU-202610001", // Or email for administrators
    "password": "StudentPassword#2026"
  }
  ```
* **Success (200 OK)**:
  * Sets `refreshToken` in `HttpOnly`, `SameSite=Strict` cookie.
  * Body:
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "eyJhbGciOi...",
        "expiresIn": 900,
        "user": {
          "id": "654321...",
          "studentId": "STU-202610001",
          "email": "student@college.edu",
          "role": "STUDENT",
          "fullName": "Vaibhav Kumar"
        }
      }
    }
    ```
* **Errors**: `401 Unauthorized` ("Invalid credentials"), `403 Forbidden` ("Account deactivated / Pending activation").

---

#### 1.3 Account Activation (First-Time Login)
* **Route**: `POST /api/v1/auth/activate`
* **Purpose**: Sets permanent password using single-use activation token.
* **Access**: Public.
* **Request Body**:
  ```json
  {
    "activationToken": "8f3b2c1a...",
    "newPassword": "NewStrongPassword@2026"
  }
  ```
* **Success (200 OK)**: Account status becomes `ACTIVE`, activation token cleared. Returns message with student ID.
* **Errors**: `400 Bad Request` (Expired/invalid token or weak password).

---

#### 1.4 Token Refresh & Rotation
* **Route**: `POST /api/v1/auth/refresh`
* **Purpose**: Issues a new access token and rotates the refresh token.
* **Access**: Public (Cookie-based).
* **Success (200 OK)**: Returns new `accessToken`; sets new `refreshToken` cookie.
* **Errors**: `401 Unauthorized` (Invalid/expired token, or token theft detected).

---

#### 1.5 User Logout
* **Route**: `POST /api/v1/auth/logout`
* **Purpose**: Invalidates the active refresh token hash in DB and clears client cookie.
* **Access**: Authenticated (`requireAuth`).
* **Success (200 OK)**: `{ success: true, message: "Logged out successfully" }`.

---

### Group 2: Student Management & CSV Import

#### 2.1 Create Individual Student
* **Route**: `POST /api/v1/students`
* **Purpose**: Admin registers a student, generates `STU-YYYYMMNNN` ID, and generates activation token.
* **Access**: `HOSTEL_ADMIN` (`students:create`).
* **Request Body**:
  ```json
  {
    "fullName": "Aman Verma",
    "email": "aman.verma@college.edu",
    "registeredPhone": "9812345678",
    "academicInfo": {
      "rollNumber": "23BCSE101",
      "course": "BTech",
      "branch": "CSE-AIML",
      "yearOfStudy": 2
    },
    "emergencyContact": {
      "name": "Rajesh Verma",
      "relationship": "Father",
      "phone": "9812345679"
    }
  }
  ```
* **Success (201 Created)**: Returns created student record with generated `studentId` and activation expiry.
* **Errors**:
  * `400 Bad Request`: Validation failure on input schema.
  * `409 Conflict` (`EMAIL_ALREADY_EXISTS`): Email already registered in system.
  * `403 Forbidden`: Insufficient role permissions.

---

#### 2.2 Bulk Import Students: Stage 1 (Validate & Preview)
* **Route**: `POST /api/v1/students/import-csv/preview`
* **Purpose**: Parses uploaded CSV, dry-runs validation, checks duplicate emails against DB, and outputs preview without committing. (Note: shared family phone numbers are permitted).
* **Access**: `HOSTEL_ADMIN` (`students:import`).
* **Content-Type**: `multipart/form-data` (Field: `file`).
* **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalRows": 50,
      "validRowCount": 48,
      "invalidRowCount": 2,
      "validPreview": [ ...first 5 valid records... ],
      "errors": [
        { "row": 14, "email": "bad-email", "reason": "Invalid email format" },
        { "row": 29, "phone": "123", "reason": "Phone must be 10 digits" }
      ]
    }
  }
  ```

---

#### 2.3 Bulk Import Students: Stage 2 (Confirm & Commit)
* **Route**: `POST /api/v1/students/import-csv/commit`
* **Purpose**: Commits the validated CSV records, assigns atomic student IDs, and queues activation links.
* **Access**: `HOSTEL_ADMIN` (`students:import`).
* **Request Body**: `{ "importBatchKey": "batch_uuid_xyz" }`
* **Success (201 Created)**: Summary of imported records and generated student IDs.

---

#### 2.4 List Students (Paginated & Filtered)
* **Route**: `GET /api/v1/students`
* **Query Params**: `page=1&limit=20&search=aman&status=ACTIVE&hostelId=...`
* **Access**: `HOSTEL_ADMIN` (`students:view_all`).
* **Success (200 OK)**: Paginated student summary list (Aadhaar/PAN/bank details omitted).

---

### Group 3: Student Profile & KYC Management

#### 3.1 Get Profile (Self or Admin)
* **Route**: `GET /api/v1/profile/me` (or `GET /api/v1/profile/:studentId` for Admin)
* **Access**: Student (Own profile) or `HOSTEL_ADMIN`.
* **Success (200 OK)**: Returns full student profile with masked KYC numbers and bank details.

---

#### 3.2 Update Own Profile
* **Route**: `PATCH /api/v1/profile/me`
* **Access**: Student (`profile:update_self`).
* **Request Body**:
  ```json
  {
    "alternatePhone": "9876501234",
    "bloodGroup": "B+",
    "dietaryPreference": "VEGETARIAN",
    "addresses": {
      "current": { "street": "Flat 4B", "city": "Noida", "state": "UP", "postalCode": "201301" }
    }
  }
  ```
* **Validation**: Rejects any attempt to inject `role`, `studentId`, `roomId`, or `dues`.

---

#### 3.3 Upload KYC Document
* **Route**: `POST /api/v1/profile/documents`
* **Access**: Student (`profile:upload_kyc`).
* **Content-Type**: `multipart/form-data`
* **Body**: `documentType` (`AADHAAR` | `PAN` | `COLLEGE_ID`), `maskedIdNumber`, `file` (PDF/JPEG/PNG, max 5 MB).
* **Success (201 Created)**: Metadata of uploaded document (file key hidden, secure ID returned).

---

#### 3.4 Secure Stream KYC Document
* **Route**: `GET /api/v1/profile/documents/:docId`
* **Purpose**: Securely streams private document binary after ownership/admin check.
* **Access**: Document Owner or `HOSTEL_ADMIN`.

---

### Group 4: Hostel, Building, Room & Bed Management

#### 4.1 Create Room
* **Route**: `POST /api/v1/rooms`
* **Access**: `HOSTEL_ADMIN` (`rooms:manage`).
* **Request Body**:
  ```json
  {
    "hostelId": "651a...",
    "buildingId": "651b...",
    "roomNumber": "204",
    "floor": 2,
    "roomType": "DOUBLE",
    "baseMonthlyRent": 8500
  }
  ```
* **Success (201 Created)**: Automatically provisions Bed A and Bed B records in `beds` collection.

---

#### 4.2 List Rooms with Real-Time Vacancy
* **Route**: `GET /api/v1/rooms`
* **Query Params**: `hostelId=...&floor=2&status=AVAILABLE&roomType=DOUBLE`
* **Access**: `HOSTEL_ADMIN`.

---

### Group 5: Room Allocations & Transfers

#### 5.1 Allocate Bed to Student
* **Route**: `POST /api/v1/allocations`
* **Purpose**: Executes atomic ACID allocation transaction.
* **Access**: `HOSTEL_ADMIN` (`allocations:create`).
* **Request Body**:
  ```json
  {
    "studentId": "651c...",
    "contractId": "651d...",
    "roomId": "651e...",
    "bedId": "651f...",
    "startDate": "2026-11-01"
  }
  ```
* **Success (201 Created)**: Returns updated bed status and allocation ID.
* **Errors**: `409 Conflict` (Bed already occupied, or student already has active bed).

---

#### 5.2 Transfer Student Room/Bed
* **Route**: `POST /api/v1/allocations/transfer`
* **Purpose**: Atomically vacates previous bed and occupies target bed in single transaction.
* **Access**: `HOSTEL_ADMIN` (`allocations:transfer`).
* **Request Body**:
  ```json
  {
    "currentAllocationId": "652a...",
    "targetBedId": "652b...",
    "targetRoomId": "652c...",
    "transferReason": "Requested quiet room for research project"
  }
  ```

---

### Group 6: Contracts & Residency Tenure

#### 6.1 Create Contract
* **Route**: `POST /api/v1/contracts`
* **Access**: `HOSTEL_ADMIN`.
* **Request Body**:
  ```json
  {
    "studentId": "651c...",
    "hostelId": "651a...",
    "startDate": "2026-11-01",
    "endDate": "2027-10-31",
    "tenureMonths": 12,
    "lockInUntilDate": "2027-04-30",
    "noticePeriodDays": 30,
    "monthlyRentAmount": 8500,
    "securityDepositAmount": 15000
  }
  ```

---

#### 6.2 Initiate Exit Request (Student)
* **Route**: `POST /api/v1/contracts/exit-request`
* **Access**: Student (`contracts:request_exit`).
* **Request Body**:
  ```json
  {
    "requestedExitDate": "2027-05-15",
    "reason": "Graduating and semester internship in Bengaluru"
  }
  ```

---

#### 6.3 Approve Exit & Final Checkout (Admin)
* **Route**: `POST /api/v1/contracts/:contractId/approve-exit`
* **Purpose**: Verifies dues == 0; atomically marks bed vacant and finishes contract.
* **Access**: `HOSTEL_ADMIN` (`contracts:approve_exit`).
* **Errors**: `422 Unprocessable Entity` ("Cannot checkout student: Outstanding dues of ₹4,200 pending").

---

### Group 7: Financial Ledger (Charges, Payments & Refunds)

#### 7.1 Generate Charge / Invoice
* **Route**: `POST /api/v1/finances/charges`
* **Access**: `HOSTEL_ADMIN` (`finances:charge`).
* **Request Body**:
  ```json
  {
    "studentId": "651c...",
    "contractId": "651d...",
    "chargeType": "MONTHLY_RENT",
    "billingPeriod": "2026-11",
    "amount": 8500,
    "dueDate": "2026-11-05"
  }
  ```

---

#### 7.2 Record Manual Payment
* **Route**: `POST /api/v1/finances/payments`
* **Purpose**: Records an append-only payment transaction.
* **Access**: `HOSTEL_ADMIN` (`finances:record_payment`).
* **Request Body**:
  ```json
  {
    "studentId": "651c...",
    "chargeRecordId": "653a...",
    "amountPaid": 8500,
    "paymentMethod": "UPI",
    "referenceNumber": "UPI-42981029384",
    "paymentDate": "2026-11-03",
    "notes": "Paid via Google Pay"
  }
  ```
* **Success (201 Created)**: Generates serial receipt `REC-202611-00042`.
* **Errors**: `409 Conflict` (Duplicate bank reference UTR number).

---

#### 7.3 Get Financial Dues & Ledger
* **Route**: `GET /api/v1/finances/ledger/me` (or `GET /api/v1/finances/ledger/:studentId` for Admin)
* **Access**: Student (Own ledger) or `HOSTEL_ADMIN`.
* **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalCharges": 25500,
      "totalPaid": 17000,
      "totalRefunded": 0,
      "outstandingBalance": 8500,
      "chargeHistory": [ ... ],
      "paymentHistory": [ ... ]
    }
  }
  ```

---

#### 7.4 Download Payment Receipt
* **Route**: `GET /api/v1/finances/receipts/:receiptNumber`
* **Purpose**: Generates printable PDF / verified receipt data.
* **Access**: Student (Own receipt) or `HOSTEL_ADMIN`.

---

### Group 8: Food & Mess Management

#### 8.1 Create/Update Day Menu
* **Route**: `POST /api/v1/mess/menu`
* **Access**: `HOSTEL_ADMIN` (`mess:manage_menu`).
* **Request Body**:
  ```json
  {
    "hostelId": "651a...",
    "mealDate": "2026-10-25",
    "mealType": "LUNCH",
    "title": "Rajma Chawal Feast",
    "items": ["Rajma", "Steamed Basmati Rice", "Raita", "Salad", "Papad"]
  }
  ```

---

#### 8.2 Get Menus (Upcoming 3 Days)
* **Route**: `GET /api/v1/mess/menu`
* **Query Params**: `hostelId=...&days=3`
* **Access**: Authenticated (`STUDENT`, `HOSTEL_ADMIN`).

---

#### 8.3 Submit Daily Lunch Choice (Tiffin vs. Dine-in)
* **Route**: `POST /api/v1/mess/selection`
* **Purpose**: Student sets lunch preference before cutoff for a specific local calendar date.
* **Access**: Student (`mess:select_meal`).
* **Request Body**:
  ```json
  {
    "mealDate": "2026-10-25",
    "selection": "TIFFIN" // Or "DINE_IN"
  }
  ```
* **Business Rule**: Must be submitted before `lunchCutoffTime` (e.g., 09:30 AM local hostel time).
* **Success (200 OK)**: Sets `selection: "TIFFIN"`, `isDefault: false`.
* **Errors**: `422 Unprocessable Entity` ("Cutoff time of 09:30 AM has passed for this date").

---

#### 8.4 Authorized Administrator Selection Override
* **Route**: `PATCH /api/v1/mess/selection/override`
* **Purpose**: Allows warden to alter a student's selection after cutoff, with mandatory audit logging.
* **Access**: `HOSTEL_ADMIN` (`mess:override_selection`).
* **Request Body**:
  ```json
  {
    "studentId": "651c...",
    "mealDate": "2026-10-25",
    "newSelection": "TIFFIN",
    "overrideReason": "Student has unexpected lab exam at 1:00 PM; authorized by Warden"
  }
  ```
* **Success (200 OK)**: Updates selection and writes immutable entry to `auditLogs`.

---

#### 8.5 Daily Kitchen Preparation & Tiffin Dispatch Roster
* **Route**: `GET /api/v1/mess/reports/daily-kitchen`
* **Query Params**: `hostelId=...&mealDate=2026-10-25`
* **Access**: `HOSTEL_ADMIN`, `MESS_STAFF`.
* **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "mealDate": "2026-10-25",
      "totalResidents": 210,
      "confirmedDineInCount": 162,
      "confirmedTiffinCount": 48,
      "explicitSelections": 85,
      "defaultSelections": 125,
      "tiffinRoster": [
        { "studentId": "STU-202610001", "name": "Vaibhav Kumar", "room": "204-A", "phone": "9876543210" }
      ]
    }
  }
  ```

---

### Group 9: Complaints & Grievance Dispatch

#### 9.1 File Grievance / Complaint
* **Route**: `POST /api/v1/complaints`
* **Access**: Student (`complaints:create`).
* **Content-Type**: `multipart/form-data`
* **Fields**: `category`, `title`, `description`, `priority`, `photos` (up to 3 images).
* **Success (201 Created)**: Generates ticket number `CMP-202610-008`.

---

#### 9.2 Update Complaint Status & Assign Staff (Admin)
* **Route**: `PATCH /api/v1/complaints/:ticketNumber/status`
* **Access**: `HOSTEL_ADMIN` (`complaints:resolve`).
* **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS",
    "assignedStaffName": "Ramesh (Electrician)",
    "adminRemarks": "Electrician dispatched to Room 204 to inspect switchboard"
  }
  ```

---

#### 9.3 Submit Student Resolution Feedback
* **Route**: `POST /api/v1/complaints/:ticketNumber/feedback`
* **Access**: Student (Complaint creator only).
* **Request Body**: `{ "rating": 5, "comment": "Fixed quickly. Working perfectly now." }`

---

### Group 10: Student Leave & Gate Visitors

#### 10.1 Submit Leave Application
* **Route**: `POST /api/v1/leave`
* **Access**: Student (`leave:apply`).
* **Request Body**:
  ```json
  {
    "leaveType": "WEEKEND",
    "departureDate": "2026-10-24T18:00:00Z",
    "expectedReturnDate": "2026-10-26T08:00:00Z",
    "reason": "Visiting hometown for Diwali festival",
    "destinationAddress": "House 12, Civil Lines, Kanpur",
    "emergencyContactPhone": "9812345679",
    "parentConsentAcknowledged": true
  }
  ```

---

#### 10.2 Review Leave Application (Admin)
* **Route**: `PATCH /api/v1/leave/:leaveId/review`
* **Access**: `HOSTEL_ADMIN` (`leave:approve`).
* **Request Body**: `{ "action": "APPROVE", "remarks": "Approved. Return by Monday 8 AM." }`

---

#### 10.3 Register Visitor & Log Gate Check-In/Out
* **Route**: `POST /api/v1/visitors` (Register)
* **Route**: `PATCH /api/v1/visitors/:visitorId/check-in` (Gate Check-In)
* **Route**: `PATCH /api/v1/visitors/:visitorId/check-out` (Gate Check-Out)
* **Access**: Pre-register: Student / Admin; Check-in/out: `HOSTEL_ADMIN` or `SECURITY_STAFF`.

---

### Group 11: Notices & Notifications

#### 11.1 Publish Notice
* **Route**: `POST /api/v1/notices`
* **Access**: `HOSTEL_ADMIN` (`notices:publish`).

#### 11.2 Get User In-App Notifications
* **Route**: `GET /api/v1/notifications`
* **Access**: Authenticated (Own notifications).

#### 11.3 Mark Notification Read
* **Route**: `PATCH /api/v1/notifications/:id/read`
* **Access**: Authenticated.

---

### Group 12: Admin Dashboard & Reports

#### 12.1 Real-Time Executive KPI Dashboard
* **Route**: `GET /api/v1/dashboard/admin-metrics`
* **Access**: `HOSTEL_ADMIN` (`reports:view`).
* **Success (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "totalStudents": 210,
      "totalBeds": 240,
      "occupiedBeds": 210,
      "vacantBeds": 30,
      "occupancyRate": 87.5,
      "pendingComplaints": 4,
      "activeLeavesToday": 12,
      "visitorsInside": 3,
      "totalOutstandingDues": 42500,
      "todayLunchDineIn": 162,
      "todayLunchTiffin": 48
    }
  }
  ```

---

#### 12.2 Export Server-Side CSV Reports
* **Route**: `GET /api/v1/reports/export-csv`
* **Query Params**: `type=occupancy | finances | complaints | mess&startDate=...&endDate=...`
* **Access**: `HOSTEL_ADMIN` (`reports:export`).
* **Response**: Streamed CSV file attachment with header `Content-Disposition: attachment; filename="report-finances-202610.csv"`.

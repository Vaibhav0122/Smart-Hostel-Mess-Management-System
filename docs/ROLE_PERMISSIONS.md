# Role-Based Access Control (RBAC) & Permission Matrix

> **Document Version**: 1.0.0  
> **Status**: Approved for Technical Planning (Phase 1)  
> **Security Baseline**: Principle of Least Privilege & Zero Client Trust

---

## 1. Architectural Philosophy & Zero Client Trust

A foundational rule of this system is that **the backend never trusts any role, user ID, student ID, or permission passed in the request body, query parameter, or custom header from the client**.

1. **Authentication State**: The requesting user's identity is derived strictly from the cryptographically verified JWT access token signature.
2. **Authorization Guards**: Every incoming protected request passes through a two-stage authorization verification:
   * **Stage 1 (Permission Check)**: Does the user's role possess the general permission to perform `resource:action`?
   * **Stage 2 (Resource Ownership & Tenancy Check)**: If the user is a `STUDENT`, is the target record owned by this specific student (`record.studentId === req.user.id`)? If the user is a `HOSTEL_ADMIN`, does the record belong to their assigned hostel boundary?

---

## 2. Defined System Roles

### Initial Scope (Phase 1 Implementation)
* 🎓 **`STUDENT` (Hostel Resident)**:
  * Regular student living in the hostel.
  * Granted strictly self-scoped privileges: viewing room assignment, signing contracts, viewing personal fee ledger, selecting daily lunch (Dine-in vs. Tiffin), raising grievances, applying for leave, and pre-registering visitors.
* 🏢 **`HOSTEL_ADMIN` (Warden / Hostel Manager)**:
  * Administrative authority over one or more assigned hostels.
  * Manages student onboarding, CSV bulk imports, room/bed inventory, allocations and room transfers, contract approvals, manual fee collections, mess menus, meal cutoff overrides, complaint assignment and resolution, and leave approvals.

### Extensible Future Roles (Pre-Architected in Permission Engine)
* 👑 **`SUPER_ADMIN`**: Global institutional administrator overseeing multiple hostels, configuring system settings, and inspecting audit trails.
* 💼 **`ACCOUNTS_MANAGER`**: Financial officer managing fee categories, bulk billing runs, payment reconciliation, and security deposit refunds.
* 🍳 **`MESS_STAFF` (Catering Manager)**: Dedicated dining hall staff interface for viewing real-time lunch headcounts, downloading tiffin packing rosters, and monitoring daily food feedback.
* 🛡️ **`SECURITY_STAFF` (Gate Security)**: Gatekeeper interface for recording visitor physical check-in/out and verifying student leave gate passes.

---

## 3. Granular Permission Namespace (`resource:action`)

All actions in the system map to a standardized permission string:

| Resource | Action Key | Description |
| :--- | :--- | :--- |
| **`students`** | `students:create` | Register a new student account |
| | `students:import` | Perform bulk CSV student import |
| | `students:view_all` | View paginated resident directory |
| | `students:deactivate` | Deactivate/suspend a student account |
| **`profile`** | `profile:view_self` | View own profile details |
| | `profile:update_self` | Update permitted personal profile fields |
| | `profile:upload_kyc` | Upload Aadhaar, PAN, or College ID proof |
| | `profile:view_sensitive` | View unmasked student KYC and bank details |
| **`rooms`** | `rooms:manage` | Create, edit, and decommission rooms and beds |
| | `rooms:view` | Inspect room vacancy and occupancy statuses |
| **`allocations`**| `allocations:create` | Atomically allocate bed to student |
| | `allocations:transfer` | Transfer student between rooms/beds |
| | `allocations:checkout` | Execute final physical checkout |
| **`contracts`** | `contracts:create` | Generate new residency contract |
| | `contracts:view_self` | View own contract tenure and terms |
| | `contracts:request_exit`| Submit premature exit or graduation checkout request |
| | `contracts:approve_exit`| Approve student checkout and dues clearance |
| **`finances`** | `finances:charge` | Issue charge/invoice to student |
| | `finances:record_payment`| Record manual cash/UPI/bank payment receipt |
| | `finances:reverse` | Issue auditable payment reversal / credit note |
| | `finances:view_self` | View own fee balance and payment ledger |
| | `finances:view_all` | Inspect institutional revenue and arrears |
| **`mess`** | `mess:manage_menu` | Curate day-wise meal menus |
| | `mess:select_meal` | Submit lunch choice before daily cutoff |
| | `mess:override_selection`| Authorize lunch choice change post-cutoff with audit reason |
| | `mess:view_roster` | View kitchen preparation and tiffin rosters |
| | `mess:feedback` | Submit meal ratings and taste reviews |
| **`complaints`** | `complaints:create` | Lodge maintenance complaint |
| | `complaints:view_self` | View own raised complaints and progress |
| | `complaints:resolve` | Assign staff, record remarks, and mark resolved |
| | `complaints:feedback` | Submit star rating on completed resolution |
| **`leave`** | `leave:apply` | Submit night-out or weekend leave application |
| | `leave:view_self` | View status of own leave applications |
| | `leave:approve` | Approve or reject student leave requests |
| **`visitors`** | `visitors:register` | Pre-register a guest/visitor |
| | `visitors:gate_log` | Record physical gate check-in and check-out |
| **`notices`** | `notices:publish` | Post digital notices and bulletins |
| | `notices:view` | Read notices targeted to resident |
| **`reports`** | `reports:view` | View real-time KPI dashboards |
| | `reports:export` | Export CSV reports for finances, beds, or mess |
| **`system`** | `system:audit_logs` | Inspect immutable administrative audit trail |

---

## 4. Master Role-Permission Matrix

| Permission String | `STUDENT` | `HOSTEL_ADMIN` | `SUPER_ADMIN` (Ext.) | `ACCOUNTS_MGR` (Ext.) | `MESS_STAFF` (Ext.) | `SECURITY_STAFF` (Ext.) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `students:create` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `students:import` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `students:view_all` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `students:deactivate` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `profile:view_self` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `profile:update_self` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `profile:upload_kyc` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `profile:view_sensitive`| ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `rooms:manage` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `rooms:view` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `allocations:create` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `allocations:transfer` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `allocations:checkout` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `contracts:create` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `contracts:view_self` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `contracts:request_exit`| ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `contracts:approve_exit`| ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finances:charge` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `finances:record_payment`| ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `finances:reverse` | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| `finances:view_self` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `finances:view_all` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `mess:manage_menu` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `mess:select_meal` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `mess:override_selection`| ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `mess:view_roster` | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `mess:feedback` | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| `complaints:create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `complaints:view_self` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `complaints:resolve` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `complaints:feedback` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `leave:apply` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `leave:view_self` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `leave:approve` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `visitors:register` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `visitors:gate_log` | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `notices:publish` | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `notices:view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `reports:view` | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `reports:export` | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| `system:audit_logs` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 5. Middleware Architecture & Ownership Enforcement

```typescript
// Architectural representation of backend middleware pipeline

/**
 * 1. requireAuth: Verifies JWT signature and injects req.user
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => { ... };

/**
 * 2. requirePermission: Asserts requesting user holds specific permission string
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user.role;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Your role (${userRole}) is not authorized to perform action: ${permission}`
        }
      });
    }
    next();
  };
};

/**
 * 3. verifyOwnershipOrAdmin: Enforces that students can ONLY read/write their own records
 */
export const verifyOwnershipOrAdmin = (studentIdGetter: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role === "HOSTEL_ADMIN" || req.user.role === "SUPER_ADMIN") {
      return next(); // Administrators have cross-student inspection rights within their hostel
    }

    const targetStudentId = studentIdGetter(req);
    if (req.user.studentId !== targetStudentId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "IDOR_FORBIDDEN",
          message: "Access Denied: You cannot view or modify another student's confidential records."
        }
      });
    }
    next();
  };
};
```

---

## 6. Extensibility Guarantee

To add a new role (e.g., `NURSE_INFIRMARY` or `LAUNDRY_SUPERVISOR`):
1. Add the role identifier to the `Role` TypeScript enum.
2. Define their allowed permission strings in the `ROLE_PERMISSIONS` configuration object.
3. **Zero existing routes or controller files need to be modified**, preserving Open/Closed architectural principles.

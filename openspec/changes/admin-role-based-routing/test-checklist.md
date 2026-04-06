# Test Checklist: Admin Role-Based Routing

This document defines manual and API test cases for verifying the admin role-based routing implementation. Based on the design in `design.md`.

---

## Test Setup

### Prerequisites
- Backend running at `http://localhost:5182`
- Frontend running at `http://localhost:3001`
- Test accounts available:
  - **Admin/SuperAdmin** account (e.g., `admin@test.com`)
  - **Manager** account (e.g., `manager@test.com`)
  - **Regular user** account (e.g., `user@test.com`)

### Test Notes
- Clear browser cookies (`access_token`, `refresh_token`, `auth_status`, `auth_portal`, `auth_roles`) between each test
- Use Incognito/Private window for each test to ensure clean state
- Backend must have `Auth:DisableAuthorization: false` in `appsettings.json` for policy tests to be meaningful

---

## Category 1: Login Redirect Tests

### T1 — Admin/SuperAdmin user logs in and is redirected to `/admin`
- **Description**: Verify that users with "Admin" or "SuperAdmin" role are redirected to the admin portal after login
- **Steps**:
  1. Open browser (incognito), navigate to frontend
  2. Login with an Admin or SuperAdmin account
  3. Observe the redirect URL after callback
- **Expected Result**: User is redirected to `/admin/dashboard` (not `/dashboard`)
- **Pass / Fail**: [ ]

### T2 — Manager user logs in and is redirected to `/dashboard`
- **Description**: Verify that users with "Manager" role are redirected to the manager portal after login
- **Steps**:
  1. Open browser (incognito), navigate to frontend
  2. Login with a Manager account
  3. Observe the redirect URL after callback
- **Expected Result**: User is redirected to `/dashboard` (the manager dashboard)
- **Pass / Fail**: [ ]

### T3 — Regular user logs in and is redirected to `/home`
- **Description**: Verify that users without Admin or Manager roles are redirected to the user portal after login
- **Steps**:
  1. Open browser (incognito), navigate to frontend
  2. Login with a regular user account (no admin/manager role)
  3. Observe the redirect URL after callback
- **Expected Result**: User is redirected to `/home`
- **Pass / Fail**: [ ]

---

## Category 2: Route Access Tests (Middleware)

### T4 — Admin user can access `/admin/*` routes
- **Description**: Verify that Admin/SuperAdmin users can access admin portal routes
- **Steps**:
  1. Login as Admin user
  2. Navigate to `/admin/dashboard`
  3. Verify page loads without redirect
  4. Navigate to `/admin/custom-tour-requests` (if exists)
  5. Verify page loads
- **Expected Result**: Admin user successfully accesses admin routes
- **Pass / Fail**: [ ]

### T5 — Manager user is blocked from accessing `/admin/*` routes
- **Description**: Verify that Manager users are redirected away from admin routes
- **Steps**:
  1. Login as Manager user
  2. Manually navigate to `/admin/dashboard` URL
  3. Observe what happens (redirect or 403)
- **Expected Result**: Manager is redirected to `/dashboard` or shows access denied
- **Pass / Fail**: [ ]

### T6 — Admin user is blocked from accessing Manager-specific routes
- **Description**: Verify that Admin users cannot access manager-specific routes (if they exist)
- **Steps**:
  1. Login as Admin user
  2. Manually navigate to `/dashboard/tour-management` (manager route)
  3. Observe what happens
- **Expected Result**: Admin is redirected to `/admin/dashboard` or shows access denied
- **Pass / Fail**: [ ]

---

## Category 3: API Authorization Tests

### T7 — Admin token can call AdminOnly policy endpoints (200)
- **Description**: Verify that an Admin JWT token successfully calls endpoints protected by `AdminOnly` policy
- **Steps**:
  1. Get Admin JWT token (see API setup below)
  2. Call an AdminOnly endpoint (e.g., `GET /api/roles`)
  3. Check HTTP response code
- **Expected Result**: HTTP 200 OK
- **Pass / Fail**: [ ]

### T8 — Manager token is denied from AdminOnly policy endpoints (403)
- **Description**: Verify that a Manager JWT token is rejected by `AdminOnly` policy endpoints
- **Steps**:
  1. Get Manager JWT token (see API setup below)
  2. Call an AdminOnly endpoint (e.g., `GET /api/roles`)
  3. Check HTTP response code
- **Expected Result**: HTTP 403 Forbidden
- **Pass / Fail**: [ ]

### T9 — Manager token can call ManagerOnly policy endpoints (200)
- **Description**: Verify that a Manager JWT token successfully calls endpoints protected by `ManagerOnly` policy
- **Steps**:
  1. Get Manager JWT token (see API setup below)
  2. Call a ManagerOnly endpoint (e.g., `GET /api/tours` or `GET /api/tour-requests`)
  3. Check HTTP response code
- **Expected Result**: HTTP 200 OK
- **Pass / Fail**: [ ]

### T10 — Admin token is denied from ManagerOnly policy endpoints (403)
- **Description**: Verify that an Admin JWT token is rejected by `ManagerOnly` policy endpoints
- **Steps**:
  1. Get Admin JWT token (see API setup below)
  2. Call a ManagerOnly endpoint (e.g., `GET /api/tours`)
  3. Check HTTP response code
- **Expected Result**: HTTP 403 Forbidden
- **Pass / Fail**: [ ]

---

## API Testing Commands

### Setup: Get JWT Tokens

**Login as Admin:**
```bash
curl -X POST http://localhost:5182/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"YourPassword123!"}' \
  -c admin_cookies.txt
```

**Login as Manager:**
```bash
curl -X POST http://localhost:5182/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"YourPassword123!"}' \
  -c manager_cookies.txt
```

**Extract Admin access token:**
```bash
grep access_token admin_cookies.txt | awk '{print $7}'
```

**Extract Manager access token:**
```bash
grep access_token manager_cookies.txt | awk '{print $7}'
```

### AdminOnly Policy Endpoints (should return 200 for Admin, 403 for Manager)

**GET /api/roles** (RoleController — AdminOnly):
```bash
# Admin token — should return 200
curl -X GET http://localhost:5182/api/roles \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Manager token — should return 403
curl -X GET http://localhost:5182/api/roles \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/users** (UserController — AdminOnly):
```bash
# Admin token — should return 200
curl -X GET http://localhost:5182/api/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Manager token — should return 403
curl -X GET http://localhost:5182/api/users \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/admin** (AdminController — AdminOnly):
```bash
# Admin token — should return 200
curl -X GET http://localhost:5182/api/admin \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Manager token — should return 403
curl -X GET http://localhost:5182/api/admin \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/departments** (DepartmentController — AdminOnly):
```bash
# Admin token — should return 200
curl -X GET http://localhost:5182/api/departments \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Manager token — should return 403
curl -X GET http://localhost:5182/api/departments \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/positions** (PositionController — AdminOnly):
```bash
# Admin token — should return 200
curl -X GET http://localhost:5182/api/positions \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Manager token — should return 403
curl -X GET http://localhost:5182/api/positions \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/site-content** (SiteContentController — AdminOnly):
```bash
# Admin token — should return 200
curl -X GET http://localhost:5182/api/site-content \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# Manager token — should return 403
curl -X GET http://localhost:5182/api/site-content \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

### ManagerOnly Policy Endpoints (should return 200 for Manager, 403 for Admin)

**GET /api/tours** (TourController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/tours \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/tours \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**GET /api/tour-instances** (TourInstanceController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/tour-instances \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/tour-instances \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

**GET /api/tour-requests** (TourRequestController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/tour-requests \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/tour-requests \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/bookings** (BookingManagementController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/bookings \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/bookings \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/payments** (PaymentController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/payments \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/payments \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/pricing-policies** (PricingPolicyController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/pricing-policies \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/pricing-policies \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/tax-configs** (TaxConfigController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/tax-configs \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/tax-configs \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/cancellation-policies** (CancellationPolicyController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/cancellation-policies \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/cancellation-policies \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/deposit-policies** (DepositPolicyController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/deposit-policies \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/deposit-policies \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

**GET /api/visa-policies** (VisaPolicyController — ManagerOnly):
```bash
# Manager token — should return 200
curl -X GET http://localhost:5182/api/visa-policies \
  -H "Authorization: Bearer <MANAGER_TOKEN>"

# Admin token — should return 403
curl -X GET http://localhost:5182/api/visa-policies \
  -H "Authorization: Bearer <MANAGER_TOKEN>"
```

### Expected Response Formats

**Success (200):**
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "data": null,
  "error": "Access denied"
}
```

---

## Summary

| Test ID | Category | Description | Status |
|---------|----------|-------------|--------|
| T1 | Login Redirect | Admin/SuperAdmin -> /admin | [ ] |
| T2 | Login Redirect | Manager -> /dashboard | [ ] |
| T3 | Login Redirect | Regular user -> /home | [ ] |
| T4 | Route Access | Admin accesses /admin/* | [ ] |
| T5 | Route Access | Manager blocked from /admin/* | [ ] |
| T6 | Route Access | Admin blocked from manager routes | [ ] |
| T7 | API Auth | Admin token -> AdminOnly endpoints (200) | [ ] |
| T8 | API Auth | Manager token -> AdminOnly endpoints (403) | [ ] |
| T9 | API Auth | Manager token -> ManagerOnly endpoints (200) | [ ] |
| T10 | API Auth | Admin token -> ManagerOnly endpoints (403) | [ ] |

**Total: 10 test cases**
**Passed: ___ / 10**

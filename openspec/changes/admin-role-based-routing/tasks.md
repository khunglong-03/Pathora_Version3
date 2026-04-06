# Tasks: Admin Role-Based Routing

## Phase 1: Frontend — Auth Logic

- [x] **1.1** Update `src/utils/authRouting.ts` — Add ADMIN_ROLE_NAMES, MANAGER_ROLE_NAMES constants, resolveRoleDefaultPath helper, update hasAdminRole
- [x] **1.2** Update `src/utils/postLoginRouting.ts` — Add ADMIN_ROUTE_PREFIXES, update resolvePostLoginPath to use roles parameter
- [x] **1.3** Update `src/store/api/auth/authApiSlice.ts` — Set auth_roles cookie after login, refresh, and getUserInfo
- [x] **1.4** Update `src/middleware.ts` — Role-based route protection with auth_roles cookie, cross-access blocking
- [x] **1.5** Update `src/app/auth/callback/page.tsx` — Role-based redirect using resolveRoleDefaultPath

## Phase 2: Backend — Policy-Based Authorization

- [x] **2.1** Add authorization policies in `panthora_be/src/Api/DependencyInjection.cs` — AdminOnly and ManagerOnly policies
- [x] **2.2** Update Admin controllers with [Authorize(Policy = "AdminOnly")] — RoleController, UserController, AdminController, DepartmentController, PositionController, SiteContentController
- [x] **2.3** Update Manager controllers with [Authorize(Policy = "ManagerOnly")] — TourController, TourInstanceController, TourRequestController, BookingManagementController, PaymentController, PricingPolicyController, TaxConfigController, CancellationPolicyController, DepositPolicyController, VisaPolicyController

## Phase 3: Admin Route Group

- [x] **3.1** Create Admin folder structure — `pathora/frontend/src/app/admin/` with dashboard, loading, error
- [x] **3.2** Create Admin layout at `pathora/frontend/src/app/admin/layout.tsx` with AdminSidebar variant="admin"
- [x] **3.3** Create Admin dashboard page at `pathora/frontend/src/app/admin/dashboard/page.tsx` placeholder
- [x] **3.4** Update AdminSidebar component — Add variant prop ("manager" | "admin"), separate ADMIN_NAV_ITEMS and MANAGER_NAV_ITEMS

## Phase 4: Testing & Verification

- [x] **4.1** Manual browser testing — T1-T10 test cases for login redirect and route access
- [x] **4.2** API testing — curl commands to verify backend policy enforcement

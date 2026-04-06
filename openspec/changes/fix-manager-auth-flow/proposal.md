# Proposal: Fix Manager Auth Flow

## Why

Manager role-based authorization is broken across the stack. Backend `ManagerOnly` policy uses `RequireRole("Manager")` which works, but frontend middleware and routing have inconsistent role name checks — `MANAGER_ROLE_NAMES = {"Manager"}` doesn't match the actual role names that Manager users have, causing legitimate Manager users to be redirected to `/home` instead of `/dashboard`. The auth flow needs a unified, consistent role-based policy from JWT token through middleware to page routing.

## What Changes

### Backend
- **No changes needed** to `DependencyInjection.cs` — `RequireRole("Manager")` already works with JWT `role: "Manager"` claim.
- Backend `AuthPortalResolver` already resolves Manager users to portal `"admin"` with default path `"/dashboard"`.
- Backend returns correct `portal` and `defaultPath` in login response.

### Frontend — Auth Flow Fix
- **Auth callback** (`auth/callback/page.tsx`): Refactor to use Redux store roles (already populated by `login` mutation's `onQueryStarted` → `getUserInfo` → `setAuthRolesCookie`) instead of awaiting a separate `getUserInfo` call. Fallback to fetch if roles not in store.
- **Middleware** (`middleware.ts`): Verify `MANAGER_ROLE_NAMES = {"Manager"}` is correctly applied for route guards and cross-access blocking.
- **Auth routing** (`utils/authRouting.ts`): `resolveRoleDefaultPath` with `MANAGER_ROLE_NAMES = {"Manager"}` must return `/dashboard` for Manager users.

### Frontend — Dashboard Layout
- **Create `(dashboard)/layout.tsx`**: Server component that reads `auth_roles` cookie, verifies Manager role, and wraps children with `AdminShell variant="manager"`. Redirects to `/home` if user lacks Manager role.
- **AdminSidebar** (`AdminSidebar.tsx`): Ensure `variant="manager"` is correctly applied for all `(dashboard)` pages.

### Frontend — Manager Navigation
- All 30+ pages under `(dashboard)/` route group remain accessible to Manager users.
- Manager sees full nav: Dashboard, Tours, Tour Instances, Tour Requests, Bookings, Payments, Customers, Insurance, Visa, Settings.

## Capabilities

### New Capabilities
- `manager-auth-flow`: Unified auth flow for Manager role — from JWT token validation through middleware route guards to page-level authorization with shared sidebar layout.

### Modified Capabilities
- (none — no spec-level behavior changes, only implementation fixes)

## Impact

| Area | Files |
|------|-------|
| Frontend — Auth | `auth/callback/page.tsx` |
| Frontend — Routing | `middleware.ts`, `utils/authRouting.ts` |
| Frontend — Layout | `app/(dashboard)/layout.tsx` (new) |
| Frontend — Components | `AdminSidebar.tsx` |
| Backend | (no changes needed) |

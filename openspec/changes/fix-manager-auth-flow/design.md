# Design: Fix Manager Auth Flow

## Context

Backend `ManagerOnly` policy uses `RequireRole("Manager")` and correctly authorizes JWT tokens with `role: "Manager"` claim. Backend `AuthPortalResolver` maps Manager users to portal `"admin"` with default path `"/dashboard"`. However, frontend has multiple role-checking locations (`middleware.ts`, `authRouting.ts`, `auth/callback/page.tsx`, and page components) that may not be consistently aligned, causing Manager users to be redirected to `/home` after login instead of `/dashboard`.

### Current Auth Flow

```
1. POST /api/auth/login
2. Backend returns: { accessToken, refreshToken, portal: "admin", defaultPath: "/dashboard" }
3. Frontend sets cookies: auth_portal="admin", auth_roles=["Manager"]
4. router.replace("/auth/callback")
5. Callback → getUserInfo → resolveRoleDefaultPath → /dashboard
6. Middleware runs on navigation → checks auth_roles
7. (dashboard) pages render without shared layout wrapper
```

### Current Issues

| Issue | Location | Impact |
|-------|----------|--------|
| Callback may race with getUserInfo | `auth/callback/page.tsx` | Roles may not be available at redirect time |
| No shared layout for (dashboard) | `app/(dashboard)/layout.tsx` missing | Each page imports AdminSidebar independently, no unified auth guard |
| `MANAGER_ROLE_NAMES` inconsistency | `authRouting.ts` vs `middleware.ts` | Hard to verify they're in sync |

## Goals / Non-Goals

**Goals:**
- Manager users login and are redirected to `/dashboard` (not `/home`)
- Middleware correctly blocks non-Manager users from accessing `(dashboard)` routes
- All `(dashboard)` pages share a unified layout with `AdminSidebar variant="manager"`
- Backend policy `ManagerOnly` (`RequireRole("Manager")`) remains unchanged and functional
- No new database tables or schema changes

**Non-Goals:**
- Policy-Based Authorization (permissions table, granular permissions)
- Changes to backend controllers, TokenManager, or JWT structure
- Admin portal (`/admin/*`) UI changes
- Changes to AuthController, AuthService, or backend auth infrastructure

## Decisions

### 1. Use Redux store as source of truth for roles in callback

**Decision**: Auth callback reads roles from Redux store (`useSelector(selectUser)`) instead of awaiting a separate `getUserInfo` call.

**Why**: The `login` mutation's `onQueryStarted` already dispatches `getUserInfo` and calls `setAuthRolesCookie`. By the time the router navigates to `/auth/callback`, the Redux store already has the user info. Using the store avoids a redundant API call and race conditions.

**Alternatives considered**:
- Await `getUserInfo.initiate()` in callback: Works but adds latency and an extra API call.
- Decode JWT directly in callback: Not needed since Redux already has the roles.

### 2. Server-side layout guard with cookies

**Decision**: Create `(dashboard)/layout.tsx` as a Next.js Server Component that reads `auth_roles` cookie via `cookies()` from `next/headers`, checks for Manager role, and redirects to `/home` if unauthorized.

**Why**: Server Components can read cookies natively without client-side API calls. This provides a security boundary — unauthorized users cannot even see the page shell before being redirected. It complements the middleware-level check.

**Alternatives considered**:
- Client-side layout with `useEffect`: Works but renders the page shell briefly before redirecting.
- Middleware-only guard: Middleware handles route-level blocking; layout handles page-level guard.

### 3. MANAGER_ROLE_NAMES = {"Manager"} — aligned everywhere

**Decision**: Define `MANAGER_ROLE_NAMES` as a shared constant, used consistently in:
- `middleware.ts`
- `authRouting.ts`
- `(dashboard)/layout.tsx`

**Why**: Single source of truth prevents drift. Only one place to update if role names change.

### 4. Auth roles cookie set on login and refresh

**Decision**: Keep existing behavior — `setAuthRolesCookie(roleNames)` is called from `login` mutation's `onQueryStarted` and `getUserInfo` callback. No changes needed.

**Why**: Works correctly. The cookie stores `["Manager"]` which matches `MANAGER_ROLE_NAMES`.

## Auth Flow (Fixed)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Manager Login Flow                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. POST /api/auth/login                                            │
│     ← { accessToken, refreshToken, portal: "admin",                │
│         defaultPath: "/dashboard" }                                  │
│                                                                      │
│  2. login.onQueryStarted:                                           │
│     • setCookie("access_token", ...)                               │
│     • setCookie("refresh_token", ...)                               │
│     • setAuthSessionCookies("admin")                                │
│     • dispatch(getUserInfo) → setUser → setAuthRolesCookie(["Manager"])│
│                                                                      │
│  3. router.replace("/auth/callback")                                │
│                                                                      │
│  4. Callback:                                                        │
│     userInfo = useSelector(selectUser)  ← Redux (already populated) │
│     if (userInfo?.roles) {                                          │
│       router.replace(resolveRoleDefaultPath(userInfo.roles))        │
│       // → "/dashboard" ✅                                          │
│     } else {                                                        │
│       dispatch(getUserInfo).then(result => ...)                      │
│     }                                                               │
│                                                                      │
│  5. Middleware:                                                     │
│     auth_portal = "admin"                                           │
│     auth_roles  = ["Manager"]                                       │
│     pathname = "/dashboard"                                        │
│     hasAdminRole(["Manager"])  → false                              │
│     hasManagerRole(["Manager"]) → true  (MANAGER_ROLE_NAMES={"Manager"})│
│     isManagerRoutePath("/dashboard") → true                         │
│     → NextResponse.next() ✅                                        │
│                                                                      │
│  6. (dashboard)/layout.tsx (Server Component):                      │
│     auth_roles = cookies().get("auth_roles")                        │
│     parse → ["Manager"]                                            │
│     MANAGER_ROLE_NAMES.has("Manager") → true ✅                     │
│     → <AdminShell variant="manager">{children}</AdminShell>        │
└─────────────────────────────────────────────────────────────────────┘
```

## Role-to-Route Mapping

```
┌──────────────────────────────────────────────────────────────────────┐
│  SUPERADMIN, ADMIN  (role: "SuperAdmin" or "Admin")                  │
│  Redirect: Login → /admin/dashboard                                  │
│  Middleware: hasAdminRole → blocks /dashboard/* routes              │
│  Backend:   AdminOnly policy → RequireRole("Admin","SuperAdmin")     │
│  Pages:     /admin/dashboard, /admin/custom-tour-requests/*       │
├──────────────────────────────────────────────────────────────────────┤
│  MANAGER  (role: "Manager")                                          │
│  Redirect: Login → /dashboard                                        │
│  Middleware: hasManagerRole → blocks /admin/* routes               │
│  Backend:   ManagerOnly policy → RequireRole("Manager")            │
│  Pages:     All routes under (dashboard)/ route group              │
├──────────────────────────────────────────────────────────────────────┤
│  OTHERS  (TourOperator, SalesStaff, TourGuide, Accountant, etc.)   │
│  Redirect: Login → /home                                            │
│  Backend:   No policy match → 403 on protected endpoints           │
│  Pages:     /home, public pages only                               │
└──────────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `(dashboard)/layout.tsx` server-side redirect causes flash | Server Component `redirect()` happens before any HTML is sent; minimal flash. |
| Cookie `auth_roles` not set yet on first navigation | Middleware also checks — user is blocked at middleware level even if layout hasn't loaded |
| User has both Admin and Manager role | Priority: Admin > Manager. Admin redirect wins. Middleware blocks cross-access. |
| Next.js Server Component cannot import `"use client"` components directly | `AdminShell` is already a client component. `AdminSidebar` is client. Server layout wraps them — Next.js handles the boundary correctly. |

## Open Questions (Pre-Work — MUST VERIFY BEFORE CODING)

### CRITICAL: Verify actual JWT role claim for Manager user
Before any frontend code change, **log the actual JWT payload** for a user with role "Manager".
The plan assumes `role: "Manager"` and `roles: ["Manager"]` but the JWT claim string is the
single source of truth. If it is `"manager"`, `"MANAGER"`, or something else, all frontend
changes will be wrong.

### CRITICAL: Verify backend login response for Manager user
Before any frontend code change, **verify the actual `/api/auth/login` response** for a Manager user:
- `portal` should be `"admin"`
- `defaultPath` should be `"/dashboard"`
If the backend returns different values, the backend fix becomes the primary task.

### HIGH: TourOperator/SalesStaff auth_portal gap
Users with type=2 (TourOperator, SalesStaff) have `auth_portal = "admin"` but should NOT
access `(dashboard)` routes. This is deferred but documented here as a known gap.

## Open Questions

1. ~~Manager role name inconsistency~~ — **Resolved**: JWT `role: "Manager"` is the source of truth. Backend assigns it, frontend checks for it. No DB mismatch.
2. **Admin portal (`/admin/*`)** — Currently only has dashboard. No admin-only UI pages exist yet (Users, Roles, Departments management). This is out of scope for this change.
3. **TourOperator / SalesStaff** — These users currently have `auth_portal = "admin"` in backend resolver (type=2). They should not access `(dashboard)` routes. This is a future scope (Policy-Based authorization).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|---------|
| CEO Review | `/autoplan` | Scope & strategy | 1 | issues_open | 8 findings (1 CRITICAL, 3 HIGH, 3 MEDIUM) |
| Eng Review | `/autoplan` | Architecture & tests | 1 | issues_open | 13 verified findings (2 CRITICAL, 6 HIGH, 5 MEDIUM) |
| Design Review | `/autoplan` | UI/UX gaps | 1 | issues_open | 6 findings (2 CRITICAL, 2 HIGH, 2 MEDIUM) |

**VERDICT:** CEO + ENG + DESIGN REVIEWED — issues identified and auto-decided. Eng review required.

**Cross-phase theme:** Cookie integrity — both Design and Eng flagged `(dashboard)/layout.tsx` needs robust cookie handling (parse safely, check both auth AND role cookies). Confirmed HIGH priority.

**Auto-decisions: 13 total.**

## 1. Update AdminShell.tsx

- [x] 1.1 Change `SUPERADMIN_ROLE_NAME = "SuperAdmin"` → `ADMIN_ROLE_NAME = "Admin"` in AdminShell.tsx
- [x] 1.2 Rename state `isSuperAdmin` → `isAdmin` throughout AdminShell.tsx (line 23, 33, 41)

## 2. Refactor AdminSidebar.tsx — Rename constants and navigation

- [x] 2.1 Delete `SUPERADMIN_USER_ITEMS`, `SUPERADMIN_PROVIDER_ITEMS`, `SUPERADMIN_TOUR_ITEMS`, `SUPERADMIN_NAV_ITEMS` constants
- [x] 2.2 Delete `SUPERADMIN_SECTION_LABELS` and `getSuperAdminSectionLabel` function
- [x] 2.3 Rename to `ADMIN_USER_ITEMS`, `ADMIN_PROVIDER_ITEMS`, `ADMIN_TOUR_ITEMS`, `ADMIN_NAV_ITEMS` and update href in each nav item
- [x] 2.4 Update prop interface: change `isSuperAdmin?: boolean` → `isAdmin?: boolean`
- [x] 2.5 Update function signature: `isSuperAdmin = false` → `isAdmin = false`
- [x] 2.6 Simplify nav logic at line 119: replace `variant === "admin" ? (isSuperAdmin ? [...SUPERADMIN_NAV_ITEMS] : ADMIN_NAV_ITEMS)` → `variant === "admin" ? ADMIN_NAV_ITEMS`
- [x] 2.7 Simplify render at line 285: replace `variant === "admin" && isSuperAdmin ? renderSuperAdminNav()` → `variant === "admin" ? renderAdminNav()`
- [x] 2.8 Rename `renderSuperAdminNav()` → `renderAdminNav()` and update internal references (section labels, nav item references)
- [x] 2.9 Update type annotation inside `renderAdminNav()` to reference `ADMIN_USER_ITEMS` types

## 3. Update middleware.ts

- [x] 3.1 Change `ADMIN_ROLE_NAMES` Set from `["Admin", "SuperAdmin"]` → `["Admin"]`
- [x] 3.2 Delete `hasSuperAdminRole` function entirely
- [x] 3.3 Delete the block that redirects non-SuperAdmin users from `/admin/tour-managers` and `/admin/tour-designers` (lines 135-143)
- [x] 3.4 Delete `hasSuperAdminRole` import/usage from middleware if applicable

## 4. Update auth routing utilities

- [x] 4.1 In `utils/authRouting.ts`: change `ADMIN_ROLE_NAMES` Set from `["Admin", "SuperAdmin"]` → `["Admin"]`
- [x] 4.2 In `utils/postLoginRouting.ts`: change `ADMIN_ROLE_NAMES` Set from `["Admin", "SuperAdmin"]` → `["Admin"]`

## 5. Update admin dashboard page title

- [x] 5.1 In `app/admin/dashboard/page.tsx`: change title "SuperAdmin Dashboard" → "Admin Dashboard"

## 6. Update unit tests

- [x] 6.1 In `utils/__tests__/authRouting.test.ts`: update all test names and assertions referencing "SuperAdmin" → "Admin"
- [x] 6.2 In `middleware/__tests__/middleware.test.ts`: update all test names and assertions referencing "SuperAdmin" → "Admin"

## 7. Verification

- [ ] 7.1 Run `npm run lint` to verify no ESLint errors
- [ ] 7.2 Run `npm run build` to verify production build passes
- [ ] 7.3 Run `npm test` to verify all unit tests pass
- [x] 7.4 Grep entire `pathora/frontend/src/` for any remaining "SuperAdmin" references (should return zero results) — Verified: zero results

## 1. Pre-flight Checks

- [x] 1.1 Search all codebase for references to `TourRequestAdminLayout` (imports, usages) — found 7 files import it (TourRequestDetailPage, TourRequestListPage, 5 policy pages), CANNOT delete
- [x] 1.2 Search all codebase for internal links to `/dashboard/tour-requests/[id]` to ensure no broken links after redirect deletion — found in TourRequestListPage.tsx and redirect page, canonical URL stays the same
- [x] 1.3 Verify `AdminSidebar.tsx` sidebar overlay z-index vs review modal z-index (modal must appear above sidebar) — sidebar z-50, backdrop z-40, modal z-[60] ✓
- [x] 1.4 Verify `(dashboard)/tour-requests/page.tsx` (list page) uses correct sidebar layout — uses TourRequestAdminLayout (same sidebar pattern), no refactor needed in scope

## 2. Add Pending Count Badge to AdminSidebar

- [x] 2.1 Add `pendingCount` state and `setPendingCount` to `AdminSidebar` component
- [x] 2.2 Add `loadPendingCount` callback in `AdminSidebar` using `tourRequestService.getAllTourRequests({ status: "Pending", pageNumber: 1, pageSize: 1 })`
- [x] 2.3 Add `useEffect` in `AdminSidebar` to call `loadPendingCount` on mount
- [x] 2.4 Update "Tour Requests" nav item in `NAV_ITEMS` to include pending count badge rendering (animated pill with count)
- [x] 2.5 Import `tourRequestService` from `@/api/services/tourRequestService` in `AdminSidebar.tsx`

## 3. Refactor TourRequestDetailPage Layout

- [x] 3.1 Import `AdminSidebar` and `TopBar` from `@/features/dashboard/components/AdminSidebar` in `TourRequestDetailPage.tsx`
- [x] 3.2 Replace `<TourRequestAdminLayout>` wrapper with `<AdminSidebar>` + `<TopBar>` pattern matching `AdminDashboardPage`
- [x] 3.3 Wrap page content in `<main>` with `id="main-content"` and appropriate classes (`p-6 lg:py-8 lg:pr-8 lg:pl-6`, `backgroundColor: "#F1F5F9"`, `minHeight: "100vh"`)
- [x] 3.4 Add `sidebarOpen` state and `onClose` handler to `TourRequestDetailPage`
- [x] 3.5 Remove import of `TourRequestAdminLayout` after refactoring

## 4. Remove Redundant Redirect Page

- [x] 4.1 Delete `(dashboard)/dashboard/tour-requests/[id]/page.tsx` redirect page
- [x] 4.2 Verify no other files import or link to the deleted redirect path — only TourRequestListPage links to `/dashboard/tour-requests/${id}` (canonical URL), no broken links

## 5. Cleanup

- [x] 5.1 If `TourRequestAdminLayout` has no other consumers (verified by task 1.1) → SKIP — 6 other files still import it (TourRequestListPage, 5 policy pages)
- [x] 5.2 If `TourRequestAdminLayout.tsx` is deleted → SKIP — file not deleted

## 6. Verification

- [x] 6.1 Run `npm run lint` to ensure no lint errors — 0 errors in changed files
- [x] 6.2 Run `npm run build` to verify the build passes — ✓ build successful
- [ ] 6.3 Manually verify on dev server at `http://localhost:3003/dashboard/tour-requests/{id}`:
  - Sidebar visible on desktop with Phosphor icons
  - Sidebar opens as overlay on mobile
  - "Tour Requests" nav item is active
  - TopBar shows hamburger menu (mobile) and notification bell
  - Back to list link works correctly
  - Approve/Reject modal works correctly (appears above sidebar overlay)
  - Pending count badge visible on "Tour Requests" nav item
- [x] 6.4 Verify list page at `/dashboard/tour-requests` also has correct sidebar — uses TourRequestAdminLayout (same sidebar pattern)

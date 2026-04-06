## Context

The SuperAdmin portal (`/admin/*`) currently serves as a minimal shell with only TourManager and TourDesigner management pages. The `/admin/dashboard` is a stub showing "coming soon". Three major user groups — general users, TransportProviders, and HotelServiceProviders — lack dedicated management pages. The goal is to transform the SuperAdmin portal into a comprehensive 4-section command center while maintaining consistency with the existing Bento 2.0 warm monochrome design language already established in the Manager dashboard.

**Current state:**
- `/admin/dashboard` — stub placeholder
- `/admin/tour-managers` — table-based list with edit/create
- `/admin/tour-designers` — table-based list
- `/admin/custom-tour-requests` — existing
- `AdminSidebar.tsx` — SuperAdmin nav has only 2 items

**Design language to adopt:** Warm monochrome with amber accent (`#C9873A`), Outfit font, Bento 2.0 with spring physics, diffusion shadows.

## Goals / Non-Goals

**Goals:**

- Build 4 distinct SuperAdmin management sections: Users, TourManagers+Staff, TransportProviders, HotelProviders
- Migrate from stub `/admin/dashboard` to KPI overview dashboard
- Consistent Bento 2.0 design across all admin pages
- Expand SuperAdmin sidebar navigation with labeled sections
- Backend API endpoints to support all frontend data needs

**Non-Goals:**

- Backend CRUD for creating/editing TransportProviders or HotelServiceProviders (SuperAdmin creates these via existing user creation flow)
- Authentication or authorization changes (already SuperAdmin-only)
- Changes to the Manager dashboard (`/dashboard/*`)
- Mobile-first redesign — responsive at lg breakpoint, mobile follows existing sidebar overlay pattern
- Adding departments/hierarchies beyond TourManager → Staff relationship

## Decisions

### Decision 1: Card-based layout over table-based layout for provider pages

**Choice:** Use bento card grids for Transport and Hotel provider pages instead of traditional data tables.

**Rationale:** Cards communicate more personality per item (icon, stats, status) and fit the Bento 2.0 design language established in the codebase. Tables are reserved for dense, filterable lists (Users page) where column alignment matters.

**Alternative considered:** Table layout — rejected because provider pages benefit from visual hierarchy and stat chips that tables cannot easily display. The existing TourManagers page uses a table which is fine for that use case (manager-level data with few columns), but Transport/Hotel pages benefit more from cards.

### Decision 2: Drill-down navigation for TourManager staff instead of inline expansion

**Choice:** Navigate from TourManager card to `/admin/tour-managers/{id}/staff` for staff list, rather than expanding inline within the same page.

**Rationale:** Staff assignment is a significant workflow (SuperAdmin reassigns staff between managers). A dedicated route makes the breadcrumb trail clear and allows bookmarking. Inline expansion would clutter the manager list page.

**Alternative considered:** Inline expansion — rejected because reassign modal in a modal inside an expanded row creates too deep a nesting context. Dedicated route is cleaner.

### Decision 3: Expand SUPERADMIN_NAV_ITEMS instead of creating separate nav groups

**Choice:** Add new nav items to `SUPERADMIN_NAV_ITEMS` array in `AdminSidebar.tsx`, grouped by section labels.

**Rationale:** Keeps the existing `AdminSidebar` component architecture intact. Adding section headers (labeled dividers) to the nav array is simpler than creating a new `NavSection` abstraction. No layout refactoring needed.

**Alternative considered:** Create a `NavSection` wrapper component — rejected for simplicity. The nav is small enough (5 items total) that section labels as visual separators within the existing flat nav structure are sufficient.

### Decision 4: Reuse existing shared UI components

**Choice:** Leverage existing `StatCard`, `SkeletonTable`, `Badge`, `StatusBadge`, `SearchableSelect`, `Modal`, `Pagination`, `ConfirmationDialog` from `src/components/ui/`.

**Rationale:** The codebase already has a rich component library. Building new primitives (badge, skeleton, modal) would duplicate effort. Only missing components to build: `AdminPageHeader` (page header composition), `AdminFilterTabs` (pill tabs with amber indicator), `AdminKpiStrip` (horizontal KPI row).

**Alternative considered:** Build all components from scratch — rejected. Existing components are well-tested and match the design system.

### Decision 5: Backend returns paginated, filterable lists

**Choice:** All list endpoints (`/api/admin/users`, `/api/admin/transport-providers`, `/api/admin/hotel-providers`) return paginated results with role/status filters applied server-side.

**Rationale:** Keeps the frontend thin — it only needs to pass filter parameters and render results. Server-side pagination is essential for Users page which may grow large. Client-side filtering is acceptable for small lists (providers) but server-side consistency is preferred.

**Alternative considered:** Client-side pagination — rejected because the Users page needs server-side filtering by role, and consistency across all list pages is preferable.

### Decision 6: User Management page uses table layout (not cards)

**Choice:** The Users page uses a traditional table layout with filter tabs.

**Rationale:** Users have many columns (avatar, name, email, role, status, actions) that need column alignment. A table is the appropriate pattern here. Cards would waste horizontal space. This is consistent with the existing TourManagers table approach.

## Risks / Trade-offs

[Risk] → Backend endpoint creation overhead
> **Mitigation:** All endpoints follow the same pattern as existing admin endpoints (`/api/admin/tour-managers`). Mirror the existing MediatR handler pattern. Keep it minimal — DTO + Query + Handler + Validator.

[Risk] → Staff reassignment requires careful handling
> **Mitigation:** Staff reassignment is a write operation. The reassign endpoint must be idempotent (reassigning to the same manager is a no-op). Validate that the target manager exists before updating.

[Risk] → Large user list impacts page performance
> **Mitigation:** Pagination at 20 users per page. Skeleton loader during fetch. Debounced search (300ms). Role filter tabs are server-side, not client-side, so the API must support `$filter=Role eq 'TourGuide'`.

[Risk] → Expanding sidebar nav items may conflict with future SuperAdmin features
> **Mitigation:** The section-label approach is purely visual. Future features can be added as new nav items in the same array. No hardcoded dependency on section names.

## Migration Plan

1. **Phase 1 — Backend API (backend-first):** Create all new API endpoints first so frontend has data contracts to build against.
2. **Phase 2 — Shared components:** Build `AdminPageHeader`, `AdminFilterTabs`, `AdminKpiStrip` reusable components.
3. **Phase 3 — Sidebar expansion:** Update `SUPERADMIN_NAV_ITEMS` and add section labels.
4. **Phase 4 — Page implementations:** Implement all 4 pages plus dashboard in parallel (each is independent).
5. **Phase 5 — Verification:** Run lint and build, verify all routes accessible by SuperAdmin only.

## Open Questions

1. **Provider detail view:** Should clicking a Transport/Hotel card navigate to a detail page, or is the card view sufficient? Current design assumes card view is sufficient for management — no detail page planned.
2. **Create/edit Transport/Hotel providers:** Should SuperAdmin be able to create/edit these users from the admin portal, or only via the existing user creation flow? Current design assumes existing flow is sufficient.
3. **Real-time updates:** Should the admin pages use SignalR for real-time updates when users change status? Not in scope for v1, but could be added later.
4. **Department hierarchy:** The codebase has `DepartmentEntity` but it's not used in the current admin flow. Should TourManagers be organized by department in the management UI? Current design assumes flat structure (no departments).

## API Contract Reference

### GET /api/admin/users

**Query params:** `pageNumber`, `pageSize`, `role` (optional), `status` (optional), `search` (optional)

**Response:**
```json
{
  "items": [{ "id", "username", "fullName", "email", "phoneNumber", "avatarUrl", "status", "verifyStatus", "roles": ["Admin"] }],
  "total": 16,
  "pageNumber": 1,
  "pageSize": 20
}
```

### GET /api/admin/transport-providers

**Query params:** `pageNumber`, `pageSize`, `status` (optional), `search` (optional)

**Response:**
```json
{
  "items": [{ "id", "fullName", "email", "phoneNumber", "avatarUrl", "status", "bookingCount" }],
  "total": 2,
  "pageNumber": 1,
  "pageSize": 20
}
```

### GET /api/admin/hotel-providers

**Query params:** `pageNumber`, `pageSize`, `status` (optional), `search` (optional)

**Response:**
```json
{
  "items": [{ "id", "fullName", "email", "phoneNumber", "avatarUrl", "status", "accommodationCount" }],
  "total": 2,
  "pageNumber": 1,
  "pageSize": 20
}
```

### GET /api/admin/tour-managers/{id}/staff

**Response:**
```json
{
  "manager": { "id", "fullName", "email", "phoneNumber", "avatarUrl", "status", "department" },
  "staff": [{ "id", "fullName", "email", "role": "TourDesigner|TourGuide", "status" }]
}
```

### PUT /api/admin/tour-managers/{managerId}/staff/{staffId}/reassign

**Body:** `{ "targetManagerId": "guid" }`

**Response:** `204 No Content` on success

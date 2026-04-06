## Why

The SuperAdmin portal currently has only two management pages (TourManager and TourDesigner) while leaving three critical user groups — all system users, TransportProviders, and HotelServiceProviders — without dedicated management interfaces. The `/admin/dashboard` remains a stub. SuperAdmins must use raw data or scattered endpoints to manage these user types. This change transforms the SuperAdmin portal into a complete, 4-section command center for the entire platform ecosystem.

## What Changes

- **New page: User Management (`/admin/users`)** — Unified view of all users in the system with role-based filtering, search, and status management across all 7 role types.
- **Expanded page: TourManager Management (`/admin/tour-managers`)** — TourManager cards now include a drill-down into each manager's staff (TourDesigners and TourGuides they supervise), enabling SuperAdmins to reassign staff between managers.
- **New page: Transport Provider Management (`/admin/transport-providers`)** — Dedicated management interface for TransportProvider role users, listing all transport service providers with booking stats.
- **New page: Hotel Provider Management (`/admin/hotel-providers`)** — Dedicated management interface for HotelServiceProvider role users, listing all accommodation providers.
- **Updated SuperAdmin sidebar** — Navigation restructured into 4 labeled sections: Users, Tour Management, Transport, Accommodation.
- **Backend API expansion** — New endpoints for listing users by role, listing transport/hotel providers, and reassigning staff to managers.
- **Updated `/admin/dashboard`** — Replace stub with a KPI overview showing aggregate stats across all 4 management sections.

## Capabilities

### New Capabilities

- `admin-user-management`: SuperAdmin views and filters all platform users across roles. Supports search, role-filter tabs, status toggle, and pagination. Read-only view with links to detail/edit.
- `admin-tour-manager-hierarchy`: SuperAdmin views each TourManager's profile card and can drill into a nested staff list showing all assigned TourDesigners and TourGuides. Supports reassign staff to different managers.
- `admin-transport-provider-management`: SuperAdmin lists, filters, and views TransportProvider accounts with aggregate booking statistics per provider.
- `admin-hotel-provider-management`: SuperAdmin lists, filters, and views HotelServiceProvider accounts with aggregate accommodation statistics per provider.
- `admin-dashboard-overview`: SuperAdmin dashboard landing page shows KPI cards for total users, active managers, active transport providers, active hotel providers, and recent activity.

### Modified Capabilities

- `admin-dashboard-routing`: The SuperAdmin sidebar navigation items will be expanded beyond just "Tour Manager" and "Tour Designer" to include all 4 management sections. The routing rules and role authorization remain unchanged.

## Impact

### Frontend

- New pages: `src/app/admin/users/`, `src/app/admin/transport-providers/`, `src/app/admin/hotel-providers/`
- Updated `AdminSidebar.tsx` — `SUPERADMIN_NAV_ITEMS` expanded with new nav items, reorganized into collapsible sections
- New shared components: `AdminPageHeader.tsx`, `AdminKpiCard.tsx`, `AdminFilterTabs.tsx`, `AdminUserTable.tsx`, `AdminProviderCard.tsx`
- No changes to middleware or route protection — all pages remain SuperAdmin-only

### Backend

- New API endpoint: `GET /api/admin/users` — paginated list of all users with role and status filters
- New API endpoint: `GET /api/admin/users/{id}` — single user detail
- New API endpoint: `GET /api/admin/transport-providers` — list of TransportProvider users
- New API endpoint: `GET /api/admin/hotel-providers` — list of HotelServiceProvider users
- New API endpoint: `GET /api/admin/tour-managers/{id}/staff` — staff members (TourDesigners + TourGuides) assigned to a specific manager
- Existing endpoint: `GET /api/admin/tour-managers` already implemented
- Authorization: all new endpoints require "Admin" or "SuperAdmin" policy

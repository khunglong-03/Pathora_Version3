# Dashboard Navigation Consistency — Delta

## MODIFIED Requirements

### Requirement: Admin sidebar renders consistently across all admin pages (DEPRECATED)

> This requirement is partially superseded. Admin sidebar now has two variants.

The original requirement applied to all pages under `(dashboard)`. With role-based routing:
- Manager pages (`/dashboard/*`) use Manager sidebar variant
- Admin pages (`/admin/*`) use Admin sidebar variant

### Requirement: Admin sidebar renders consistently across Manager pages

All pages under the Manager route group (`/dashboard/*`) SHALL render the Manager sidebar variant with identical navigation items.

#### Scenario: Manager sidebar renders on tour management page
- **WHEN** user with role "Manager" navigates to `/dashboard/tour-management`
- **THEN** the sidebar SHALL render with variant `"manager"`
- **AND** the sidebar SHALL include: Dashboard, Tours, Tour Instances, Tour Requests, Bookings, Payments, Customers, Insurance, Visa Applications, Settings

### Requirement: Admin sidebar renders consistently across Admin pages

All pages under the Admin route group (`/admin/*`) SHALL render the Admin sidebar variant with limited navigation.

#### Scenario: Admin sidebar renders on admin dashboard page
- **WHEN** user with role "Admin" navigates to `/admin/dashboard`
- **THEN** the sidebar SHALL render with variant `"admin"`
- **AND** the sidebar SHALL include: Dashboard, Settings (and other admin-only items, to be designed)

## ADDED Requirements

### Requirement: Sidebar variant determines navigation items

The AdminSidebar component SHALL accept a `variant` prop that determines which navigation items are rendered.

#### Scenario: Manager variant shows all items
- **WHEN** AdminSidebar is rendered with `variant="manager"`
- **THEN** navigation items SHALL include: Dashboard, Tours, Tour Instances, Tour Requests, Bookings, Payments, Customers, Insurance, Visa Applications, Settings

#### Scenario: Admin variant shows limited items
- **WHEN** AdminSidebar is rendered with `variant="admin"`
- **THEN** navigation items SHALL include: Dashboard, Settings
- **AND** other navigation items SHALL be hidden or shown based on Admin-specific needs (to be designed)

### Requirement: Sidebar labels reflect the current role

The sidebar SHALL display the correct role label based on the variant.

#### Scenario: Manager sidebar shows "Manager" label
- **WHEN** AdminSidebar is rendered with `variant="manager"`
- **THEN** the sidebar SHALL display "Manager" as the role subtitle

#### Scenario: Admin sidebar shows "Admin" label
- **WHEN** AdminSidebar is rendered with `variant="admin"`
- **THEN** the sidebar SHALL display "Admin" as the role subtitle

### Requirement: Admin layout wraps admin pages

Admin pages at `/admin/*` SHALL use a layout that wraps content with the Admin sidebar.

#### Scenario: Admin layout includes admin sidebar
- **WHEN** user is on any `/admin/*` page
- **THEN** the layout SHALL render the AdminSidebar with `variant="admin"`
- **AND** the layout SHALL pass `isOpen` and `onClose` props to the sidebar for mobile responsiveness

#### Scenario: Manager layout includes manager sidebar
- **WHEN** user is on any `/dashboard/*` page
- **THEN** the layout SHALL render the AdminSidebar with `variant="manager"` (existing behavior)

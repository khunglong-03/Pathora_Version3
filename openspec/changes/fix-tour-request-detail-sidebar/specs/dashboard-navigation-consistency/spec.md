# Dashboard Navigation Consistency

## ADDED Requirements

### Requirement: Admin sidebar renders consistently across all admin pages

All pages under the admin dashboard route group SHALL render the same `AdminSidebar` component with identical navigation items, icons, active state styling, and responsive behavior.

#### Scenario: Tour request detail page displays admin sidebar
- **WHEN** user navigates to `/dashboard/tour-requests/{id}`
- **THEN** the `AdminSidebar` component SHALL render with the full navigation menu visible on desktop
- **AND** the sidebar SHALL include links to: Dashboard, Tours, Tour Instances, Tour Requests, Bookings, Payments, Customers, Insurance, Visa Applications, Settings
- **AND** the sidebar SHALL use Phosphor icons from `@phosphor-icons/react`

#### Scenario: Sidebar active state highlights current route
- **WHEN** user is on `/dashboard/tour-requests/{id}`
- **THEN** the "Tour Requests" nav item SHALL have active styling (amber background, amber indicator bar)
- **AND** other nav items SHALL have default styling

#### Scenario: Sidebar is accessible on mobile
- **WHEN** user is on a mobile device
- **THEN** the sidebar SHALL be hidden by default
- **AND** tapping the menu button in the top bar SHALL reveal the sidebar as an overlay
- **AND** tapping outside or the close button SHALL hide the sidebar

### Requirement: Admin pages share the same TopBar component

All admin pages SHALL render the `TopBar` component from `AdminSidebar.tsx` with the hamburger menu button and notification bell.

#### Scenario: TopBar renders with menu button on tour request detail page
- **WHEN** user is on `/dashboard/tour-requests/{id}`
- **THEN** the TopBar SHALL display a hamburger menu button on the left (visible on mobile, hidden on lg+)
- **AND** the TopBar SHALL display a notification bell icon on the right

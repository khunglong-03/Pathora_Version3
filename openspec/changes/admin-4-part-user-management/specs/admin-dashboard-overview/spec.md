# Admin Dashboard Overview

## ADDED Requirements

### Requirement: SuperAdmin dashboard shows aggregate KPI cards

The `/admin/dashboard` page SHALL display KPI cards showing aggregate statistics across the platform.

#### Scenario: Dashboard KPI cards render
- **WHEN** SuperAdmin navigates to `/admin/dashboard`
- **THEN** KPI cards SHALL display: Total Users, Active TourManagers, Active TransportProviders, Active HotelProviders, Pending TourRequests
- **AND** each KPI SHALL show an icon, count value, and label

#### Scenario: KPI cards animate on load
- **WHEN** the dashboard page loads
- **THEN** KPI cards SHALL animate in with staggered entrance animation
- **AND** spring physics SHALL be used for smooth motion

### Requirement: SuperAdmin dashboard shows recent activity

The dashboard SHALL display a recent activity panel showing the latest actions on the platform.

#### Scenario: Activity panel renders recent items
- **WHEN** the dashboard loads
- **THEN** an activity panel SHALL display the 10 most recent user registrations, status changes, or bookings
- **AND** each item SHALL show timestamp, action description, and actor

### Requirement: SuperAdmin dashboard replaces stub page

The existing stub `/admin/dashboard` page SHALL be replaced with the full KPI dashboard.

#### Scenario: Dashboard replaces stub
- **WHEN** SuperAdmin navigates to `/admin/dashboard`
- **THEN** the page SHALL render the KPI overview instead of "Admin Dashboard — coming soon"

### Requirement: Dashboard uses Bento 2.0 design language

The SuperAdmin dashboard SHALL use the Bento 2.0 design system.

#### Scenario: KPI cards use diffusion shadow
- **WHEN** KPI cards render
- **THEN** they SHALL use `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`
- **AND** cards SHALL have `rounded-[2.5rem]` border radius

#### Scenario: Dashboard uses warm monochrome palette
- **WHEN** the dashboard renders
- **THEN** background SHALL be `#F7F6F3`, accent SHALL be amber `#C9873A`
- **AND** font SHALL be Outfit

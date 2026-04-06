# Admin Tour Request Detail

## MODIFIED Requirements

### Requirement: Tour request detail page uses consistent admin layout

The tour request detail page at `/dashboard/tour-requests/{id}` SHALL wrap its content with the `AdminSidebar` component (with `TopBar` as a child) instead of `TourRequestAdminLayout`.

#### Scenario: Tour request detail page renders within admin sidebar
- **WHEN** user navigates to `/dashboard/tour-requests/{id}`
- **THEN** the page SHALL render inside `<AdminSidebar>` with `<TopBar>` as the first child
- **AND** the page content SHALL be wrapped in the `<main>` element with appropriate padding and background color (`#F1F5F9`)
- **AND** the sidebar SHALL be visible on desktop (lg+ screen size)
- **AND** the sidebar SHALL shift page content to the right via `lg:ml-64`

#### Scenario: Back to list link navigates correctly
- **WHEN** user clicks the "Back to list" button on the detail page
- **THEN** user SHALL be navigated to `/dashboard/tour-requests`
- **AND** the sidebar SHALL remain visible on the list page

#### Scenario: Review modal works within admin sidebar context
- **WHEN** admin clicks "Approve" or "Reject" button
- **THEN** the review modal SHALL display centered over the page content
- **AND** the modal SHALL not conflict with the sidebar overlay

### Requirement: Tour request detail page has correct routing

The route `(dashboard)/dashboard/tour-requests/[id]/page.tsx` SHALL NOT exist as a redirect page. The canonical route is `(dashboard)/tour-requests/[id]/page.tsx`.

#### Scenario: Canonical route renders correctly
- **WHEN** user navigates to `/dashboard/tour-requests/{id}`
- **THEN** Next.js SHALL render the page from `(dashboard)/tour-requests/[id]/page.tsx`
- **AND** there SHALL NOT be a conflicting redirect at `(dashboard)/dashboard/tour-requests/[id]/page.tsx`

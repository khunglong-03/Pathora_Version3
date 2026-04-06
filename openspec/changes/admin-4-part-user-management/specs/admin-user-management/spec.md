# Admin User Management

## ADDED Requirements

### Requirement: SuperAdmin can view paginated list of all users

The system SHALL provide a paginated list of all users across all roles accessible only to SuperAdmin users.

#### Scenario: User list loads successfully
- **WHEN** SuperAdmin navigates to `/admin/users`
- **THEN** the page SHALL display a loading skeleton
- **AND** after data loads, a table SHALL show user rows with avatar initials, full name, email, role badge, status badge, and action menu
- **AND** pagination controls SHALL appear at the bottom

#### Scenario: User list shows empty state
- **WHEN** there are no users matching the current filters
- **THEN** an empty state card SHALL display with an icon, heading "Chưa có người dùng nào", and subtitle text
- **AND** no table rows SHALL render

#### Scenario: User list shows error state
- **WHEN** the API request fails
- **THEN** an error card SHALL display with the error message and a "Thử lại" button
- **AND** clicking "Thử lại" SHALL reload the data

### Requirement: User list supports filter tabs by role

The user list SHALL display filter tabs that filter the displayed users by their assigned role.

#### Scenario: Filter tab is active
- **WHEN** SuperAdmin clicks the "TourGuide" filter tab
- **THEN** the table SHALL display only users with the TourGuide role
- **AND** the active tab SHALL show an amber underline indicator with spring animation

#### Scenario: Filter tab shows count badge
- **WHEN** the user list loads
- **THEN** each filter tab SHALL display a count badge showing the number of users in that role

#### Scenario: "Tất cả" tab resets filter
- **WHEN** SuperAdmin clicks the "Tất cả" tab
- **THEN** the table SHALL display all users regardless of role
- **AND** no role filter SHALL be applied

### Requirement: User list supports real-time search

The user list SHALL support a debounced search input that filters users by name or email.

#### Scenario: Search filters user list
- **WHEN** SuperAdmin types "Lan" in the search input
- **THEN** after 300ms debounce, the table SHALL display only users whose name or email contains "Lan"

#### Scenario: Search clears with backspace
- **WHEN** SuperAdmin clears the search input
- **THEN** the table SHALL display all users matching the current role filter

### Requirement: User row shows role badge with distinct color per role

Each user row SHALL display a colored badge indicating the user's role.

#### Scenario: Role badges display with role-specific colors
- **WHEN** user list renders
- **THEN** Admin role SHALL show a red badge
- **AND** Manager role SHALL show an amber badge
- **AND** TourDesigner role SHALL show a purple badge
- **AND** TourGuide role SHALL show a blue badge
- **AND** Customer role SHALL show a gray badge
- **AND** TransportProvider role SHALL show a teal badge
- **AND** HotelServiceProvider role SHALL show a orange badge

### Requirement: User row shows status indicator

Each user row SHALL display a status badge indicating whether the user account is active or inactive.

#### Scenario: Active user shows green indicator
- **WHEN** a user with `Status = Active` renders in the table
- **THEN** the status column SHALL show a green dot with "Active" text

#### Scenario: Inactive user shows gray indicator
- **WHEN** a user with `Status = Inactive` renders in the table
- **THEN** the status column SHALL show a gray dot with "Inactive" text

### Requirement: User row action menu provides navigation

Each user row SHALL provide an action menu dropdown for navigation to user detail.

#### Scenario: Action menu opens on click
- **WHEN** SuperAdmin clicks the "•••" action button on a user row
- **THEN** a dropdown menu SHALL appear with a "Xem chi tiết" item
- **AND** clicking outside SHALL close the menu

#### Scenario: View detail navigates correctly
- **WHEN** SuperAdmin clicks "Xem chi tiết" in the action menu
- **THEN** the browser SHALL navigate to `/admin/users/{userId}`

### Requirement: KPI cards display aggregate user statistics

The page SHALL display KPI cards at the top showing aggregate counts per role.

#### Scenario: KPI cards render with counts
- **WHEN** the user list page loads
- **THEN** KPI cards SHALL display: Total Users, Managers, TourGuides, TourDesigners, Transport, Hotel
- **AND** each KPI SHALL show the count and a label

### Requirement: Pagination controls navigate through pages

The user list SHALL support pagination with page size of 20.

#### Scenario: Pagination navigates forward
- **WHEN** SuperAdmin is on page 1 with more than 20 users
- **AND** clicks "Tiếp" (Next) button
- **THEN** the table SHALL display users from page 2

#### Scenario: Pagination navigates backward
- **WHEN** SuperAdmin is on page 2
- **AND** clicks "Trước" (Previous) button
- **THEN** the table SHALL display users from page 1

### Requirement: Page has sticky header with title and action

The page SHALL display a sticky header with page title, subtitle, and action buttons.

#### Scenario: Header shows refresh button
- **WHEN** the page renders
- **THEN** a "Làm mới" button SHALL appear in the header
- **AND** clicking it SHALL reload the current data

### Requirement: User list uses Bento 2.0 design language

The user management page SHALL use the Bento 2.0 design system.

#### Scenario: Design uses warm monochrome palette
- **WHEN** the page renders
- **THEN** background SHALL be `#F7F6F3`, surface cards SHALL be `#FFFFFF`
- **AND** accent color SHALL be amber `#C9873A`
- **AND** font SHALL be Outfit

#### Scenario: Table rows have hover state
- **WHEN** SuperAdmin hovers over a user table row
- **THEN** the row SHALL lift with `translateY(-1px)` and enhanced shadow

#### Scenario: KPI cards animate on load
- **WHEN** KPI cards mount
- **THEN** they SHALL animate in with staggered entrance (100ms delay per card)
- **AND** spring physics SHALL be used (`type: "spring", stiffness: 100, damping: 20`)

#### Scenario: Avatar uses initials-based styling
- **WHEN** a user row renders
- **THEN** the avatar SHALL display the user's initials (first + last name letters) in a rounded circle
- **AND** background color SHALL be amber-100 with amber-700 text

#### Scenario: Active filter tab animates indicator
- **WHEN** a filter tab becomes active
- **THEN** an amber pill bar SHALL animate on the left of the tab item using Framer Motion `layoutId`

# Admin Tour Manager Hierarchy

## ADDED Requirements

### Requirement: SuperAdmin can view all TourManagers as cards

The system SHALL display TourManagers in a card-based bento grid layout with stats per manager.

#### Scenario: TourManager cards render in bento grid
- **WHEN** SuperAdmin navigates to `/admin/tour-managers`
- **THEN** each TourManager SHALL be displayed as a card in a responsive bento grid (2 columns on lg+)
- **AND** each card SHALL show: avatar with initials, name, email, phone, department, staff counts (TourDesigner count + TourGuide count), and action buttons
- **AND** cards SHALL animate in with staggered entrance animation

#### Scenario: Card shows KPI stats
- **WHEN** a TourManager card renders
- **THEN** it SHALL display three stat chips: Tour Designers count (purple), Tour Guides count (blue), Tours count (green)

### Requirement: TourManager card shows "Xem nhân viên" action

Each TourManager card SHALL display a prominent "Xem nhân viên" button that navigates to the staff list.

#### Scenario: Clicking "Xem nhân viên" navigates to staff view
- **WHEN** SuperAdmin clicks "Xem nhân viên" on a TourManager card
- **THEN** the page SHALL display a staff list view for that manager
- **AND** the URL SHALL change to `/admin/tour-managers/{managerId}/staff`
- **AND** a "Quay lại" (Back) button SHALL appear at the top

### Requirement: Staff list shows TourDesigners and TourGuides assigned to a manager

The staff view SHALL display all TourDesigners and TourGuides assigned to the selected manager.

#### Scenario: Staff list displays assigned staff
- **WHEN** SuperAdmin views staff for a TourManager
- **THEN** a staff list SHALL display each assigned staff member with: avatar initials, full name, email, role badge, and status indicator
- **AND** staff SHALL be grouped by role (TourDesigners section, then TourGuides section)

#### Scenario: Staff list shows empty state for manager with no staff
- **WHEN** a TourManager has no assigned staff
- **THEN** an empty state SHALL display with text "Tour Manager này chưa có nhân viên nào"

#### Scenario: Staff list shows loading skeleton
- **WHEN** the staff data is being fetched
- **THEN** a skeleton list SHALL display matching the staff item layout

### Requirement: SuperAdmin can reassign a staff member to a different manager

The staff view SHALL provide an action to reassign a staff member to a different TourManager.

#### Scenario: Reassign button opens manager selector
- **WHEN** SuperAdmin clicks the reassign icon on a staff row
- **THEN** a modal or dropdown SHALL appear listing all available TourManagers
- **AND** the current manager SHALL be pre-selected

#### Scenario: Reassigning staff member confirms and saves
- **WHEN** SuperAdmin selects a different TourManager in the reassign dropdown
- **AND** clicks "Xác nhận"
- **THEN** the API SHALL call the reassign endpoint
- **AND** the staff list SHALL update to remove the reassigned staff from the current manager's list

#### Scenario: Reassign cancel closes without changes
- **WHEN** SuperAdmin opens the reassign dropdown
- **AND** clicks outside or presses Escape
- **THEN** no changes SHALL be made

### Requirement: Staff view has manager profile summary

The staff view SHALL display a summary card of the selected TourManager at the top.

#### Scenario: Manager summary card displays info
- **WHEN** SuperAdmin views staff for a manager
- **THEN** a manager info card SHALL display at the top with: avatar, name, email, phone, department, and status

### Requirement: Existing TourManager table remains accessible

The existing table view of TourManagers SHALL remain available as an alternative view mode.

#### Scenario: Toggle between card and table view
- **WHEN** SuperAdmin clicks a toggle button in the page header
- **THEN** the view SHALL switch between card grid and table view
- **AND** the preference SHALL persist during the session

### Requirement: Create and edit TourManager workflows remain unchanged

The existing create/edit TourManager pages SHALL continue to work as currently implemented.

#### Scenario: Create new TourManager
- **WHEN** SuperAdmin clicks "+ Thêm Tour Manager"
- **THEN** the page SHALL navigate to `/admin/tour-managers/create`

#### Scenario: Edit existing TourManager
- **WHEN** SuperAdmin clicks "Chỉnh sửa" on a TourManager card or table row
- **THEN** the page SHALL navigate to `/admin/tour-managers/{id}/edit`

### Requirement: TourManager hierarchy uses Bento 2.0 design language

The tour manager management pages SHALL use the Bento 2.0 design system.

#### Scenario: Cards use diffusion shadow
- **WHEN** TourManager cards render
- **THEN** they SHALL use `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]` for depth
- **AND** on hover, cards SHALL lift with `translateY(-2px)` and enhanced shadow

#### Scenario: Back navigation animates smoothly
- **WHEN** SuperAdmin navigates from staff view back to manager list
- **THEN** the transition SHALL use a slide-in animation from left

#### Scenario: Manager summary card in staff view
- **WHEN** staff view loads
- **THEN** the manager info card SHALL use amber accent border on the left side
- **AND** SHALL display in a full-width card above the staff list

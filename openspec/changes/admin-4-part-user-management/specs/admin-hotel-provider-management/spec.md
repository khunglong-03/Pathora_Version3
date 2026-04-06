# Admin Hotel Provider Management

## ADDED Requirements

### Requirement: SuperAdmin can view paginated list of HotelServiceProviders

The system SHALL display a card-based list of all HotelServiceProvider users accessible only to SuperAdmin.

#### Scenario: HotelProvider cards render
- **WHEN** SuperAdmin navigates to `/admin/hotel-providers`
- **THEN** HotelServiceProviders SHALL be displayed as cards in a responsive bento grid
- **AND** each card SHALL show: hotel/building icon, provider name, email, phone, total rooms/accommodations count, status badge
- **AND** cards SHALL animate in with staggered entrance

#### Scenario: Cards show accommodation statistics
- **WHEN** a HotelServiceProvider card renders
- **AND** the provider has accommodation data
- **THEN** the card SHALL display the total number of accommodation units offered by this provider

### Requirement: HotelProvider list supports status filter

The list SHALL display filter tabs to filter by active/inactive status.

#### Scenario: Filter tabs for status
- **WHEN** SuperAdmin clicks the "Active" tab
- **THEN** only HotelServiceProviders with active status SHALL display
- **AND** the tab SHALL show an amber underline indicator

#### Scenario: All filter shows all providers
- **WHEN** SuperAdmin clicks "Tất cả"
- **THEN** all HotelServiceProviders SHALL display regardless of status

### Requirement: HotelProvider list supports search

The list SHALL support a debounced search input filtering by provider name or email.

#### Scenario: Search filters provider list
- **WHEN** SuperAdmin types in the search input
- **THEN** after 300ms debounce, the list SHALL display only matching providers

### Requirement: HotelProvider card shows status

Each card SHALL display a status badge indicating active or inactive.

#### Scenario: Active provider shows green status
- **WHEN** an active HotelServiceProvider card renders
- **THEN** the status badge SHALL show a green dot with "Active" text

#### Scenario: Inactive provider shows gray status
- **WHEN** an inactive HotelServiceProvider card renders
- **AND** the status is inactive
- **THEN** the status badge SHALL show a gray dot with "Inactive" text

### Requirement: HotelProvider page has KPI strip

The page SHALL display KPI cards showing total providers and aggregate accommodation counts.

#### Scenario: KPI cards display stats
- **WHEN** the page loads
- **THEN** KPI cards SHALL display: Total Providers count, Active Providers count, Total Accommodation units across all providers

### Requirement: HotelProvider page has empty state

When no providers exist, an empty state SHALL display.

#### Scenario: Empty state renders
- **WHEN** there are no HotelServiceProviders in the system
- **THEN** an empty state card SHALL display with a hotel icon, heading "Chưa có nhà cung cấp chỗ ở nào"

### Requirement: HotelProvider page has loading state

When data is being fetched, a skeleton grid SHALL display.

#### Scenario: Loading skeleton renders
- **WHEN** the API request is in progress
- **THEN** a skeleton grid SHALL display matching the card layout

### Requirement: HotelProvider page uses Bento 2.0 design language

The page SHALL use the Bento 2.0 design system with warm monochrome palette.

#### Scenario: Cards use diffusion shadow
- **WHEN** HotelServiceProvider cards render
- **THEN** they SHALL use `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`
- **AND** on hover, cards SHALL lift with `translateY(-2px)`

#### Scenario: Page header follows design system
- **WHEN** the page renders
- **THEN** the header SHALL use the page title "Quản lý người cung cấp chỗ ở" with subtitle
- **AND** action buttons SHALL use amber accent color

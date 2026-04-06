# Admin Transport Provider Management

## ADDED Requirements

### Requirement: SuperAdmin can view paginated list of TransportProviders

The system SHALL display a card-based list of all TransportProvider users accessible only to SuperAdmin.

#### Scenario: TransportProvider cards render
- **WHEN** SuperAdmin navigates to `/admin/transport-providers`
- **THEN** TransportProviders SHALL be displayed as cards in a responsive bento grid
- **AND** each card SHALL show: bus/transport icon, provider name, email, phone, total bookings count, status badge
- **AND** cards SHALL animate in with staggered entrance

#### Scenario: Cards show booking statistics
- **WHEN** a TransportProvider card renders
- **AND** the provider has booking data
- **THEN** the card SHALL display the total number of bookings assigned to this provider

### Requirement: TransportProvider list supports status filter

The list SHALL display filter tabs to filter by active/inactive status.

#### Scenario: Filter tabs for status
- **WHEN** SuperAdmin clicks the "Active" tab
- **THEN** only TransportProviders with active status SHALL display
- **AND** the tab SHALL show an amber underline indicator

#### Scenario: All filter shows all providers
- **WHEN** SuperAdmin clicks "Tất cả"
- **THEN** all TransportProviders SHALL display regardless of status

### Requirement: TransportProvider list supports search

The list SHALL support a debounced search input filtering by provider name or email.

#### Scenario: Search filters provider list
- **WHEN** SuperAdmin types in the search input
- **THEN** after 300ms debounce, the list SHALL display only matching providers

### Requirement: TransportProvider card shows status

Each card SHALL display a status badge indicating active or inactive.

#### Scenario: Active provider shows green status
- **WHEN** an active TransportProvider card renders
- **THEN** the status badge SHALL show a green dot with "Active" text

#### Scenario: Inactive provider shows gray status
- **WHEN** an inactive TransportProvider card renders
- **THEN** the status badge SHALL show a gray dot with "Inactive" text

### Requirement: TransportProvider page has KPI strip

The page SHALL display KPI cards showing total providers and aggregate booking counts.

#### Scenario: KPI cards display stats
- **WHEN** the page loads
- **THEN** KPI cards SHALL display: Total Providers count, Active Providers count, Total Bookings across all providers

### Requirement: TransportProvider page has empty state

When no providers exist, an empty state SHALL display.

#### Scenario: Empty state renders
- **WHEN** there are no TransportProviders in the system
- **THEN** an empty state card SHALL display with a bus icon, heading "Chưa có nhà cung cấp vé xe nào"

### Requirement: TransportProvider page has loading state

When data is being fetched, a skeleton grid SHALL display.

#### Scenario: Loading skeleton renders
- **WHEN** the API request is in progress
- **THEN** a skeleton grid SHALL display matching the card layout

### Requirement: TransportProvider page uses Bento 2.0 design language

The page SHALL use the Bento 2.0 design system with warm monochrome palette.

#### Scenario: Cards use diffusion shadow
- **WHEN** TransportProvider cards render
- **THEN** they SHALL use `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`
- **AND** on hover, cards SHALL lift with `translateY(-2px)`

#### Scenario: Page header follows design system
- **WHEN** the page renders
- **THEN** the header SHALL use the page title "Quản lý người bán vé" with subtitle
- **AND** action buttons SHALL use amber accent color

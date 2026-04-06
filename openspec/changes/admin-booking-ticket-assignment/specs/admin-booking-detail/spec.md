## ADDED Requirements

### Requirement: Admin can view booking detail page

The booking detail page at `/dashboard/bookings/[id]` SHALL display complete booking information and allow admins to manage the booking's itinerary (activities, transport, accommodation).

#### Scenario: Admin navigates to booking detail from bookings list
- **WHEN** admin clicks on a booking row in the bookings list
- **THEN** admin is navigated to `/dashboard/bookings/{bookingId}`
- **AND** the page loads with AdminSidebar layout and TopBar

#### Scenario: Booking detail page displays booking information header
- **WHEN** booking detail page loads successfully
- **THEN** page SHALL display booking ID, customer name, customer phone, customer email
- **AND** SHALL display tour name, departure date, duration
- **AND** SHALL display number of adults, children, infants
- **AND** SHALL display booking status with appropriate badge color

#### Scenario: Booking detail page displays itinerary section
- **WHEN** booking detail page loads
- **THEN** page SHALL display an "Itinerary" section
- **AND** SHALL list all activities belonging to this booking
- **AND** activities SHALL be ordered by their Order field
- **AND** each activity SHALL display its title, activity type, start time, end time

#### Scenario: Loading state while fetching booking detail
- **WHEN** booking detail page is loading
- **THEN** page SHALL display skeleton loading state
- **AND** skeleton SHALL match the layout of the actual content

#### Scenario: Error state when booking not found
- **WHEN** booking detail API returns not found (404)
- **THEN** page SHALL display error message "Booking not found"
- **AND** SHALL provide a "Back to list" button

### Requirement: Ticket assignment only available for Deposited+ bookings

The system SHALL only allow transport and accommodation assignment operations for bookings with status Deposited, Paid, or Completed.

#### Scenario: Gán vé button visible for Deposited booking
- **WHEN** admin views a booking with status "Deposited"
- **THEN** admin SHALL see "Thêm Transport" and "Thêm Accommodation" buttons for each activity
- **AND** admin SHALL be able to click the buttons to open assignment forms

#### Scenario: Gán vé button hidden for Pending booking
- **WHEN** admin views a booking with status "Pending"
- **THEN** admin SHALL NOT see "Thêm Transport" or "Thêm Accommodation" buttons
- **AND** activity cards SHALL display "Cần xác nhận booking trước khi gán vé" message

#### Scenario: Gán vé button hidden for Confirmed booking
- **WHEN** admin views a booking with status "Confirmed"
- **THEN** admin SHALL NOT see "Thêm Transport" or "Thêm Accommodation" buttons
- **AND** activity cards SHALL display informational message

#### Scenario: Gán vé button visible for Paid booking
- **WHEN** admin views a booking with status "Paid"
- **THEN** admin SHALL see "Thêm Transport" and "Thêm Accommodation" buttons
- **AND** admin SHALL be able to create/edit/delete transport and accommodation details

#### Scenario: Gán vé button visible for Completed booking
- **WHEN** admin views a booking with status "Completed"
- **THEN** admin SHALL see "Thêm Transport" and "Thêm Accommodation" buttons
- **AND** admin SHALL be able to create/edit/delete transport and accommodation details

### Requirement: Activity displays associated transport and accommodation details

Each activity card in the itinerary SHALL display its associated transport and accommodation details.

#### Scenario: Activity shows transport detail card
- **WHEN** an activity has at least one transport detail assigned
- **THEN** activity card SHALL display a transport detail card
- **AND** SHALL show transport type icon (bus, airplane, train, etc.)
- **AND** SHALL show departure location, arrival location, departure time, arrival time
- **AND** SHALL show ticket number or e-ticket number
- **AND** SHALL show seat number(s) and seat class
- **AND** SHALL show edit and delete action buttons

#### Scenario: Activity shows accommodation detail card
- **WHEN** an activity has at least one accommodation detail assigned
- **THEN** activity card SHALL display an accommodation detail card
- **AND** SHALL show accommodation name
- **AND** SHALL show room type, room count, bed type
- **AND** SHALL show check-in and check-out times
- **AND** SHALL show confirmation code
- **AND** SHALL show edit and delete action buttons

#### Scenario: Activity with no assigned details
- **WHEN** an activity has no transport and no accommodation details
- **THEN** activity card SHALL display empty state message
- **AND** SHALL show "+ Thêm Transport" and "+ Thêm Accommodation" buttons

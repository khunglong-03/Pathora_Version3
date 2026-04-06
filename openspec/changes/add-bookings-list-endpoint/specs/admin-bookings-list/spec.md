## ADDED Requirements

### Requirement: Admin can list all bookings

The system SHALL provide a `GET /api/bookings` endpoint returning a paginated list of bookings for admin users. The endpoint SHALL return bookings with their associated customer name, tour name, departure date, total amount, and status.

#### Scenario: Returns paginated booking list
- **WHEN** an authenticated admin user sends `GET /api/bookings?page=1&pageSize=20`
- **THEN** the system SHALL return HTTP 200 with a JSON body containing `items` (array) and `totalCount` (number)
- **AND** each item in `items` SHALL contain: `id`, `customerName`, `tourName`, `departureDate`, `amount`, `status`

#### Scenario: Uses default pagination when params omitted
- **WHEN** an authenticated admin user sends `GET /api/bookings` without query parameters
- **THEN** the system SHALL use default `page=1` and `pageSize=20`

#### Scenario: Returns bookings ordered by creation date descending
- **WHEN** an authenticated admin user sends `GET /api/bookings`
- **THEN** the system SHALL return bookings ordered by creation date in descending order (newest first)

### Requirement: Unauthorized requests are rejected

The system SHALL reject requests from unauthenticated or unauthorized users with HTTP 401 or 403.

#### Scenario: Rejects unauthenticated request
- **WHEN** an unauthenticated user sends `GET /api/bookings`
- **THEN** the system SHALL return HTTP 401 Unauthorized

#### Scenario: Rejects non-admin user
- **WHEN** an authenticated non-admin user sends `GET /api/bookings`
- **THEN** the system SHALL return HTTP 403 Forbidden

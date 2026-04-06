## ADDED Requirements

### Requirement: Admin can assign transport detail to an activity

The system SHALL allow admins to create a transport detail for a specific booking activity reservation.

#### Scenario: Admin creates new transport detail
- **WHEN** admin clicks "+ Thêm Transport" on an activity
- **THEN** system SHALL display an inline transport detail form
- **AND** form SHALL contain fields: Transport Type, Departure At, Arrival At, Ticket Number, E-Ticket Number, Seat Number, Seat Capacity, Seat Class, Vehicle Number, Buy Price, Tax Rate, Supplier, Special Request, Note
- **AND** Transport Type SHALL have options: Airplane (1), Bus (2), Train (3), Ship (4), Car (5), Other (99)

#### Scenario: Admin fills and submits transport detail form
- **WHEN** admin fills all required fields in transport detail form
- **AND** clicks "Lưu" button
- **THEN** system SHALL send POST request to `/api/bookings/{bookingId}/transport-details`
- **AND** SHALL send BookingActivityReservationId, TransportType, DepartureAt, ArrivalAt, TicketNumber, ETicketNumber, SeatNumber, SeatCapacity, SeatClass, VehicleNumber, BuyPrice, TaxRate, IsTaxable, SupplierId, SpecialRequest, Note
- **AND** upon success, SHALL close the form
- **AND** SHALL display the new transport detail card within the activity
- **AND** SHALL show a success toast notification

#### Scenario: Form validation — required fields
- **WHEN** admin submits transport detail form with empty BookingActivityReservationId
- **THEN** form SHALL display validation error "BookingActivityReservationId is required"
- **AND** SHALL prevent form submission

#### Scenario: Form validation — price constraints
- **WHEN** admin enters negative BuyPrice
- **THEN** form SHALL display validation error "Giá trị không được âm"
- **AND** SHALL prevent form submission

#### Scenario: Form validation — arrival after departure
- **WHEN** admin enters ArrivalAt that is before or equal to DepartureAt
- **THEN** form SHALL display validation error "ArrivalAt phải lớn hơn DepartureAt"
- **AND** SHALL prevent form submission

#### Scenario: Form validation — seat capacity
- **WHEN** admin enters SeatCapacity less than number of active participants in booking
- **THEN** form SHALL display validation error "Số ghế không đủ cho số khách"
- **AND** SHALL prevent form submission

#### Scenario: Admin cancels transport detail creation
- **WHEN** admin clicks "Hủy" button on the form
- **THEN** form SHALL close
- **AND** no transport detail SHALL be created

### Requirement: Admin can edit existing transport detail

The system SHALL allow admins to update an existing transport detail assigned to an activity.

#### Scenario: Admin clicks edit on transport detail card
- **WHEN** admin clicks "✏️ Sửa" button on a transport detail card
- **THEN** system SHALL display the transport detail form pre-filled with existing values
- **AND** SHALL allow admin to modify any field

#### Scenario: Admin saves edited transport detail
- **WHEN** admin modifies fields and clicks "Lưu"
- **THEN** system SHALL send PUT request to `/api/bookings/{bookingId}/transport-details/{transportDetailId}`
- **AND** upon success, SHALL update the transport detail card
- **AND** SHALL show success toast notification

#### Scenario: Edit form validation
- **WHEN** admin changes values to invalid state during edit
- **THEN** same validation rules as create form SHALL apply
- **AND** SHALL prevent submission until valid

### Requirement: Admin can delete transport detail

The system SHALL allow admins to delete a transport detail from an activity.

#### Scenario: Admin deletes transport detail
- **WHEN** admin clicks "🗑️ Xóa" button on a transport detail card
- **THEN** system SHALL display a confirmation dialog "Bạn có chắc muốn xóa transport detail này?"
- **AND** confirmation dialog SHALL have "Hủy" and "Xóa" buttons

#### Scenario: Admin confirms deletion
- **WHEN** admin clicks "Xóa" in confirmation dialog
- **THEN** system SHALL send DELETE request to `/api/bookings/{bookingId}/transport-details/{transportDetailId}`
- **AND** upon success, SHALL remove the transport detail card from the activity
- **AND** SHALL show success toast notification

#### Scenario: Admin cancels deletion
- **WHEN** admin clicks "Hủy" in confirmation dialog
- **THEN** dialog SHALL close
- **AND** no deletion SHALL occur

### Requirement: Transport detail displays correct information

The transport detail card SHALL display all relevant transport information in a readable format.

#### Scenario: Transport detail card shows all fields
- **WHEN** a transport detail has all fields populated
- **THEN** card SHALL display transport type with icon (Bus icon, Airplane icon, etc.)
- **AND** SHALL display departure time formatted as "HH:mm DD/MM/YYYY"
- **AND** SHALL display arrival time formatted as "HH:mm DD/MM/YYYY"
- **AND** SHALL display ticket number or "—" if empty
- **AND** SHALL display e-ticket number or "—" if empty
- **AND** SHALL display seat number(s) or "—" if empty
- **AND** SHALL display seat class or "—" if empty
- **AND** SHALL display vehicle number or "—" if empty
- **AND** SHALL display buy price formatted as currency (e.g., "3.500.000 đ")
- **AND** SHALL display status badge (Pending/Confirmed/Cancelled/Completed)
- **AND** SHALL display special request or "—" if empty

#### Scenario: Transport type icon mapping
- **WHEN** transport detail has TransportType = Bus
- **THEN** card SHALL display a bus icon
- **WHEN** transport detail has TransportType = Airplane
- **THEN** card SHALL display an airplane icon
- **WHEN** transport detail has TransportType = Train
- **THEN** card SHALL display a train icon
- **WHEN** transport detail has TransportType = Ship
- **THEN** card SHALL display a ship icon
- **WHEN** transport detail has TransportType = Car
- **THEN** card SHALL display a car icon

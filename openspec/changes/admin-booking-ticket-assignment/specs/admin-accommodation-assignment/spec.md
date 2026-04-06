## ADDED Requirements

### Requirement: Admin can assign accommodation detail to an activity

The system SHALL allow admins to create an accommodation detail for a specific booking activity reservation.

#### Scenario: Admin creates new accommodation detail
- **WHEN** admin clicks "+ Thêm Accommodation" on an activity
- **THEN** system SHALL display an inline accommodation detail form
- **AND** form SHALL contain fields: Accommodation Name, Room Type, Room Count, Bed Type, Address, Contact Phone, Check In At, Check Out At, Buy Price, Tax Rate, Supplier, Confirmation Code, Special Request, Note

#### Scenario: Admin fills and submits accommodation detail form
- **WHEN** admin fills all required fields in accommodation detail form
- **AND** clicks "Lưu" button
- **THEN** system SHALL send POST request to `/api/bookings/{bookingId}/accommodation-details`
- **AND** SHALL send BookingActivityReservationId, AccommodationName, RoomType, RoomCount, SupplierId, BedType, Address, ContactPhone, CheckInAt, CheckOutAt, BuyPrice, TaxRate, IsTaxable, ConfirmationCode, SpecialRequest, Note
- **AND** upon success, SHALL close the form
- **AND** SHALL display the new accommodation detail card within the activity
- **AND** SHALL show a success toast notification

#### Scenario: Form validation — required fields
- **WHEN** admin submits accommodation detail form with empty AccommodationName
- **THEN** form SHALL display validation error "AccommodationName is required"
- **AND** SHALL prevent form submission

#### Scenario: Form validation — room count
- **WHEN** admin enters RoomCount less than 1
- **THEN** form SHALL display validation error "Số phòng phải lớn hơn 0"
- **AND** SHALL prevent form submission

#### Scenario: Form validation — check-out after check-in
- **WHEN** admin enters CheckOutAt that is before or equal to CheckInAt
- **THEN** form SHALL display validation error "CheckOutAt phải lớn hơn CheckInAt"
- **AND** SHALL prevent form submission

#### Scenario: Form validation — room capacity
- **WHEN** admin enters RoomCount that results in capacity less than number of active participants
- **THEN** form SHALL display validation error "Số phòng không đủ cho số khách"
- **AND** SHALL prevent form submission

#### Scenario: Admin cancels accommodation detail creation
- **WHEN** admin clicks "Hủy" button on the form
- **THEN** form SHALL close
- **AND** no accommodation detail SHALL be created

### Requirement: Admin can edit existing accommodation detail

The system SHALL allow admins to update an existing accommodation detail assigned to an activity.

#### Scenario: Admin clicks edit on accommodation detail card
- **WHEN** admin clicks "✏️ Sửa" button on an accommodation detail card
- **THEN** system SHALL display the accommodation detail form pre-filled with existing values
- **AND** SHALL allow admin to modify any field

#### Scenario: Admin saves edited accommodation detail
- **WHEN** admin modifies fields and clicks "Lưu"
- **THEN** system SHALL send PUT request to `/api/bookings/{bookingId}/accommodation-details/{accommodationDetailId}`
- **AND** upon success, SHALL update the accommodation detail card
- **AND** SHALL show success toast notification

### Requirement: Admin can delete accommodation detail

The system SHALL allow admins to delete an accommodation detail from an activity.

#### Scenario: Admin deletes accommodation detail
- **WHEN** admin clicks "🗑️ Xóa" button on an accommodation detail card
- **THEN** system SHALL display a confirmation dialog "Bạn có chắc muốn xóa accommodation detail này?"
- **AND** confirmation dialog SHALL have "Hủy" and "Xóa" buttons

#### Scenario: Admin confirms deletion
- **WHEN** admin clicks "Xóa" in confirmation dialog
- **THEN** system SHALL send DELETE request to `/api/bookings/{bookingId}/accommodation-details/{accommodationDetailId}`
- **AND** upon success, SHALL remove the accommodation detail card from the activity
- **AND** SHALL show success toast notification

#### Scenario: Admin cancels deletion
- **WHEN** admin clicks "Hủy" in confirmation dialog
- **THEN** dialog SHALL close
- **AND** no deletion SHALL occur

### Requirement: Accommodation detail displays correct information

The accommodation detail card SHALL display all relevant accommodation information in a readable format.

#### Scenario: Accommodation detail card shows all fields
- **WHEN** an accommodation detail has all fields populated
- **THEN** card SHALL display accommodation name with hotel icon
- **AND** SHALL display room type label (e.g., "Double", "Twin", "Suite")
- **AND** SHALL display room count (e.g., "2 phòng")
- **AND** SHALL display bed type or "—" if empty
- **AND** SHALL display check-in time formatted as "DD/MM/YYYY HH:mm"
- **AND** SHALL display check-out time formatted as "DD/MM/YYYY HH:mm"
- **AND** SHALL display number of nights calculated from check-in/check-out
- **AND** SHALL display confirmation code or "—" if empty
- **AND** SHALL display address or "—" if empty
- **AND** SHALL display buy price formatted as currency (e.g., "2.400.000 đ")
- **AND** SHALL display status badge (Pending/Confirmed/Cancelled/Completed)
- **AND** SHALL display special request or "—" if empty

#### Scenario: Number of nights calculated correctly
- **WHEN** check-in is 26/04/2026 and check-out is 28/04/2026
- **THEN** card SHALL display "2 đêm" (2 nights)
- **WHEN** check-in is 26/04/2026 and check-out is 29/04/2026
- **THEN** card SHALL display "3 đêm" (3 nights)

### Requirement: Supplier selection in forms

The transport and accommodation detail forms SHALL provide a supplier selection dropdown.

#### Scenario: Admin selects supplier from dropdown
- **WHEN** admin opens transport or accommodation form
- **THEN** form SHALL display a Supplier dropdown
- **AND** dropdown SHALL list all suppliers with type "Transport" (for transport form) or "Hotel" (for accommodation form)
- **AND** dropdown SHALL support search/filter by supplier name

#### Scenario: Admin leaves supplier optional
- **WHEN** admin does not select a supplier
- **THEN** form SHALL allow submission
- **AND** supplierId SHALL be sent as null

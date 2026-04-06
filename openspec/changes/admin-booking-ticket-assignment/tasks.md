## 1. Backend — Expose POST/PUT/DELETE endpoints

### 1.1 Add endpoint constants

- [ ] 1.1.1 Thêm constants trong `BookingManagementEndpoint.cs` cho transport detail endpoints
  - `{id:guid}/transport-details` (đã có GET)
  - `{id:guid}/transport-details/{transportDetailId:guid}` (mới)
  - Tương tự cho accommodation-details

### 1.2 Add transport detail endpoints

- [ ] 1.2.1 Thêm `POST /api/bookings/{id}/transport-details` trong `BookingManagementController`
  - Bind `CreateTransportDetailCommand` từ request body
  - Trả về `HandleCreated(result)`

- [ ] 1.2.2 Thêm `PUT /api/bookings/{id}/transport-details/{transportDetailId}` trong `BookingManagementController`
  - Bind `UpdateTransportDetailCommand` từ request body
  - Trả về `HandleUpdated(result)`

- [ ] 1.2.3 Thêm `DELETE /api/bookings/{id}/transport-details/{transportDetailId}` trong `BookingManagementController`
  - Gọi `DeleteTransportDetailCommand` hoặc handler tương ứng

### 1.3 Add accommodation detail endpoints

- [ ] 1.3.1 Thêm `POST /api/bookings/{id}/accommodation-details` trong `BookingManagementController`
  - Bind `CreateAccommodationDetailCommand` từ request body

- [ ] 1.3.2 Thêm `PUT /api/bookings/{id}/accommodation-details/{accommodationDetailId}` trong `BookingManagementController`

- [ ] 1.3.3 Thêm `DELETE /api/bookings/{id}/accommodation-details/{accommodationDetailId}` trong `BookingManagementController`

### 1.4 Verify backend handlers exist

- [ ] 1.4.1 Kiểm tra `DeleteTransportDetailCommand` handler tồn tại, nếu chưa có thì tạo
- [ ] 1.4.2 Kiểm tra `DeleteAccommodationDetailCommand` handler tồn tại, nếu chưa có thì tạo

## 2. Frontend — API Service Layer

### 2.1 Add endpoint constants

- [ ] 2.1.1 Thêm endpoint constants trong `src/api/endpoints/booking.ts`
  - `CREATE_TRANSPORT_DETAIL: (id) => /api/bookings/${id}/transport-details`
  - `UPDATE_TRANSPORT_DETAIL: (id, transportId) => ...`
  - `DELETE_TRANSPORT_DETAIL: (id, transportId) => ...`
  - Tương tự cho accommodation

### 2.2 Add service methods

- [ ] 2.2.1 Thêm `getActivities(bookingId)` trong `bookingService.ts`
- [ ] 2.2.2 Thêm `getTransportDetails(bookingId)` trong `bookingService.ts`
- [ ] 2.2.3 Thêm `createTransportDetail(bookingId, payload)` trong `bookingService.ts`
- [ ] 2.2.4 Thêm `updateTransportDetail(bookingId, transportId, payload)` trong `bookingService.ts`
- [ ] 2.2.5 Thêm `deleteTransportDetail(bookingId, transportId)` trong `bookingService.ts`
- [ ] 2.2.6 Thêm `getAccommodationDetails(bookingId)` trong `bookingService.ts`
- [ ] 2.2.7 Thêm `createAccommodationDetail(bookingId, payload)` trong `bookingService.ts`
- [ ] 2.2.8 Thêm `updateAccommodationDetail(bookingId, accommodationId, payload)` trong `bookingService.ts`
- [ ] 2.2.9 Thêm `deleteAccommodationDetail(bookingId, accommodationId)` trong `bookingService.ts`

### 2.3 Verify DTOs exist

- [ ] 2.3.1 Kiểm tra `TransportDetailDto` và `AccommodationDetailDto` trong `src/types/booking.ts` — đã có từ trước
- [ ] 2.3.2 Thêm `CreateTransportDetailPayload` và `UpdateTransportDetailPayload` types nếu cần

## 3. Frontend — Routing & Layout

### 3.1 Create route

- [ ] 3.1.1 Tạo route `src/app/(dashboard)/dashboard/bookings/[id]/page.tsx`
  - Dùng dynamic import cho `AdminBookingDetailPage` component
  - Redirect về `/dashboard/bookings` nếu không có id

### 3.2 Update navigation

- [ ] 3.2.1 Thêm link từ booking table row → `/dashboard/bookings/[id]` trong `BookingsTable.tsx` hoặc `TableRow.tsx`

## 4. Frontend — Components

### 4.1 Create component directory

- [ ] 4.1.1 Tạo thư mục `src/features/dashboard/components/bookings/BookingDetail/`

### 4.2 BookingDetailPage container

- [ ] 4.2.1 Tạo `BookingDetailPage.tsx` — component chính
  - Sử dụng `AdminSidebar` và `TopBar` layout (như `BookingsPage.tsx`)
  - Fetch booking detail, activities, transport details, accommodation details
  - Pass data xuống `ActivitySection` components

### 4.3 BookingDetailHeader

- [ ] 4.3.1 Tạo `BookingDetailHeader.tsx`
  - Hiển thị: booking ID, customer name, phone, email
  - Tour name, departure date, duration
  - Số người (adult/child/infant)
  - Status badge (theo `STATUS_BADGE` pattern có sẵn)

### 4.4 ActivitySection

- [ ] 4.4.1 Tạo `ActivitySection.tsx`
  - Hiển thị danh sách activities
  - Mỗi activity hiển thị `TransportDetailCard` và `AccommodationDetailCard` đã gán
  - Nút "+ Thêm Transport" / "+ Thêm Accommodation" — chỉ hiện nếu booking Deposited+
  - Inline form khi click nút thêm

### 4.5 TransportDetailForm

- [ ] 4.5.1 Tạo `TransportDetailForm.tsx`
  - Fields: TransportType (select), DepartureAt (datetime), ArrivalAt (datetime), TicketNumber, ETicketNumber, SeatNumber, SeatCapacity, SeatClass (select), VehicleNumber, BuyPrice, TaxRate, Supplier (searchable select), SpecialRequest, Note
  - Dùng React Hook Form + Yup validation
  - Yup schema mirror backend FluentValidation rules
  - Submit → gọi `createTransportDetail` hoặc `updateTransportDetail`

### 4.6 AccommodationDetailForm

- [ ] 4.6.1 Tạo `AccommodationDetailForm.tsx`
  - Fields: AccommodationName, RoomType (select), RoomCount, BedType, Address, ContactPhone, CheckInAt (datetime), CheckOutAt (datetime), BuyPrice, TaxRate, Supplier (searchable select), ConfirmationCode, SpecialRequest, Note
  - Dùng React Hook Form + Yup validation
  - Submit → gọi `createAccommodationDetail` hoặc `updateAccommodationDetail`

### 4.7 TransportDetailCard

- [ ] 4.7.1 Tạo `TransportDetailCard.tsx`
  - Hiển thị transport info theo spec
  - Transport type icon (bus/airplane/train/ship/car)
  - Format giờ: "HH:mm DD/MM/YYYY"
  - Format giá: currency VND
  - Status badge
  - Nút "✏️ Sửa" và "🗑️ Xóa"

### 4.8 AccommodationDetailCard

- [ ] 4.8.1 Tạo `AccommodationDetailCard.tsx`
  - Hiển thị accommodation info theo spec
  - Hotel icon
  - Tính số đêm từ check-in/check-out
  - Status badge
  - Nút "✏️ Sửa" và "🗑️ Xóa"

### 4.9 Skeleton

- [ ] 4.9.1 Tạo `BookingDetailSkeleton.tsx` cho loading state

### 4.10 Delete confirmation

- [ ] 4.10.1 Tạo hoặc dùng existing confirmation dialog component cho delete actions

## 5. Frontend — Booking Status Condition

### 5.1 Conditionally show assignment buttons

- [ ] 5.1.1 Kiểm tra `booking.status` trong `ActivitySection`
  - Deposited (3), Paid (4), Completed (6) → hiện nút gán
  - Pending (1), Confirmed (2), Cancelled (5) → ẩn nút gán, hiện message

## 6. Frontend — i18n (nếu cần)

### 6.1 Translation keys

- [ ] 6.1.1 Thêm translation keys trong `src/i18n/locales/en/translation.json` và `vi/translation.json`
  - `bookingDetail.pageTitle`, `bookingDetail.itinerary`, `bookingDetail.transport.*`, `bookingDetail.accommodation.*`
  - Form labels, button text, validation messages, toast notifications

## 7. Verification

### 7.1 Manual testing

- [ ] 7.1.1 Test: Tạo booking mới, chuyển sang Deposited, vào booking detail, gán transport
- [ ] 7.1.2 Test: Tạo booking mới, chuyển sang Deposited, vào booking detail, gán accommodation
- [ ] 7.1.3 Test: Edit transport detail đã gán
- [ ] 7.1.4 Test: Delete transport/accommodation detail
- [ ] 7.1.5 Test: Booking Pending/Confirmed — không thấy nút gán vé
- [ ] 7.1.6 Test: Click booking row → navigate đến detail page
- [ ] 7.1.7 Test: Validation — số ghế < số khách → show error
- [ ] 7.1.8 Test: Validation — ArrivalAt <= DepartureAt → show error

### 7.2 Lint

- [ ] 7.2.1 Chạy `npm run lint` trong `pathora/frontend`
- [ ] 7.2.2 Fix any lint errors

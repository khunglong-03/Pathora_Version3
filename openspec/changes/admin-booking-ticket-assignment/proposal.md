## Why

Hiện tại hệ thống backend đã có domain model và API handlers cho việc gán Transport Details (xe bus, máy bay) và Accommodation Details (khách sạn) vào các booking activities, nhưng frontend admin chưa có UI để thực hiện thao tác này. Khi khách hàng cọc thành công (booking status = Deposited+), admin cần một trang để gán vé và thông tin nơi nghỉ cho từng activity trong lịch trình tour của booking đó.

## What Changes

### Backend
- Thêm HTTP endpoints POST/PUT/DELETE cho `transport-details` vào `BookingManagementController`
  - POST `/api/bookings/{id}/transport-details` — tạo transport detail mới cho một activity
  - PUT `/api/bookings/{id}/transport-details/{transportDetailId}` — cập nhật transport detail
  - DELETE `/api/bookings/{id}/transport-details/{transportDetailId}` — xóa transport detail
  - Tương tự cho `accommodation-details`

### Frontend (Admin Dashboard)
- Tạo route `/dashboard/bookings/[id]` — trang chi tiết booking cho admin
- Tạo component `AdminBookingDetailPage` với layout AdminSidebar + TopBar
- Tạo component gán Transport Details (form + danh sách)
- Tạo component gán Accommodation Details (form + danh sách)
- Tạo `ActivitySection` — hiển thị activities đã có sẵn trong booking, kèm transport/accommodation đã gán
- Thêm API service methods: get/create/update/delete transport & accommodation details
- Thêm API service methods: get activities by booking

### UX/Workflow
- Chỉ hiển thị nút gán vé cho booking có status `Deposited` trở lên
- Filter mặc định ở booking list: chỉ hiện Deposited+ bookings (hoặc tab riêng)

## Capabilities

### New Capabilities

- `admin-booking-detail`: Trang chi tiết booking dành cho admin, cho phép xem toàn bộ thông tin booking và quản lý itinerary (activities, transport, accommodation). Scope: hiển thị booking info + itinerary + gán vé. Không bao gồm participants, payments, team management trong phase này.
- `admin-transport-assignment`: Gán thông tin vận chuyển (loại xe, số vé, ghế, giờ đi/đến, giá mua) vào một booking activity.
- `admin-accommodation-assignment`: Gán thông tin nơi nghỉ (khách sạn, loại phòng, check-in/out, mã xác nhận, giá) vào một booking activity.

### Modified Capabilities

*(Không có spec nào hiện tại liên quan đến booking — leave empty)*

## Impact

### Backend
- `panthora_be/src/Api/Controllers/BookingManagementController.cs` — thêm 6 endpoints mới
- `panthora_be/src/Api/Endpoint/BookingManagementEndpoint.cs` — thêm endpoint constants
- Không ảnh hưởng domain model (đã có sẵn)

### Frontend
- `pathora/frontend/src/app/(dashboard)/dashboard/bookings/[id]/page.tsx` — route mới
- `pathora/frontend/src/features/dashboard/components/bookings/BookingDetail/` — thư mục components mới
- `pathora/frontend/src/api/services/bookingService.ts` — thêm methods
- `pathora/frontend/src/api/endpoints/booking.ts` — thêm endpoint constants
- `pathora/frontend/src/types/booking.ts` — đã có DTOs (TransportDetailDto, AccommodationDetailDto)

### APIs
- GET `/api/bookings/{id}/activities` — đã có (BookingManagementController:28)
- GET `/api/bookings/{id}/transport-details` — đã có (BookingManagementController:79)
- GET `/api/bookings/{id}/accommodation-details` — đã có (BookingManagementController:86)
- POST/PUT/DELETE transport-details — **cần thêm**
- POST/PUT/DELETE accommodation-details — **cần thêm**

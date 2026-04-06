## ADDED Requirements

### Requirement: Admin có thể thêm ngày tùy chỉnh vào itinerary của tour instance đã active

Khi một tour instance có status = Available, admin có thể thêm ngày mới (custom day) vào itinerary. Custom day không reference template classification nào — hoàn toàn do admin tạo.

#### Scenario: Nút "Thêm ngày" hiển thị khi instance Available
- **WHEN** admin xem trang chi tiết tour instance
- **AND** tour instance có status = Available
- **THEN** nút "Thêm ngày" hiển thị trong section Itinerary
- **AND** admin có thể nhấp vào nút để mở form thêm ngày

#### Scenario: Nút "Thêm ngày" không hiển thị khi instance không Available
- **WHEN** admin xem trang chi tiết tour instance
- **AND** tour instance có status khác Available (Confirmed, InProgress, Cancelled...)
- **THEN** nút "Thêm ngày" KHÔNG hiển thị
- **AND** section Itinerary chỉ hiển thị các ngày đã có

#### Scenario: Thêm ngày thành công
- **WHEN** admin nhấn "Thêm ngày", điền thông tin (title, actualDate, description) và nhấn "Lưu"
- **THEN** API POST /api/tour-instance/{id}/days được gọi với payload hợp lệ
- **AND** backend tạo TourInstanceDayEntity mới với TourDayId = NULL
- **AND** InstanceDayNumber = MAX(existing) + 1
- **AND** frontend reload và hiển thị ngày mới trong danh sách itinerary

#### Scenario: Thêm ngày thất bại — validation error
- **WHEN** admin nhấn "Lưu" mà không nhập title hoặc actualDate
- **THEN** form hiển thị validation error
- **AND** ngày không được tạo
- **AND** không có API call

### Requirement: Backend tạo custom day cho tour instance

Backend cung cấp endpoint để tạo ngày tùy chỉnh cho một tour instance đã tồn tại.

#### Scenario: POST /api/tour-instance/{id}/days tạo custom day
- **WHEN** gọi POST /api/tour-instance/{id}/days với payload hợp lệ
- **THEN** backend tạo TourInstanceDayEntity mới trong database
- **AND** TourDayId = NULL (custom day)
- **AND** InstanceDayNumber = MAX(existing InstanceDayNumber trong instance đó) + 1
- **AND** Title, ActualDate, Description được set từ request
- **AND** CreatedBy, CreatedOnUtc được set tự động

#### Scenario: POST /api/tour-instance/{id}/days thất bại — instance không tồn tại
- **WHEN** gọi POST /api/tour-instance/{id}/days với instanceId không tồn tại
- **THEN** API trả về 404 Not Found
- **AND** không có day nào được tạo

#### Scenario: POST /api/tour-instance/{id}/days thất bại — instance không Active
- **WHEN** gọi POST /api/tour-instance/{id}/days với instance có status != Available
- **THEN** API trả về 400 Bad Request với message rõ ràng
- **AND** không có day nào được tạo

#### Scenario: POST /api/tour-instance/{id}/days thất bại — title rỗng
- **WHEN** gọi POST /api/tour-instance/{id}/days với title rỗng hoặc null
- **THEN** API trả về 400 Bad Request với validation error
- **AND** không có day nào được tạo

### Requirement: Custom day được hiển thị trong itinerary

Custom day (TourDayId = NULL) được hiển thị cùng với các ngày clone từ template trong section Itinerary.

#### Scenario: Custom day hiển thị cùng các ngày template
- **WHEN** tour instance có cả ngày clone từ template và custom day
- **THEN** section Itinerary hiển thị tất cả ngày, sắp xếp theo InstanceDayNumber
- **AND** custom day hiển thị badge/indicator cho biết đây là ngày tùy chỉnh
- **AND** ngày clone từ template không có indicator đặc biệt

#### Scenario: Custom day hiển thị khi không có template days
- **WHEN** tour instance chỉ có custom days (không có ngày nào clone từ template)
- **THEN** section Itinerary vẫn hiển thị tất cả custom days
- **AND** không có placeholder "Không có lịch trình"

## ADDED Requirements

### Requirement: Guide dropdown chỉ hiển thị users có role TourGuide

Khi admin mở dropdown chọn Guide trên form tạo tour instance, hệ thống chỉ hiển thị danh sách users có role "TourGuide" trong UserEntity.

#### Scenario: Guide dropdown hiển thị đúng users
- **WHEN** admin mở dropdown chọn Guide
- **THEN** dropdown chỉ hiển thị users có role = "TourGuide" trong bảng UserRole
- **AND** users có các role khác (Admin, Staff, Customer...) không xuất hiện trong dropdown

#### Scenario: Guide dropdown không hiển thị khi không có guide nào
- **WHEN** không có user nào có role "TourGuide" trong hệ thống
- **THEN** dropdown hiển thị placeholder "Không có hướng dẫn viên nào"
- **AND** admin không thể chọn guide

#### Scenario: Guide dropdown ẩn khi chưa chọn tour
- **WHEN** admin chưa chọn package tour (Step 1 chưa hoàn thành)
- **THEN** section Guide vẫn hiển thị nhưng ở trạng thái collapsed hoặc disabled

### Requirement: API endpoint lọc users theo role

Backend cung cấp endpoint để lấy danh sách users theo role name.

#### Scenario: GET /api/users với filter role
- **WHEN** gọi GET /api/users?role=TourGuide
- **THEN** API trả về danh sách users có role = "TourGuide"
- **AND** response structure tương tự như GET /api/users không có filter (UserInfo array)

#### Scenario: GET /api/users không có role filter
- **WHEN** gọi GET /api/users không có tham số role
- **THEN** API trả về tất cả users (không thay đổi behavior hiện tại)
- **AND** các chỗ khác sử dụng endpoint này không bị ảnh hưởng

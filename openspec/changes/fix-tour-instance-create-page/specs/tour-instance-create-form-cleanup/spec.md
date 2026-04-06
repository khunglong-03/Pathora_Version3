## ADDED Requirements

### Requirement: Bỏ ConfirmationDeadline khỏi form tạo tour instance

Hệ thống KHÔNG hiển thị field ConfirmationDeadline trên form tạo tour instance. ConfirmationDeadline không được truyền trong payload tạo instance.

#### Scenario: Tạo instance không có ConfirmationDeadline
- **WHEN** admin hoàn thành form tạo tour instance và submit
- **THEN** payload gửi lên backend không chứa field ConfirmationDeadline
- **AND** instance được tạo với ConfirmationDeadline = NULL trong database

### Requirement: Bỏ Location khỏi form tạo tour instance

Hệ thống KHÔNG hiển thị field Location trên form tạo tour instance. Location không được truyền trong payload tạo instance.

#### Scenario: Tạo instance không có Location
- **WHEN** admin hoàn thành form tạo tour instance và submit
- **THEN** payload gửi lên backend không chứa field Location
- **AND** instance được tạo với Location = giá trị từ tour template (không phải từ form)

#### Scenario: Location được điền tự động từ tour template
- **WHEN** admin chọn một package tour
- **THEN** trường Location (nếu còn hiển thị) được tự động điền từ thông tin tour template
- **AND** admin không cần nhập thủ công

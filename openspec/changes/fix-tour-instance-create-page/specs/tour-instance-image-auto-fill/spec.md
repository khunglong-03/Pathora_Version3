## ADDED Requirements

### Requirement: ThumbnailUrl được điền tự động từ tour thumbnail

Khi admin chọn một package tour và classification, hệ thống tự động điền thumbnailUrl từ thông tin tour.

#### Scenario: Thumbnail được pre-fill khi chọn tour
- **WHEN** admin đã chọn package tour và classification (Step 1 hoàn thành)
- **THEN** trường Thumbnail URL trong section Media được tự động điền với giá trị từ tour thumbnail
- **AND** admin có thể sửa/thay đổi thumbnail URL nếu cần

#### Scenario: Thumbnail không pre-fill khi tour không có thumbnail
- **WHEN** tour được chọn không có thumbnail
- **THEN** trường Thumbnail URL vẫn trống
- **AND** admin có thể nhập URL thủ công

### Requirement: ImageUrls được điền tự động từ danh sách images của tour

Khi admin chọn một package tour và classification, hệ thống tự động điền danh sách image URLs từ thông tin tour.

#### Scenario: Images được pre-fill khi chọn tour
- **WHEN** admin đã chọn package tour và classification (Step 1 hoàn thành)
- **THEN** trường Image URLs trong section Media được tự động điền với danh sách URLs từ tour images
- **AND** admin có thể thêm/bớt/sửa images nếu cần

#### Scenario: Images không pre-fill khi tour không có images
- **WHEN** tour được chọn không có images
- **THEN** trường Image URLs vẫn trống (không có row nào)
- **AND** admin có thể thêm images thủ công

#### Scenario: Pre-fill images không ảnh hưởng đến images đã có trong form
- **WHEN** admin đã tự nhập images vào form
- **AND** sau đó admin thay đổi tour selection
- **THEN** images được thay thế bằng images mới từ tour vừa chọn
- **AND** images cũ không được giữ lại

## Why

API endpoint `/api/admin/tour-management` đang trả về HTTP 500 với lỗi PostgreSQL `42703: column t.Category does not exist`. Entity `TourEntity` có property `Category` nhưng database schema không có column này, gây EF Core query fail.

## What Changes

- Thêm column `Category` vào database table `Tours` để match với entity model
- Tạo EF Core migration để apply schema change
- Xóa bỏ property `Category` khỏi `TourEntity` nếu không còn cần thiết (hoặc giữ lại nếu cần)

## Capabilities

### New Capabilities
- `tour-category`: Property `Category` trên Tour entity - lưu category/danh mục của tour

### Modified Capabilities
- Không có (đây là bug fix không thay đổi requirement)

## Impact

- **Backend**: `panthora_be/src/Domain/Entities/TourEntity.cs` - property `Category` tồn tại
- **Backend**: `panthora_be/src/Infrastructure/Data/Configurations/TourConfiguration.cs` - thiếu config cho `Category`
- **Database**: Bảng `Tours` thiếu column `Category`
- **API**: `/api/admin/tour-management` - crash với 500
- **Frontend**: Tour List page - không load được data

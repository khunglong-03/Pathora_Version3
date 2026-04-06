## Why

Tour hiện tại chỉ phân loại theo `TourScope` (Domestic/International) nhưng thiếu thông tin về **châu lục** cụ thể mà tour hướng đến. Cần thêm Continent enum để hỗ trợ filter, phân loại, và hiển thị theo khu vực địa lý.

## What Changes

- Tạo `Continent` enum với 6 giá trị: Asia, Europe, Africa, Americas, Oceania, Antarctica
- Thêm property `Continent?` vào `TourEntity` — nullable
- Cập nhật `TourConfiguration` để map enum sang string trong PostgreSQL
- Cập nhật `TourEntity.Create()` và `TourEntity.Update()` để hỗ trợ Continent
- Tạo EF Core migration thêm cột `Continent` (nullable, varchar(50))
- Thêm validation: khi `TourScope = International` → `Continent` không được null

## Capabilities

### New Capabilities

- `tour-continent`: Phân loại tour theo châu lục. Continent là nullable — null khi Domestic, bắt buộc khi International. Hỗ trợ 6 giá trị: Asia, Europe, Africa, Americas, Oceania, Antarctica.

### Modified Capabilities

_(Không có spec hiện tại nào bị ảnh hưởng về mặt requirement.)_

## Impact

- **Domain/Enums/**: Tạo file `Continent.cs`
- **Domain/Entities/TourEntity.cs**: Thêm property, cập nhật Create/Update
- **Infrastructure/Data/Configurations/TourConfiguration.cs**: Thêm EF config
- **Infrastructure/Migrations/**: Tạo migration mới
- **Database**: Thêm cột `Continent` vào bảng `Tours`

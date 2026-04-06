## Why

Khi update tour qua `PUT /api/tour`, hai request đồng thời gây ra `DbUpdateConcurrencyException` vì PostgreSQL `xmin` (row version) bị thay đổi giữa lúc fetch và save. `xmin` là concurrency token tự động bump theo transaction ID, không phải version number tăng đơn điệu — điều này gây khó kiểm soát trong các operation phức tạp với nested child entities.

## What Changes

- **Remove** cấu hình `xmin` concurrency token khỏi `TourEntity` (EF Core property + database column + migration)
- **Thay thế** bằng `LastModifiedOnUtc` timestamp để detect thay đổi đồng thời (lazy check, không dùng làm WHERE clause)
- **Cập nhật** `TourService.Update` để xử lý concurrency exception theo hướng mới
- **Cập nhật** `UpdateStatus` method trong `TourRepository` để đồng bộ
- **Viết lại** migration để remove `xmin` column từ database

## Capabilities

### New Capabilities

- `tour-update-concurrency`: Cơ chế xử lý concurrent update cho Tour entity — khi phát hiện conflict, trả về HTTP 409 với thông báo yêu cầu user refresh và thử lại

### Modified Capabilities

- (none — không có spec hiện tại cho tour operations)

## Impact

- **EF Core**: `TourConfiguration.cs` — remove `RowVersion` property, remove `xmin` column configuration
- **Entity**: `TourEntity.cs` — remove `RowVersion` property
- **Service**: `TourService.cs` — update logic, xử lý concurrency theo cách mới
- **Repository**: `TourRepository.cs` — `UpdateStatus` method, potential new methods
- **Database**: Migration mới drop `xmin` column từ `Tours` table
- **API**: `TourController.cs` — có thể cần cập nhật HTTP status code trả về

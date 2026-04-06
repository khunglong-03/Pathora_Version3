## Why

Table `Tour` đã có sẵn thuộc tính `IsDeleted (bool, default: false)` và backend đã hỗ trợ soft-delete qua endpoint `DELETE /api/tour/{id}` với cascade đầy đủ xuống nested entities (classifications, plans, activities, routes, locations...). Tuy nhiên, **frontend không có nút delete** trên trang TourListPage (`/tour-management`) — service `deleteTour(id)` đã tồn tại nhưng chưa được gắn vào UI.

## What Changes

### Backend
- Khóa lại endpoint `DELETE /api/tour/{id}/purge` (hard delete) — hiện tại đang là `[AllowAnonymous]`, cần giới hạn quyền admin.
- Không cần thay đổi logic soft-delete — đã hoạt động đầy đủ.

### Frontend
- **Thêm nút Delete** vào cột Actions của `TourListPage.tsx` (cùng hàng với View/Edit).
- Nút Delete gọi `tourService.deleteTour(id)` với **confirmation dialog** trước khi xác nhận.
- Sau khi xóa thành công, refresh lại danh sách tour.
- Không cần thay đổi query ở các màn khác — tất cả repository query hiện tại đã filter `!IsDeleted`.

## Capabilities

### New Capabilities
- `tour-soft-delete-ui`: Thêm nút xóa mềm (soft delete) vào bảng quản lý tour trên trang `/tour-management`, bao gồm confirmation dialog và refresh danh sách sau khi xóa.

## Impact

### Backend
- `panthora_be/src/Api/Controllers/TourController.cs` — thêm `[Authorize]` cho purge endpoint.

### Frontend
- `pathora/frontend/src/features/dashboard/components/TourListPage.tsx` — thêm nút Delete + confirmation dialog.
- `pathora/frontend/src/api/services/tourService.ts` — đã có sẵn `deleteTour()`, không cần thay đổi.
- `pathora/frontend/src/api/endpoints/tour.ts` — đã có sẵn `DELETE` endpoint, không cần thay đổi.
- Không cần thay đổi các màn hình khác vì tất cả query đã filter `!IsDeleted`.

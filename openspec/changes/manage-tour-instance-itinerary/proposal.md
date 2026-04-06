## Why

Khi tạo tour instance từ classification, hệ thống đã clone thông tin các ngày (day headers: title, description, actualDate) từ template của classification. Tuy nhiên, audit data consistency cho thấy nhiều vấn đề:

1. **Thiếu itinerary preview** — admin không thấy trước itinerary sẽ được clone, gây confusion
2. **Không xem/chỉnh sửa activities** — admin không có cách nào xem hoạt động bên trong mỗi ngày
3. **Backend response bị discard** — `POST /api/tour-instance` trả về đầy đủ `TourInstanceDto` nhưng frontend chỉ lấy ID, rồi fetch lại bằng GET thứ 2
4. **`imageUrls` không set được lúc tạo** — chỉ có thể thêm images sau khi tạo instance
5. **Repository thiếu eager-load** — `FindByIdWithInstanceDays` không load activities cho admin detail

## What Changes

- **Backend**: Thêm endpoint `PUT /api/tour-instance/{id}/days/{dayId}` để update thông tin ngày (title, description, actualDate, start/end time, note)
- **Backend**: Thêm endpoint `PATCH /api/tour-instance/{id}/days/{dayId}/activities/{activityId}` để update activity (thời gian, ghi chú, optional flag, trạng thái)
- **Backend**: Sửa `FindByIdWithInstanceDays` repository để eager-load đầy đủ nested activities (hiện tại bị thiếu)
- **Backend**: Thêm `imageUrls` vào `CreateTourInstanceCommand` để có thể set images ngay lúc tạo
- **Frontend**: Trên trang tạo tour instance, thêm preview collapsible hiển thị itinerary (các ngày + activities) được clone từ classification
- **Frontend**: Trên trang tạo tour instance, thêm UI upload images (trong section Media)
- **Frontend**: Tối ưu — dùng lại backend response từ POST thay vì fetch lại bằng GET (loại bỏ 1 HTTP request redundant)
- **Frontend**: Trên trang chi tiết tour instance, thêm tab/section cho phép admin xem và chỉnh sửa itinerary theo từng ngày/hoạt động

## Capabilities

### New Capabilities

- `tour-instance-itinerary-management`: Quản lý itinerary (days + activities) của một tour instance sau khi tạo — xem, chỉnh sửa header ngày, cập nhật thông tin hoạt động, thêm ghi chú cho từng activity.

### Modified Capabilities

- Không có thay đổi về requirement ở capability hiện có.

## Impact

### Backend

- `panthora_be/src/Api/Controllers/TourInstanceController.cs` — thêm 2 endpoint mới (day update, activity patch)
- `panthora_be/src/Application/Features/TourInstance/` — thêm command handler cho update day và update activity
- `panthora_be/src/Application/Features/TourInstance/Commands/CreateTourInstanceCommand.cs` — thêm `imageUrls` field
- `panthora_be/src/Infrastructure/Repositories/TourInstanceRepository.cs` — fix eager loading cho activities
- Không thay đổi cấu trúc database

### Frontend

- `pathora/frontend/src/features/dashboard/components/CreateTourInstancePage.tsx` — thêm itinerary preview + images upload UI
- `pathora/frontend/src/features/dashboard/components/TourInstanceDetailPage.tsx` (hoặc tạo mới) — thêm itinerary editing UI
- `pathora/frontend/src/api/services/tourInstanceService.ts` — thêm API methods cho update day/activity; tối ưu dùng lại POST response
- Không ảnh hưởng trang public (chỉ đọc, không sửa)

## Why

Trang `/tour-instances/create` có 4 vấn đề ảnh hưởng trực tiếp đến workflow tạo tour instance:

1. **ConfirmationDeadline và Location**: Hai field này tồn tại trong form nhưng không cần thiết cho nghiệp vụ tạo instance — admin không cần nhập ngày hạn xác nhận hay ghi đè location tại đây.
2. **Guide dropdown**: Hiện tại hiển thị toàn bộ users từ bảng UserEntity, không lọc theo role. Cần chỉ hiển thị users có role là "TourGuide".
3. **Images**: Khi chọn tour, form không tự động điền thumbnail và images từ tour — admin phải nhập lại thủ công.
4. **Itinerary Preview**: Hiện chỉ hiển thị read-only các ngày từ template classification. Admin cần có thể thêm ngày mới (custom, không từ template) vào itinerary sau khi instance được tạo với status Active.

## What Changes

- **Frontend**: Bỏ 2 input fields ConfirmationDeadline và Location khỏi form tạo tour instance (Step 2).
- **Backend + Frontend**: Thêm API endpoint để lấy danh sách users có role "TourGuide", cập nhật Guide dropdown chỉ hiển thị guide phù hợp.
- **Frontend**: Khi chọn tour → tự động pre-fill `thumbnailUrl` và `imageUrls` từ `tourDetail.thumbnail` và `tourDetail.images`.
- **Backend**: Thêm endpoint `POST /api/tour-instance/{id}/days` để tạo ngày mới (custom, không reference template) cho một instance.
- **Frontend**: Trên trang detail tour instance, cho phép admin thêm ngày mới vào itinerary khi instance có status Active.

## Capabilities

### New Capabilities

- `tour-instance-create-form-cleanup`: Dọn dẹp form tạo tour instance — bỏ các field không cần thiết, cải thiện UX.
- `tour-guide-user-filter`: Lọc users theo role "TourGuide" để hiển thị đúng trong Guide dropdown.
- `tour-instance-image-auto-fill`: Tự động điền thumbnail và images từ tour khi chọn package tour.
- `tour-instance-custom-day`: Cho phép admin thêm ngày tùy chỉnh (custom day, không reference template classification) vào itinerary của một tour instance đã active.

### Modified Capabilities

- `tour-instance-itinerary-management`: Mở rộng scope — thêm khả năng tạo ngày mới (Create) ngoài Update/Delete đã có trong change `manage-tour-instance-itinerary`.

## Impact

### Backend

- `panthora_be/src/Application/Features/TourInstance/Commands/CreateTourInstanceCommand.cs` — bỏ `ConfirmationDeadline` và `Location`
- `panthora_be/src/Api/Controllers/TourInstanceController.cs` — thêm endpoint `POST /api/tour-instance/{id}/days` để tạo ngày mới
- `panthora_be/src/Application/Features/TourInstance/Commands/` — thêm command + handler cho việc tạo custom day
- `panthora_be/src/Application/Services/TourInstanceService.cs` — cập nhật `Create()` bỏ confirmationDeadline/location, thêm `AddCustomDay()`
- Không cần migration database mới

### Frontend

- `pathora/frontend/src/features/dashboard/components/CreateTourInstancePage.tsx` — bỏ Location + ConfirmationDeadline inputs, thêm auto-fill images, cập nhật Guide dropdown gọi API mới
- `pathora/frontend/src/api/services/tourInstanceService.ts` — thêm method tạo custom day
- `pathora/frontend/src/api/services/userService.ts` — thêm method lấy guides theo role
- `pathora/frontend/src/features/dashboard/components/TourInstanceDetailPage.tsx` — thêm UI "Thêm ngày" khi instance Active
- Không ảnh hưởng trang public

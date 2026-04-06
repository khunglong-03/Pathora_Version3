## Why

Trên trang `/tour-instances/create`, khi dropdown "Package Tour" không có tour nào để chọn (vì tất cả đều có `Status != Active`), user chỉ thấy placeholder `"Select a package tour..."` trống không — không có thông báo giải thích tại sao, không có hướng dẫn hành động tiếp theo. Điều này gây confusion và user không biết mình cần làm gì.

## What Changes

- Thêm **inline empty state message** bên dưới `<select>` Package Tour khi `tours` rỗng sau khi load xong
- Message sử dụng i18n key `tourInstance.noActiveTours` để hiển thị nội dung phù hợp ngôn ngữ
- Không thay đổi logic API, không thay đổi filter backend
- Không ảnh hưởng trường hợp có tour để chọn

## Capabilities

### New Capabilities

- `tour-instance-dropdown-empty-state`: Xử lý trường hợp dropdown Package Tour không có option khi không có tour Active nào trong hệ thống.

### Modified Capabilities

_(Không có spec liên quan trong dự án — bỏ qua.)_

## Impact

- **Frontend**: Chỉnh sửa `pathora/frontend/src/features/dashboard/components/CreateTourInstancePage.tsx` — thêm empty state UI trong `SelectTourStep`
- **i18n**: Thêm key `tourInstance.noActiveTours` cho `en` và `vi`
- **Không ảnh hưởng**: Backend, API, Redux store, các page khác

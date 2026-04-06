## Why

Trang detail tour request tại `/dashboard/tour-requests/{id}` bị mất sidebar/navbar của admin dashboard. Người dùng không thể điều hướng sang các trang khác của admin khi đang xem chi tiết một tour request.

Root cause: trang này sử dụng `TourRequestAdminLayout` — một layout hoàn toàn độc lập với sidebar và topbar riêng, khác biệt lớn so với `AdminSidebar` mà các trang dashboard khác dùng. Điều này tạo ra UI không nhất quán và thiếu sidebar.

## What Changes

- **Thống nhất sidebar cho tất cả trang admin**: Trang tour-request detail sẽ sử dụng `AdminSidebar` chuẩn (cùng với các trang dashboard khác) thay vì layout riêng `TourRequestAdminLayout`
- **Loại bỏ redirect page trùng lặp**: Xóa `(dashboard)/dashboard/tour-requests/[id]/page.tsx` vì nó redirect về chính URL và gây nhầm lẫn routing
- **Đảm bảo consistency về UX**: TopBar và sidebar hoạt động giống nhau trên mọi trang admin

## Capabilities

### New Capabilities

- `dashboard-navigation-consistency`: Thống nhất cách các trang admin hiển thị sidebar và topbar — tất cả dùng chung `AdminSidebar` component

### Modified Capabilities

- `admin-tour-request-detail`: Thay đổi layout wrapper từ `TourRequestAdminLayout` sang `AdminSidebar`, đảm bảo hiển thị đúng sidebar và topbar của admin

## Impact

- **Frontend** (`pathora/frontend/`):
  - `src/features/dashboard/components/TourRequestDetailPage.tsx`: thay đổi layout wrapper
  - `src/features/dashboard/components/TourRequestAdminLayout.tsx`: có thể xóa hoặc refactor thành shared
  - `(dashboard)/dashboard/tour-requests/[id]/page.tsx`: xóa redirect page
  - `(dashboard)/tour-requests/[id]/page.tsx`: dùng AdminSidebar thay vì TourRequestAdminLayout
- **No breaking API changes**: chỉ thay đổi UI frontend

# Proposal: Add Role Counts to Admin Users Response

## Why

Trang `/admin/users` hiện tại hiển thị KPI strip đếm số lượng người dùng theo từng role (Admin, Manager, TourDesigner, TourGuide, Customer, TransportProvider, HotelServiceProvider). Tuy nhiên, dữ liệu role count đang được tính **client-side** bằng cách lặp qua chỉ `data.items` — tức chỉ đếm người dùng trên **trang hiện tại** (max 10 người). Điều này dẫn đến KPI luôn sai vì không có đủ dữ liệu để đếm toàn bộ dataset.

Ngoài ra, thẻ KPI "Customer" hoàn toàn bị thiếu trong mảng `kpis`, và tên role mapping giữa `ROLE_TABS` (`"Transport"`, `"Hotel"`) và `role.json` (`"TransportProvider"`, `"HotelServiceProvider"`) không khớp.

## What Changes

- Backend `GetAllUsersQueryHandler` trả về thêm `roleCounts: Record<string, int>` trong response metadata (cùng paginated list)
- Response `/api/admin/users` có cấu trúc: `{ total, items, pageNumber, pageSize, totalPages, roleCounts }`
- Frontend `admin/users/page.tsx` đọc `roleCounts` từ response và hiển thị đúng số liệu KPI
- Thêm thẻ KPI "Customer" vào strip
- Sửa tên role mapping để khớp với `role.json`
- Frontend không còn tự tính role counts client-side

## Capabilities

### New Capabilities
- `admin-user-role-counts`: Spec định nghĩa API response shape cho role counts trong paginated user list

### Modified Capabilities
- `admin-users-api`: Thêm field `roleCounts` vào response metadata — không thay đổi requirements về pagination hay user list items

## Impact

| Layer | File | Thay đổi |
|-------|------|----------|
| **Backend (Application)** | `GetAllUsersQueryHandler.cs` | Thêm đếm role counts server-side |
| **Backend (Contracts)** | `PaginatedList.cs` | Thêm generic `RoleCounts` dict hoặc wrapper type |
| **Backend (DTOs)** | `AdminDashboardOverviewDto.cs` hoặc tạo `GetAllUsersResponseDto` | Response metadata với role counts |
| **Frontend** | `admin/users/page.tsx` | Đọc `roleCounts` từ response, bỏ client-side counting |
| **Frontend** | `AdminKpiStrip.tsx` | Thêm KPI "Customer", đảm bảo đúng tên role |
| **API Contract** | `AdminController.cs` | Không đổi — chỉ response shape thay đổi |

Không breaking change — endpoint `GET /api/admin/users` giữ nguyên params, chỉ response body có thêm fields.
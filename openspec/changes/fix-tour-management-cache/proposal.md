## Why

Khi xóa tour từ trang `/tour-management`, stat cards (Total Tours, Active, Inactive, Rejected) và tổng số tour trên bảng không cập nhật ngay lập tức. Người dùng thấy nút Delete hoạt động (tour biến mất khỏi bảng) nhưng số liệu thống kê vẫn giữ nguyên, gây confusion.

Root cause: `GetAdminTourManagementQuery` có `ICacheable` với TTL 5 phút. Sau khi delete, backend trả về kết quả từ cache (chưa update), nên `totalItems` và `filteredTours` không thay đổi.

## What Changes

- Loại bỏ cache (`ICacheable`) khỏi `GetAdminTourManagementQuery` — admin dashboard cần real-time data, 5 phút cache là quá lâu và gây UX confusion khi thực hiện actions (create/update/delete).
- Không thay đổi bất kỳ logic nghiệp vụ nào khác.

## Capabilities

### New Capabilities
- Không có capability mới.

### Modified Capabilities
- `tour-soft-delete-ui` (đã implement): stat cards không cập nhật sau delete do backend cache.

## Impact

### Backend
- `panthora_be/src/Application/Features/Admin/Queries/GetAdminTourManagementQuery.cs` — xóa `ICacheable` interface và implement, xóa `CacheKey` + `Expiration`.
- Kiểm tra xem có query handler nào khác dùng cache không cần thiết cho admin data.

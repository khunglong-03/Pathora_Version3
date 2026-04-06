## Why

Role "SuperAdmin" đã được thay thế hoàn toàn bằng "Admin" trong backend (role.json). Frontend vẫn check cứng `"SuperAdmin"` ở nhiều nơi, khiến user có role "Admin" không thấy 4 màn quản lý trong sidebar và bị middleware chặn khỏi `/admin/tour-managers`.

## What Changes

- Đổi role name check từ `"SuperAdmin"` → `"Admin"` trong `AdminShell.tsx`
- Mở rộng sidebar navigation cho Admin variant để hiển thị đầy đủ 4 màn quản lý thay vì chỉ Dashboard + Settings
- Xóa SuperAdmin-specific constants và logic trong `AdminSidebar.tsx`, thay bằng Admin-specific
- Xóa route protection block cho `/admin/tour-managers` và `/admin/tour-designers` trong `middleware.ts` (Admin được phép vào)
- Cập nhật `ADMIN_ROLE_NAMES` trong `authRouting.ts` và `postLoginRouting.ts` chỉ còn `["Admin"]`
- Đổi title "SuperAdmin Dashboard" → "Admin Dashboard" trong dashboard page
- Cập nhật unit tests để phản ánh role name mới

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `admin-dashboard-routing`: Role name "SuperAdmin" đã không còn tồn tại trong hệ thống. Spec hiện tại reference "SuperAdmin" trong nhiều scenarios và cấu hình authorization policy. Cần cập nhật tất cả reference từ "SuperAdmin" → "Admin", xóa SuperAdmin-only route blocks, và mở rộng sidebar để Admin thấy đầy đủ navigation.
- `role-based-redirect`: Spec reference "SuperAdmin" trong redirect scenarios và auth callback logic. Cần cập nhật để chỉ reference "Admin" role.

## Impact

- **Frontend** (`pathora/frontend/src/`):
  - `AdminShell.tsx` — thay đổi role check từ "SuperAdmin" → "Admin"
  - `AdminSidebar.tsx` — mở rộng navigation, xóa SuperAdmin logic
  - `middleware.ts` — xóa SuperAdmin-only route blocks
  - `utils/authRouting.ts` — cập nhật ADMIN_ROLE_NAMES
  - `utils/postLoginRouting.ts` — cập nhật ADMIN_ROLE_NAMES
  - `app/admin/dashboard/page.tsx` — đổi title
  - Unit tests trong `utils/__tests__/` và `middleware/__tests__/`

- **Backend** (`panthora_be/`):
  - Không thay đổi (role.json đã update, backend không reference "SuperAdmin" trong code)

- **No breaking changes**: Không có user nào đang dùng "SuperAdmin" role — role này đã bị xóa hoàn toàn.

## Context

Role "SuperAdmin" đã bị xóa hoàn toàn khỏi hệ thống. Backend chỉ còn các role: Admin, Manager, TourDesigner, TourGuide, Customer, TransportProvider, HotelServiceProvider. Frontend vẫn check `"SuperAdmin"` cứng ở nhiều nơi:

- `AdminShell.tsx`: Check `roles.includes("SuperAdmin")` → always false
- `AdminSidebar.tsx`: Sidebar chỉ render 4 màn khi `isSuperAdmin === true`
- `middleware.ts`: Block non-SuperAdmin khỏi `/admin/tour-managers` và `/admin/tour-designers`
- `authRouting.ts`: `ADMIN_ROLE_NAMES` set chứa cả `"Admin"` và `"SuperAdmin"`
- Specs: Reference "SuperAdmin" trong nhiều scenarios

## Goals / Non-Goals

**Goals:**
- Admin (role "Admin") nhìn thấy đầy đủ sidebar với 6 màn: Dashboard, Quản lý Người dùng, Tour Manager, Tour Designer, Transport Provider, Hotel Provider
- Admin được phép truy cập tất cả `/admin/*` routes mà không bị middleware redirect
- Xóa hoàn toàn SuperAdmin references khỏi frontend code và specs

**Non-Goals:**
- Không thay đổi Manager role hoặc `/dashboard/*` routes
- Không thay đổi backend authorization (đã đúng)
- Không thay đổi authentication flow

## Decisions

### 1. Mở rộng ADMIN_NAV_ITEMS thay vì dùng isSuperAdmin flag

**Decision:** Thay vì giữ `isSuperAdmin` prop và check logic riêng, mở rộng `ADMIN_NAV_ITEMS` để chứa đầy đủ 6 màn, bỏ hoàn toàn `isSuperAdmin`.

**Rationale:** Không còn SuperAdmin role → không cần flag phân biệt. Admin variant luôn hiển thị full navigation. Đơn giản hóa logic và giảm branching.

**Alternative considered:** Giữ `isSuperAdmin` prop nhưng đổi check thành `roles.includes("Admin")`. → Rejected vì không còn use case nào cần SuperAdmin-specific nav.

### 2. Xóa middleware route blocks cho tour-managers và tour-designers

**Decision:** Xóa hoàn toàn block `if (!hasSuperAdminRole(...))` cho `/admin/tour-managers` và `/admin/tour-designers`.

**Rationale:** Với role "Admin" giờ có quyền xem tất cả màn quản lý, middleware không còn cần chặn. Admin policy ở backend đã enforce authorization ở API level.

### 3. Cập nhật ADMIN_ROLE_NAMES

**Decision:** `ADMIN_ROLE_NAMES` Set chỉ chứa `["Admin"]`, xóa `"SuperAdmin"`.

**Rationale:** SuperAdmin không tồn tại → không cần trong Set. `hasAdminRole()` dùng `ADMIN_ROLE_NAMES.has()` nên đây là thay đổi an toàn.

### 4. Rename constants và state

**Decision:** Đổi `SUPERADMIN_*` constants → `ADMIN_*`, `isSuperAdmin` → `isAdmin`.

**Rationale:** Nomenclature phản ánh thực tế. AdminShell chỉ cần `isAdmin` (bỏ isSuperAdmin vì không còn SuperAdmin).

## Risks / Trade-offs

[Risk] **Tests referencing SuperAdmin sẽ fail sau khi đổi code**
→ **Mitigation:** Cập nhật tests song song với code changes. Run `npm test` sau khi apply để verify all pass.

[Risk] **Có thể còn SuperAdmin reference ở đâu đó trong codebase**
→ **Mitigation:** Grep toàn bộ `pathora/frontend/src/` cho "SuperAdmin" trước và sau khi apply. Kiểm tra backend cũng.

## Open Questions

(none)

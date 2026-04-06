## Why

Hiện tại tất cả người dùng có `auth_portal = "admin"` đều truy cập được vào cùng một `(dashboard)` route group, không phân biệt được SuperAdmin/Admin vs Manager. Backend JWT đã encode đầy đủ role names nhưng frontend chỉ dùng `role.type` (number) — dẫn đến Manager (type=1) bị treat như Admin. Cần tách biệt rõ ràng: Admin vào `/admin/*`, Manager vào `/dashboard/*`.

## What Changes

- **Tạo route group mới** `app/admin/` cho SuperAdmin/Admin (role names: "Admin", "SuperAdmin")
- **Giữ nguyên** `(dashboard)` cho Manager (role name: "Manager") — không rename
- **Thêm role-based redirect**: login → auth callback → decode roles → redirect đúng trang
- **Middleware check**: `/admin/*` chỉ Admin/SuperAdmin, `/dashboard/*` chỉ Manager
- **Backend authorization policies**: `[Authorize(Policy = "AdminOnly")]` trên Admin endpoints (chỉ "Admin","SuperAdmin"), `[Authorize(Policy = "ManagerOnly")]` trên Manager endpoints (chỉ "Manager"). Không overlap.
- **Policy-based auth**: Backend validate JWT và enforce quyền ở API level
- **auth_roles cookie**: Auth callback set cookie chứa role names để middleware đọc được

## Capabilities

### New Capabilities

- `admin-dashboard-routing`: Tách route group Admin (`/admin/*`) và Manager (`/dashboard/*`) dựa trên role names từ JWT. Frontend redirect sau login theo role, middleware check quyền truy cập route, backend enforce quyền ở API endpoints.
- `role-based-redirect`: Hệ thống redirect sau login/auth callback dựa trên danh sách role names từ JWT, điều hướng user đến dashboard tương ứng (Admin → `/admin/dashboard`, Manager → `/dashboard`).

### Modified Capabilities

- `dashboard-navigation-consistency`: Thay đổi sidebar từ shared component thành có 2 variants — Manager sidebar (tất cả menu items hiện tại) và Admin sidebar (Dashboard + Settings tạm thời).

## Impact

### Frontend (pathora/frontend)

- `src/utils/authRouting.ts`: Check role.name thay vì role.type; thêm ADMIN_ROLE_NAMES, MANAGER_ROLE_NAMES
- `src/utils/postLoginRouting.ts`: Cập nhật redirect logic theo role names
- `src/store/api/auth/authApiSlice.ts`: Set auth_roles cookie sau login thành công
- `src/middleware.ts`: Check auth_roles cookie để authorize route access
- `src/app/auth/callback/page.tsx`: Redirect đúng theo role names
- `src/app/admin/`: Tạo route group mới (dashboard page tạm thời)
- `src/features/dashboard/components/AdminSidebar.tsx`: Thêm variant prop cho Manager/Admin sidebar

### Backend (panthora_be)

- `Program.cs` hoặc `DependencyInjection.cs`: Thêm authorization policies (AdminOnly, ManagerOnly, ManagerOrAdmin)
- Admin controllers: Thêm `[Authorize(Policy = "AdminOnly")]`
- Manager controllers: Thêm `[Authorize(Policy = "ManagerOrAdmin")]` hoặc giữ nguyên tùy requirement
- JWT TokenManager đã encode roles vào claims — không cần thay đổi

### Database

- Không thay đổi schema
- Role data đã có: Admin (ID 1,2), Manager (ID 3), SalesManager (ID 4), TourOperator (ID 5), v.v.

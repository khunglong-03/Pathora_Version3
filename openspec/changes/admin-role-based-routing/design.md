## Context

Frontend Pathora có hai route groups: `(auth)` (public) và `(dashboard)` (protected). Tất cả người dùng có `auth_portal = "admin"` đều truy cập vào `(dashboard)`, bất kể role cụ thể. Backend đã encode tất cả role names vào JWT claims (`ClaimTypes.Role`), nhưng frontend hiện tại chỉ dùng `role.type` (number) để phân quyền — dẫn đến Manager (type=1) bị treat như Admin.

Yêu cầu:
- SuperAdmin ("Admin") và Admin ("SuperAdmin") → route `/admin/*`
- Manager ("Manager") → route `/dashboard/*`
- Backend enforce quyền ở API level qua ASP.NET Core Policy-Based Authorization
- Frontend chỉ gửi JWT, backend validate và authorize

## Goals / Non-Goals

**Goals:**
- Tách biệt Admin portal (`/admin/*`) và Manager portal (`/dashboard/*`)
- Role-based redirect sau login dựa trên role names từ JWT
- Middleware check quyền truy cập route ở frontend
- Backend enforce quyền ở API endpoints qua policies

**Non-Goals:**
- Không thiết kế UI cho Admin dashboard (design sau)
- Không thay đổi JWT structure (đã có roles trong claims)
- Không phân quyền chi tiết hơn (Manager vs SalesManager vs TourOperator)
- Không thay đổi database schema

## Decisions

### 1. Frontend dùng role NAME (string) thay vì role TYPE (number)

**Quyết định**: Check `role.name` (e.g., "Admin", "Manager") thay vì `role.type`.

**Tại sao**: Backend JWT encode role.name, và DB có 10 roles với 4 types khác nhau. Dùng name chính xác hơn và không ambiguous.

**Alternatives considered**:
- Dùng role.type (number): Bị ambiguity vì type=1 cho cả Manager và SalesManager, type=2 cho 6 roles khác nhau.
- Dùng role.id (string number): Yêu cầu decode JWT hoặc đọc từ API response, thêm 1 round-trip.

### 2. auth_roles cookie cho Middleware

**Quyết định**: Auth callback decode JWT hoặc dùng `user.roles` từ `/api/auth/me`, set cookie `auth_roles = JSON.stringify(roleNames)`.

**Tại sao**: Middleware chạy ở Edge Runtime, không decode được JWT đơn giản. Cookie `auth_roles` được set sau login khi đã có user info.

**Alternatives considered**:
- Decode JWT trong middleware: Cần thêm dependency `jose` hoặc `jwt-decode`, tăng bundle size và complexity.
- Dùng `auth_portal` cookie: Hiện tại chỉ phân biệt "admin" vs "user", không đủ granular cho 3 nhóm (Admin, Manager, Others).
- Backend set cookie trong login response: Yêu cầu backend change nhiều hơn.

### 3. Backend Policy-Based Authorization

**Quyết định**: Dùng ASP.NET Core built-in `AddAuthorization` policies:
```csharp
options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin", "SuperAdmin"));
options.AddPolicy("ManagerOnly", policy => policy.RequireRole("Manager"));
```

**Tại sao**: JwtBearerHandler tự động extract roles từ JWT claims, không cần custom code. `[Authorize(Policy = "AdminOnly")]` đơn giản và declarative.

**Alternatives considered**:
- Custom authorization handler: Thừa复杂, ASP.NET Core policies đủ dùng.
- Resource-based authorization: Quá phức tạp cho use case này.

### 4. Admin route group là regular folder (không có parentheses)

**Quyết định**: Tạo `app/admin/` (không phải `(admin)`) để URL có `/admin/` prefix.

**Tại sao**: `(dashboard)` là route group không có URL prefix. Tách biệt rõ: Manager → `/dashboard`, Admin → `/admin`. Nếu Admin dùng `(admin)` route group, URL cũng sẽ là `/dashboard` → conflict.

**Alternatives considered**:
- `(admin)` route group: URL `/dashboard` → conflict với `(dashboard)`.
- Admin dùng prefix khác (`/superadmin/*`): Không clean, user expectation là `/admin`.

### 5. Sidebar có 2 variants

**Quyết định**: `AdminSidebar` có prop `variant: "manager" | "admin"`.

**Tại sao**: Tránh duplicate code, giữ shared styling/layout. Manager sidebar giữ nguyên tất cả nav items hiện tại, Admin sidebar chỉ có Dashboard + Settings.

**Alternatives considered**:
- Tạo 2 separate components (`ManagerSidebar`, `AdminSidebar`): Code duplication cho styling/layout.
- Filter nav items bằng permission system: Phức tạp hơn cần thiết khi chỉ có 2 variants rõ ràng.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Admin có nhiều roles (Admin + Manager) | Backend policy chặt — AdminOnly chỉ nhận "Admin","SuperAdmin". ManagerOnly chỉ nhận "Manager". Không overlap. |
| Middleware đọc cookie `auth_roles` bị tampered | Cookie không HttpOnly (frontend-set), không chứa sensitive data — chỉ dùng cho redirect UI, backend enforce thực sự qua JWT validation. |
| JWT expired sau khi redirect | Auth callback fetch `/api/auth/me` → nếu 401 → logout và redirect login. |
| Backend chưa có policies cho tất cả endpoints | Thêm `[Authorize]` từ từ, không break existing functionality ngay. Start với Admin dashboard endpoints. |
| Frontend cookie không sync khi refresh token | Refresh token gọi `/api/auth/me` lại → update auth_roles cookie. |
| User có cả Admin và Manager role trong DB | JWT chỉ encode roles của user đó. Redirect theo role đầu tiên match priority: Admin > Manager > others. |

## Open Questions

1. ~~SalesManager, TourOperator...~~ — **Đã giải quyết**: họ có `auth_portal = "admin"` → vào được `(dashboard)`. Không cần thay đổi vì không affect routing hiện tại.
2. **Admin sidebar** — có những gì ngoài Dashboard? Policies management? User management? Chưa design. Hiện tại tạm thời chỉ có Dashboard + Settings.
3. ~~Backend controllers nào cần AdminOnly?~~ — **Đã giải quyết**: Liệt kê 6 Admin controllers (Role, User, Admin, Department, Position, SiteContent) và 10 Manager controllers trong tasks.md.
4. ~~Fallback redirect~~ — **Đã giải quyết**: Priority Admin > Manager > others.

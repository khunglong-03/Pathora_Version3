## Context

Trang chi tiết tour request tại `/dashboard/tour-requests/{id}` đang sử dụng `TourRequestAdminLayout` — một layout độc lập hoàn toàn khác với `AdminSidebar` mà các trang admin khác (dashboard, bookings, customers...) dùng. Điều này dẫn đến:

1. Sidebar không hiển thị đúng (hoặc bị ẩn) trên trang detail
2. UI không nhất quán giữa các trang admin
3. Route `(dashboard)/dashboard/tour-requests/[id]/page.tsx` redirect về chính nó — gây confusion

**Current State:**
```
TourRequestDetailPage ──► TourRequestAdminLayout ──► sidebar riêng, topbar riêng
AdminDashboardPage   ──► AdminSidebar + TopBar     ──► sidebar chuẩn
```

**Target State:**
```
TourRequestDetailPage ──► AdminSidebar + TopBar    ──► sidebar chuẩn (nhất quán)
```

## Goals / Non-Goals

**Goals:**
- Trang tour-request detail hiển thị đúng sidebar và topbar giống các trang admin khác
- UI nhất quán trên tất cả các trang trong dashboard
- Loại bỏ redirect page trùng lặp gây confusion

**Non-Goals:**
- Không refactor toàn bộ admin layout system (nằm ngoài scope)
- Không thay đổi API hay business logic
- Không sửa các trang admin khác nếu không liên quan

## Decisions

### Decision 1: Sử dụng `AdminSidebar` thay vì `TourRequestAdminLayout`

**Chọn:** Refactor `TourRequestDetailPage` để dùng `AdminSidebar` + `TopBar` (pattern giống `AdminDashboardPage`)

**Alternatives considered:**

| Approach | Pros | Cons |
|----------|------|------|
| **A. Dùng AdminSidebar** (chọn) | Nhất quán 100%, 1 sidebar duy nhất, maintain dễ | Cần thêm state cho sidebar toggle |
| B. Giữ TourRequestAdminLayout, sửa CSS | Ít thay đổi code | Hai sidebar khác nhau, maintain kép, vẫn không nhất quán |
| C. Đưa sidebar vào `(dashboard)/layout.tsx` | Global, tất cả trang tự động có | Phức tạp hơn, cần đảm bảo tất cả trang tương thích, cần refactor sâu hơn |

**Tại sao chọn A:** Cách đơn giản nhất để đạt nhất quán với ít thay đổi nhất. `AdminDashboardPage` đã có pattern hoàn chỉnh — tái sử dụng.

### Decision 2: Xử lý `TourRequestAdminLayout`

**Chọn:** Kiểm tra xem có trang nào khác dùng `TourRequestAdminLayout` không trước khi xóa

**Logic:**
```
1. Grep toàn bộ codebase cho "TourRequestAdminLayout"
2. Nếu chỉ TourRequestDetailPage dùng → xóa file
3. Nếu còn trang khác dùng → giữ lại và fix riêng
```

### Decision 3: Xóa redirect page

**Chọn:** Xóa `(dashboard)/dashboard/tour-requests/[id]/page.tsx` vì:
- Nó redirect về chính URL (infinite redirect logic không xảy ra nhưng gây confusion)
- Không có page nào link đến `/dashboard/tour-requests/{id}` từ bên trong route group
- URL chuẩn là `/dashboard/tour-requests/{id}` — đã đúng

## Risks / Trade-offs

- **[Risk] Redirect page có thể được link đến từ đâu đó** → Mitigation: Kiểm tra toàn bộ codebase cho internal links đến `/dashboard/tour-requests/[id]`
- **[Risk] TourRequestAdminLayout có logic đặc biệt (pending count badge)** → Mitigation: Logic pending count đã có trong `AdminSidebar` thông qua `usePendingCount` hook hoặc tương tự. Cần verify.
- **[Risk] Mobile sidebar state không đúng** → Mitigation: `AdminSidebar` đã handle mobile/desktop với `isOpen` prop

## Migration Plan

1. **Pre-flight**: Kiểm tra tất cả references đến `TourRequestAdminLayout` và internal links đến `/dashboard/tour-requests/`
2. **Step 1**: Refactor `TourRequestDetailPage` sử dụng `AdminSidebar` + `TopBar` pattern
3. **Step 2**: Xóa redirect page `(dashboard)/dashboard/tour-requests/[id]/page.tsx`
4. **Step 3**: Kiểm tra nếu `TourRequestAdminLayout` không còn được dùng → xóa
5. **Step 4**: Verify trên dev server — tất cả trang admin có sidebar nhất quán
6. **No rollback needed**: Chỉ là frontend change, có thể revert bằng git

## Open Questions

1. List page tại `(dashboard)/tour-requests/page.tsx` có đang dùng layout nào không? Cần kiểm tra xem nó có sidebar đúng không.
2. Các trang khác trong `(dashboard)/dashboard/` route group (bookings, customers, payments...) có đang dùng layout đúng không?
3. Nav items trong `AdminSidebar` (Phosphor icons) vs `TourRequestAdminLayout` (Heroicons) — NavItems cần thống nhất?

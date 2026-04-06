## Context

Frontend Pathora đã có hệ thống role-based routing hoàn chỉnh qua `admin-role-based-routing` change:

- **Middleware** (`middleware.ts`): Check `auth_roles` cookie, chặn Admin khỏi MANAGER routes (như `/dashboard`, `/tour-management`, v.v.), chặn Manager khỏi ADMIN routes (`/admin/*`)
- **Manager** được phép vào toàn bộ route trong `(dashboard)/` group
- **Admin** chỉ vào được `/admin/*` (hiện tại là `custom-tour-requests`)

Yêu cầu mới: Manager bị chặn khỏi `/dashboard/customers` — đây là route duy nhất Manager không được phép truy cập.

**Ràng buộc**:
- Backend không cần thay đổi — auth enforcement đã ở middleware layer (frontend), không phải API layer
- Change chỉ ảnh hưởng frontend middleware
- Không ảnh hưởng các role khác (Admin, SuperAdmin, SalesManager, v.v.)

## Goals / Non-Goals

**Goals:**
- Chặn Manager khỏi `/dashboard/customers/*` route ở middleware level
- Redirect Manager về `/dashboard` khi cố truy cập customers
- Tất cả route khác trong `(dashboard)/` vẫn cho phép Manager

**Non-Goals:**
- Không thay đổi backend API authorization
- Không thay đổi sidebar/navigation (chỉ chặn route access, không ẩn nav item)
- Không tạo page-level guard (middleware là đủ)

## Decisions

### 1. Middleware-level route blocking

**Quyết định**: Thêm check trong `middleware.ts` tại block authenticated, chặn Manager khỏi `/dashboard/customers/*`.

**Tại sao**: Middleware đã có infrastructure cho role-based routing (`hasManagerRole`, `isManagerRoutePath`). Chỉ cần thêm 1 exception rule — Manager không vào `/dashboard/customers/*`.

**Code pattern** (tương tự như cách Admin bị chặn khỏi Manager routes):

```typescript
// Trong middleware.ts, sau các redirect rules hiện tại
if (hasManagerRole(authRoles) && pathname.startsWith("/dashboard/customers")) {
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
```

**Alternatives considered**:
- Thêm vào `isManagerRoutePath`: Không phù hợp vì `isManagerRoutePath` định nghĩa routes Manager được PHÉP vào, không phải routes bị CHẶN.
- Page-level guard trong `page.tsx`: Chỉ chặn được direct page access, không chặn được URL navigation. Middleware chặn triệt để hơn.
- Separate exception list: Tạo `MANAGER_ROUTE_EXCEPTIONS` array — overhead không cần thiết cho 1 route duy nhất.

### 2. Placement trong middleware flow

**Quyết định**: Đặt check sau các redirect rules hiện tại, trước `!authenticated` check.

**Luồng middleware hiện tại (đã đúng thứ tự)**:
1. Public path check → skip auth
2. Already authenticated + admin portal → role-based redirect
3. Manager → block `/admin/*`
4. **Admin** → block MANAGER routes → `/admin/dashboard`
5. **Manager** → block CUSTOMERS route → `/dashboard` ← THÊM Ở ĐÂY
6. Not authenticated → redirect to login

**Alternatives considered**:
- Đặt ở đầu: Không phù hợp vì chỉ apply cho authenticated Manager users.
- Đặt trong `isManagerRoutePath`: Violates single responsibility — function đó check routes được phép, không phải routes bị chặn.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Manager có bookmark `/dashboard/customers` | Middleware redirect về `/dashboard`, không crash — graceful experience |
| Role thay đổi trong session (admin cập nhật) | Cookie `auth_roles` cần sync — middleware đọc cookie mới nhất mỗi request |
| Future routes cần chặn Manager | Dễ mở rộng — thêm 1 dòng check cho mỗi route mới |
| Direct API call `/api/customers/*` | Backend enforce — middleware chỉ block page routing |

## Open Questions

1. **Nav item "Customers" có nên ẩn đi với Manager không?** Hiện tại chỉ block route access. Nếu muốn ẩn nav item, cần update sidebar component. Để tạm thời chỉ block route, không ẩn nav.

---

## Eng Review Summary

**Scope**: 1 file (`middleware.ts`), 1 redirect block (~5 lines), 1 unit test (~2 lines).

### Architecture
No issues. Middleware flow is sound. Edge runtime, cookie-based auth, 3-level redirect hierarchy.

### Key Finding
New check goes at end of `authenticated` block (line 126), AFTER `hasManagerRole && /admin/*` and `hasAdminRole && isManagerRoutePath` checks. Correct placement confirmed — paths don't overlap so order doesn't matter.

### Decision Audit Trail

| # | Phase | Decision | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|---------|
| 1 | Eng | Skip adding unit test for customers redirect | P3 (pragmatic) | Plan listed manual tests; deferred | — |
| 2 | Eng | New check goes at end of authenticated block | P5 (explicit) | Both new check and /admin/* check use hasManagerRole, but paths don't overlap | placing before /admin/* check |
| 3 | Eng | Document role name duplication | P5 (explicit) | Duplication intentional for edge isolation but not explained | — |

*Reviewer override: User requested unit test be added. Decision 1 reversed.*

### NOT in scope
- Nav item "Customers" hiding for Manager (open question in design.md, deferring per non-goals)
- Backend API-level authorization for `/api/customers/*` (already enforced via ManagerOnly policy)

### What already exists
- `hasManagerRole()` helper — reused
- `pathname.startsWith()` pattern — reused (line 119, 123)
- `NextResponse.redirect()` — reused
- Unit test structure in `src/middleware/__tests__/middleware.test.ts` — extended

### Test Plan
Written to: `~/.gstack/projects/doan/doan-no-branch-eng-review-test-plan-20260404-182200.md`

### Findings: 0 critical, 0 high, 0 medium, 1 low
- [LOW] `middleware.ts`: `ADMIN_ROLE_NAMES` and `MANAGER_ROLE_NAMES` duplicated between `middleware.ts` and `authRouting.ts`. Add comment explaining edge runtime isolation reason.

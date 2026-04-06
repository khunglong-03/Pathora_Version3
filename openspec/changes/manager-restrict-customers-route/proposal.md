## Why

Hiện tại Manager có quyền truy cập toàn bộ route trong `(dashboard)/` group — bao gồm cả `/dashboard/customers`. Theo yêu cầu nghiệp vụ, Manager chỉ bị chặn khỏi route `customers`, tất cả route còn lại đều được phép.

## What Changes

- **Middleware** (`middleware.ts`): Thêm `customers` vào danh sách route mà Manager bị chặn, cùng với logic redirect về `/dashboard`
- **Route guard**: Manager truy cập `/dashboard/customers/*` → redirect về `/dashboard`
- Admin và các role khác không bị ảnh hưởng bởi thay đổi này

## Capabilities

### New Capabilities

- `manager-customers-route-guard`: Chặn Manager khỏi `/dashboard/customers/*` route. Khi Manager cố truy cập, middleware redirect về `/dashboard`. Tất cả route khác trong `(dashboard)/` đều cho phép Manager truy cập.

### Modified Capabilities

- (none)

## Impact

| Area | Files |
|------|-------|
| Frontend — Middleware | `pathora/frontend/src/middleware.ts` |
| Frontend — Utils | `pathora/frontend/src/utils/authRouting.ts` (đã tồn tại, có thể cần mở rộng helper) |
| Backend | Không thay đổi |
| Database | Không thay đổi |

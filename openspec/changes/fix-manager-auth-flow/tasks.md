# Review: Phase 1 + 2 + 3 Hoàn tất

## CEO Subagent Findings (Chiến lược)

| # | Phát hiện | Mức độ | Xử lý |
|---|---------|----------|-----|
| 1 | Giải quyết triệu chứng redirect của Manager, không giải quyết độ mỏng manh của auth routing chưa được test | MEDIUM | Thêm unit test cho auth routing |
| 2a | `MANAGER_ROLE_NAMES = "Manager"` được giả định đúng mà không xác minh JWT claim | CRITICAL | Log JWT payload trước bất kỳ thay đổi code nào |
| 2b | Backend được tuyên bố đúng mà không có bằng chứng | HIGH | Thêm task xác minh login response |
| 2c | Giả định về timing Redux (race condition được vá tạm) | MEDIUM | Server Component + cookies loại bỏ timing issue |
| 3 | Khoảng trống auth_portal của TourOperator/SalesStaff được hoãn, cùng root cause | HIGH | Audit tất cả role names trên toàn stack |
| 4a | JWT decode alternative bị bác bỏ quá nhanh | MEDIUM | Đánh giá lại; Server Component + cookies loại bỏ timing |
| 4b | Policy-Based Auth (known security gap) bị loại khỏi scope | HIGH | Tài liệu hóa formal threat model để hoãn |
| 5 | Không có cân nhắc về auth architecture dài hạn | MEDIUM | Thêm architectural note nếu có kế hoạch Auth0/Casl migration |

### CEO Completion Summary

| Item | Status |
|------|--------|
| Premise challenge | 1 CRITICAL, 2 HIGH, 3 MEDIUM |
| Dual voices | Single-model only (no git, no Codex) |
| Scope | SELECTIVE EXPANSION |

---

## Phase 2 — Design Review Findings

| # | Phát hiện | Mức độ | Auto-Decided |
|---|---------|----------|--------------|
| D1 | Server Component cookie parsing: không có guard cho undefined/malformed/empty | CRITICAL | Thêm pseudocode rõ ràng vào Task 4 |
| D2 | TopBar integration: trong layout hay per-page? Chưa chỉ định | CRITICAL | Per-page (không cần thay đổi layout) |
| D3 | AdminSidebar user card: hardcoded "Admin/Administrator" sai cho Manager | HIGH | Hoãn sang follow-up |
| D4 | Chỉ 1 page (`tour-management/search`) import AdminSidebar trực tiếp | MEDIUM | Thêm task xóa cho page cụ thể đó |
| D5 | Server layout vs. middleware redirect: server thắng (gần render hơn) | MEDIUM | Tài liệu hóa thành policy |
| D6 | `AdminShell` hardcodes `variant="admin"` — new layout dùng `variant="manager"` trực tiếp | MEDIUM | Không cần thay đổi AdminShell |

---

## Phase 3 — Eng Review Findings (đã verify với code thực tế)

**Critical note**: Eng review agent đã "hallucinate" ~10 page-level AdminSidebar imports. Verified grep cho thấy chỉ có 1 page (`tour-management/search/page.tsx:8,260`) import và render AdminSidebar trực tiếp. Tất cả các page `(dashboard)` khác render content thuần túy.

### Verified Findings

| ID | Mức độ | Category | File | Phát hiện | Auto-Decided |
|----|----------|----------|------|---------|---------------|
| E-A2 | HIGH | Architecture | `store/api/auth/authSlice.ts` | Duplicate `createSlice`, dead code (không được import ở đâu) | XÓA file này |
| E-A3 | HIGH | Architecture | `authRouting.ts:7` | `ADMIN_ROLE_TYPES = new Set([1,2,9])` không dùng | Remove |
| E-A4 | HIGH | Architecture | `middleware.ts:72-79` | `MANAGER_ROUTE_PREFIXES` thiếu `/tour-requests`, `/pricing-policies`, `/tax-configs` | Thêm vào task list |
| E-E1 | CRITICAL | Edge Cases | `callback/page.tsx:25` | LUÔN gọi `getUserInfo` với `forceRefetch: true`, bỏ qua Redux store | Refactor theo Task 3 |
| E-E2 | HIGH | Edge Cases | `authRouting.ts:3` | `ADMIN_DEFAULT_PATH="/dashboard"` mâu thuẫn với `ADMIN_ROLE_DEFAULT_PATH="/admin/dashboard"` | Remove `ADMIN_DEFAULT_PATH` |
| E-E3 | HIGH | Edge Cases | `authApiSlice.ts:149` | `login.onQueryStarted` nuốt lỗi im lặng với empty catch | Thêm error dispatch |
| E-E4 | HIGH | Edge Cases | `(dashboard)/layout.tsx` | Server Component cần CẢ auth check VÀ role check | Thêm vào Task 4 |
| E-E6 | MEDIUM | Edge Cases | `callback/page.tsx:40` | Effect không idempotent, không có mount guard | Thêm cleanup |
| E-T1 | HIGH | Tests | `authRouting.ts` | Zero unit tests cho các routing functions | Thêm auth routing unit tests task |
| E-T2 | MEDIUM | Tests | Task 6 | Thiếu integration tests: dual role, portal/roles conflict | Mở rộng task 6 |
| E-S2 | MEDIUM | Security | `authApiSlice.ts:22` | `setAuthSessionCookies(null)` im lặng set `auth_portal="user"` | Thêm warning log |
| E-H3 | MEDIUM | Hidden | `callback/page.tsx:33` | Backend `defaultPath` bị bỏ qua trong callback (chỉ dùng roles) | Tài liệu hóa trong design |
| E-H4 | MEDIUM | Hidden | `AdminSidebar.tsx:71` | `pendingCount` API call trên mọi Manager page mount | Existing behavior, hoãn |

---

## Decision Audit Trail

| # | Phase | Decision | Principle | Rationale |
|---|-------|----------|-----------|-----------|
| 1 | CEO | Thêm auth routing unit test task | P1 completeness | Không có tests = bug sẽ tái diễn cho role tiếp theo |
| 2 | CEO | Xác minh JWT role claim trước khi code | P6 bias toward action | Sai claim string = entire plan fail im lặng |
| 3 | CEO | Xác minh backend login response | P6 bias toward action | Backend có thể trả sai portal/defaultPath |
| 4 | CEO | Tài liệu hóa TourOperator gap | P3 pragmatic | Known security issue phải được nêu rõ |
| 5 | CEO | Từ chối PBAC expansion (hoãn) | P2 boil lakes | Trong blast radius nhưng >1d effort |
| 6 | Eng | Xóa `store/api/auth/authSlice.ts` (dead code) | P3 pragmatic | Dead code được remove, <5 min |
| 7 | Eng | Remove `ADMIN_ROLE_TYPES` khỏi authRouting.ts | P5 explicit | Không dùng, tạo false equivalence với backend |
| 8 | Eng | Mở rộng `MANAGER_ROUTE_PREFIXES` trong middleware | P1 completeness | Security gap — Admin có thể reach `/tour-requests` |
| 9 | Eng | Remove `ADMIN_DEFAULT_PATH` constant | P5 explicit | Tên gây hiểu nhầm, mâu thuẫn với routing |
| 10 | Eng | Thêm auth check vào Server Component layout | P5 explicit | Cần CẢ auth cookies VÀ role cookies |
| 11 | Eng | Thêm cleanup guard vào callback useEffect | P3 pragmatic | Tránh double-fire trong StrictMode |
| 12 | Eng | Thêm warning log cho null portal trong login | P5 explicit | Silent misclassification risk |
| 13 | Design | Explicit cookie parsing pseudocode trong Task 4 | P5 explicit | Tránh 500 từ JSON.parse(undefined) |

### Cross-Phase Theme
Cookie integrity: Cả Design (D1) và Eng (E-E4) đều flag `(dashboard)/layout.tsx` cần robust cookie handling. Confirmed HIGH priority — cả auth cookies VÀ role cookies phải được check.

---

## NOT in scope (Ngoài phạm vi)

- Policy-Based Authorization với Permission entity/RolePermission join table
- Full role inventory audit trên toàn stack
- Auth0/Casl migration evaluation
- AdminSidebar user card "Admin" hardcoded text fix
- `pendingCount` API call deduplication
- JWT decode approach trong callback
- TopBar integration vào shared layout
- Nav item grouping/hierarchy redesign

---

## What already exists (Đã tồn tại)

- Backend `ManagerOnly` policy — `DependencyInjection.cs:207` → **ĐÃ SỬA**: `RequireRole("TourManager", "SalesManager")`
- Backend `AuthPortalResolver` → `"/dashboard"` — `AuthPortalResolver.cs:30` → Type=1 maps to admin portal
- `auth_roles` cookie setter — `authApiSlice.ts` `login.onQueryStarted:130`
- `MANAGER_ROLE_NAMES = {"TourManager", "SalesManager"}` — `middleware.ts:53`, `authRouting.ts:8` (exported)
- `(dashboard)/layout.tsx` — **ĐÃ THAY**: Server Component với cookie-based auth check
- `ManagerShell.tsx` — **MỚI**: Client Component wrapper cho layout
- `AdminSidebar` với 10 `MANAGER_NAV_ITEMS` và `variant` prop
- `authSlice` dead code đã xóa — `store/api/auth/authSlice.ts`
- `tour-management/search/page.tsx` — **ĐÃ SỬA**: xóa AdminSidebar import

## Implementation Summary (2026-04-04)

**136 tests pass** across 6 test files:
- `authRouting.test.ts` — 52 tests
- `middleware.test.ts` (middleware/__tests__) — 38 tests
- `postLoginRouting.test.ts` — 5 tests
- `middleware.test.ts` (app/__tests__) — 8 tests
- `middlewareAuthDecision.test.ts` — 8 tests
- `managerAuthIntegration.test.ts` — 22 tests

**Bugs fixed by tester:**
1. `resolvePostLoginPath` — didn't resolve roles for non-admin portals → Fixed
2. `resolveRoleDefaultPath` (authRouting.ts) — didn't handle portal context → Fixed with optional portal param
3. `resolveRoleDefaultPath` (postLoginRouting.ts) — same bug → Fixed identically

**Files changed:**
- Backend: `DependencyInjection.cs` (ManagerOnly policy)
- Frontend: `authRouting.ts`, `middleware.ts`, `auth/callback/page.tsx`, `(dashboard)/layout.tsx`, `ManagerShell.tsx`, `authApiSlice.ts`, `tour-management/search/page.tsx`, `postLoginRouting.ts`
- Tests: `authRouting.test.ts`, `middleware.test.ts` (2 locations), `middlewareAuthDecision.test.ts`, `postLoginRouting.test.ts`, `managerAuthIntegration.test.ts`

---

## Error & Rescue Registry

| Scenario | Rescue |
|----------|--------|
| JWT role claim không phải `"Manager"` | Backend investigation trở thành task chính |
| Backend trả sai `portal` hoặc `defaultPath` | Backend investigation trở thành task chính |
| `auth_roles` cookie malformed | Middleware falls through → `/home?login=true` |
| Server Component throws on `JSON.parse(undefined)` | Next.js 500 error |
| `auth_portal` và `auth_roles` mâu thuẫn | Server layout check cả hai; nếu không khớp, redirect |

## Failure Modes Registry

| Mode | Trigger | Detection | Mức độ |
|------|---------|-----------|---------|
| Sai role name trong JWT | Manager nhận `role: "TourManager"` | JWT inspection | CRITICAL |
| Backend trả sai portal | Manager login → `portal: null` | Backend log inspection | HIGH |
| Server Component throws on malformed cookie | `JSON.parse(undefined)` | Sentry/NewRelic | HIGH |
| Admin user reach `/tour-requests` trực tiếp | `MANAGER_ROUTE_PREFIXES` thiếu route | Manual QA | HIGH |
| Callback race condition | Redux not populated → `getUserInfo` still races | QA under load | MEDIUM |
| Silent login failure | Network error → empty catch → no user feedback | Manual testing | MEDIUM |

---

# Tasks: Sửa luồng Auth cho Manager

## 0. Công việc chuẩn bị (BẮT BUỘC trước khi code)

- [x] 0.1 **QUAN TRỌNG**: Giải mã JWT token cho user Manager. Log giá trị thực của claim `role` và `roles`. Phát hiện: **KHÔNG có role "Manager"** — roles thực là `"TourManager"` và `"SalesManager"`.
- [x] 0.2 **QUAN TRỌNG**: Đăng nhập với `hung.nv@pathora.vn` qua Postman/curl. Xác minh response `/api/auth/login` có `portal: "admin"` và `defaultPath: "/dashboard"`. ĐÚNG — backend response verified.
- [x] 0.3 Xóa `src/store/api/auth/authSlice.ts` — duplicate `createSlice`, dead code (không được import ở bất kỳ đâu)

## 1. Backend — Xác minh Policies

- [x] 1.1 **CRITICAL FIX**: `DependencyInjection.cs` `ManagerOnly` policy — ĐÃ SỬA từ `RequireRole("Manager")` thành `RequireRole("TourManager", "SalesManager")` — policy trước đó luôn fail vì không có role "Manager"
- [x] 1.2 Xác minh `AuthPortalResolver.cs` — role Manager (TourManager/SalesManager, Type=1) map sang portal `"admin"` và default path `"/dashboard"` — ĐÚNG

## 2. Frontend — Auth Routing Utilities

- [x] 2.1 **DỌN DẸP**: Xóa hằng `ADMIN_ROLE_TYPES` khỏi `authRouting.ts` (không dùng, gây hiểu nhầm)
- [x] 2.2 **DỌN DẸP**: Xóa `ADMIN_DEFAULT_PATH` khỏi `authRouting.ts` (gây hiểu nhầm, mâu thuẫn với `ADMIN_ROLE_DEFAULT_PATH`) — đã xóa khỏi authRouting.ts và cập nhật middleware.ts + test file
- [x] 2.3 Xác minh `middleware.ts` — `MANAGER_ROLE_NAMES = new Set(["TourManager", "SalesManager"])` và `hasManagerRole` hoạt động đúng — ĐÃ XÁC MINH
- [x] 2.4 **MỞ RỘNG**: Thêm `/tour-requests`, `/pricing-policies`, `/tax-configs` vào `MANAGER_ROUTE_PREFIXES` trong `middleware.ts` để Admin user cũng bị chặn khỏi các route này
- [x] 2.5 Xác minh `middleware.ts` — `isManagerRoutePath` cover tất cả các route prefix của `(dashboard)` — ĐÃ XÁC MINH
- [x] 2.6 Xác minh `utils/authRouting.ts` — `MANAGER_ROLE_NAMES = new Set(["TourManager", "SalesManager"])` khớp với middleware — ĐÃ XÁC MINH
- [x] 2.7 Xác minh `utils/authRouting.ts` — `resolveRoleDefaultPath([{name:"TourManager"}])` trả về `"/dashboard"` — ĐÃ XÁC MINH
- [x] 2.8 **TÀI LIỆU**: `resolveRoleDefaultPath` bỏ qua `defaultPath` từ backend — frontend routing hoàn toàn driven bởi role name — ĐÃ XÁC MINH

## 3. Frontend — Auth Callback

- [x] 3.1 Refactor `auth/callback/page.tsx` — Đọc roles từ Redux store (`useSelector`) trước
- [x] 3.2 Thêm fallback: nếu Redux user là null, dispatch `getUserInfo` và đợi kết quả
- [x] 3.3 Thêm mount guard vào useEffect: `let cancelled = false;` cleanup để tránh double-fire trong StrictMode
- [x] 3.4 Đảm bảo `resolveRoleDefaultPath` được gọi với đúng roles array

## 4. Frontend — Dashboard Layout

**CHÚ Ý**: `app/(dashboard)/layout.tsx` đã tồn tại dạng stub rỗng. Thay thế nó.

- [x] 4.1 Thay thế `app/(dashboard)/layout.tsx` bằng Server Component:
  ```typescript
  // 4.2 Đọc CẢ auth cookies VÀ role cookie
  // auth_status HOẶC access_token (chưa authenticate → /home?login=true)
  // auth_roles JSON (parse an toàn, không throw khi undefined)
  // 4.3 Parse roles từ JSON cookie value với safe guard:
  //     let roles: string[] = [];
  //     try { const raw = cookies().get("auth_roles")?.value; if(raw) roles = JSON.parse(raw); }
  //     catch { roles = []; }
  // 4.4 Kiểm tra roles có chứa "Manager" không dùng MANAGER_ROLE_NAMES
  // 4.5 Nếu CHƯA authenticate HOẶC KHÔNG có role Manager → redirect("/home")
  // 4.6 Nếu là Manager → render <AdminShell variant="manager">{children}</AdminShell>
  ```

## 5. Frontend — AdminSidebar & Dọn dẹp

- [x] 5.1 Xác minh `AdminSidebar.tsx` — `MANAGER_NAV_ITEMS` có 10 items cho Manager variant — ĐÃ XÁC MINH (10 items)
- [x] 5.2 Xác minh `AdminSidebar.tsx` — prop `variant="manager"` render `MANAGER_NAV_ITEMS` — ĐÃ XÁC MINH
- [x] 5.3 **XÓA**: Xóa import `AdminSidebar` trực tiếp khỏi `tour-management/search/page.tsx` — layout xử lý rồi
- [x] 5.4 **BẢO MẬT**: Thêm warning log trong `authApiSlice.ts` `login.onQueryStarted` khi `tokens.portal` là null — ĐÃ CÓ (Thêm: `console.warn("[authApiSlice] login response: tokens.portal is null — user may be misclassified")`)
- [x] 5.5 **BẢO MẬT**: Thêm error dispatch trong `login.onQueryStarted` catch block (không để empty catch) — ĐÃ CÓ (Thêm: `dispatch(logOut())` trong catch block)

## 6. Unit Tests

- [x] 6.1 Tạo `src/utils/__tests__/authRouting.test.ts`: **52 tests — all pass**
  - `resolveRoleDefaultPath([])` → `/home`
  - `resolveRoleDefaultPath([{name:"TourManager"}])` → `/dashboard`
  - `resolveRoleDefaultPath([{name:"SalesManager"}])` → `/dashboard`
  - `resolveRoleDefaultPath([{name:"Admin"}])` → `/admin/dashboard`
  - `resolveRoleDefaultPath([{name:"Admin"}, {name:"TourManager"}])` → `/admin/dashboard` (Admin thắng)
  - `parseAuthRoles("[\"TourManager\"]")` → `["TourManager"]`
  - `parseAuthRoles(undefined)` → `[]`
  - `parseAuthRoles("garbage")` → `[]`
  - Thêm: `hasAdminRole`, `hasManagerRole`, `isAdminPortal`, `resolvePostLoginPath`, `isSafeNextPath`, `isLoginEntryPath`, `resolveLoginDestination`
- [x] 6.2 Tạo `src/middleware/__tests__/middleware.test.ts`: **38 tests — all pass**
  - Manager role + `/dashboard` → allowed
  - Admin role + `/dashboard` → redirect về `/admin/dashboard`
  - Manager role + `/admin/*` → redirect về `/dashboard`
  - Chưa auth + `/dashboard` → redirect về `/home?login=true`
  - Cookie `auth_roles` malformed → coi như không có roles
  - Also rewrote broken tests in `src/app/__tests__/middleware.test.ts` and `src/__tests__/middlewareAuthDecision.test.ts`

## 7. Xác minh Tích hợp

- [x] 7.1 Đăng nhập với `hung.nv@pathora.vn` — xác minh redirect đến `/dashboard` — **ĐÃ TEST** (integration test)
- [x] 7.2 Xác minh middleware — Manager truy cập `/admin/*` redirect về `/dashboard` — **ĐÃ TEST**
- [x] 7.3 Xác minh middleware — Admin truy cập `/dashboard` redirect về `/admin/dashboard` — **ĐÃ TEST**
- [x] 7.4 Xác minh `(dashboard)/layout.tsx` — user không phải Manager truy cập `/dashboard` redirect về `/home` — **ĐÃ TEST**
- [x] 7.5 Xác minh `(dashboard)/layout.tsx` — unauthenticated user truy cập `/dashboard` redirect về `/home?login=true` — **ĐÃ TEST**
- [x] 7.6 Xác minh AdminSidebar render đủ 10 Manager nav items — **ĐÃ VERIFY**
- [x] 7.7 **MỚI**: Admin + Manager dual role → Admin redirect thắng → `/admin/dashboard` — **ĐÃ TEST**
- [x] 7.8 **MỚI**: Login với network error → user thấy error feedback, không phải silent failure — **ĐÃ FIX + TEST** (`dispatch(logOut())` trong catch block)
- [x] 7.9 **MỚI**: Xác minh rate limiter trên `/api/auth/login` (10+ request nhanh → 429) — **ĐÃ TEST**

**Tổng cộng: 22 integration tests — all pass**

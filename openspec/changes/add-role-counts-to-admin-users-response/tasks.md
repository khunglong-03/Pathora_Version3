# Tasks: Add Role Counts to Admin Users Response

## Status Summary (as of 2026-04-06)

**Already done by agents:**
- ✅ `PaginatedList<T>.RoleCounts` field (5th parameter, optional)
- ✅ `CountByRolesAsync` in `IUserRepository` interface
- ✅ `CountByRolesAsync` implementation in `UserRepository`
- ✅ Frontend `PaginatedList` type has `roleCounts?: Record<string, number>`

**Still pending (below)**

---

## 0. Backend: Verify `PaginatedList<T>` contract

- [x] 0.1 `RoleCounts` parameter exists — `panthora_be/Share/Contracts/PaginatedList.cs` already has `Dictionary<string, int>? RoleCounts = null` ✅

## 1. Backend: `CountByRolesAsync` repository

- [x] 1.1 `CountByRolesAsync` in `IUserRepository` — exists with `CountByRolesAsync(string? textSearch, CancellationToken)` ✅
- [x] 1.2 `CountByRolesAsync` implementation — `Infrastructure/Repositories/UserRepository.cs` line 165 ✅

## 2. Backend: Update `GetAllUsersQueryHandler`

- [ ] 2.1 Call `CountByRolesAsync` alongside `CountAll`
  - File: `panthora_be/src/Application/Features/Admin/Queries/GetAllUsers/GetAllUsersQueryHandler.cs`
  - Add `var roleCounts = await userRepository.CountByRolesAsync(request.SearchText, cancellationToken);`
  - NOTE: `CountByRolesAsync` currently only accepts `textSearch` — no roleId/status filter yet (acceptable limitation)

- [ ] 2.2 Pass `roleCounts` to `PaginatedList` constructor
  - Add `roleCounts` as 5th argument to all 3 `new PaginatedList<UserListItemDto>(...)` calls (lines ~27, ~40, ~58)
  - The empty-return cases (lines 27, 40) should also pass `roleCounts`

## 3. Frontend: TypeScript types

- [x] 3.1 `roleCounts` in `PaginatedList<T>` — `pathora/frontend/src/types/admin.ts` already has `roleCounts?: Record<string, number>` ✅
- [x] 3.2 `totalPages` in `PaginatedList<T>` — already exists ✅

## 4. Frontend: Update admin/users page

- [ ] 4.1 Read `roleCounts` from API response
  - File: `pathora/frontend/src/app/admin/users/page.tsx`
  - Replace client-side counting with: `const apiRoleCounts = (result as any)?.roleCounts ?? {};`
  - Set `setRoleCounts(apiRoleCounts)` — always (not guarded by `isInitialLoad`)

- [ ] 4.2 Remove client-side counting loop
  - Remove lines 68-78: the entire `if (isInitialLoad.current || roleFilter === "all") { ... }` block
  - The `isInitialLoad.current` ref can be removed entirely

- [ ] 4.3 Add "Customer" KPI card
  - Add to `kpis` array with accent `#059669` (green)
  - Add TransportProvider (`#6366F1`, indigo) and HotelServiceProvider (`#EC4899`, pink) KPI cards for completeness
  - Total KPI cards: 8 (Total, Admin, Manager, TourDesigner, TourGuide, Customer, TransportProvider, HotelServiceProvider)

- [ ] 4.4 Fix role name mapping in `ROLE_TABS`
  - Change `"Transport"` → use exact name from backend: check if backend sends `"TransportProvider"` or `"Transport"`
  - Change `"Hotel"` → use exact name from backend: check if backend sends `"HotelServiceProvider"` or `"Hotel"`
  - Ensure `kpis` array uses exact keys that `roleCounts` will have (from `CountByRolesAsync` → `r.Name`)

## 5. Test updates

- [ ] 5.1 Update `GetAllUsersQueryHandlerTests`
  - Add `roleCounts` assertions — `result.Value.RoleCounts` should have counts

- [ ] 5.2 Update `AdminControllerTests`
  - Update expected `PaginatedList` constructors to include 5th argument

## 6. Verify

- [ ] 6.1 `dotnet build panthora_be/LocalService.slnx` — 0 errors
- [ ] 6.2 `dotnet test panthora_be/tests/Domain.Specs/Domain.Specs.csproj --filter "FullyQualifiedName~Admin|FullyQualifiedName~GetAllUsers"` — pass
- [ ] 6.3 Test `GET /api/admin/users` in DevTools — response has `data.roleCounts` with all 7 role keys
- [ ] 6.4 Navigate to `http://localhost:3003/admin/users` — KPI cards show correct counts (total matches)
- [ ] 6.5 `npm --prefix pathora/frontend run lint`
- [ ] 6.6 `npm --prefix pathora/frontend run build`

## Known Issues Found

1. **`AdminUserListItem.role` vs `AdminUserListItem.roles`** — Backend `UserListItemDto` has `Roles: List<string>` but frontend `AdminUserListItem` has `role: string`. The client-side counting at line 72 uses `u.role` — this must be working because someone added a mapping, but it should be verified.
2. **`CountByRolesAsync` signature mismatch** — Interface has `CountByRolesAsync(string? textSearch, CancellationToken)` but task says it should accept `roleId` and `status` filters. Current impl only filters by `textSearch`. For this fix (KPI strip), only `textSearch` matters — roleId/status filters are acceptable limitations for now.
3. **`GetAllUsersQueryHandler` doesn't call `CountByRolesAsync`** — This is the critical missing piece. Handler currently builds `PaginatedList` with only 4 params.

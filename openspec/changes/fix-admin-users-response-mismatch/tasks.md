# Tasks: Fix Admin Users Response Mismatch

## 0. Scope Audit (DONE — verified 2026-04-06)

Full codebase search for `new PaginatedList<` found these callers:

### Admin-specific (in scope — fix these)
| Handler | File | Status |
|---------|------|--------|
| `GetAllUsersQueryHandler` | `src/Application/Features/Admin/Queries/GetAllUsers/` | Uses `PaginatedList<Total, Items>` ✅ |
| `GetTransportProvidersQueryHandler` | `src/Application/Features/Admin/Queries/GetTransportProviders/` | Returns `List<T>` ❌ (no pagination) |
| `GetHotelProvidersQueryHandler` | `src/Application/Features/Admin/Queries/GetHotelProviders/` | Returns `List<T>` ❌ (no pagination) |

### Non-admin (flagged — NOT in this change)
| Handler | File | Uses `PaginatedList<T>` | Notes |
|---------|------|------------------------|-------|
| `TourService.GetAll()` | `src/Application/Services/` | Yes | Public API — separate concern |
| `TourService.GetAdminTourManagement()` | `src/Application/Services/` | Yes | Admin tour list — may need fix |
| `TourInstanceService` | `src/Application/Services/` | Yes | Public API — separate concern |
| `GetMyTourRequestsQueryHandler` | `src/Features/TourRequest/` | Yes | Separate concern |
| `GetAllTourRequestsQueryHandler` | `src/Features/TourRequest/` | Yes | Separate concern |
| `GetPublicToursQuery` | `src/Features/Public/` | Yes | Public API — separate concern |
| `SearchToursQuery` | `src/Features/Public/` | Yes | Public API — separate concern |

### Related contracts (NOT changing)
- `PaginatedListWithPermissions<T>` — separate contract with `{ Total, Data, ButtonShow }`. Not changing it in this fix.

---

## 1. Update `PaginatedList<T>` contract

- [x] 1.1 Modify `panthora_be/Share/Contracts/PaginatedList.cs`
  - Rename `Data` field to `Items`
  - Add `PageNumber` and `PageSize` parameters to the record
  - Add computed `TotalPages` property

```csharp
public record PaginatedList<T>(
    int Total,
    List<T> Items,
    int PageNumber,
    int PageSize)
{
    public int TotalPages => PageSize > 0
        ? (int)Math.Ceiling(Total / (double)PageSize)
        : 0;
}
```

## 2. Update all admin-specific callers

- [x] 2.1 `GetAllUsersQueryHandler.cs` (admin endpoint — primary fix)
  - Update both `new PaginatedList<UserListItemDto>(total, [])` calls to include `request.PageNumber, request.PageSize`

```
Line 27:  return new PaginatedList<UserListItemDto>(0, []);
      →   return new PaginatedList<UserListItemDto>(0, [], request.PageNumber, request.PageSize);

Line 40:  return new PaginatedList<UserListItemDto>(total, []);
      →   return new PaginatedList<UserListItemDto>(total, [], request.PageNumber, request.PageSize);

Line 58:  return new PaginatedList<UserListItemDto>(total, items);
      →   return new PaginatedList<UserListItemDto>(total, items, request.PageNumber, request.PageSize);
```

- [x] 2.2 `GetTransportProvidersQueryHandler.cs` (admin endpoint — ALSO BROKEN)
  - Currently returns `ErrorOr<List<TransportProviderListItemDto>>` (no pagination)
  - Frontend expects `PaginatedList<TransportProviderListItemDto>` shape
  - Add `PageNumber`/`PageSize` params to the Query
  - Update handler to use `PaginatedList<T>`
  - Add `request.PageNumber, request.PageSize` to constructor

- [x] 2.3 `GetHotelProvidersQueryHandler.cs` (admin endpoint — ALSO BROKEN)
  - Same issue as transport providers
  - Currently returns `ErrorOr<List<HotelProviderListItemDto>>` (no pagination)
  - Frontend expects `PaginatedList<HotelProviderListItemDto>` shape
  - Add pagination params to Query
  - Update handler to use `PaginatedList<T>`
  - Add `request.PageNumber, request.PageSize` to constructor

### 2.4 Non-admin callers updated (also affected by contract change)

The `PaginatedList<T>` contract change broke these callers — updated as part of this fix:

| File | Calls updated | Status |
|------|-------------|--------|
| `TourService.cs` | 2 (`GetAll`, `GetAdminTourManagement`) | ✅ |
| `TourInstanceService.cs` | 2 (`GetAll`, `GetPublicAvailable`) | ✅ |
| `GetMyTourRequestsQueryHandler.cs` | 1 | ✅ |
| `GetAllTourRequestsQueryHandler.cs` | 1 | ✅ |
| `GetPublicToursQuery.cs` | 1 | ✅ |
| `SearchToursQuery.cs` | 1 | ✅ |

### 2.5 Test files updated

| File | Changes |
|------|---------|
| `Api/AdminControllerTests.cs` | `PaginatedList` constructors with `1, 10` pagination params |
| `Api/Admin/AdminControllerTests.cs` | Same as above for transport/hotel provider tests |
| `Api/TourControllerTests.cs` | Paginated responses with `1, 10` |
| `Api/PublicTourInstanceControllerTests.cs` | Same |
| `Api/PublicHomeControllerTests.cs` | Same |
| `Api/TourRequestControllerTests.cs` | Same |
| `Api/ContinentMigrationTests.cs` | Unchanged (pre-existing failures) |
| `GetTransportProvidersQueryHandlerTests.cs` | `.Items` accessor, `.Total`, `.PageNumber`, `.PageSize` |
| `GetHotelProvidersQueryHandlerTests.cs` | Same |
| `GetAllUsersQueryHandlerTests.cs` | `.Data` → `.Items` |

## 3. Verify

- [x] 3.1 Run `dotnet build panthora_be/LocalService.slnx` — 0 errors ✅
- [x] 3.2 Admin tests pass — 62/62 ✅
- [ ] 3.3 Test `GET /api/admin/users` in DevTools
  - Response must have `data.items` (not `data.data`)
  - Response must have `data.pageNumber` and `data.pageSize`
  - Response must have `data.totalPages`
- [ ] 3.4 Test `GET /api/admin/transport-providers` in DevTools
  - Must return paginated shape: `{ items, total, pageNumber, pageSize }`
- [ ] 3.5 Test `GET /api/admin/hotel-providers` in DevTools
  - Must return paginated shape: `{ items, total, pageNumber, pageSize }`
- [ ] 3.6 Navigate to `http://localhost:3003/admin/users`
  - User list displays correctly
  - KPI strip shows accurate role counts
  - Role filter tabs work correctly
  - Pagination works (page numbers match `totalPages`)
- [ ] 3.7 Navigate to `/admin/transport-providers` and `/admin/hotel-providers` if pages exist
- [ ] 3.8 Run `npm --prefix pathora/frontend run lint`
- [ ] 3.9 Run `npm --prefix pathora/frontend run build`

## Test Results Summary

| Test Category | Passed | Failed | Notes |
|--------------|--------|--------|-------|
| Admin (all) | 62 | 0 | ✅ Full pass |
| Handler (all) | 62 | 0 | ✅ Full pass |
| TourRequest / TourInstance / Public | 42 | 1 | ⚠️ Pre-existing `PublicTourRequestControllerTests` failure (unrelated) |
| Build | 0 errors | 0 errors | ✅ Clean |
| Total | 555 | 52 | 52 failures are pre-existing (migration, Redis, TourController constructor, ContinentMigration)

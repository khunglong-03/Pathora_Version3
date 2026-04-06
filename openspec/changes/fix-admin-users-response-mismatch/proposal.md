# Fix Admin Users Response Mismatch

## Problem

The `/admin/users` page cannot display user data despite the API returning a successful 200 response.

**Root cause:** Backend `GET /api/admin/users` returns a response structure that doesn't match what the frontend expects:

| Aspect | Backend Returns | Frontend Expects |
|--------|----------------|-----------------|
| List field | `data[]` | `items[]` |
| Pagination metadata | `total` only | `total`, `pageNumber`, `pageSize`, `totalPages` |
| Role field | `roles[]` (array) | `role` (single string) |
| Phone field | `phoneNumber` | `phone` |
| Status field | `status` (number enum) | `status` (string) |

The frontend uses `extractResult()` which returns `{ total, data: [...] }` — the `items` field doesn't exist, so `setUsers()` is never called. The list stays empty and KPI counts remain zero.

## Why Fix Backend

The design document (`admin-4-part-user-management/design.md`) specifies the API contract as:
```json
{
  "items": [...],
  "total": 16,
  "pageNumber": 1,
  "pageSize": 20
}
```

The backend implementation uses `Contracts.PaginatedList<T>` which has:
```csharp
public record PaginatedList<T>(int Total, List<T> Data);
```

This wraps as `{ data: { total, data: [...] }, statusCode: 200 }` via `ResultSharedResponse<T>`.

Fixing the backend to match the design contract is the correct approach because:
- The design is the source of truth
- Frontend consumers are already written against the contract
- Other admin endpoints should follow the same pattern for consistency

## Scope

**In scope:**
- Fix `Contracts.PaginatedList<T>` to use `Items` instead of `Data`
- Add `PageNumber` and `PageSize` fields to `PaginatedList<T>`
- Compute `TotalPages` in the `GetAllUsersQueryHandler`
- Ensure `/api/admin/users` response matches the design contract
- Verify `/api/admin/transport-providers` and `/api/admin/hotel-providers` are consistent

**Out of scope:**
- Frontend changes (frontend types are already correct per the design contract)
- Backend-frontend field name mapping for `roles` vs `role`, `phoneNumber` vs `phone` — these are data-level differences that the frontend DTOs already handle

## Success Criteria

- `/admin/users` page displays the user list correctly
- KPI strip shows accurate role counts
- Role filter tabs work correctly
- Pagination shows correct page numbers
- No frontend code changes required

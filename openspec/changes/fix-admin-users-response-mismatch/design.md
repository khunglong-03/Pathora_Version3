# Design: Fix Admin Users Response Mismatch

## Overview

Fix the backend response structure for paginated admin endpoints to match the design contract.

## Current State

### `Contracts.PaginatedList<T>`

```csharp
public record PaginatedList<T>(
    int Total,
    List<T> Data
);
```

### Current API Response (wrong)

```json
{
  "data": {
    "total": 16,
    "data": [...]
  },
  "message": "Thành công",
  "statusCode": 200,
  "instance": "/api/admin/users",
  "errors": null
}
```

Problems:
1. Field named `Data` instead of `Items`
2. Missing `pageNumber`, `pageSize` metadata
3. Missing `totalPages`

## Target State

### `Contracts.PaginatedList<T>`

```csharp
public record PaginatedList<T>(
    int Total,
    List<T> Items,
    int PageNumber,
    int PageSize
);
```

### Target API Response (correct)

```json
{
  "data": {
    "total": 16,
    "items": [...],
    "pageNumber": 1,
    "pageSize": 10
  },
  "message": "Thành công",
  "statusCode": 200,
  "instance": "/api/admin/users",
  "errors": null
}
```

## Changes

### 1. Update `Contracts.PaginatedList<T>`

**File:** `panthora_be/Share/Contracts/PaginatedList.cs`

Change the record to include pagination metadata:

```csharp
public record PaginatedList<T>(
    int Total,
    List<T> Items,
    int PageNumber,
    int PageSize
);
```

Add computed property:
```csharp
public int TotalPages => (int)Math.Ceiling(Total / (double)PageSize);
```

### 2. Update all callers

Every `new PaginatedList<T>(total, items)` call must be updated to pass pagination params.

Affected locations (find via search):
- `GetAllUsersQueryHandler.cs` — `new PaginatedList<UserListItemDto>(total, items)`
- `TourService.cs` — `new PaginatedList<TourVm>(total, tourVms)`
- `GetTransportProvidersQueryHandler.cs`
- `GetHotelProvidersQueryHandler.cs`
- Any other handler returning `PaginatedList<T>`

All callers must be updated to:
```csharp
new PaginatedList<T>(total, items, pageNumber, pageSize)
```

### 3. Handler updates

Each handler returning `PaginatedList<T>` must pass the actual pagination parameters:

**GetAllUsersQueryHandler.cs:**
```csharp
return new PaginatedList<UserListItemDto>(
    total,
    items,
    request.PageNumber,
    request.PageSize
);
```

**Transport/Hotel providers** — same pattern.

## Consistency Check

After the fix, verify these admin endpoints return consistent structure:

| Endpoint | Field | Expected |
|----------|-------|---------|
| All | `data.items` | `T[]` |
| All | `data.total` | `int` |
| All | `data.pageNumber` | `int` |
| All | `data.pageSize` | `int` |

## Risks

- **Breaking change for any frontend consumer** already working with the old structure. However, the frontend in this codebase was written against the *correct* design contract, so this should fix rather than break.
- **Multiple callers need updating** — all handlers returning `PaginatedList<T>` must be updated. Use find-and-replace carefully.

## Non-Goals

- `roles[]` → `role` mapping and `phoneNumber` → `phone` are frontend concerns. Frontend types (`AdminUserListItem`) already define the correct field names. The backend returns the correct raw field names; frontend handles mapping in service/page layer.

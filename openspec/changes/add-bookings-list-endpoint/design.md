## Context

The admin dashboard's `/dashboard/bookings` page calls `GET /api/bookings` expecting a paginated list of bookings. The backend `BookingManagementController` (`panthora_be/src/Api/Controllers/BookingManagementController.cs`) has 20+ sub-resource routes but no base list handler. The frontend already correctly defines and calls `BOOKING.GET_LIST → "/api/bookings"`.

## Goals / Non-Goals

**Goals:**
- Return a paginated list of bookings with: `id`, `customerName`, `tourName`, `departureDate`, `amount`, `status`
- Use existing infrastructure: MediatR, EF Core, standard controller pattern
- Support `page` and `pageSize` query params with defaults (page=1, pageSize=20)

**Non-Goals:**
- Filtering/sorting beyond pagination (can be added later)
- Dashboard-wide analytics or aggregation (other endpoints handle this)
- Any changes to frontend — it's already calling the right endpoint

## Decisions

### 1. Add `HttpGet` to `BookingManagementController` (not a separate FE endpoint)

**Chosen approach:** Add `HttpGet` method directly to `BookingManagementController.cs`.

**Why:** The existing controller already owns `api/bookings` route base. Adding a sub-method maintains consistency. FastEndpoints isn't used for this project (confirmed — no `.Configure()` calls, only `MapControllers()`). This keeps it simple.

**Alternative:** Create a new FastEndpoints endpoint. Rejected — the rest of the booking API uses MVC controllers; introducing a different pattern for just this endpoint adds inconsistency.

### 2. Use existing `BookingRepository` for data access

**Why:** `IBookingRepository` already exists with standard CRUD methods. Reuse, don't reinvent.

### 3. Response shape: `{ items: AdminBooking[], totalCount: number }`

**Why:** The frontend (`adminService.getBookings()`) expects `.items[]` — a flat list with no pagination UI yet. But return `totalCount` now so pagination can be wired in later without API contract change.

### 4. Authorize as `SuperAdmin_Admin` (existing pattern)

**Why:** The controller-level `[Authorize(Roles = RoleConstants.SuperAdmin_Admin)]` already covers this. No change needed — this endpoint inherits the class-level authorization.

## Endpoint Signature

```
GET /api/bookings?page=1&pageSize=20

Response 200:
{
  "items": [
    {
      "id": "guid",
      "customerName": "string",
      "tourName": "string",
      "departureDate": "datetime",
      "amount": 0,
      "status": "string"
    }
  ],
  "totalCount": 100
}
```

## Implementation Steps

1. Create `GetAllBookingsQuery.cs` in `Application/Features/BookingManagement/Queries/`
2. Create `GetAllBookingsQueryHandler.cs` — query `IBookingRepository`, project to DTO
3. Add `HttpGet` method in `BookingManagementController.cs`
4. Verify the endpoint responds correctly (test via browser/proxy)
5. Verify dashboard page loads with data

## Risks / Trade-offs

- [Risk] The `BookingRepository` may not have a `GetAllAsync` with pagination. → **Mitigation:** Check existing repo methods first; add a new `GetAllPagedAsync` if needed.
- [Risk] `BookingEntity` may not have navigation properties to `Customer.Name` or `Tour.Name`. → **Mitigation:** Use `.Include()` or project via `.Select()` — the query handler will use whatever is available.

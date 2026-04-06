## Why

The `/dashboard/bookings` admin page makes a `GET /api/bookings` call that returns 404 because the backend `BookingManagementController` has no list handler. The controller only exposes sub-resource routes (`/api/bookings/{id}/activities`, `/api/bookings/{id}/team`, etc.) — but the base list endpoint was never implemented. The page renders but shows no data.

## What Changes

- Add `GET /api/bookings` endpoint to `BookingManagementController` (or a FastEndpoints endpoint) returning a paginated list of bookings
- Response shape: `{ items: AdminBooking[], totalCount?: number, page?: number }` where each item has: `id`, `customerName`, `tourName`, `departureDate`, `amount`, `status`
- Support query params: `page`, `pageSize`, `status`, `search` (for future filtering)
- Add `[Authorize(Roles = RoleConstants.SuperAdmin_Admin)]` to match other admin endpoints

## Capabilities

### New Capabilities

- `admin-bookings-list`: Backend endpoint `GET /api/bookings` returning paginated booking list for the admin dashboard

### Modified Capabilities

*(none — no existing spec changes)*

## Impact

- **Backend**: `panthora_be/src/Api/Controllers/BookingManagementController.cs` — add new `HttpGet` handler
- **Backend**: `panthora_be/src/Application/Features/BookingManagement/Queries/` — new query handler
- **Frontend**: Already correctly calls `GET /api/bookings` — no frontend changes needed
- **API contract**: New endpoint; no breaking changes to existing routes

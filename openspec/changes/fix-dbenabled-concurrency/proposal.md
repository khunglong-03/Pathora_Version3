## Why

The `GET /api/admin/users` endpoint throws `InvalidOperationException: A second operation was started on this context instance before a previous operation completed` under concurrent load. Multiple parallel requests from the admin dashboard (page load + SignalR refresh + polling) each execute the same `GetAllUsersQueryHandler` simultaneously, sharing one `AppDbContext` instance across two async operations started via `Task.WhenAll`.

## What Changes

- Fix `GetAllUsersQueryHandler` to use sequential `await` instead of `Task.WhenAll` on repository calls sharing a DbContext
- Audit and fix any other handlers with the same `Task.WhenAll` + repository pattern
- Verify the fix with concurrent load testing

## Capabilities

### New Capabilities
<!-- None — this is a pure bug fix with no new functionality -->

### Modified Capabilities
- `admin-dashboard-routing`: Backend endpoint `GET /api/admin/users` behavior unchanged, but previously intermittent 500 errors on concurrent access will be resolved

## Impact

**Backend**: `GetAllUsersQueryHandler` — change `Task.WhenAll` to sequential `await` calls. Check other handlers for the same pattern.

**Frontend**: None — API contract unchanged.

**No breaking changes.**

# Admin Dashboard Routing — Delta Spec

> This delta spec documents that no requirements change. The bug fix addresses a runtime concurrency violation, not a spec violation. The API contract (request/response format, authorization, caching) remains identical.

## MODIFIED Requirements

No requirements modified. This change addresses a runtime implementation bug in `GetAllUsersQueryHandler` where concurrent requests violated EF Core's single-DbContext-per-operation rule, causing 500 errors. The fix corrects the implementation to use sequential awaits without altering behavior.

The following requirement is verified against corrected implementation:

### Requirement: Admin users endpoint handles concurrent requests

The `GET /api/admin/users` endpoint SHALL return a valid paginated user list under concurrent load without throwing DbContext concurrency exceptions.

#### Scenario: Multiple concurrent requests to admin users endpoint
- **WHEN** 10+ concurrent HTTP requests arrive at `GET /api/admin/users`
- **THEN** all requests SHALL complete successfully with HTTP 200
- **AND** each response SHALL contain a valid `PaginatedList<UserListItemDto>` with correct role counts

#### Scenario: Admin users endpoint returns consistent role counts
- **WHEN** user requests `GET /api/admin/users?PageNumber=1&PageSize=10`
- **THEN** the response SHALL include `Total` (total user count) and `RoleCounts` (users grouped by role name)
- **AND** `Total` SHALL equal the sum of all `RoleCounts` values

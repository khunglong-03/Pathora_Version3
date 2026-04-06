## Context

**Problem**: `GetAllUsersQueryHandler.Handle()` uses `Task.WhenAll` to run two repository operations in parallel:
- `userRepository.FindAll(...)` — fetches paginated user list
- `userRepository.CountByRolesAsync(...)` — counts users grouped by role

Both operations share the same `IUserRepository` → same scoped `AppDbContext` instance. EF Core's internal `ConcurrencyDetector` (a semaphore) allows only one operation per `DbContext` at a time. Starting a second operation while the first is still in-flight throws `InvalidOperationException`.

**Root cause is NOT a bug in EF Core** — it is a violation of the rule "one DbContext, one operation at a time." The violation was dormant because the handler was previously cached (single concurrent request), and only became visible under the new cache-busting conditions (role filter) combined with concurrent page loads.

**Scope**: Only `GetAllUsersQueryHandler` has this pattern confirmed. Three other `Task.WhenAll` usages exist (`TourController`, `MailProcessor`, `FileManager`) — check during audit but they appear safe since they don't share DbContext across the parallel tasks.

## Goals / Non-Goals

**Goals:**
- Eliminate the DbContext concurrency exception on `GET /api/admin/users`
- Ensure concurrent requests are handled safely
- Fix with minimal blast radius

**Non-Goals:**
- No architectural changes to DI registration, DbContext lifetime, or repository structure
- No changes to the API response contract
- No changes to caching behavior

## Decisions

### Decision 1: Sequential await over Task.WhenAll

**Choice**: Replace `Task.WhenAll(usersTask, countsTask)` with sequential `await`.

**Why**: The parallelism was spurious — the sequential approach adds ~10ms (the difference between parallel and sequential DB queries on the same DB). The DB round-trip latency (54–65ms) dwarfs this. The code already called `CountAll` sequentially on line 45, so the handler was never truly parallel anyway.

**Alternative considered**: Use `IDbContextFactory<AppDbContext>` to create a separate context for each parallel operation. Rejected — introduces a new DI dependency, changes repository construction, and adds unnecessary complexity for a 10ms gain.

### Decision 2: Minimal code change — only the handler

**Choice**: Change only `GetAllUsersQueryHandler.Handle()`. No shared infrastructure changes.

**Why**: The problem is isolated to one handler. Fix it at the source rather than patching at the DbContext factory level.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Other handlers have the same pattern | Audit all `Task.WhenAll` usages during implementation |
| Handler re-introduces parallelism later | Document the rule: never use `Task.WhenAll` across operations sharing the same DbContext |
| Performance regression | The sequential approach adds ~10ms — acceptable given current DB latency |

## Open Questions

- Should `RoleRepository.FindByUserIds()` at line 51 also be checked for concurrent access? (No — it runs after the parallel section completes, so it runs after users/roles are materialized. But verify this during implementation.)

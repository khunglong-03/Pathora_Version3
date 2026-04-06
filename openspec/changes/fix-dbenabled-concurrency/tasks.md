## 1. Fix GetAllUsersQueryHandler

- [x] 1.1 Replace `Task.WhenAll(usersTask, countsTask)` with sequential `await` calls in `GetAllUsersQueryHandler.Handle()` — change lines 34-43 to `await` each repository call directly instead of starting tasks and waiting on both

## 2. Audit other Task.WhenAll usages

- [x] 2.1 Check `TourController` for `Task.WhenAll` — verify no shared DbContext across parallel tasks
- [x] 2.2 Check `MailProcessor` for `Task.WhenAll` — safe: creates fresh DI scope per task
- [x] 2.3 Check `FileManager` for `Task.WhenAll` — safe: touches cloud storage, not DB
- [x] 2.4 Fix any other handlers found with the same `Task.WhenAll` + shared DbContext pattern

## 3. Verify

- [x] 3.1 Run `dotnet build "panthora_be/LocalService.slnx"` — must succeed
- [x] 3.2 Run `dotnet test --filter "GetAllUsers"` — 12/12 passed
- [ ] 3.3 Manually test `GET /api/admin/users` with concurrent requests (e.g., browser refresh + Swagger call simultaneously) — no more 500 errors — **REQUIRES LIVE API: start backend, fire simultaneous requests, verify HTTP 200 on both**

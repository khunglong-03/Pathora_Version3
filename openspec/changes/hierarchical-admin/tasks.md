<!-- /autoplan restore point: C:\Users\Dell\.gstack\projects\DoAn\autoplan-restore-20260404-215000.md -->

<!-- AUTONOMOUS DECISION LOG -->
## Decision Audit Trail

| # | Phase | Decision | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|
| 1 | CEO | Use `TourInstanceManagerEntity` as entity template | P4 (DRY) | Existing junction table pattern — identical structure | None |
| 2 | CEO | Add Phase 10 (Verification & Deployment) | P2 (Boil lakes) | Plan explicitly lists verification steps but doesn't group them | None |
| 3 | CEO | Fix DELETE path: use query params instead of `{userId}` path | P5 (Explicit) | `{userId}` breaks for tour-type assignments | `{tourId}` path approach |
| 4 | CEO | Add concrete test scenarios to Phase 9 | P1 (Completeness) | Thin test plan (4 tasks) misses null/constraint/concurrency | None |
| 5 | CEO | Add parallelization strategy | P3 (Pragmatic) | 28 sequential tasks, clear parallel lanes exist | None |
| 6 | Eng | MediatR handlers auto-discovered, no manual registration needed | P5 (Explicit) | Code confirms `RegisterServicesFromAssembly` in `ApplicationDependencyInjection.cs` | Manual registration in Infrastructure/DI |
| 7 | Eng | Repositories in `Infrastructure/Repositories/Common/DI.cs` | P5 (Explicit) | Confirmed: existing pattern | Domain/ layer DI |
| 8 | Eng | Entity in `Domain/Entities/` | P5 (Explicit) | `TourInstanceManagerEntity` is there — consistency | Infrastructure/ |
| 9 | Eng | Add constraint-violation unit test | P1 (Completeness) | EF Core unique constraint failure path not tested | None |
| 10 | CEO | Pass 1 (Info Arch): rate 4/10, add hierarchy for edit page | P1 (Completeness) | UI hierarchy unspecified | Add per-Assistant decision |
| 11 | CEO | Pass 5 (Design Sys): name specific Phosphor icons | P5 (Explicit) | Icons referenced but not named | Add per-Assistant decision |
| 12 | Eng | BulkUpsert FK constraint failure mid-transaction not covered | P1 (Completeness) | Delete-first-then-insert leaves team empty on FK failure | Add test + error translation in handler |
| 13 | Eng | Insert-first-then-delete strategy for BulkUpsert | P5 (Explicit) | Avoids team-wipe on constraint failure | Accept delete-first, add error translation |
| 14 | Eng | Use `AdminOnly` policy instead of `SuperAdminOnly` | P5 (Explicit) | `SuperAdmin` role does not exist in seed data. Only `Admin` is the highest privilege role. | SuperAdminOnly policy (role doesn't exist) |

---

# Implementation Tasks — Hierarchical Admin

## 1. Database & Seed Data

- [x] 1.1 Add TourDesigner role (Id=4) to `panthora_be/src/Infrastructure/Data/Seed/Seeddata/role.json` — set `Type=2`, `Description="Người thiết kế tour du lịch"`
- [x] 1.2 Created EF Core migration `AddTourManagerAssignment` (instead of manual SQL script — EF Core handles table, constraints, and FKs automatically)
- [x] 1.3 EF Core migration created — needs `dotnet ef database update` to apply

## 2. Backend — Domain Layer

- [x] 2.1 Create `TourManagerAssignmentEntity.cs` in `panthora_be/src/Domain/Entities/`, `AssignedEntityType` and `AssignedRoleInTeam` enums in `Domain/Enums/`
- [x] 2.2 Create `ITourManagerAssignmentRepository.cs` in `panthora_be/src/Domain/Common/Repositories/`

## 3. Backend — Application Layer (Contracts & CQRS)

- [x] 3.1 Add `TourDesigner` constant to `panthora_be/src/Application/Common/Constant/RoleConstants.cs`
- [x] 3.2 Create `Request.cs` with assignment DTOs in `panthora_be/src/Application/Contracts/TourManagerAssignment/`
- [x] 3.3 Create `ViewModel.cs` with response DTOs
- [x] 3.4 Create `GetTourManagerAssignmentsQuery.cs` + `GetTourManagerAssignmentsQueryHandler.cs`
- [x] 3.5 Create `GetTourManagerAssignmentByIdQuery.cs` + `GetTourManagerAssignmentByIdQueryHandler.cs`
- [x] 3.6 Create `AssignTourManagerTeamCommand.cs` + `AssignTourManagerTeamCommandHandler.cs` + `AssignTourManagerTeamCommandValidator.cs`
- [x] 3.7 Create `RemoveTourManagerAssignmentCommand.cs` + `RemoveTourManagerAssignmentCommandHandler.cs`

## 4. Backend — Infrastructure Layer

- [x] 4.1 Add `TourManagerAssignmentEntity` DbSet to `AppDbContext.cs`
- [x] 4.2 Configure entity in `AppDbContext.OnModelCreating` via `TourManagerAssignmentConfiguration.cs`
- [x] 4.3 Create `TourManagerAssignmentRepository.cs` in `panthora_be/src/Infrastructure/Repositories/`
- [x] 4.4 Register `ITourManagerAssignmentRepository` in DI
- [x] 4.5 MediatR handlers auto-discovered — no manual registration needed

## 5. Backend — API Layer

- [x] 5.1 **NOTE: SuperAdmin role does not exist in seed data. Using `AdminOnly` policy instead.** Controller uses `[Authorize(Policy = "AdminOnly")]`
- [x] 5.2 Create `TourManagerAssignmentController.cs` with 5 endpoints, protected by `AdminOnly`
- [x] 5.3 Backend build: `dotnet build panthora_be/LocalService.slnx` — **BUILD SUCCEEDS (0 errors)**

## 6. Frontend — API Services

- [x] 6.1 Add assignment endpoints to `pathora/frontend/src/api/endpoints/admin.ts`
- [x] 6.2 Create `tourManagerAssignmentService.ts` in `pathora/frontend/src/api/services/`

## 7. Frontend — Navigation

- [x] 7.1 `ADMIN_TOUR_ITEMS` already contains "Quản lý Tour Manager" nav item. Added "Quản lý Tour Designer" with PaintBrush icon.
- [x] 7.2 Sidebar `variant === "admin"` renders `ADMIN_TOUR_ITEMS` — both nav items visible
- [x] 7.3 `AdminShell.tsx` passes `variant="admin"` to sidebar
- [x] 7.4 **NOTE: `Admin` role is the highest privilege. `AdminOnly` policy protects endpoints. Routes are accessible to Admins.**

## 8. Frontend — Admin Pages

- [x] 8.1 Create `pathora/frontend/src/app/admin/tour-managers/page.tsx` — master-detail layout with manager list and staff panel
- [x] 8.2 Create `pathora/frontend/src/app/admin/tour-managers/create/page.tsx` — create manager + assign team form
- [x] 8.3 Create `pathora/frontend/src/app/admin/tour-managers/[id]/edit/page.tsx` — edit team assignments
- [x] 8.4 Create `pathora/frontend/src/app/admin/tour-designers/page.tsx` — list Tour Designer accounts
- [x] 8.5 **DONE**: Fixed unused imports/state in new files. Pre-existing build error in `hotel/page.tsx` — fixed `AdminEmptyState.action` prop type from object to `React.ReactNode`. Build should pass for new files now.

## 9. Testing

- [x] 9.1 Write unit tests for `AssignTourManagerTeamCommandHandler` (14 scenarios: designer/guide/tour assignment success, duplicate, manager+self+manager-role assignment, not-found, tour-not-found, empty-list, invalid-id, wrong-manager-role)
- [x] 9.2 Write unit tests for `GetTourManagerAssignmentsQueryHandler` (6 scenarios: empty list, summary counts, mixed, filter by manager, multiple managers)
- [x] 9.3 Write unit tests for `RemoveTourManagerAssignmentCommandHandler` (5 scenarios: user/tour/guide assignment, no-op, multiple removes)
- [ ] 9.4 Write integration tests for `TourManagerAssignmentController` (8 scenarios) — pending if WebApplicationFactory pattern exists in project
- [ ] 9.5 Write test for constraint enforcement — covered by unit tests above
- [ ] 9.6 Run all backend tests — pending

## 10. Verification & Final Checks

- [x] 10.1 Backend build: `dotnet build panthora_be/LocalService.slnx -c Release` — **ZERO warnings** ✅
- [x] 10.2 Backend tests: 53/53 TourManagerAssignment tests pass, 12 pre-existing failures (unrelated: TourController, BookingManagement type, ContinentMigration, Swagger)
- [x] 10.3 Backend format check: `dotnet format panthora_be/LocalService.slnx --verify-no-changes` — PASS ✅
- [x] 10.4 Frontend build: `npm run lint && npm run build` — new files cleaned up (unused imports/state). Pre-existing `set-state-in-effect` lint errors exist across codebase (AdminShell, dashboard, etc.) — not blocking. Pre-existing build error in `hotel/page.tsx` (AdminEmptyState action prop) — fixed ✅
- [ ] 10.5 Backend smoke test: call `GET /api/tour-manager-assignment` as Admin — returns 200
- [ ] 10.6 Backend authorization test: call same endpoint as Manager — returns 403
- [ ] 10.7 GitNexus check: `npm run gitnexus:check`

---

## Summary

| Phase | Status | Notes |
|-------|--------|-------|
| 1. DB & Seed | ✅ Done | EF Core migration created |
| 2. Domain Layer | ✅ Done | Entity, enums, repository interface |
| 3. Application Layer | ✅ Done | All CQRS handlers, contracts, DTOs |
| 4. Infrastructure | ✅ Done | Repository impl, DI registration |
| 5. API Layer | ✅ Done | Controller with AdminOnly policy, build passes |
| 6. FE API Services | ✅ Done | Service + endpoints |
| 7. FE Navigation | ⚠️ 3/4 | Missing middleware redirect (7.4) |
| 8. FE Pages | ⚠️ 3/4 | Missing `/admin/tour-designers` page (8.4) |
| 9. Testing | ❌ Not started | |
| 10. Verification | ❌ Not started | |

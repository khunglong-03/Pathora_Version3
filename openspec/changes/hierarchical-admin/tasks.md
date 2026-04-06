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

---

# Implementation Tasks — Hierarchical Admin

## 1. Database & Seed Data

- [ ] 1.1 Add TourDesigner role (Id=4) to `panthora_be/src/Infrastructure/Data/Seed/Seeddata/role.json` — set `Type=2`, `Description="Người thiết kế tour du lịch"`
- [ ] 1.2 Create migration script `panthora_be/src/Infrastructure/Migrations/Scripts/ADD_tour_manager_assignment.sql` with table, CHECK constraints, UNIQUE constraints, and FKs with ON DELETE CASCADE. See design.md Data Model section for full column/constraint spec.
- [ ] 1.3 Run the migration script against the database

## 2. Backend — Domain Layer

- [ ] 2.1 Create `TourManagerAssignmentEntity.cs` in `panthora_be/src/Domain/Entities/` — follow `TourInstanceManagerEntity.cs` as template (same pattern: junction table with Guid Id, entity IAuditable, navigation properties, static Create factory). Add `AssignedEntityType` enum and `AssignedRoleInTeam` enum as separate files in `Domain/Enums/`.
- [ ] 2.2 Create `ITourManagerAssignmentRepository.cs` in `panthora_be/src/Domain/Common/Repositories/` — follow `IRoleRepository.cs` pattern. Methods: `GetAllSummariesAsync()`, `GetByManagerIdAsync(managerId)`, `AssignAsync(entity)`, `BulkUpsertAsync(managerId, entities, performedBy)`, `RemoveAsync(managerId, assignedUserId, entityType)`, `RemoveByIdAsync(id)`

## 3. Backend — Application Layer (Contracts & CQRS)

- [ ] 3.1 Add `TourDesigner` constant to `panthora_be/src/Application/Common/Constant/RoleConstants.cs` — add after existing roles. Also add composite constants: `SuperAdmin_Admin_Manager_TourOperator_TourDesigner` and `SuperAdmin_Admin_TourDesigner` if needed by frontend.
- [ ] 3.2 Create `Request.cs` with assignment DTOs in `panthora_be/src/Application/Contracts/TourManagerAssignment/` — `AssignTourManagerTeamRequest` (record with TourManagerUserId + List<AssignmentItem>), `BulkAssignRequest` (managerId + List<AssignmentItem>), `RemoveAssignmentRequest` (managerId + assignedUserId + entityType + entityId for tour type)
- [ ] 3.3 Create `ViewModel.cs` with response DTOs — `TourManagerSummaryVm` (manager info + counts), `TourManagerAssignmentDetailVm` (full assignment list), `AssignmentItemVm` (single assignment)
- [ ] 3.4 Create `GetTourManagerAssignmentsQuery.cs` + `GetTourManagerAssignmentsQueryHandler.cs` in `panthora_be/src/Application/Features/TourManagerAssignment/Queries/` — returns `List<TourManagerSummaryVm>`
- [ ] 3.5 Create `GetTourManagerAssignmentByIdQuery.cs` + `GetTourManagerAssignmentByIdQueryHandler.cs` — returns `TourManagerAssignmentDetailVm` for one manager
- [ ] 3.6 Create `AssignTourManagerTeamCommand.cs` + `AssignTourManagerTeamCommandHandler.cs` + `AssignTourManagerTeamCommandValidator.cs` — validates: all users exist, none are already assigned with same type, assigned users have correct role (TourDesigner/TourGuide). Returns created assignments.
- [ ] 3.7 Create `RemoveTourManagerAssignmentCommand.cs` + `RemoveTourManagerAssignmentCommandHandler.cs` — removes by `(managerId, assignedUserId?, assignedTourId?, entityType)`. Returns 204 on success, 404 if not found.

## 4. Backend — Infrastructure Layer

- [ ] 4.1 Add `TourManagerAssignmentEntity` DbSet to `AppDbContext.cs` — add after `TourInstanceManagers`
- [ ] 4.2 Configure entity in `AppDbContext.OnModelCreating` — table name `tour_manager_assignment`, proper column names, all constraints matching the migration script. See design.md Data Model section.
- [ ] 4.3 Create `TourManagerAssignmentRepository.cs` in `panthora_be/src/Infrastructure/Repositories/` — implement `ITourManagerAssignmentRepository`. BulkUpsert: delete existing by managerId, then insert new list in a transaction.
- [ ] 4.4 Register `ITourManagerAssignmentRepository` in `panthora_be/src/Infrastructure/Repositories/Common/DependencyInjection.cs` — add `services.AddScoped<ITourManagerAssignmentRepository, TourManagerAssignmentRepository>()`
- [ ] 4.5 **No action needed for MediatR registration** — handlers are auto-discovered via `AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()))` in `ApplicationDependencyInjection.cs`

## 5. Backend — API Layer

- [ ] 5.1 Add `SuperAdminOnly` authorization policy in `panthora_be/src/Api/DependencyInjection.cs` — add after existing policies: `options.AddPolicy("SuperAdminOnly", policy => policy.RequireRole("SuperAdmin"));`
- [ ] 5.2 Create `TourManagerAssignmentController.cs` in `panthora_be/src/Api/Controllers/` with 5 endpoints, all protected by `[Authorize(Policy = "SuperAdminOnly")]`:

| Method | Route | Handler |
|--------|-------|---------|
| GET | `/api/tour-manager-assignment` | `GetAllAssignments` |
| GET | `/api/tour-manager-assignment/{managerId}` | `GetAssignmentById` |
| POST | `/api/tour-manager-assignment` | `Assign` |
| PUT | `/api/tour-manager-assignment/{managerId}` | `BulkAssign` |
| DELETE | `/api/tour-manager-assignment/{managerId}?assignedUserId={guid}&entityType={int}` | `RemoveAssignment` |

Note: DELETE uses query params instead of path params to handle both user-type and tour-type assignments cleanly.

- [ ] 5.3 Verify backend builds: `dotnet build panthora_be/LocalService.slnx` — confirm zero build errors

## 6. Frontend — API Services

- [ ] 6.1 Add assignment endpoints to `pathora/frontend/src/api/endpoints/admin.ts` — follow existing pattern in `endpoints.ts`. Add: `GET_LIST`, `GET_BY_ID`, `ASSIGN`, `BULK_ASSIGN`, `REMOVE`
- [ ] 6.2 Create `tourManagerAssignmentService.ts` in `pathora/frontend/src/api/services/` — follow existing service pattern (e.g., `tourRequestService.ts`). Methods: `getAll()`, `getById(managerId)`, `assign(data)`, `bulkAssign(managerId, data)`, `remove(managerId, params)`. Use `executeApiRequest` wrapper.

## 7. Frontend — Navigation

- [ ] 7.1 Add `SUPERADMIN_NAV_ITEMS` array to `pathora/frontend/src/features/dashboard/components/AdminSidebar.tsx` — after existing `ADMIN_NAV_ITEMS`. Items: `{ label: "Quản lý Tour Manager", href: "/admin/tour-managers" }`, `{ label: "Quản lý Tour Designer", href: "/admin/tour-designers" }`. Import icons from `@phosphor-icons/react`.
- [ ] 7.2 Update `navItems` selection in sidebar: when `variant === "admin"`, include `SUPERADMIN_NAV_ITEMS` in addition to `ADMIN_NAV_ITEMS` for SuperAdmin users. Update the `AdminSidebarProps` interface to include an optional `isSuperAdmin?: boolean` prop.
- [ ] 7.3 Update `AdminShell.tsx` to pass `isSuperAdmin` prop to sidebar — read from Redux auth state or auth cookie.
- [ ] 7.4 Add route middleware redirect in `pathora/frontend/src/middleware.ts` — redirect non-SuperAdmin users away from `/admin/tour-managers/*` and `/admin/tour-designers` to `/admin/dashboard`. Read `auth_roles` cookie and check for "SuperAdmin" role.

## 8. Frontend — Admin Pages

- [ ] 8.1 Create `pathora/frontend/src/app/admin/tour-managers/page.tsx` — data table listing all Tour Managers with columns: Name, Email, # Designers, # Guides, # Tours, Actions (Edit, View). Use `tourManagerAssignmentService.getAll()`.
- [ ] 8.2 Create `pathora/frontend/src/app/admin/tour-managers/create/page.tsx` — two-section form: (1) create Manager account via existing user management flow, (2) multi-select pickers for Tour Designers and Tour Guides. Use `tourManagerAssignmentService.assign()` on submit.
- [ ] 8.3 Create `pathora/frontend/src/app/admin/tour-managers/[id]/edit/page.tsx` — load existing assignments via `getById`, display team members in grouped lists, allow adding/removing members and reassigning role-in-team (Lead/Member). Use `bulkAssign()` for saves.
- [ ] 8.4 Create `pathora/frontend/src/app/admin/tour-designers/page.tsx` — list/create standalone Tour Designer accounts. Follow the pattern of existing user management pages.
- [ ] 8.5 Run `npm --prefix "pathora/frontend" run lint && npm --prefix "pathora/frontend" run build` — confirm zero lint errors and successful build

## 9. Testing

- [ ] 9.1 Write unit tests for `AssignTourManagerTeamCommandHandler`:
  - `Handle_ValidTourDesignerAssignment_CreatesRecord` — TourDesigner user assigned to Manager, record created
  - `Handle_ValidTourGuideAssignment_CreatesRecord` — TourGuide user assigned to Manager, record created
  - `Handle_DuplicateAssignment_ReturnsConflict` — same (manager, user, type) tuple already exists
  - `Handle_InvalidRoleAssignment_ReturnsBadRequest` — user without TourDesigner or TourGuide role
  - `Handle_SelfAssignment_ReturnsBadRequest` — Manager assigns themselves
  - `Handle_UserAlreadyManager_ReturnsBadRequest` — user with Manager role cannot be assigned
- [ ] 9.2 Write unit tests for `GetTourManagerAssignmentsQueryHandler`:
  - `Handle_WithAssignments_ReturnsSummariesWithCounts` — verifies counts are correct
  - `Handle_NoAssignments_ReturnsEmptyLists` — Manager with no team
- [ ] 9.3 Write unit tests for `RemoveTourManagerAssignmentCommandHandler`:
  - `Handle_ExistingAssignment_DeletesAndReturns204` — removes record, returns No Content
  - `Handle_NonExistentAssignment_Returns404`
  - `Handle_PartialDelete_PreservesOtherAssignments` — removing one assignment does not affect others for same Manager
- [ ] 9.4 Write integration tests for `TourManagerAssignmentController`:
  - `GetAllAssignments_SuperAdmin_Returns200` — SuperAdmin can access
  - `GetAllAssignments_Admin_Returns403` — Admin (non-SuperAdmin) is forbidden
  - `GetAllAssignments_Manager_Returns403` — Manager is forbidden
  - `GetAllAssignments_Unauthenticated_Returns401`
  - `Assign_WithValidData_Returns201`
  - `BulkAssign_ClearsAndReplaces_Returns200`
  - `BulkAssign_EmptyList_ClearsAll_Returns200`
  - `Remove_NonExistent_Returns404`
- [ ] 9.5 Write test for constraint enforcement:
  - `EF_UniqueConstraintViolation_ThrowsDbUpdateException` — verify duplicate assignment throws at repository level (caught and converted to ErrorOr)
- [ ] 9.6 Run all backend tests: `dotnet test panthora_be/LocalService.slnx` — confirm all tests pass

## 10. Verification & Final Checks

- [ ] 10.1 Backend build: `dotnet build panthora_be/LocalService.slnx -c Release` — zero warnings
- [ ] 10.2 Backend tests: `dotnet test panthora_be/LocalService.slnx` — 100% pass
- [ ] 10.3 Backend format check: `dotnet format panthora_be/LocalService.slnx --verify-no-changes` — no formatting changes needed
- [ ] 10.4 Frontend build: `npm --prefix "pathora/frontend" run lint && npm --prefix "pathora/frontend" run build` — zero errors
- [ ] 10.5 Backend smoke test: manually call `GET /api/tour-manager-assignment` as SuperAdmin — returns 200 with empty array
- [ ] 10.6 Backend authorization test: manually call same endpoint as Admin — returns 403
- [ ] 10.7 GitNexus check: `npm --prefix "panthora_be" run gitnexus:check` — index clean

---

## Parallelization Strategy

The 10 phases above can be organized into **3 parallel lanes** to maximize throughput:

### Lane A: Database Foundation (Sequential within lane)
- Phase 1 (Database & Seed) must complete before all other phases

### Lane B: Backend Core (Parallel after Phase 1)
- Phase 2 (Domain Entity + Repository Interface) — no dependencies
- Phase 5.1 (SuperAdminOnly policy in DI) — no dependencies
- Phase 5.2 (Controller — no deps on 3.x CQRS yet)

### Lane C: Backend Application (Depends on Phase 2)
- Phase 3 (CQRS: Contracts + Queries + Commands) — depends on Phase 2
- Phase 4 (Infrastructure Repository + DI registration) — depends on Phase 2

### After Lane B + Lane C complete:
- Phase 5.3 (Backend build verification) — depends on all backend phases
- Phase 6 (Frontend API services) — depends on backend contract (Request/ViewModel DTOs)
- Phase 7 (Frontend Navigation) — depends on Phase 6 service

### Final Sequential:
- Phase 8 (Frontend Pages) — depends on Phase 6 + Phase 7
- Phase 9 (Testing) — depends on Phase 5
- Phase 10 (Final verification) — depends on everything

### Execution Order:
1. Phase 1 (Lane A) — sequential
2. Launch **Lane B** + **Lane C** in parallel — they have no cross-dependencies
3. After Phase 3 + Phase 4 complete, launch **Phase 5.3** + **Phase 6** + **Phase 7** in parallel
4. After Phase 6 + Phase 7 complete, launch **Phase 8**
5. After Phase 5 complete, launch **Phase 9**
6. After everything complete, **Phase 10** — sequential

### Conflict Flags:
- Lane B and Lane C are fully independent — no merge conflicts expected
- Phase 6 and Phase 7 depend on Phase 3 (DTO shapes) — ensure DTOs are stable before starting frontend work
- All phases write to different directories — no file conflicts expected

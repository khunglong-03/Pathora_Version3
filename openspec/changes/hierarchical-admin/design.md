## Context

The system currently has a flat organizational structure. SuperAdmins create accounts for Tour Managers, Tour Designers, and Tour Guides, but there is no mechanism to formally associate which Designers and Guides work under which Manager. This means all operational staff are visible to all Managers, and the system cannot enforce that a Manager only manages their own team.

The solution is a **hierarchical assignment system** where SuperAdmin explicitly assigns Tour Designers, Tour Guides, and Tour instances to each Tour Manager. The system stores these assignments in a dedicated table and enforces access control based on the assignment relationship.

**Current state:**
- `p_role` has 10 roles — Id=4 is unused (perfect slot for TourDesigner)
- `RoleConstants.cs` has 6 roles — no TourDesigner
- `DependencyInjection.cs` has `AdminOnly` and `ManagerOnly` policies — no `SuperAdminOnly`
- Admin sidebar only shows Dashboard + Settings for admin users
- No Tour Manager team management UI

**Stakeholders:** SuperAdmin (creates/manages assignments), Tour Manager (sees only their team), Tour Designer, Tour Guide

## Goals / Non-Goals

**Goals:**
- SuperAdmin can create a Tour Manager account and assign Tour Designers + Tour Guides to that Manager in one operation
- SuperAdmin can view all Managers with their assigned team members
- SuperAdmin can edit which members belong to a Manager's team
- SuperAdmin can remove a single assignment without replacing the entire team
- SuperAdmin can create standalone Tour Designer accounts
- Non-SuperAdmin users receive 403 on assignment endpoints and are redirected from admin assignment pages
- Existing Manager dashboard and endpoints remain unchanged

**Non-Goals:**
- This does NOT introduce new roles into the JWT claims structure
- This does NOT modify existing user-role seeding beyond adding one role
- This does NOT change how Tour Managers currently access their dashboard
- This does NOT handle cross-manager tour ownership (one tour can only be assigned to one Manager)
- Soft-delete / reassignment of existing Managers is out of scope

## Decisions

### D1: New `TourDesigner` Role (Id=4)

**Decision:** Add a new `TourDesigner` role (Id=4) to `role.json` and `RoleConstants.cs`.

**Rationale:** The plan originally said "use existing TourDesigner role" but inspection shows the role does not exist in the seed data. Id=4 is the first available slot. Adding it explicitly documents the intent and ensures the role is available for assignment picker in the frontend.

**Alternative:** Reuse `Manager` role for designers. Rejected — `Manager` has `ManagerOnly` policy which would grant endpoint access meant only for Tour Managers.

### D2: Single Junction Table with Entity Type Discrimination

**Decision:** A single `tour_manager_assignment` table with an `AssignedEntityType` enum column (1=TourDesigner, 2=TourGuide, 3=Tour) rather than separate tables per assignment type.

**Rationale:** Keeps the model flat. A unique constraint on `(TourManagerId, AssignedUserId, AssignedEntityType)` prevents duplicate assignments per entity type. When entity type is Tour (3), `AssignedUserId` is NULL and `AssignedTourId` is filled. CHECK constraints enforce the mutual exclusivity.

**Alternative:** Separate `tour_manager_designer_assignment` and `tour_manager_guide_assignment` tables. Rejected — adds complexity with no benefit for 2-3 entity types.

### D3: Upsert on PUT (Full Replacement)

**Decision:** The PUT endpoint replaces all existing assignments for a Manager with the new payload (bulk upsert behavior).

**Rationale:** The use case is "assign these people to this Manager" — an overwrite operation. This gives SuperAdmin clean control to reassign entire teams.

**Alternative:** Delta updates (only add/remove specified items). Rejected — harder to implement and harder for SuperAdmin to understand.

### D4: `SuperAdminOnly` Policy (Not `AdminOnly`)

**Decision:** New authorization policy `SuperAdminOnly` that requires the exact role `"SuperAdmin"`, separate from the existing `AdminOnly` (which allows both Admin and SuperAdmin).

**Rationale:** Only the highest-privilege role should manage organizational hierarchy. The `Admin` role should not be able to assign teams.

**Alternative:** Reuse `AdminOnly`. Rejected — violates principle of least privilege. Only SuperAdmin manages organization structure.

### D5: `AssignedRoleInTeam` Enum (Lead=1, Member=2)

**Decision:** The assignment table includes an `AssignedRoleInTeam` column to track whether the assigned user is a Lead or Member within that Manager's team.

**Rationale:** Teams may have sub-leads. The column is nullable (not required) to avoid forcing the field when it doesn't matter.

**Alternative:** No role within team. Rejected — the plan explicitly includes this for sub-manager capability.

### D6: Entity Framework Core Without Code-First Migration

**Decision:** Use a raw SQL migration script (`ADD_tour_manager_assignment.sql`) rather than EF Core code-first migrations.

**Rationale:** Matches the project's existing migration approach. The project uses SQL migration scripts in `Infrastructure/Migrations/Scripts/`.

### D7: CQRS with MediatR (Same Pattern as Existing Code)

**Decision:** Follow the existing CQRS pattern used throughout the codebase: separate Query/Command classes with Handlers, registered in `Infrastructure/DependencyInjection.cs`.

**Rationale:** Consistency with the codebase. No new patterns introduced.

## Data Model

```
tour_manager_assignment
├── Id                        uniqueidentifier (PK)
├── TourManagerId             uniqueidentifier (FK → user.Id, ON DELETE CASCADE)
├── AssignedEntityType        tinyint (1=TourDesigner, 2=TourGuide, 3=Tour)
├── AssignedUserId            uniqueidentifier (FK → user.Id, nullable, ON DELETE CASCADE)
├── AssignedTourId            uniqueidentifier (FK → tour_instance.Id, nullable, ON DELETE CASCADE)
├── AssignedRoleInTeam        tinyint (1=Lead, 2=Member, nullable)
├── CreatedAtUtc              datetimeoffset
├── CreatedBy                 uniqueidentifier
├── LastModifiedAtUtc         datetimeoffset (nullable)
└── LastModifiedBy            uniqueidentifier (nullable)

Constraints:
  UNIQUE(TourManagerId, AssignedUserId, AssignedEntityType) -- when UserId is not null
  UNIQUE(TourManagerId, AssignedTourId)                      -- when TourId is not null
  CHECK: AssignedEntityType IN (1,2,3)
  CHECK: (EntityType 1 or 2) → AssignedUserId IS NOT NULL AND AssignedTourId IS NULL
  CHECK: (EntityType 3)     → AssignedTourId IS NOT NULL AND AssignedUserId IS NULL
```

## API Design

All endpoints are under `/api/tour-manager-assignment` and require `[Authorize(Policy = "SuperAdminOnly")]`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tour-manager-assignment` | List all Tour Managers with their assigned teams (summary) |
| GET | `/api/tour-manager-assignment/{managerId}` | Get details of one Manager's assigned team |
| POST | `/api/tour-manager-assignment` | Assign users/tours to a Manager (create or add) |
| PUT | `/api/tour-manager-assignment/{managerId}` | Replace all assignments for a Manager |
| DELETE | `/api/tour-manager-assignment/{managerId}?assignedUserId={guid}&entityType={int}` | Remove one assignment (user type) |
| DELETE | `/api/tour-manager-assignment/{managerId}?assignedTourId={guid}&entityType=3` | Remove one assignment (tour type) |

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Existing Managers have no assignment records until SuperAdmin creates them | High | Migration is additive only. Existing Manager-role users continue working normally. Assignment records are created on-demand via the new UI. |
| User with multiple roles (TourGuide + Accountant) — which role is assigned? | Medium | The `AssignedEntityType` column makes it explicit. Frontend picker only shows users with the matching role. Handler validates role existence before assignment. |
| Self-assignment or circular assignment | Medium | Validation in `AssignTourManagerTeamCommandHandler` prevents assigning the Manager themselves and prevents assigning a user who is also a Manager. |
| Tour Managers without `ManagerOnly` policy still use their dashboard normally | Low | The new feature is additive. Existing endpoints remain under their current policies. |
| Frontend build grows with 4 new pages | Low | The project already has a rich admin portal. New pages follow established patterns. |

## Migration Plan

1. **Deploy migration first** — Run `ADD_tour_manager_assignment.sql` and add TourDesigner role to `role.json` seed. No downtime — purely additive.
2. **Backend rollout** — Deploy new API endpoints behind existing auth. They are unreachable until the frontend calls them.
3. **Frontend rollout** — Deploy new admin pages. SuperAdmin sidebar gets new nav items.
4. **Rollback** — If issues arise, rollback frontend first (new pages disappear). Backend can remain with endpoints available for future use.

## Open Questions

1. ~~Should existing Manager-role users be auto-assigned as Tour Managers in the new table?~~ — RESOLVED: No. Assignments are created on-demand via the new UI. Existing Manager-role users continue working normally.
2. ~~DELETE endpoint for tour-type assignments.~~ — RESOLVED: Use query parameters. DELETE `/api/tour-manager-assignment/{managerId}?assignedUserId={guid}&entityType={int}` for user assignments, and DELETE `/api/tour-manager-assignment/{managerId}?assignedTourId={guid}&entityType=3` for tour assignments. Simpler routing, no ambiguity.
3. **What is the initial value of `AssignedRoleInTeam` when assigning a user?** — RESOLVED: `NULL` initially. SuperAdmin can set Lead/Member via the edit page.

## Architecture Notes

### MediatR Registration
Handlers are auto-discovered via `AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()))` in `ApplicationDependencyInjection.cs`. No manual handler registration is needed in `Infrastructure/DependencyInjection.cs`.

### Repository Registration Location
Repositories are registered in `Infrastructure/Repositories/Common/DependencyInjection.cs`, not `ApplicationDependencyInjection.cs`. Follow this pattern.

### Entity Location
`TourInstanceManagerEntity` lives in `Domain/Entities/` (not `Infrastructure/`). Place `TourManagerAssignmentEntity` in the same location for consistency.

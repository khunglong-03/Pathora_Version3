## Why

Currently, the system has no concept of organizational hierarchy between staff members. SuperAdmins can create accounts but cannot assign specific Tour Designers or Tour Guides to specific Tour Managers. This means the operational team structure is flat — every Manager sees all staff, regardless of who they actually manage. The proposed hierarchical assignment system introduces explicit ownership relationships: SuperAdmin controls which people belong to which Manager's team.

## What Changes

- **New database table** `tour_manager_assignment` — tracks which Tour Manager owns which Tour Designer, Tour Guide, or Tour instance
- **New backend layer** — CQRS commands/queries, repository, controller for managing assignments
- **New authorization policy** `SuperAdminOnly` — restricts assignment management to SuperAdmins only
- **New TourDesigner role** (Id=4) — distinct from Manager, used for staff assignment
- **New frontend pages** — `/admin/tour-managers` (list), `/admin/tour-managers/create`, `/admin/tour-managers/[id]/edit`, `/admin/tour-designers`
- **New sidebar navigation** — SuperAdmin-only nav items for assignment management
- **Upsert behavior on PUT** — replaces entire assignment set when updating a Manager's team

## Capabilities

### New Capabilities

- `tour-manager-assignment`: SuperAdmin can create Tour Manager accounts with assigned Tour Designers and Tour Guides, view all assignments, and edit team rosters. Assignments are stored in `tour_manager_assignment` with entity type discrimination (TourDesigner vs TourGuide vs Tour).
- `tour-designer-role`: A new `TourDesigner` role (Id=4) is seeded in `p_role` and added to `RoleConstants`. This is distinct from the `Manager` role and is used specifically for the assignment feature.
- `superadmin-policy`: A new `SuperAdminOnly` authorization policy is added to the backend's authorization configuration, restricting assignment endpoints to SuperAdmin role only.

### Modified Capabilities

- (none — existing roles, controllers, and pages are not modified)

## Impact

### Backend (panthora_be/)

- **New**: `TourManagerAssignmentEntity` in `Domain/Entities/`
- **New**: `ITourManagerAssignmentRepository` in `Domain/Common/Repositories/`
- **New**: `TourManagerAssignmentRepository` in `Infrastructure/Repositories/`
- **New**: Request/ViewModel DTOs in `Application/Contracts/TourManagerAssignment/`
- **New**: CQRS query/command handlers in `Application/Features/TourManagerAssignment/`
- **New**: `TourManagerAssignmentController` in `Api/Controllers/`
- **New**: Migration script `ADD_tour_manager_assignment.sql` in `Infrastructure/Migrations/Scripts/`
- **Modified**: `RoleConstants.cs` — add `TourDesigner` constant
- **Modified**: `DependencyInjection.cs` — add `SuperAdminOnly` authorization policy
- **Modified**: `Infrastructure/DependencyInjection.cs` — register repository and MediatR handlers
- **Modified**: `Infrastructure/Repositories/Common/DependencyInjection.cs` — register repository DI

### Frontend (pathora/frontend/)

- **New**: `tourManagerAssignmentService.ts` in `api/services/`
- **New**: `/admin/tour-managers/page.tsx` — list all Tour Managers with assigned team counts
- **New**: `/admin/tour-managers/create/page.tsx` — create Tour Manager + assign team
- **New**: `/admin/tour-managers/[id]/edit/page.tsx` — edit team assignments
- **New**: `/admin/tour-designers/page.tsx` — manage Tour Designer accounts
- **Modified**: `AdminSidebar.tsx` — add `SUPERADMIN_NAV_ITEMS` with new nav links
- **Modified**: `AdminShell.tsx` — pass roles to sidebar for SuperAdmin-only nav visibility

### Database

- **New table**: `tour_manager_assignment` with FK relationships to `user` and `tour_instance`
- **New seed**: `TourDesigner` role (Id=4) added to `role.json`

### Security

- All assignment endpoints protected by `[Authorize(Policy = "SuperAdminOnly")]`
- Tour Managers can only access their own assigned resources (backend enforcement)
- No changes to existing authorization policies

# /autoplan — Review Plan: auto-create-manager-assignment-on-role-assign

## Context

**Branch:** `hieuMac` | **Base:** `main` | **Change:** `auto-create-manager-assignment-on-role-assign`

### Summary
Fix `/admin/tour-managers` page showing empty list despite existing Manager-role users. Root cause: backend endpoint only queries `TourManagerAssignments` table, which only has records after staff assignment. Solution: auto-create a sentinel `TourManagerAssignmentEntity` when a user gets the "Manager" role.

### Artifacts
- `openspec/changes/auto-create-manager-assignment-on-role-assign/proposal.md`
- `openspec/changes/auto-create-manager-assignment-on-role-assign/design.md`
- `openspec/changes/auto-create-manager-assignment-on-role-assign/tasks.md`
- `openspec/changes/auto-create-manager-assignment-on-role-assign/specs/auto-manager-assignment/spec.md`

### Scope Detection
- UI scope: **NO** (backend-only fix, no frontend changes)
- DX scope: **NO** (developer-facing impact is minimal — internal repository change)

<!-- /autoplan restore point: auto-create-manager-assignment-on-role-assign restore -->

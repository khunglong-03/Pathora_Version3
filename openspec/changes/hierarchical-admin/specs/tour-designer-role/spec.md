# Tour Designer Role

## Overview

A new `TourDesigner` role (Id=4) is added to the system's role seed data and referenced in backend constants. This role is distinct from `Manager` and is used specifically for the assignment feature.

## ADDED Requirements

### Requirement: TourDesigner role is seeded in the database

The system SHALL include a `TourDesigner` role record in the `p_role` table with Id=4.

#### Scenario: Database seed includes TourDesigner
- **WHEN** the application initializes and runs role seeding
- **THEN** the `p_role` table SHALL contain a record with `Id = 4` and `Name = "TourDesigner"`
- **AND** the role `Description` SHALL be "Người thiết kế tour du lịch" (or equivalent)
- **AND** the role `Status` SHALL be `1` (active)
- **AND** the role `IsDeleted` SHALL be `false`

### Requirement: TourDesigner role constant exists in RoleConstants

The backend `RoleConstants.cs` SHALL include a `TourDesigner` string constant.

#### Scenario: RoleConstants references TourDesigner
- **WHEN** backend code references `RoleConstants.TourDesigner`
- **THEN** the constant SHALL resolve to the string `"TourDesigner"`
- **AND** this SHALL match the `Name` field in the `p_role` database record

### Requirement: TourDesigner role does not grant Manager endpoint access

Users with only the `TourDesigner` role SHALL NOT have access to endpoints protected by `ManagerOnly` policy.

#### Scenario: TourDesigner user cannot access Manager endpoints
- **WHEN** a user with role `TourDesigner` (and no `Manager` role) calls a `ManagerOnly` endpoint
- **THEN** the system SHALL return HTTP 403 Forbidden

### Requirement: TourDesigner role enables assignment picker visibility

The frontend assignment UI SHALL display only users with the `TourDesigner` role as options for Tour Designer assignment.

#### Scenario: Assignment picker shows only TourDesigner users
- **WHEN** SuperAdmin opens the Tour Designer assignment picker on the create/edit Tour Manager form
- **THEN** the picker SHALL display only users whose `p_user_role` includes the `TourDesigner` role
- **AND** users without the `TourDesigner` role SHALL NOT appear in the picker

### Requirement: Existing users can be assigned the TourDesigner role

A user without the `TourDesigner` role SHALL be assignable to the role through existing user management functionality.

#### Scenario: User management assigns TourDesigner role
- **WHEN** a SuperAdmin assigns the `TourDesigner` role to an existing user
- **THEN** the system SHALL insert a record into `p_user_role` linking the user to role Id=4
- **AND** the user SHALL subsequently appear in Tour Designer assignment pickers

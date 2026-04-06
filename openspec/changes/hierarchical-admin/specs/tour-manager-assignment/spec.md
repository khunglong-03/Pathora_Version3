# Tour Manager Assignment

## Overview

SuperAdmin can create Tour Manager accounts with explicitly assigned Tour Designers and Tour Guides, view all assignment relationships, and manage team rosters. Assignments are stored in `tour_manager_assignment` with entity type discrimination.

## ADDED Requirements

### Requirement: SuperAdmin can view all Tour Manager assignments

The system SHALL provide an endpoint that returns all Tour Managers with their assigned team members (Tour Designers, Tour Guides, and Tours) in a summary view.

#### Scenario: SuperAdmin retrieves all assignment summary
- **WHEN** SuperAdmin calls `GET /api/tour-manager-assignment`
- **THEN** the system SHALL return a list of all Tour Managers
- **AND** each Manager entry SHALL include: manager user info (id, name, email), count of assigned Tour Designers, count of assigned Tour Guides, count of assigned Tours

#### Scenario: SuperAdmin retrieves specific Manager's team
- **WHEN** SuperAdmin calls `GET /api/tour-manager-assignment/{managerId}`
- **THEN** the system SHALL return the Manager's full assignment details
- **AND** the response SHALL include all assigned Tour Designers with their role in team (Lead/Member/null)
- **AND** the response SHALL include all assigned Tour Guides with their role in team (Lead/Member/null)
- **AND** the response SHALL include all assigned Tour instances

#### Scenario: Non-SuperAdmin user attempts to retrieve assignments
- **WHEN** a user without SuperAdmin role calls `GET /api/tour-manager-assignment`
- **THEN** the system SHALL return HTTP 403 Forbidden
- **AND** the system SHALL NOT return any assignment data

### Requirement: SuperAdmin can assign team members to a Tour Manager

The system SHALL allow SuperAdmin to create assignment records linking Tour Designers and Tour Guides to a specific Tour Manager.

#### Scenario: SuperAdmin assigns a Tour Designer to a Manager
- **WHEN** SuperAdmin calls `POST /api/tour-manager-assignment` with valid `TourManagerUserId`, `AssignedUserId` (TourDesigner), and `AssignedRoleInTeam`
- **THEN** the system SHALL create a new `tour_manager_assignment` record with `AssignedEntityType = TourDesigner`
- **AND** the response SHALL return HTTP 201 with the created assignment
- **AND** `CreatedAtUtc` and `CreatedBy` SHALL be set automatically

#### Scenario: SuperAdmin assigns a Tour Guide to a Manager
- **WHEN** SuperAdmin calls `POST /api/tour-manager-assignment` with valid `TourManagerUserId`, `AssignedUserId` (TourGuide), and `AssignedRoleInTeam`
- **THEN** the system SHALL create a new `tour_manager_assignment` record with `AssignedEntityType = TourGuide`
- **AND** the response SHALL return HTTP 201 with the created assignment

#### Scenario: SuperAdmin assigns a Tour instance to a Manager
- **WHEN** SuperAdmin calls `POST /api/tour-manager-assignment` with valid `TourManagerUserId`, `AssignedTourId`
- **THEN** the system SHALL create a new `tour_manager_assignment` record with `AssignedEntityType = Tour`
- **AND** `AssignedRoleInTeam` SHALL be NULL for tour assignments
- **AND** the response SHALL return HTTP 201 with the created assignment

#### Scenario: SuperAdmin assigns a user who is not a TourDesigner or TourGuide
- **WHEN** SuperAdmin calls `POST /api/tour-manager-assignment` with `AssignedUserId` whose role is neither TourDesigner nor TourGuide
- **THEN** the system SHALL return HTTP 400 Bad Request
- **AND** the system SHALL NOT create any assignment record

#### Scenario: SuperAdmin assigns the Manager to themselves
- **WHEN** SuperAdmin calls `POST /api/tour-manager-assignment` where `TourManagerUserId` equals `AssignedUserId`
- **THEN** the system SHALL return HTTP 400 Bad Request
- **AND** the system SHALL NOT create any assignment record

#### Scenario: SuperAdmin assigns a user who is already assigned to this Manager with same entity type
- **WHEN** SuperAdmin calls `POST /api/tour-manager-assignment` where the `(TourManagerId, AssignedUserId, AssignedEntityType)` tuple already exists
- **THEN** the system SHALL return HTTP 409 Conflict
- **AND** the system SHALL NOT create a duplicate assignment record

### Requirement: SuperAdmin can replace all team assignments for a Tour Manager

The system SHALL allow SuperAdmin to replace the entire team roster for a Tour Manager with a new set of assignments (bulk upsert).

#### Scenario: SuperAdmin replaces all assignments for a Manager
- **WHEN** SuperAdmin calls `PUT /api/tour-manager-assignment/{managerId}` with a new list of assignment items
- **THEN** the system SHALL delete ALL existing assignment records for that Manager
- **AND** the system SHALL create new assignment records for all items in the request
- **AND** the response SHALL return HTTP 200 with the complete new assignment set

#### Scenario: SuperAdmin clears all assignments for a Manager
- **WHEN** SuperAdmin calls `PUT /api/tour-manager-assignment/{managerId}` with an empty assignment list
- **THEN** the system SHALL delete ALL existing assignment records for that Manager
- **AND** the response SHALL return HTTP 200 with an empty assignment list

### Requirement: SuperAdmin can remove a single team assignment

The system SHALL allow SuperAdmin to remove one specific assignment record.

#### Scenario: SuperAdmin removes a Tour Designer assignment
- **WHEN** SuperAdmin calls `DELETE /api/tour-manager-assignment/{managerId}/{userId}/{entityType}`
- **THEN** the system SHALL delete the matching assignment record
- **AND** the response SHALL return HTTP 204 No Content
- **AND** other assignment records for this Manager SHALL remain unchanged

#### Scenario: SuperAdmin removes a non-existent assignment
- **WHEN** SuperAdmin calls `DELETE /api/tour-manager-assignment/{managerId}/{userId}/{entityType}` for a record that does not exist
- **THEN** the system SHALL return HTTP 404 Not Found

### Requirement: Assignment table enforces entity type constraints

The database layer SHALL enforce that each assignment record contains either a user assignment OR a tour assignment, not both.

#### Scenario: Database rejects assignment with both user and tour
- **WHEN** a record is inserted with both `AssignedUserId` and `AssignedTourId` populated
- **THEN** the database CHECK constraint SHALL reject the insert
- **AND** the operation SHALL fail with a constraint violation

#### Scenario: Database rejects duplicate assignment
- **WHEN** a duplicate `(TourManagerId, AssignedUserId, AssignedEntityType)` tuple is inserted
- **THEN** the UNIQUE constraint SHALL reject the insert
- **AND** the operation SHALL fail with a constraint violation

### Requirement: Cascade delete removes assignments when entities are deleted

When a User or Tour Instance is deleted, all associated assignment records SHALL be automatically removed.

#### Scenario: User deletion removes assignments
- **WHEN** a user who is assigned to a Manager is deleted from the system
- **THEN** all `tour_manager_assignment` records referencing that user SHALL be deleted automatically via FK cascade
- **AND** no orphaned assignment records SHALL remain

#### Scenario: Tour Instance deletion removes assignments
- **WHEN** a Tour Instance that is assigned to a Manager is deleted
- **THEN** all `tour_manager_assignment` records referencing that Tour Instance SHALL be deleted automatically via FK cascade

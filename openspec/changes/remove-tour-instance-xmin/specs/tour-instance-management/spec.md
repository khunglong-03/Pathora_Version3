## MODIFIED Requirements

### Requirement: Update Tour Instance

The system SHALL allow updating an existing Tour Instance via `PUT /api/tour-instances/{id}`.

#### Scenario: Successful update
- **WHEN** a valid update request is sent with all required fields
- **THEN** the system updates the Tour Instance and returns HTTP 200

#### Scenario: Update with missing required fields
- **WHEN** the update request is missing required fields (Id, Title, StartDate, EndDate, MaxParticipation, BasePrice)
- **THEN** the system returns HTTP 400 with validation errors

#### Scenario: Update non-existent instance
- **WHEN** the update request targets a non-existent Tour Instance ID
- **THEN** the system returns HTTP 404

### Requirement: Tour Instance Concurrency Control

**MODIFIED** from: RowVersion-based optimistic concurrency token (PostgreSQL xmin)

**Reason**: PostgreSQL xmin bump behavior is non-deterministic in batch operations, causing false-positive conflicts. Concurrency token approach removed in favor of simple last-write-wins update semantics.

**Migration**: Clients no longer need to send `rowVersion` in update requests. API responses no longer include `rowVersion` field.

#### Scenario: Concurrent updates — last write wins
- **WHEN** two concurrent update requests are sent for the same Tour Instance
- **THEN** the last successful write overwrites the previous changes (no conflict error returned)

### REMOVED Requirements

### Requirement: RowVersion-based Conflict Detection

**Reason**: `xmin`/`RowVersion` concurrency token removed from TourInstanceEntity. No replacement mechanism implemented.

**Migration**: Use simple update without concurrency check. If concurrent updates occur, last write wins.
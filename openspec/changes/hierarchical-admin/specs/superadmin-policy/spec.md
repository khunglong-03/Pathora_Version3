# SuperAdmin Policy

## Overview

A new `SuperAdminOnly` authorization policy restricts assignment management endpoints to users with the exact `SuperAdmin` role. This separates organizational hierarchy management from regular administrative functions.

## ADDED Requirements

### Requirement: SuperAdminOnly policy is registered in authorization configuration

The backend authorization configuration SHALL register a `SuperAdminOnly` policy that requires the exact `SuperAdmin` role.

#### Scenario: SuperAdminOnly policy is registered
- **WHEN** the application starts and configures authorization policies
- **THEN** the policy registry SHALL include a policy named `SuperAdminOnly`
- **AND** the policy SHALL require `policy.RequireRole("SuperAdmin")`
- **AND** the policy SHALL NOT include any other roles

### Requirement: Assignment endpoints require SuperAdminOnly policy

All Tour Manager Assignment endpoints SHALL be protected by `[Authorize(Policy = "SuperAdminOnly")]`.

#### Scenario: SuperAdmin accesses assignment endpoints
- **WHEN** a user with `SuperAdmin` role calls any assignment endpoint
- **THEN** the system SHALL allow access
- **AND** the response SHALL be returned normally

#### Scenario: Admin user is denied access to assignment endpoints
- **WHEN** a user with `Admin` role (but not `SuperAdmin`) calls any assignment endpoint
- **THEN** the system SHALL return HTTP 403 Forbidden
- **AND** no assignment data SHALL be returned

#### Scenario: Manager user is denied access to assignment endpoints
- **WHEN** a user with `Manager` role calls any assignment endpoint
- **THEN** the system SHALL return HTTP 403 Forbidden
- **AND** no assignment data SHALL be returned

#### Scenario: Unauthenticated request to assignment endpoints
- **WHEN** an unauthenticated request is made to any assignment endpoint
- **THEN** the system SHALL return HTTP 401 Unauthorized

### Requirement: SuperAdminOnly policy does not affect other endpoints

Existing endpoints protected by `AdminOnly` or `ManagerOnly` policies SHALL NOT be affected by the new `SuperAdminOnly` policy.

#### Scenario: Admin user can still access Admin-only endpoints
- **WHEN** a user with `Admin` role calls an endpoint protected by `AdminOnly`
- **THEN** the system SHALL allow access
- **AND** the response SHALL be returned normally

### Requirement: Frontend middleware prevents non-SuperAdmin access to assignment pages

The frontend middleware SHALL redirect non-SuperAdmin users away from `/admin/tour-managers/*` and `/admin/tour-designers` routes.

#### Scenario: Admin user tries to access Tour Managers page
- **WHEN** a user with `Admin` role (but not `SuperAdmin`) navigates to `/admin/tour-managers`
- **THEN** the middleware SHALL redirect the user to `/admin/dashboard`

#### Scenario: Manager user tries to access Tour Designers page
- **WHEN** a user with `Manager` role navigates to `/admin/tour-designers`
- **THEN** the middleware SHALL redirect the user to `/dashboard`

#### Scenario: SuperAdmin user accesses Tour Managers page
- **WHEN** a user with `SuperAdmin` role navigates to `/admin/tour-managers`
- **THEN** the page SHALL render successfully
- **AND** the SuperAdmin-specific nav items SHALL be visible in the sidebar

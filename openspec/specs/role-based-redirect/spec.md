# Role-Based Redirect

## Overview

Hệ thống redirect sau login/auth callback dựa trên danh sách role names từ JWT, điều hướng user đến dashboard tương ứng. Admin/SuperAdmin → `/admin/dashboard`. Manager → `/dashboard`. Others → `/home`.

## ADDED Requirements

### Requirement: Auth callback redirects user based on role names

The auth callback page SHALL read user roles from the Redux store and redirect to the appropriate default path.

#### Scenario: Admin redirected to admin dashboard
- **WHEN** user with roles ["Admin"] completes authentication
- **THEN** the callback SHALL redirect to `/admin/dashboard`

#### Scenario: SuperAdmin redirected to admin dashboard
- **WHEN** user with roles ["SuperAdmin"] completes authentication
- **THEN** the callback SHALL redirect to `/admin/dashboard`

#### Scenario: Manager redirected to manager dashboard
- **WHEN** user with roles ["Manager"] completes authentication
- **THEN** the callback SHALL redirect to `/dashboard`

#### Scenario: User with multiple roles redirected to highest priority
- **WHEN** user with roles ["Manager", "TourOperator"] completes authentication
- **THEN** the callback SHALL redirect to `/dashboard` (Manager is the highest matching role)

- **WHEN** user with roles ["Admin", "Manager"] completes authentication
- **THEN** the callback SHALL redirect to `/admin/dashboard` (Admin has higher priority)

### Requirement: Login form redirects user based on role names

The login mutation callback SHALL redirect user to the appropriate path after successful login.

#### Scenario: Successful login with admin role
- **WHEN** user with role "Admin" successfully logs in via the login form
- **THEN** the application SHALL redirect to `/admin/dashboard`

#### Scenario: Successful login with manager role
- **WHEN** user with role "Manager" successfully logs in via the login form
- **THEN** the application SHALL redirect to `/dashboard`

### Requirement: Middleware redirects from login entry point based on role

On login entry path (`/` or `/home?login=true`), authenticated users SHALL be redirected to their role-appropriate default path.

#### Scenario: Authenticated admin on login entry path
- **WHEN** authenticated user with `auth_roles=["Admin"]` is on `/`
- **THEN** middleware SHALL redirect to `/admin/dashboard`

#### Scenario: Authenticated manager on login entry path
- **WHEN** authenticated user with `auth_roles=["Manager"]` is on `/`
- **THEN** middleware SHALL redirect to `/dashboard`

#### Scenario: Authenticated user with no matching role on login entry path
- **WHEN** authenticated user with `auth_roles=["TourOperator"]` is on `/`
- **THEN** middleware SHALL redirect to `/home`

### Requirement: Middleware blocks cross-access between portals

Users SHALL NOT be able to access routes belonging to other roles.

#### Scenario: Admin trying to access manager routes
- **WHEN** user with `auth_roles=["Admin"]` navigates to `/dashboard`
- **THEN** middleware SHALL redirect to `/admin/dashboard`

#### Scenario: Manager trying to access admin routes
- **WHEN** user with `auth_roles=["Manager"]` navigates to `/admin/dashboard`
- **THEN** middleware SHALL redirect to `/dashboard`

### Requirement: Default path from user profile is respected

If the user has a `defaultPath` set in their profile, the redirect SHALL use that path instead.

#### Scenario: User with defaultPath in profile
- **WHEN** user has `defaultPath: "/dashboard/tour-management"`
- **THEN** the callback SHALL redirect to `/dashboard/tour-management`

- **WHEN** user has `defaultPath: "/admin/dashboard"`
- **THEN** the callback SHALL redirect to `/admin/dashboard`

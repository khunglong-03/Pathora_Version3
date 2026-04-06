# Admin Dashboard Routing

## Overview

Tách biệt Admin portal (`/admin/*`) và Manager portal (`/dashboard/*`) dựa trên role names từ JWT. SuperAdmin ("Admin") và Admin ("SuperAdmin") truy cập `/admin/*`. Manager ("Manager") truy cập `/dashboard/*`. Backend enforce quyền ở API level qua ASP.NET Core Policy-Based Authorization.

## ADDED Requirements

### Requirement: Admin route group is accessible only to Admin and SuperAdmin roles

Admin route group at `app/admin/` SHALL only be accessible to users with role names "Admin" or "SuperAdmin".

#### Scenario: Admin user navigates to admin dashboard
- **WHEN** user with role "Admin" navigates to `/admin/dashboard`
- **THEN** the page SHALL render successfully
- **AND** the admin sidebar SHALL display with only Dashboard and Settings navigation

#### Scenario: Manager user tries to access admin route
- **WHEN** user with role "Manager" navigates to `/admin/dashboard`
- **THEN** the middleware SHALL redirect the user to `/dashboard`
- **OR** the backend SHALL return 403 Forbidden if the URL is accessed directly

#### Scenario: Unauthenticated user tries to access admin route
- **WHEN** unauthenticated user navigates to `/admin/dashboard`
- **THEN** the middleware SHALL redirect to `/home?login=true`

### Requirement: Manager route group is accessible only to Manager role

Manager route group at `app/(dashboard)/` SHALL only be accessible to users with role name "Manager".

#### Scenario: Manager navigates to dashboard
- **WHEN** user with role "Manager" navigates to `/dashboard`
- **THEN** the page SHALL render successfully
- **AND** the manager sidebar SHALL display with all navigation items

#### Scenario: Admin user tries to access manager route
- **WHEN** user with role "Admin" navigates to `/dashboard`
- **THEN** the middleware SHALL redirect the user to `/admin/dashboard`

#### Scenario: Admin with Admin+Manager roles tries to access manager route
- **WHEN** user with roles ["Admin", "Manager"] navigates to `/dashboard`
- **THEN** the middleware SHALL redirect the user to `/admin/dashboard` (Admin has higher priority)

### Requirement: Admin route group has separate layout and sidebar

The admin route group SHALL use its own layout component and sidebar variant.

#### Scenario: Admin layout includes admin sidebar
- **WHEN** user is on any `/admin/*` page
- **THEN** the layout SHALL render the AdminSidebar with `variant="admin"`
- **AND** the sidebar SHALL show "Admin" as the role label
- **AND** the logo SHALL display "Pathora" with "Admin" subtitle

### Requirement: Backend enforces role-based authorization on API endpoints

API endpoints SHALL enforce role-based authorization using ASP.NET Core policy-based authorization. Admin endpoints require "Admin" or "SuperAdmin". Manager endpoints require "Manager" only.

#### Scenario: Admin-only endpoint rejects Manager request
- **WHEN** user with role "Manager" calls an API endpoint decorated with `[Authorize(Policy = "AdminOnly")]`
- **THEN** the backend SHALL return HTTP 403 Forbidden

#### Scenario: Admin-only endpoint accepts Admin request
- **WHEN** user with role "Admin" calls an API endpoint decorated with `[Authorize(Policy = "AdminOnly")]`
- **THEN** the backend SHALL process the request normally

#### Scenario: Manager-only endpoint rejects Admin request
- **WHEN** user with role "Admin" calls an API endpoint decorated with `[Authorize(Policy = "ManagerOnly")]`
- **THEN** the backend SHALL return HTTP 403 Forbidden

#### Scenario: Manager-only endpoint accepts Manager request
- **WHEN** user with role "Manager" calls an API endpoint decorated with `[Authorize(Policy = "ManagerOnly")]`
- **THEN** the backend SHALL process the request normally

### Requirement: auth_roles cookie stores user role names

The frontend SHALL store role names in a cookie for middleware consumption.

#### Scenario: Login sets auth_roles cookie
- **WHEN** user successfully logs in
- **THEN** the auth callback SHALL decode the user's roles from `userInfo.roles`
- **AND** set cookie `auth_roles` with JSON-encoded array of role names
- **AND** redirect user to the appropriate default path based on their highest-priority role

#### Scenario: auth_roles cookie has correct values
- **WHEN** user with roles ["Admin"] logs in
- **THEN** `auth_roles` cookie SHALL contain `["Admin"]`

- **WHEN** user with roles ["SuperAdmin"] logs in
- **THEN** `auth_roles` cookie SHALL contain `["SuperAdmin"]`

- **WHEN** user with roles ["Manager"] logs in
- **THEN** `auth_roles` cookie SHALL contain `["Manager"]`

- **WHEN** user with roles ["Admin", "Manager"] logs in
- **THEN** `auth_roles` cookie SHALL contain `["Admin", "Manager"]`
- **AND** redirect SHALL go to `/admin/dashboard` (Admin has higher priority)

### Requirement: Role priority determines redirect destination

When a user has multiple roles, the redirect destination SHALL be determined by role priority.

#### Priority order (highest to lowest):
1. Admin, SuperAdmin → `/admin/dashboard`
2. Manager → `/dashboard`
3. Others → `/home`

#### Scenario: User with both Admin and Manager roles
- **WHEN** user has roles ["Admin", "Manager"]
- **THEN** redirect SHALL go to `/admin/dashboard`
- **AND** the auth_roles cookie SHALL contain both roles

### Requirement: Middleware checks auth_roles cookie for route authorization

The middleware SHALL read the `auth_roles` cookie to determine route access permissions.

#### Scenario: Access to admin route with admin role
- **WHEN** authenticated user with `auth_roles=["Admin"]` navigates to `/admin/dashboard`
- **THEN** the request SHALL pass through

#### Scenario: Access to admin route without admin role
- **WHEN** authenticated user with `auth_roles=["Manager"]` navigates to `/admin/dashboard`
- **THEN** the middleware SHALL redirect to `/dashboard`

#### Scenario: Access to manager route with manager role
- **WHEN** authenticated user with `auth_roles=["Manager"]` navigates to `/dashboard`
- **THEN** the request SHALL pass through

#### Scenario: Access to manager route without manager role
- **WHEN** authenticated user with `auth_roles=["Admin"]` navigates to `/dashboard`
- **THEN** the middleware SHALL redirect to `/admin/dashboard`

#### Scenario: Login entry point redirect
- **WHEN** authenticated Admin navigates to `/`
- **THEN** redirect to `/admin/dashboard`

- **WHEN** authenticated Manager navigates to `/`
- **THEN** redirect to `/dashboard`

## ADDED Configuration

### Authorization Policies (Backend)

```csharp
options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin", "SuperAdmin"));
options.AddPolicy("ManagerOnly", policy => policy.RequireRole("Manager"));
```

### Route Prefix Mapping

| Route Prefix | Allowed Roles | Default Path |
|---|---|---|
| `/admin/*` | Admin, SuperAdmin | `/admin/dashboard` |
| `/dashboard/*` | Manager | `/dashboard` |
| `/*` | Customer, others | `/home` |

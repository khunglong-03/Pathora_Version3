## MODIFIED Requirements

### Requirement: Admin route group is accessible only to Admin role

Admin route group at `app/admin/` SHALL only be accessible to users with role name "Admin".

#### Scenario: Admin user navigates to admin dashboard
- **WHEN** user with role "Admin" navigates to `/admin/dashboard`
- **THEN** the page SHALL render successfully
- **AND** the admin sidebar SHALL display with full navigation including Dashboard, Quản lý Người dùng, Tour Manager, Tour Designer, Transport Provider, Hotel Provider

#### Scenario: Manager user tries to access admin route
- **WHEN** user with role "Manager" navigates to `/admin/dashboard`
- **THEN** the middleware SHALL redirect the user to `/dashboard`
- **OR** the backend SHALL return 403 Forbidden if the URL is accessed directly

#### Scenario: Unauthenticated user tries to access admin route
- **WHEN** unauthenticated user navigates to `/admin/dashboard`
- **THEN** the middleware SHALL redirect to `/home?login=true`

### Requirement: Admin route group has full navigation for Admin role

The admin route group SHALL display all management pages in the sidebar.

#### Scenario: Admin sidebar shows all management pages
- **WHEN** user with role "Admin" is on any `/admin/*` page
- **THEN** the sidebar SHALL display the following navigation items grouped by section:
  - QUẢN LÝ NGƯỜI DÙNG: Quản lý Người dùng
  - QUẢN LÝ NHÀ CUNG CẤP: Nhà cung cấp Vận tải, Nhà cung cấp Khách sạn
  - QUẢN LÝ TOUR: Quản lý Tour Manager, Quản lý Tour Designer

### Requirement: auth_roles cookie stores Admin role name

The frontend SHALL store role names in a cookie for middleware consumption.

#### Scenario: Login sets auth_roles cookie with Admin role
- **WHEN** user with roles ["Admin"] logs in
- **THEN** `auth_roles` cookie SHALL contain `["Admin"]`

- **WHEN** user with roles ["Manager"] logs in
- **THEN** `auth_roles` cookie SHALL contain `["Manager"]`

- **WHEN** user with roles ["Admin", "Manager"] logs in
- **THEN** `auth_roles` cookie SHALL contain `["Admin", "Manager"]`
- **AND** redirect SHALL go to `/admin/dashboard` (Admin has higher priority)

### Requirement: Role priority determines redirect destination

When a user has multiple roles, the redirect destination SHALL be determined by role priority.

#### Priority order (highest to lowest):
1. Admin → `/admin/dashboard`
2. Manager → `/dashboard`
3. Others → `/home`

#### Scenario: User with both Admin and Manager roles
- **WHEN** user has roles ["Admin", "Manager"]
- **THEN** redirect SHALL go to `/admin/dashboard`
- **AND** the auth_roles cookie SHALL contain both roles

### Requirement: Middleware checks auth_roles cookie for route authorization

The middleware SHALL read the `auth_roles` cookie to determine route access permissions.

#### Scenario: Admin can access all admin routes
- **WHEN** authenticated user with `auth_roles=["Admin"]` navigates to `/admin/tour-managers`
- **THEN** the request SHALL pass through

- **WHEN** authenticated user with `auth_roles=["Admin"]` navigates to `/admin/tour-designers`
- **THEN** the request SHALL pass through

- **WHEN** authenticated user with `auth_roles=["Admin"]` navigates to `/admin/users`
- **THEN** the request SHALL pass through

#### Scenario: Access to admin route without admin role
- **WHEN** authenticated user with `auth_roles=["Manager"]` navigates to `/admin/dashboard`
- **THEN** the middleware SHALL redirect to `/dashboard`

#### Scenario: Access to manager route with admin role
- **WHEN** authenticated user with `auth_roles=["Admin"]` navigates to `/dashboard`
- **THEN** the middleware SHALL redirect to `/admin/dashboard`

## REMOVED Requirements

### Requirement: Admin route group is accessible only to Admin and SuperAdmin roles

**Reason:** SuperAdmin role no longer exists in the system. Only "Admin" role exists for admin portal access.

**Migration:** Replace all references to "SuperAdmin" with "Admin" in role checks and documentation.

### Requirement: Authorization policies include SuperAdmin

**Reason:** SuperAdmin role removed from role.json. Backend authorization policies updated to only require "Admin".

**Migration:** No migration needed - this reflects the current state.

### Requirement: auth_roles cookie scenarios for SuperAdmin

**Reason:** SuperAdmin role no longer exists.

**Migration:** No migration needed.

### Requirement: Role priority includes SuperAdmin

**Reason:** SuperAdmin role no longer exists.

**Migration:** Update priority order to only include existing roles.

# Spec: Manager Auth Flow

## ADDED Requirements

### Requirement: Manager role redirects to dashboard after login
The system SHALL redirect users with the "Manager" role to `/dashboard` after successful authentication through the auth callback flow.

#### Scenario: Manager user logs in via auth callback
- **WHEN** a user with role "Manager" completes login and is redirected to `/auth/callback`
- **THEN** the system reads the roles from the Redux store and calls `resolveRoleDefaultPath(["Manager"])`
- **AND** the user is redirected to `/dashboard`

#### Scenario: Manager user directly accesses dashboard URL
- **WHEN** a user with role "Manager" navigates directly to `/dashboard`
- **THEN** the middleware detects `auth_roles` cookie contains "Manager"
- **AND** `hasManagerRole(["Manager"])` returns `true`
- **AND** `isManagerRoutePath("/dashboard")` returns `true`
- **AND** the middleware allows the request to proceed

#### Scenario: Manager user accesses admin portal
- **WHEN** a user with role "Manager" navigates to a path under `/admin/`
- **THEN** the middleware detects `hasManagerRole` is `true`
- **AND** the pathname starts with `/admin/`
- **AND** the middleware redirects the user to `/dashboard`

### Requirement: Non-manager users cannot access dashboard routes
The system SHALL redirect non-Manager users away from `/dashboard` routes to `/home`.

#### Scenario: User without Manager role accesses dashboard
- **WHEN** a user without the "Manager" role navigates to `/dashboard`
- **THEN** the `(dashboard)/layout.tsx` server component reads `auth_roles` cookie
- **AND** finds "Manager" is not in the parsed roles array
- **AND** the server redirects the user to `/home`

#### Scenario: Unauthenticated user accesses dashboard
- **WHEN** a user without valid `auth_status` or `access_token` cookie navigates to `/dashboard`
- **THEN** the middleware detects the user is not authenticated
- **AND** the middleware redirects the user to `/home?login=true`

### Requirement: Dashboard layout wraps all manager pages with sidebar
All pages under the `(dashboard)/` route group SHALL be wrapped with the shared `AdminShell` component with `variant="manager"`.

#### Scenario: Dashboard layout provides shared sidebar
- **WHEN** a user navigates to any page under `(dashboard)/`
- **THEN** the `(dashboard)/layout.tsx` server component renders `AdminShell variant="manager"`
- **AND** the `AdminSidebar` displays all 10 Manager navigation items
- **AND** the sidebar state is shared across all pages in the route group

### Requirement: Middleware enforces role-based route access
The middleware SHALL enforce role-based access control by checking the `auth_roles` cookie against predefined route access rules.

#### Scenario: Admin user accessing manager routes is blocked
- **WHEN** a user with role "Admin" or "SuperAdmin" navigates to `/dashboard`
- **THEN** the middleware detects `hasAdminRole` is `true`
- **AND** `isManagerRoutePath("/dashboard")` is `true`
- **AND** the middleware redirects the user to `/admin/dashboard`

#### Scenario: Manager role name resolved from cookie
- **WHEN** the middleware reads the `auth_roles` cookie
- **THEN** the cookie value is parsed as a JSON array: `["Manager"]`
- **AND** `hasManagerRole(["Manager"])` returns `true`
- **AND** the user is granted access to Manager portal routes

### Requirement: Auth roles cookie is set after login
The system SHALL set the `auth_roles` cookie with the user's role names immediately after a successful login or token refresh.

#### Scenario: Auth roles cookie set on login
- **WHEN** a user successfully logs in
- **THEN** the `login` mutation's `onQueryStarted` dispatches `getUserInfo`
- **AND** the response roles are extracted as `roleNames`
- **AND** `setAuthRolesCookie(["Manager"])` is called
- **AND** the cookie `auth_roles` is set with value `["Manager"]` for 7 days

#### Scenario: Auth roles cookie updated on token refresh
- **WHEN** a user's access token is refreshed
- **THEN** the `refreshToken` mutation re-fetches user info via `getUserInfo`
- **AND** the `auth_roles` cookie is updated with the latest roles

# Manager Customers Route Guard

## Overview

Chặn Manager khỏi `/dashboard/customers/*` route. Đây là route exception duy nhất trong Manager route group. Tất cả route còn lại trong `(dashboard)/` đều cho phép Manager truy cập.

## ADDED Requirements

### Requirement: Manager is blocked from accessing customers route

Manager role SHALL NOT be able to access the customers route at `/dashboard/customers`. When a Manager attempts to navigate to this route, the middleware SHALL redirect the user to `/dashboard`.

#### Scenario: Manager navigates to customers route
- **WHEN** user with role "Manager" navigates to `/dashboard/customers`
- **THEN** the middleware SHALL redirect to `/dashboard`
- **AND** the customers page SHALL NOT render

#### Scenario: Manager navigates to customers route with sub-path
- **WHEN** user with role "Manager" navigates to `/dashboard/customers/abc123`
- **THEN** the middleware SHALL redirect to `/dashboard`

#### Scenario: Manager navigates to customers route via direct URL
- **WHEN** user with role "Manager" enters `/dashboard/customers` directly in browser address bar
- **THEN** the middleware SHALL redirect to `/dashboard`

#### Scenario: Admin user can access customers route
- **WHEN** user with role "Admin" navigates to `/dashboard/customers`
- **THEN** the page SHALL render successfully

#### Scenario: SuperAdmin user can access customers route
- **WHEN** user with role "SuperAdmin" navigates to `/dashboard/customers`
- **THEN** the page SHALL render successfully

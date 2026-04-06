## 1. Backend — New API Endpoints

### 1.1 User Management Endpoints

- [ ] 1.1.1 Add `GET /api/admin/users` endpoint
  - Create `Application/Features/Admin/Queries/GetAllUsersQuery.cs` — query with `PageNumber`, `PageSize`, `Role` (optional), `Status` (optional), `SearchText` (optional) params
  - Create `Application/Features/Admin/Queries/GetAllUsersQueryValidator.cs` — FluentValidation
  - Create `Application/Features/Admin/Queries/GetAllUsersQueryHandler.cs` — fetch from UserRepository with role/status/search filters, return paginated `UserListItemDto[]`
  - Create `Application/Features/Admin/DTOs/UserListItemDto.cs` — `{ id, username, fullName, email, phoneNumber, avatarUrl, status, verifyStatus, roles: string[] }`
  - Register Query + Handler + Validator in DI
  - Add `[Authorize(Policy = "AdminOnly")]` and route in `Api/Controllers/AdminController.cs`

- [ ] 1.1.2 Add `GET /api/admin/users/{id}` endpoint
  - Create `Application/Features/Admin/Queries/GetUserDetailQuery.cs` + Validator + Handler
  - Create `Application/Features/Admin/DTOs/UserDetailDto.cs` — full user detail
  - Register and add route in `AdminController.cs`

### 1.2 Transport Provider Endpoints

- [ ] 1.2.1 Add `GET /api/admin/transport-providers` endpoint
  - Create `GetTransportProvidersQuery.cs` + Validator + Handler
  - Create `TransportProviderListItemDto.cs` — `{ id, fullName, email, phoneNumber, avatarUrl, status, bookingCount }`
  - Handler fetches users with `TransportProvider` role, joins with booking count
  - Register and add route in `AdminController.cs`

### 1.3 Hotel Provider Endpoints

- [ ] 1.3.1 Add `GET /api/admin/hotel-providers` endpoint
  - Create `GetHotelProvidersQuery.cs` + Validator + Handler
  - Create `HotelProviderListItemDto.cs` — `{ id, fullName, email, phoneNumber, avatarUrl, status, accommodationCount }`
  - Register and add route in `AdminController.cs`

### 1.4 TourManager Staff Endpoints

- [ ] 1.4.1 Add `GET /api/admin/tour-managers/{id}/staff` endpoint
  - Create `GetTourManagerStaffQuery.cs` + Validator + Handler
  - Create `TourManagerStaffDto.cs` — `{ manager: UserSummaryDto, staff: StaffMemberDto[] }`
  - Handler fetches manager info + all assignments where entityType = TourDesigner or TourGuide
  - Register and add route in `AdminController.cs`

- [ ] 1.4.2 Add `PUT /api/admin/tour-managers/{managerId}/staff/{staffId}/reassign` endpoint
  - Create `ReassignStaffCommand.cs` + Validator + Handler
  - Handler: remove staff from old manager assignment, create new assignment under target manager
  - Validate idempotency (same manager = no-op)
  - Register and add route in `AdminController.cs`

### 1.5 Admin Dashboard Overview Endpoint

- [ ] 1.5.1 Add `GET /api/admin/dashboard/overview` endpoint
  - Create `GetAdminDashboardOverviewQuery.cs` + Validator + Handler
  - Create `AdminDashboardOverviewDto.cs` — `{ totalUsers, activeManagers, activeTransportProviders, activeHotelProviders, pendingTourRequests, recentActivity: ActivityItemDto[] }`
  - Register and add route in `AdminController.cs`

## 2. Frontend Types & Endpoint Definitions

- [ ] 2.1 Update `src/types/admin.ts` — add new TypeScript interfaces:
  - `AdminUserListItem`, `AdminUserDetail`
  - `TransportProviderListItem`
  - `HotelProviderListItem`
  - `TourManagerStaffDto`, `StaffMemberDto`, `ManagerSummaryDto`
  - `AdminDashboardOverview`, `ActivityItem`
  - `PaginatedList<T>` helper type if not already present

- [ ] 2.2 Update `src/api/endpoints/admin.ts` — add new endpoint paths:
  - `GET_ALL_USERS: string`
  - `GET_USER_DETAIL: (id: string) => string`
  - `GET_TRANSPORT_PROVIDERS: string`
  - `GET_HOTEL_PROVIDERS: string`
  - `GET_TOUR_MANAGER_STAFF: (id: string) => string`
  - `REASSIGN_STAFF: (managerId: string, staffId: string) => string`
  - `GET_DASHBOARD_OVERVIEW: string`

## 3. Frontend API Services (expand existing)

### 3.1 Expand `adminService.ts`

- [ ] 3.1.1 Add `getAllUsers(params)` method — calls `GET_ALL_USERS` endpoint with page/role/status/search params
- [ ] 3.1.2 Add `getUserDetail(id)` method — calls `GET_USER_DETAIL(id)` endpoint
- [ ] 3.1.3 Add `getTransportProviders(params)` method — calls `GET_TRANSPORT_PROVIDERS` endpoint
- [ ] 3.1.4 Add `getHotelProviders(params)` method — calls `GET_HOTEL_PROVIDERS` endpoint
- [ ] 3.1.5 Add `getTourManagerStaff(managerId)` method — calls `GET_TOUR_MANAGER_STAFF(id)` endpoint
- [ ] 3.1.6 Add `reassignStaff(managerId, staffId, targetManagerId)` method — calls `PUT REASSIGN_STAFF(...)` endpoint
- [ ] 3.1.7 Add `getDashboardOverview()` method — calls `GET_DASHBOARD_OVERVIEW` endpoint

### 3.2 Type exports

- [ ] 3.2.1 Export all new interfaces from `adminService.ts` for convenience

## 4. Shared Admin UI Components

- [ ] 4.1 Create `src/features/dashboard/components/AdminPageHeader.tsx` — reusable page header
  - Props: `title`, `subtitle`, `backHref?`, `actionButtons?`, `onRefresh?`
  - Sticky header bar with page title + subtitle left, action buttons right
  - Includes "Quay lại" link if `backHref` provided
  - "Làm mới" button if `onRefresh` provided
  - Consistent styling with amber accent for primary actions

- [ ] 4.2 Create `src/features/dashboard/components/AdminFilterTabs.tsx` — reusable filter tabs
  - Props: `tabs: { label, count?, value }[]`, `activeValue`, `onChange`
  - Amber pill-bar active indicator using Framer Motion `layoutId`
  - Spring physics animation on tab change
  - Count badge next to each tab label

- [ ] 4.3 Create `src/features/dashboard/components/AdminKpiStrip.tsx` — horizontal KPI row
  - Props: `kpis: { label, value, icon, accent, subtext? }[]`
  - Wraps existing `StatCard` component — reuses `src/components/ui/StatCard`
  - Staggered entrance animation (100ms delay per card)
  - Responsive: wraps to 2 columns on mobile, single row on lg+

- [ ] 4.4 Create `src/features/dashboard/components/AdminEmptyState.tsx` — empty state card
  - Props: `icon`, `heading`, `description`, `action?`
  - Centered icon, heading, description, optional CTA button
  - Matches design system (amber accent for CTA)

- [ ] 4.5 Create `src/features/dashboard/components/AdminErrorCard.tsx` — error state card
  - Props: `message`, `onRetry`
  - Red-tinted card with error icon, message, "Thử lại" button

## 5. Sidebar Navigation Expansion

- [ ] 5.1 Update `SUPERADMIN_NAV_ITEMS` in `src/features/dashboard/components/AdminSidebar.tsx`
  - Add `Users` nav item with `Users` icon from Phosphor
  - Add `Transport Providers` nav item with `Van` icon from Phosphor
  - Add `Hotel Providers` nav item with `Bed` or `Buildings` icon from Phosphor
  - Keep existing `Tour Manager` and `Tour Designer` items
  - Reorder: Users first, then Tour Management section, then Providers section

- [ ] 5.2 Add section labels to sidebar nav
  - Add "QUẢN LÝ NGƯỜI DÙNG" label above Users nav item
  - Add "QUẢN LÝ NHÀ CUNG CẤP" label above Transport + Hotel nav items
  - Style labels as uppercase, small, muted text with `tracking-widest`

- [ ] 5.3 Verify all new routes redirect non-SuperAdmin users via middleware

## 6. User Management Page (`/admin/users`)

### 6.1 User List Page

- [ ] 6.1.1 Create `src/app/admin/users/page.tsx` — main users page
  - Uses `AdminPageHeader` with title "Quản lý người dùng", subtitle, refresh button
  - Uses `AdminKpiStrip` with role counts (Total, Managers, TourGuides, TourDesigners, Transport, Hotel)
  - Uses `AdminFilterTabs` with role filter: All, Admin, Manager, TourDesigner, TourGuide, Transport, Hotel
  - Search input (debounced 300ms)
  - `AdminUserTable` component
  - `AdminEmptyState` when no users
  - `AdminErrorCard` on API error
  - Skeleton table during loading

### 6.2 User Table Component

- [ ] 6.2.1 Create `src/features/dashboard/components/AdminUserTable.tsx`
  - Table columns: Avatar initials, Full Name, Email, Role badge, Status, Actions
  - Avatar: amber circle with user initials
  - `RoleBadge` component: distinct color per role (Admin=red, Manager=amber, TourDesigner=purple, TourGuide=blue, Customer=gray, Transport=teal, Hotel=orange)
  - Status: green dot "Active" or gray dot "Inactive"
  - Actions: "•••" dropdown with "Xem chi tiết" → navigates to `/admin/users/{id}`
  - Hover state: row lifts with `translateY(-1px)`
  - Pagination using existing `Pagination` component

### 6.3 User Detail Page

- [ ] 6.3.1 Create `src/app/admin/users/[id]/page.tsx` — user detail view
  - Back button to `/admin/users`
  - User info card: avatar, name, email, phone, status, roles
  - Read-only display — no edit form needed for v1
  - Shows all assigned roles as badges

## 7. TourManager Hierarchy Expansion (`/admin/tour-managers`)

### 7.1 Card View Toggle

- [ ] 7.1.1 Update `src/app/admin/tour-managers/page.tsx` — add card/table view toggle
  - Add toggle button in page header to switch between table view (existing) and card view (new)
  - Session-persisted view preference (useState + localStorage)

### 7.2 TourManager Card

- [ ] 7.2.1 Create `src/features/dashboard/components/TourManagerCard.tsx`
  - Card layout: avatar + name + email + phone, stat chips (Designers=purple, Guides=blue, Tours=green), action buttons
  - "Xem nhân viên" button → navigates to `/admin/tour-managers/{id}/staff`
  - "Chỉnh sửa" button → navigates to `/admin/tour-managers/{id}/edit` (existing page)
  - Hover lift animation: `translateY(-2px)` + enhanced shadow
  - Diffusion shadow: `shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`

### 7.3 Staff List Page

- [ ] 7.3.1 Create `src/app/admin/tour-managers/[id]/staff/page.tsx` — staff list view
  - Uses `AdminPageHeader` with back button to `/admin/tour-managers`
  - Manager summary card at top: amber-left-border card with avatar, name, email, status
  - Staff list: grouped by role (TourDesigners section, TourGuides section)
  - Each staff item: avatar initials, name, email, role badge, status indicator
  - Reassign button on each staff item → opens `StaffReassignModal`

### 7.4 Staff List Component

- [ ] 7.4.1 Create `src/features/dashboard/components/StaffList.tsx`
  - Props: `staff: StaffMemberDto[]`, `managers: TourManagerSummary[]`, `managerId: string`, `onReassign: (staffId, targetManagerId) => void`
  - Groups staff by role, renders each group with section header
  - Empty state if no staff

### 7.5 Reassign Modal

- [ ] 7.5.1 Create `src/features/dashboard/components/StaffReassignModal.tsx`
  - Props: `isOpen`, `onClose`, `staffName`, `currentManager`, `allManagers`, `onConfirm`
  - Dropdown of available managers (excludes current manager)
  - "Xác nhận" and "Hủy" buttons
  - Loading state during API call
  - Calls `adminService.reassignStaff()`

## 8. Transport Provider Management (`/admin/transport-providers`)

- [ ] 8.1.1 Create `src/app/admin/transport-providers/page.tsx` — main page
  - Uses `AdminPageHeader` with title "Quản lý người bán vé"
  - Uses `AdminKpiStrip` with: Total Providers, Active Providers, Total Bookings
  - Uses `AdminFilterTabs` with: All, Active, Inactive
  - Search input
  - Provider cards grid (2 columns on lg+)
  - `AdminEmptyState` when no providers
  - Skeleton grid during loading

- [ ] 8.1.2 Create `src/features/dashboard/components/TransportProviderCard.tsx`
  - Van icon at top
  - Provider name, email, phone
  - Booking count stat chip
  - Status badge (green "Active" or gray "Inactive")
  - Diffusion shadow, hover lift animation
  - "Xem chi tiết" button (for v1, just a card — no detail page)

## 9. Hotel Provider Management (`/admin/hotel-providers`)

- [ ] 9.1.1 Create `src/app/admin/hotel-providers/page.tsx` — main page
  - Uses `AdminPageHeader` with title "Quản lý người cung cấp chỗ ở"
  - Uses `AdminKpiStrip` with: Total Providers, Active Providers, Total Rooms
  - Uses `AdminFilterTabs` with: All, Active, Inactive
  - Search input
  - Provider cards grid
  - `AdminEmptyState` when no providers
  - Skeleton grid during loading

- [ ] 9.1.2 Create `src/features/dashboard/components/HotelProviderCard.tsx`
  - Hotel/building icon at top
  - Provider name, email, phone
  - Accommodation count stat chip
  - Status badge
  - Diffusion shadow, hover lift animation

## 10. SuperAdmin Dashboard (`/admin/dashboard`)

- [ ] 10.1.1 Update `src/app/admin/dashboard/page.tsx` — replace stub
  - Fetch dashboard overview data on mount
  - Uses `AdminKpiStrip` with: Total Users, Active Managers, Active Transport, Active Hotel, Pending Requests
  - Uses `AdminRecentActivity` component

- [ ] 10.1.2 Create `src/features/dashboard/components/AdminRecentActivity.tsx`
  - Props: `activities: ActivityItem[]`
  - Timeline-style list of recent actions
  - Each item: timestamp, actor name, action description
  - "Xem tất cả" link to relevant management page
  - Empty state if no recent activity

## 11. Verification

- [ ] 11.1 Run `npm --prefix pathora/frontend run lint` — fix any ESLint errors
- [ ] 11.2 Run `npm --prefix pathora/frontend run build` — ensure production build succeeds
- [ ] 11.3 Run `dotnet build panthora_be/LocalService.slnx` — ensure backend compiles
- [ ] 11.4 Verify each new route renders correctly when logged in as SuperAdmin
- [ ] 11.5 Verify non-SuperAdmin (Manager role) gets redirected from `/admin/*` routes
- [ ] 11.6 Test filter tabs, search, and pagination on `/admin/users` page
- [ ] 11.7 Test card/table toggle on `/admin/tour-managers`
- [ ] 11.8 Test staff reassign flow: view staff list → click reassign → select target manager → confirm

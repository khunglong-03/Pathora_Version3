# Test Specification — admin-4-part-user-management

## Overview

This document defines test expectations for the admin-4-part-user-management change: 4 management pages (Users, TourManagers, TransportProviders, HotelProviders) with shared admin components, new backend API endpoints, and an updated SuperAdmin dashboard.

Target: 80%+ line coverage on all new code.

---

## Backend Tests (xUnit — `panthora_be/tests/Domain.Specs/`)

### 1. API Controller Tests

#### 1.1 `AdminControllerTests.cs` — covers all 7 new endpoints

| Test | Description |
|------|-------------|
| `GetAllUsers_ValidRequest_Returns200` | Paginated user list with role/status/search filters |
| `GetAllUsers_WithRoleFilter_PassesRoleToQuery` | Verifies role filter is forwarded |
| `GetAllUsers_WithStatusFilter_PassesStatusToQuery` | Verifies status filter is forwarded |
| `GetAllUsers_WithSearchText_PassesSearchToQuery` | Verifies search text is forwarded |
| `GetAllUsers_NoResults_Returns200WithEmptyArray` | Empty paginated result |
| `GetAllUsers_Unauthorized_Returns403` | Missing/invalid admin auth |
| `GetUserDetail_ValidId_Returns200` | Single user detail returned |
| `GetUserDetail_NotFound_Returns404` | User ID doesn't exist |
| `GetUserDetail_InvalidIdFormat_Returns400` | Malformed GUID |
| `GetTransportProviders_ValidRequest_Returns200` | List of transport provider users |
| `GetTransportProviders_EmptyList_Returns200WithEmptyArray` | No transport providers exist |
| `GetHotelProviders_ValidRequest_Returns200` | List of hotel provider users |
| `GetHotelProviders_EmptyList_Returns200WithEmptyArray` | No hotel providers exist |
| `GetTourManagerStaff_ValidManagerId_Returns200` | Staff list for a manager |
| `GetTourManagerStaff_ManagerNotFound_Returns404` | Manager ID not found |
| `GetTourManagerStaff_EmptyStaff_Returns200WithEmptyList` | Manager has no assigned staff |
| `ReassignStaff_ValidRequest_Returns200` | Successful reassignment |
| `ReassignStaff_SameManager_NoOp_Returns200` | Idempotency: reassign to same manager |
| `ReassignStaff_StaffNotFound_Returns404` | Staff ID not found |
| `ReassignStaff_TargetManagerNotFound_Returns404` | Target manager not found |
| `ReassignStaff_Unauthorized_Returns403` | Missing admin policy |
| `GetAdminDashboardOverview_ValidRequest_Returns200` | Aggregate KPI data |
| `GetAdminDashboardOverview_NoData_Returns200WithZeros` | All KPI values are zero |

#### 1.2 Query Handler Tests

##### `GetAllUsersQueryHandlerTests.cs`

| Test | Description |
|------|-------------|
| `Handle_ValidRequest_ReturnsPaginatedUserList` | Correct DTO mapping |
| `Handle_WithRoleFilter_ReturnsFilteredUsers` | Role filter applied |
| `Handle_WithStatusFilter_ReturnsFilteredUsers` | Status filter applied |
| `Handle_WithSearchText_ReturnsMatchingUsers` | Search text partial match |
| `Handle_NoResults_ReturnsEmptyPaginatedResult` | Empty paginated result |
| `Handle_AllFilters_AppliesAllFiltersTogether` | Combined filters |

##### `GetUserDetailQueryHandlerTests.cs`

| Test | Description |
|------|-------------|
| `Handle_UserExists_ReturnsFullDetailDto` | Complete DTO with all fields |
| `Handle_UserNotFound_ReturnsNotFound` | Error returned |

##### `GetTransportProvidersQueryHandlerTests.cs`

| Test | Description |
|------|-------------|
| `Handle_ReturnsTransportProvidersWithBookingCount` | Booking count joined |
| `Handle_NoTransportProviders_ReturnsEmptyList` | Empty result |
| `Handle_WithStatusFilter_FiltersCorrectly` | Status filter applied |

##### `GetHotelProvidersQueryHandlerTests.cs`

| Test | Description |
|------|-------------|
| `Handle_ReturnsHotelProvidersWithAccommodationCount` | Accommodation count joined |
| `Handle_NoHotelProviders_ReturnsEmptyList` | Empty result |
| `Handle_WithStatusFilter_FiltersCorrectly` | Status filter applied |

##### `GetTourManagerStaffQueryHandlerTests.cs`

| Test | Description |
|------|-------------|
| `Handle_ManagerHasStaff_ReturnsGroupedStaff` | Staff grouped by role |
| `Handle_ManagerHasNoStaff_ReturnsEmptyList` | Empty staff list |
| `Handle_ManagerNotFound_ReturnsNotFound` | Error on invalid manager |

##### `ReassignStaffCommandHandlerTests.cs`

| Test | Description |
|------|-------------|
| `Handle_ValidReassignment_RemovesOldAssignmentCreatesNew` | Assignment moved |
| `Handle_SameManager_NoOp_ReturnsSuccess` | Idempotency |
| `Handle_StaffNotFound_ReturnsNotFound` | Error on invalid staff |
| `Handle_TargetManagerNotFound_ReturnsNotFound` | Error on invalid target |
| `Handle_StaffNotAssignedToAnyManager_CreatesNewAssignment` | New assignment created |

##### `GetAdminDashboardOverviewQueryHandlerTests.cs`

| Test | Description |
|------|-------------|
| `Handle_ReturnsAggregateKpisAcrossAllSections` | All 5 KPIs present |
| `Handle_NoData_ReturnsZeroValues` | Zero counts for empty DB |
| `Handle_ReturnsRecentActivityItems` | Activity items included |

---

## Frontend Tests (Vitest — `pathora/frontend/src/`)

### 2. Service Tests

#### 2.1 `adminService.test.ts` — all 7 new service methods

| Test | Description |
|------|-------------|
| `getAllUsers calls correct endpoint with params` | GET /api/admin/users with page/role/status/search |
| `getAllUsers returns normalized data on success` | Data extraction and normalization |
| `getAllUsers returns empty array on 404` | Graceful empty result |
| `getAllUsers throws on network error` | Error propagation |
| `getUserDetail calls correct endpoint` | GET /api/admin/users/{id} |
| `getUserDetail returns user data` | Data extraction |
| `getUserDetail throws on 404` | Not found handling |
| `getTransportProviders calls correct endpoint` | GET /api/admin/transport-providers |
| `getTransportProviders returns provider list` | Provider data extraction |
| `getHotelProviders calls correct endpoint` | GET /api/admin/hotel-providers |
| `getHotelProviders returns provider list` | Provider data extraction |
| `getTourManagerStaff calls correct endpoint` | GET /api/admin/tour-managers/{id}/staff |
| `getTourManagerStaff returns staff data` | Staff data extraction |
| `reassignStaff calls PUT endpoint with correct params` | PUT with managerId/staffId |
| `reassignStaff returns success` | Success response handling |
| `reassignStaff throws on error` | Error handling |
| `getDashboardOverview calls correct endpoint` | GET /api/admin/dashboard/overview |
| `getDashboardOverview returns overview data` | KPI data extraction |

### 3. Component Tests

#### 3.1 `AdminPageHeader.test.tsx`

| Test | Description |
|------|-------------|
| `renders title and subtitle` | Content visible |
| `renders back button when backHref provided` | Conditional back link |
| `back button links to correct href` | Navigation href |
| `renders refresh button when onRefresh provided` | Conditional refresh |
| `refresh button is clickable` | Interaction |
| `renders action buttons in right slot` | Button slots |
| `has sticky positioning` | CSS class applied |

#### 3.2 `AdminFilterTabs.test.tsx`

| Test | Description |
|------|-------------|
| `renders all tabs with labels` | Tab labels visible |
| `renders count badges when provided` | Count display |
| `active tab has visual indicator` | Amber underline/bar |
| `onChange called when tab clicked` | Interaction |
| `animation fires on tab change` | Framer Motion layoutId |

#### 3.3 `AdminKpiStrip.test.tsx`

| Test | Description |
|------|-------------|
| `renders all KPI cards` | KPI count matches input |
| `each card shows label and value` | Content display |
| `each card shows icon` | Icon rendering |
| `each card shows accent color` | Color application |
| `staggered entrance animation present` | 100ms delay per card |
| `wraps to 2 columns on mobile` | Responsive behavior |

#### 3.4 `AdminEmptyState.test.tsx`

| Test | Description |
|------|-------------|
| `renders icon` | Icon visible |
| `renders heading text` | Heading display |
| `renders description text` | Description display |
| `renders action button when action provided` | Conditional CTA |
| `action button is clickable` | Button interaction |

#### 3.5 `AdminErrorCard.test.tsx`

| Test | Description |
|------|-------------|
| `renders error message` | Message display |
| `renders retry button` | Retry button visible |
| `retry button calls onRetry` | Interaction |
| `has error-tinted styling` | Red tint applied |

#### 3.6 `AdminUserTable.test.tsx`

| Test | Description |
|------|-------------|
| `renders table with correct columns` | Headers visible |
| `renders avatar with user initials` | Initials calculation |
| `renders role badge with correct color per role` | Color mapping |
| `renders status indicator green for active` | Active state |
| `renders status indicator gray for inactive` | Inactive state |
| `renders action menu button per row` | Action button |
| `action menu opens on click` | Dropdown interaction |
| `action menu closes on outside click` | Dismiss behavior |
| `navigates to detail page on view action` | Navigation |
| `row has hover lift effect` | CSS transform |
| `pagination controls render` | Pagination UI |
| `pagination previous/next work` | Page navigation |

#### 3.7 `TourManagerCard.test.tsx`

| Test | Description |
|------|-------------|
| `renders avatar with initials` | Avatar display |
| `renders name, email, phone` | Info fields |
| `renders stat chips with counts` | Designer/Guide/Tour counts |
| `stat chips have correct role colors` | Purple/blue/green chips |
| `view staff button present` | Action button |
| `edit button present` | Action button |
| `hover lift animation` | translateY(-2px) on hover |
| `diffusion shadow applied` | shadow class |

#### 3.8 `TransportProviderCard.test.tsx`

| Test | Description |
|------|-------------|
| `renders van/transport icon` | Icon visible |
| `renders name, email, phone` | Info fields |
| `renders booking count stat` | Stat display |
| `renders status badge` | Status indicator |
| `view detail button present` | Action button |
| `hover lift animation` | translateY(-2px) |
| `diffusion shadow applied` | shadow class |

#### 3.9 `HotelProviderCard.test.tsx`

| Test | Description |
|------|-------------|
| `renders hotel/building icon` | Icon visible |
| `renders name, email, phone` | Info fields |
| `renders accommodation count stat` | Stat display |
| `renders status badge` | Status indicator |
| `hover lift animation` | translateY(-2px) |
| `diffusion shadow applied` | shadow class |

#### 3.10 `StaffList.test.tsx`

| Test | Description |
|------|-------------|
| `renders staff grouped by role` | Grouped sections |
| `renders staff item with avatar/name/email/role` | Staff row content |
| `renders role badge per staff` | Badge display |
| `renders reassign button per staff` | Reassign action |
| `calls onReassign with staffId and targetManagerId` | Callback on click |
| `empty state when no staff` | Conditional empty |

#### 3.11 `StaffReassignModal.test.tsx`

| Test | Description |
|------|-------------|
| `renders staff name in modal` | Modal content |
| `renders current manager info` | Current assignment |
| `renders dropdown with all managers` | Manager options |
| `current manager excluded from dropdown` | Excludes self |
| `confirm button disabled without selection` | Validation |
| `confirm button enabled when different manager selected` | Enabled state |
| `calls onConfirm with target manager id` | Confirmation callback |
| `calls onClose on cancel` | Dismiss callback |
| `loading state during API call` | Loading indicator |
| `closes on backdrop click` | Dismiss interaction |

#### 3.12 `AdminRecentActivity.test.tsx`

| Test | Description |
|------|-------------|
| `renders activity timeline items` | Timeline rendering |
| `each item shows timestamp` | Time display |
| `each item shows actor name` | Actor info |
| `each item shows action description` | Action text |
| `renders view all link` | Link button |
| `empty state when no activities` | Conditional empty |

---

## Coverage Targets

| Layer | Target | Key Files |
|-------|--------|-----------|
| Backend Query Handlers | 90%+ | `*QueryHandler.cs` |
| Backend Commands | 90%+ | `*CommandHandler.cs` |
| Backend Controllers | 80%+ | `AdminController.cs` |
| Frontend Services | 90%+ | `adminService.ts` |
| Frontend Components | 80%+ | All `*.test.tsx` |

---

## Test Data Factories

### Backend (xUnit)

```csharp
// User entity builders with role assignments
CreateAdminUser(id, email)
CreateTourManagerUser(id, email)
CreateTourDesignerUser(id, email)
CreateTourGuideUser(id, email)
CreateTransportProviderUser(id, email)
CreateHotelServiceProviderUser(id, email)
CreateCustomerUser(id, email)

// DTO builders
BuildUserListItemDto(user)
BuildTransportProviderDto(user, bookingCount)
BuildHotelProviderDto(user, accommodationCount)
BuildTourManagerStaffDto(manager, staff[])
BuildAdminDashboardOverviewDto(stats, activities)

// Pagination helpers
BuildPagedResult(items, page, pageSize, total)
```

### Frontend (Vitest)

```typescript
// Builder helpers for test data
buildUserListItem(overrides)
buildTransportProvider(overrides)
buildHotelProvider(overrides)
buildTourManagerStaff(overrides)
buildDashboardOverview(overrides)
buildActivityItem(overrides)

// State builders
buildLoadingState()
buildEmptyState()
buildErrorState(errorMessage)
buildReadyState(data)

// Mock factories
mockAdminServiceGetAllUsers()
mockAdminServiceGetUserDetail()
mockAdminServiceGetTransportProviders()
mockAdminServiceGetHotelProviders()
mockAdminServiceGetTourManagerStaff()
mockAdminServiceReassignStaff()
mockAdminServiceGetDashboardOverview()
```

---

## API Contract Tests

### Request/Response Shapes

#### GET /api/admin/users
- Request: `?pageNumber=1&pageSize=20&role=TourGuide&status=Active&searchText=Lan`
- Response 200: `{ statusCode: 200, data: { items: UserListItemDto[], total: number, page: number, pageSize: number }, message: string }`
- Response 401/403: `{ statusCode: 403, errors: [{ code: string, message: string }] }`

#### GET /api/admin/users/{id}
- Response 200: `{ statusCode: 200, data: UserDetailDto, message: string }`
- Response 404: `{ statusCode: 404, errors: [...] }`

#### GET /api/admin/transport-providers
- Response 200: `{ statusCode: 200, data: TransportProviderListItemDto[], message: string }`

#### GET /api/admin/hotel-providers
- Response 200: `{ statusCode: 200, data: HotelProviderListItemDto[], message: string }`

#### GET /api/admin/tour-managers/{id}/staff
- Response 200: `{ statusCode: 200, data: TourManagerStaffDto, message: string }`

#### PUT /api/admin/tour-managers/{managerId}/staff/{staffId}/reassign
- Request: `{ targetManagerId: string }`
- Response 200: `{ statusCode: 200, data: null, message: string }`

#### GET /api/admin/dashboard/overview
- Response 200: `{ statusCode: 200, data: AdminDashboardOverviewDto, message: string }`

---

## Error Scenarios

| Scenario | Backend Response | Frontend Behavior |
|----------|-----------------|-------------------|
| 401 Unauthorized | 401 with error | Redirect to login |
| 403 Forbidden | 403 with error | Show access denied |
| 404 Not Found | 404 with error | Show "Not Found" empty state |
| 500 Server Error | 500 with error | Show error card with retry |
| Network Timeout | No response | Show error card with retry |
| Empty result | 200 with empty array | Show empty state |
| Malformed JSON | Exception | Show error card |

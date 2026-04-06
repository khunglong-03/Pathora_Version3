## Why

`TourEntity.Category` (string?) là một property không có trong database schema nhưng được code sử dụng ở nhiều nơi. Khi endpoint `/api/admin/tour-management` query tours, EF Core generate SQL SELECT column `Category` nhưng PostgreSQL báo lỗi `42703: column t.Category does not exist`. Quyết định xóa hoàn toàn field này vì nó không mang giá trị thực tế.

## What Changes

- **Backend**: Xóa `Category` property khỏi `TourEntity`, `TourTranslationData`, và toàn bộ code sử dụng nó
- **Frontend**: Xóa category filter UI khỏi `FilterSidebar`, `FilterDrawer`, và `TourDiscoveryPage`
- **No database migration needed** vì column không tồn tại

## Capabilities

### New Capabilities
- Không có

### Modified Capabilities
- `tour-search`: Bỏ category filter khỏi search flow

## Impact

### Backend (panthora_be)
| File | Changes |
|------|---------|
| `TourEntity.cs` | Xóa `Category` property |
| `TourTranslationData.cs` | Xóa `Category` property |
| `SearchToursQuery.cs` | Xóa `Category` param, cache key, `GetResolvedCategory` method |
| `GetPublicToursQuery.cs` | Xóa `GetResolvedCategory` method và usage |
| `TourRepository.cs` | Xóa `category` param (2 methods) và category filter block |
| `ITourRepository.cs` | Xóa `category` param (2 method signatures) |
| `PublicHomeController.cs` | Xóa `category` query param |
| `PublicViewModels.cs` | Xóa `CategoryName` khỏi `SearchTourVm` |
| `PublicHomeControllerTests.cs` | Cập nhật test call |
| `AppDbContextModelSnapshot.cs` | Xóa Category property snapshot |
| `20260402200040_AddTourCategory` migration | Xóa migration file |

### Frontend (pathora/frontend)
| File | Changes |
|------|---------|
| `FilterSidebar.tsx` | Xóa `CATEGORY_OPTIONS`, `onCategoryToggle`, Category filter section |
| `FilterDrawer.tsx` | Xóa `onCategoryToggle` prop và Category section |
| `TourDiscoveryPage.tsx` | Xóa `selectedCategories`, `handleCategoryToggle`, API param |
| `homeService.ts` | Xóa `category?: string` parameter |
| `types/tour.ts` | Xóa `categoryName` khỏi `SearchTourVm` |
| `tourDiscoveryFilterIntegration.test.ts` | Xóa category-related tests |

### Breaking Changes
- Public tour search API không còn support `category` query parameter
- `SearchTourVm` response không còn `CategoryName` field
- Migration `AddTourCategory` cần xóa nếu chưa apply

### No data loss
- Column không tồn tại trong database
- Không có data thực tế bị mất

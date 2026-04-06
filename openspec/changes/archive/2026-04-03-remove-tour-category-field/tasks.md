## 1. Backend - Xóa TourEntity.Category

- [x] 1.1 Xóa `public string? Category { get; set; }` khỏi `TourEntity.cs`
- [x] 1.2 Xóa `public string? Category { get; set; }` khỏi `TourTranslationData.cs`
- [x] 1.3 Xóa `GetResolvedCategory` method khỏi `SearchToursQuery.cs` (và xóa usage line 86)
- [x] 1.4 Xóa `GetResolvedCategory` method khỏi `GetPublicToursQuery.cs` (và xóa usage line 60)
- [x] 1.5 Xóa category filter block trong `TourRepository.cs` (SearchTours: lines 391-403)
- [x] 1.6 Xóa `string? category` parameter khỏi `ITourRepository.cs` (2 methods: SearchTours và CountSearchTours)
- [x] 1.7 Xóa `string? Category` parameter khỏi `SearchToursQuery.cs` (constructor param)
- [x] 1.8 Cập nhật cache key trong `SearchToursQuery.cs` (xóa `:{Category}:` khỏi format string)

## 2. Backend - Xóa API Controller Parameter

- [x] 2.1 Xóa `[FromQuery] string? category` khỏi `PublicHomeController.cs` (SearchTours action)
- [x] 2.2 Cập nhật `Sender.Send()` call trong `PublicHomeController.cs` (bỏ category param)

## 3. Backend - Cập nhật ViewModel Response

- [x] 3.1 Xóa `CategoryName` khỏi `SearchTourVm` record (`PublicViewModels.cs`)
- [x] 3.2 Cập nhật `SearchToursQuery.cs` - bỏ `GetResolvedCategory` khỏi `new SearchTourVm(...)` call
- [x] 3.3 Cập nhật `GetPublicToursQuery.cs` - bỏ `GetResolvedCategory` khỏi `new SearchTourVm(...)` call

## 4. Frontend - Xóa Category Filter UI

- [x] 4.1 Xóa `CATEGORY_OPTIONS`, `onCategoryToggle` prop khỏi `FilterSidebar.tsx`
- [x] 4.2 Xóa Category filter section trong `FilterSidebar.tsx` (FilterSection + CheckboxGroup)
- [x] 4.3 Xóa `onCategoryToggle` prop và Category section khỏi `FilterDrawer.tsx`
- [x] 4.4 Xóa `selectedCategories` state, `handleCategoryToggle` handler trong `TourDiscoveryPage.tsx`
- [x] 4.5 Xóa `category: selectedCategories.join(",")` param trong `searchTours()` API call
- [x] 4.6 Xóa `onCategoryToggle={handleCategoryToggle}` prop truyền xuống FilterSidebar/FilterDrawer
- [x] 4.7 Xóa `category?: string` parameter khỏi `homeService.ts` `searchTours()`

## 5. Frontend - Cập nhật Types

- [x] 5.1 Xóa `categoryName: string` khỏi `SearchTourVm` type (`types/tour.ts`) — N/A: frontend SearchTourVm không có categoryName
- [x] 5.2 Kiểm tra `types/index.ts` line 609 - xóa `categoryName` nếu không cần — N/A: SalesByCategory.categoryName là type khác, không liên quan tour filter

## 6. Backend Tests

- [x] 6.1 Cập nhật `PublicHomeControllerTests.cs` - xóa `category: null` param trong `SearchTours` test call
- [x] 6.2 Kiểm tra các test files khác trong `tests/` có dùng `category` param — N/A: không tìm thấy test nào khác dùng category param

## 7. Migration Files (cleanup)

- [x] 7.1 Xóa migration `20260402200040_AddTourCategory` (nếu chưa apply)
- [x] 7.2 Cập nhật `AppDbContextModelSnapshot.cs` (xóa Category property)

## 8. Verify

- [x] 8.1 Build backend - verify không có lỗi ✓
- [x] 8.2 Build frontend - verify không có lỗi ✓
- [x] 8.3 Test GET `/api/admin/tour-management` trả về 200 — SKIPPED: service không chạy (port 5182)
- [x] 8.4 Test public tour search `/api/public/tours/search` hoạt động — SKIPPED: service không chạy (port 5182)

## Context

Property `Category` trên `TourEntity` là một free-text field lưu category name trực tiếp. Nó được sử dụng trong public tour search/filter để cho phép lọc tour theo category. Tuy nhiên, property này không có trong database schema, gây lỗi EF Core query.

## Goals / Non-Goals

**Goals:**
- Fix lỗi 500 error trên `/api/admin/tour-management`
- Xóa dead code không sử dụng
- Dọn dẹp category filter UI không hoạt động

**Non-Goals:**
- Không thêm tính năng category mới
- Không tạo database migration (column không tồn tại)
- Không ảnh hưởng đến classification hay các filter khác

## Decisions

### Decision 1: Xóa hoàn toàn hay thêm column?

**Chọn:** Xóa hoàn toàn

**Rationale:** Property `Category` là free-text không có cấu trúc. Nếu cần category system thực sự, nên dùng hierarchical tree như hệ thống Category đã có ở frontend. Việc giữ một text field không có validation không mang giá trị.

### Decision 2: Xóa category filter UI?

**Chọn:** Xóa hoàn toàn category filter khỏi UI

**Rationale:** Filter không có backend support, giữ lại chỉ gây confuse cho user. Các filter khác (classification, destination, price, etc.) vẫn hoạt động.

## Files to Modify

### Backend (panthora_be)
| File | Changes |
|------|---------|
| `TourEntity.cs` | Xóa line `public string? Category { get; set; }` |
| `TourTranslationData.cs` | Xóa line `public string? Category { get; set; }` |
| `SearchToursQuery.cs` | Xóa `Category` parameter, cache key, repository calls, `GetResolvedCategory` method |
| `GetPublicToursQuery.cs` | Xóa `GetResolvedCategory` usage và method |
| `TourRepository.cs` | Xóa category filter block (lines 391-403) |

### Frontend (pathora/frontend)
| File | Changes |
|------|---------|
| `TourDiscoveryPage.tsx` | Xóa `selectedCategories` state, `handleCategoryToggle`, và `category` param trong API call |
| `FilterSidebar.tsx` | Xóa `CATEGORY_OPTIONS`, `onCategoryToggle` prop, và Category filter section |
| `FilterDrawer.tsx` | Xóa `onCategoryToggle` prop và Category filter section |
| `homeService.ts` | Xóa `category?: string` parameter |
| `tourDiscoveryFilterIntegration.test.ts` | Xóa các test cases liên quan đến category |

## Migration Plan

1. Sửa backend trước (xóa property và code)
2. Sửa frontend (xóa filter UI và API params)
3. Build và verify không có lỗi
4. Test `/api/admin/tour-management` trả về 200
5. Test public tour search hoạt động không có category

## Open Questions

- **Q1:** Có nên giữ lại category options như một placeholder cho tương lai không? → **Quyết định: Không, xóa hoàn toàn.**
- **Q2:** Classification filter có bị ảnh hưởng không? → **Không, Classification là entity khác hoàn toàn.**

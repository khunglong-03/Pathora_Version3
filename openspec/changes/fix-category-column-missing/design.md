## Context

Lỗi `42703: column t.Category does not exist` xảy ra tại endpoint `/api/admin/tour-management`. Stack trace cho thấy:

```
TourRepository.FindAllAdmin → EF Core generate SELECT t."Category" FROM "Tours" AS t
```

Root cause: `TourEntity` có property `Category` (line 17) nhưng:
1. `TourConfiguration.cs` không có `.Property(t => t.Category)` mapping
2. Database table `Tours` không có column `Category`

Entity Framework Core vẫn include property vào SELECT query dù không được configured, dẫn đến PostgreSQL báo lỗi khi query chạy.

## Goals / Non-Goals

**Goals:**
- Fix 500 error trên `/api/admin/tour-management`
- Đồng bộ giữa entity model và database schema

**Non-Goals:**
- Không thay đổi business logic của tour management
- Không thiết kế lại feature Category (nếu có)
- Không migrate data hiện có

## Decisions

### Decision 1: Ignore property `Category` trong EF Configuration

**Chọn:** Thêm `.Property(t => t.Category).HasColumnName("Category").HasMaxLength(200)` vào `TourConfiguration.cs` + tạo migration thêm column

**Alternatives considered:**
- **Xóa property `Category` khỏi entity**: Không recommended vì có thể gây breaking change cho code khác đang dùng property này
- **Ignore property hoàn toàn**: `[NotMapped]` attribute - không lưu gì xuống DB

**Rationale:** Giữ property và thêm migration là cách an toàn nhất - đồng bộ schema mà không break code.

### Decision 2: Migration approach

**Chọn:** EF Core migration với `dotnet ef migrations add`

**Migration content:**
```csharp
migrationBuilder.AddColumn<string>(
    name: "Category",
    table: "Tours",
    type: "character varying(200)",
    nullable: true);
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Column tồn tại với giá trị NULL | Cho phép NULL (`nullable: true`) - property trong entity là `string?` |
| Migration fail nếu table lớn | Migration không dangerous, chỉ thêm column đơn giản |
| EF Core cache cũ | Clear application cache (invalidate cache key `Admin:tour-management:*`) |

## Migration Plan

1. Tạo migration: `dotnet ef migrations add AddCategoryToTours`
2. Review migration file trước khi apply
3. Apply: `dotnet ef database update`
4. Restart backend service để clear cache
5. Verify: GET `/api/admin/tour-management` trả về 200

**Rollback:** `dotnet ef migrations remove` nếu cần revert

## Open Questions

- **Q1:** Property `Category` có đang được sử dụng ở đâu khác trong codebase không? Cần search toàn bộ.
- **Q2:** Column `Category` nên có giá trị default không? Hiện tại entity cho phép null.
- **Q3:** Có cần tạo index trên column `Category` không? Tùy use case search/filter.

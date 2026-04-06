## 1. Add EF Core Configuration for Category

- [ ] 1.1 Thêm `.Property(t => t.Category)` vào `TourConfiguration.cs`
- [ ] 1.2 Verify property type là `string?` với max length 200

## 2. Create Database Migration

- [ ] 2.1 Tạo EF Core migration: `dotnet ef migrations add AddCategoryToTours`
- [ ] 2.2 Review migration file trước khi apply
- [ ] 2.3 Apply migration: `dotnet ef database update`

## 3. Verify Fix

- [ ] 3.1 Restart backend service
- [ ] 3.2 Test GET `/api/admin/tour-management` trả về 200
- [ ] 3.3 Verify frontend Tour List page load đúng data

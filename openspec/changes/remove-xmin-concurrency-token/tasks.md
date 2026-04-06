## 1. Code Changes

- [x] 1.1 Remove `RowVersion` property from `TourEntity.cs` (src/Domain/Entities/)
- [x] 1.2 Remove `xmin` column configuration from `TourConfiguration.cs` (src/Infrastructure/Data/Configurations/)
- [x] 1.3 Update `TourService.Update` to catch `DbUpdateConcurrencyException` and return `ErrorOr.Conflict`
- [x] 1.4 Add `If-Unmodified-Since` header check to `TourController.Update` method (optional, return 409 if mismatch)
- [x] 1.5 Review `TourRepository.UpdateStatus` — ensure it doesn't rely on `RowVersion` (already doesn't, just verify)

## 2. Database Migration

Migration được chạy **thủ công** sau khi code thay đổi, giống cách `xmin` được thêm ban đầu. Không tự động apply trên startup.

- [x] 2.1 Run `dotnet ef migrations add RemoveTourXminConcurrencyToken` in `panthora_be/src/Infrastructure` — tạo migration mới với Down() để drop `xmin` column
- [x] 2.2 Review generated migration — đảm bảo Down() chỉ có `DROP COLUMN xmin FROM "Tours"`
- [x] 2.3 **Đã verify qua SQL**: `xmin` không tồn tại trong `Tours` table — database đã đúng schema
- [x] 2.4 **Đã verify**: DB có `Tours` và `TourInstances` đều không có `xmin`; snapshot đã được update để match

## 3. Verification

- [ ] 3.1 Test single tour update — verify save succeeds without `xmin`
- [ ] 3.2 Test concurrent tour updates — verify no 500 errors, second request succeeds with updated data
- [ ] 3.3 Test `UpdateStatus` — verify status change works independently
- [ ] 3.4 Verify `If-Unmodified-Since` returns 409 when tour was modified (if implemented)

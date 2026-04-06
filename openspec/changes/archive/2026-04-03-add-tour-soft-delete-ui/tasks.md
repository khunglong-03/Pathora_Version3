## 1. Backend Security Fix

- [x] 1.1 Thêm `[Authorize(Roles = "Admin")]` vào endpoint `DELETE /api/tour/{id}/purge` trong `TourController.cs` — thay thế `[AllowAnonymous]`

## 2. Frontend — TourListPage Delete Button

- [x] 2.1 Thêm state `showDeleteConfirm`, `selectedTourId`, `selectedTourName` vào `TourListPage.tsx`
- [x] 2.2 Thêm nút Delete (trash icon) vào cột Actions, sau nút Edit
- [x] 2.3 Thêm `<ConfirmationDialog>` với `active={showDeleteConfirm}`, `onConfirm` gọi `handleDelete`, `message` hiển thị tên tour
- [x] 2.4 Thêm function `handleDelete(id)`: gọi `tourService.deleteTour(id)`, show success toast, refresh danh sách
- [x] 2.5 Thêm error handling trong `handleDelete`: show error toast nếu fail

## 3. Verify & Test

- [ ] 3.1 Verify i18n keys `tourAdmin.confirmDelete.*` và `tourAdmin.deleteSuccess`/`deleteError` đã tồn tại trong cả `en.json` và `vi.json`
- [ ] 3.2 Chạy lint/build frontend không có lỗi
- [x] 3.3 Test end-to-end: vào `/tour-management`, click Delete, confirm, verify tour biến mất khỏi danh sách

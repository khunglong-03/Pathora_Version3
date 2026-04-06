## Context

Table `Tour` trong database có sẵn thuộc tính `IsDeleted (bool, default: false)`. Backend đã implement đầy đủ:
- `TourEntity.SoftDelete(performedBy)` method
- Cascade soft-delete qua `TourService.Delete()` xuống tất cả nested entities
- Repository query filter `!IsDeleted` trên tất cả methods
- Endpoint `DELETE /api/tour/{id}` gọi cascade soft-delete
- Endpoint `DELETE /api/tour/{id}/purge` (hard delete) — **hiện đang là `[AllowAnonymous]` (security concern)**

Frontend:
- `TourListPage.tsx` — bảng quản lý tour tại `/tour-management`, có 2 nút Action (View, Edit), **thiếu Delete**
- `tourService.deleteTour(id)` — đã tồn tại, chưa được sử dụng
- `ConfirmationDialog.tsx` — component có sẵn với i18n keys `tourAdmin.confirmDelete.*`

## Goals / Non-Goals

**Goals:**
- Thêm nút Delete vào cột Actions của `TourListPage.tsx`
- Sử dụng `ConfirmationDialog` component có sẵn (với i18n)
- Refresh danh sách tour sau khi xóa thành công
- Khóa endpoint `DELETE /api/tour/{id}/purge` bằng `[Authorize]`

**Non-Goals:**
- Không thêm tính năng restore (khôi phục tour đã xóa)
- Không thêm "Thùng rác" / trash view
- Không thêm cascade delete cho TourInstance
- Không thay đổi logic backend soft-delete (đã hoạt động)

## Decisions

### D1: Sử dụng ConfirmationDialog có sẵn

**Chọn:** Dùng `ConfirmationDialog` từ `src/components/ui/ConfirmationDialog.tsx`

**Lý do:** Component đã tồn tại, có i18n keys sẵn cho `tourAdmin.confirmDelete.title/message/confirm/cancel`, style đã match với design system. Không cần tạo mới.

**Fallback:** Nếu cần custom, có thể dùng `Modal` component nhưng ưu tiên dùng có sẵn.

### D2: Refresh danh sách sau delete

**Chọn:** Gọi lại `fetchTours()` sau khi delete thành công

**Lý do:** Repository query đã filter `!IsDeleted`, nên tour bị xóa sẽ tự động biến mất khỏi danh sách mà không cần xử lý state phức tạp. Pattern này đã được dùng ở các chỗ khác (ví dụ: create/update tour).

### D3: Không thêm trạng thái "Deleted" vào bảng

**Chọn:** Không thêm cột trạng thái, tour đã xóa không hiển thị trong bảng

**Lý do:** Đây là soft-delete thông thường. Nếu cần restore trong tương lai, sẽ thêm sau. Giữ scope nhỏ cho lần này.

### D4: Purge endpoint — lock down với Authorize

**Chọn:** Thêm `[Authorize(Roles = "Admin")]` vào `DELETE /api/tour/{id}/purge`

**Lý do:** Endpoint hard delete hiện đang `[AllowAnonymous]` — ai cũng có thể xóa vĩnh viễn bất kỳ tour nào. Cần khóa lại ngay.

## Component Changes

### Frontend: TourListPage.tsx

```
Triggers (state):
- showDeleteConfirm: boolean
- selectedTourId: string | null
- selectedTourName: string

Actions:
1. Thêm nút Delete (trash icon) vào div.actions (sau nút Edit)
2. onClick → set showDeleteConfirm(true), selectedTourId(tour.id), selectedTourName(tour.tourName)
3. Thêm <ConfirmationDialog> với:
   - active={showDeleteConfirm}
   - onClose={() => setShowDeleteConfirm(false)}
   - onConfirm={() => handleDelete(selectedTourId)}
   - title={t("tourAdmin.confirmDelete.title")}
   - message={`${t("tourAdmin.confirmDelete.message")}\n"${selectedTourName}"?`}
4. handleDelete(id):
   - gọi deleteTour(id)
   - toast.success(t("tourAdmin.deleteSuccess", "Tour deleted successfully"))
   - setShowDeleteConfirm(false)
   - fetchTours() // refresh
   - catch: toast.error(...)
```

### Backend: TourController.cs

```
- Tìm method PurgeTour (DELETE /api/tour/{id}/purge)
- Thay [AllowAnonymous] → [Authorize(Roles = "Admin")]
```

## Migration Plan

1. Deploy backend: Thay đổi `[AllowAnonymous]` → `[Authorize]`
2. Deploy frontend: Thêm nút Delete + ConfirmationDialog
3. Không cần migration database — `IsDeleted` column đã tồn tại
4. Rollback: Revert code changes (soft-delete reversible bằng tay qua DB nếu cần)

## Open Questions

1. **i18n keys** — `tourAdmin.confirmDelete.*` keys đã tồn tại trong ConfirmationDialog. Cần verify chúng có trong file locale hay chưa, hay ConfirmationDialog dùng fallback text?
2. **Xóa TourInstance khi xóa Tour** — cascade soft-delete hiện tại không xóa các TourInstance của tour đó. Cần quyết định có thêm không (non-goal cho lần này).

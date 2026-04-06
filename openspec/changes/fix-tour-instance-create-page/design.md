## Context

Trang `/tour-instances/create` là bước đầu tiên trong workflow tạo tour instance. Hiện tại form Step 2 có nhiều vấn đề:

```
Step 2 hiện tại:
├─ Basic Info          → Title, InstanceType ✓
├─ Schedule & Pricing  → StartDate, EndDate, MaxParticipation, BasePrice ✓
│                       → Location ✗ (bỏ)
│                       → ConfirmationDeadline ✗ (bỏ)
├─ Guide               → Lấy TẤT CẢ users, không filter ✗
├─ Services            → Checkboxes ✓
├─ Media               → ThumbnailUrl, ImageUrls ✗ (không auto-fill)
└─ Itinerary Preview   → Read-only từ template ✗ (không thêm ngày mới)
```

Ngoài ra, trang detail (`/tour-instances/[id]`) hiện có UI để xem itinerary nhưng chưa có chức năng thêm ngày mới — chỉ edit được ngày đã clone từ template.

## Goals / Non-Goals

**Goals:**
- Bỏ 2 field không cần thiết (ConfirmationDeadline, Location) khỏi form tạo instance
- Guide dropdown chỉ hiển thị users có role "TourGuide"
- Images tự động pre-fill từ tour khi chọn classification
- Admin có thể thêm ngày mới (custom, không từ template) vào itinerary của instance đã active

**Non-Goals:**
- Không thay đổi trang public tour instance
- Không tạo bảng riêng cho activities — giữ reference về TourDayEntity template
- Không sửa cấu trúc database (không migration)
- Không thêm chức năng upload file — chỉ làm việc với URL string cho images
- Không thay đổi flow clone InstanceDays từ template khi tạo instance

## Decisions

### D1: Bỏ ConfirmationDeadline và Location — chỉ ở Command và Service, giữ Entity

**Chọn:** Chỉ bỏ khỏi `CreateTourInstanceCommand` và logic truyền trong `TourInstanceService.Create()`. **KHÔNG sửa `TourInstanceEntity.Create()`** — giữ nguyên entity vì có thể cần trong tương lai hoặc các nghiệp vụ khác.

**Lý do:**
- `CreateTourInstanceService.Create()` hiện tại nhận `ConfirmationDeadline` và `Location` từ command rồi truyền vào entity. Cần bỏ việc truyền 2 trường này vào entity.
- `TourInstanceEntity` giữ nguyên các field này vì: (1) không cần migration, (2) có thể cần cho nghiệp vụ khác, (3) không ảnh hưởng existing code.

**Implementation:**
```csharp
// TourInstanceService.Create() — KHÔNG truyền location/confirmationDeadline vào entity nữa
var entity = TourInstanceEntity.Create(
    ...
    // location: request.Location,  ← BỎ
    // confirmationDeadline: request.ConfirmationDeadline,  ← BỎ
    ...);
```

**Alternative:** Xóa luôn khỏi entity/database.
- Drawback: breaking change lớn, cần migration, ảnh hưởng code khác.

### D2: Guide dropdown — filter tại backend, trả về user list đã lọc

**Chọn:** Thêm query parameter `role` vào `GET /api/users?role=TourGuide`, trả về danh sách users có role "TourGuide".

**Lý do:**
- Giữ API users gốc không đổi (thêm param, không break existing calls)
- Filter tại database level qua JOIN với bảng UserRoles
- Frontend chỉ cần gọi endpoint có param, filter logic ở backend
- Đã confirm: seed data có `role.json` với `Name = "TourGuide"` (Type = 7) ✓

**Cách implement:**
- Thêm `roleName?: string` vào `GetAllUsersQuery`
- Trong `UserService.GetAll()`: nếu có roleName → JOIN với UserRoles/Roles để filter
- Dùng `IRoleRepository.FindByNameAsync()` hoặc tương đương

**Alternative A:** Filter trên frontend từ danh sách users hiện tại.
- Drawback: N+1 problem — phải load TẤT CẢ users rồi filter, không efficient.

**Alternative B:** Tạo endpoint `/api/tour-guides` hoàn toàn riêng, trả về từ bảng `TourGuideEntity`.
- Drawback: Bảng TourGuideEntity và UserEntity là 2 bảng riêng. Nếu muốn user avatar/name từ UserEntity → cần JOIN phức tạp.

### D3: Images auto-fill — pre-populate từ tourDetail, cho phép override

**Chọn:** Khi `tourDetail` được set (sau khi chọn tour + classification), tự động set `form.thumbnailUrl` và `form.imageUrls` từ `tourDetail.thumbnail` và `tourDetail.images`.

**Lý do:**
- Admin có thể thấy ngay images của tour, giảm thao tác nhập tay
- Vẫn cho phép override — form vẫn editable

**Cách implement:**
```typescript
// Trong useEffect khi tourDetail thay đổi (sau khi chọn tour)
useEffect(() => {
  if (tourDetail) {
    updateField("thumbnailUrl", tourDetail.thumbnail?.publicURL ?? "");
    updateField("imageUrls", tourDetail.images?.map(i => i.publicURL).filter(Boolean) ?? []);
  }
}, [tourDetail]);
```

**Lưu ý:** Nếu `tourDetail.images` có thể rỗng, chỉ set khi có data.

### D4: Thêm ngày mới (custom day) — khi nào, ở đâu, cách nào

**Khi nào:** Chỉ khi `TourInstance.Status = Available` (tương đương "Active" trong business logic).

**Ở đâu:**
- Không phải trên trang Create — vì instance chưa tồn tại khi đang tạo
- Trên trang detail `/tour-instances/[id]` — sau khi instance được tạo với status Available

**Cách hoạt động:**
```
Trang detail → Itinerary section
  ├─ Danh sách InstanceDays (clone từ template) → có thể edit
  ├─ Danh sách CustomDays (tourDayId = NULL)     → có thể edit + delete
  └─ Nút "Thêm ngày"                             → chỉ hiển thị khi status = Available
        ↓
  Form inline → nhập: title, actualDate, description
        ↓
  POST /api/tour-instance/{id}/days
        ↓
  Backend: tạo TourInstanceDayEntity mới với:
    - TourInstanceId = instance.Id
    - TourDayId = NULL (custom, không reference template)
    - InstanceDayNumber = auto-increment từ max existing + 1
    - Title, ActualDate, Description từ request
        ↓
  Frontend: reload itinerary, hiển thị ngày mới
```

### D5: Backend endpoint cho custom day

**Chọn:** `POST /api/tour-instance/{id}/days` với payload:
```json
{
  "title": "Tham quan theo yêu cầu khách",
  "actualDate": "2026-04-15",
  "description": "Ngày tùy chỉnh theo yêu cầu"
}
```

**Lý do:**
- RESTful: POST /days = tạo ngày mới trong resource days
- Các endpoint đã có: `PUT /days/{dayId}` (update), endpoint mới sẽ thêm ngày
- Không cần tạo bảng riêng — `TourInstanceDayEntity.TourDayId` đã nullable (cascade reference optional)

**Validation:**
- InstanceId phải tồn tại và có status = Available
- Title không rỗng
- ActualDate phải nằm trong khoảng instance.StartDate → instance.EndDate (hoặc cho phép ngoài range)
- InstanceDayNumber = MAX(existing InstanceDayNumber) + 1

## Risks / Trade-offs

[Risk] Bỏ ConfirmationDeadline/Location ở form nhưng giữ trong database
→ **Mitigation:** Nếu sau này cần, chỉ cần thêm lại vào form. Không ảnh hưởng data hiện có.

[Risk] TourGuide role filter — role name không đúng trong database
→ **Mitigation:** Check seed data để confirm role name là "TourGuide" (Type = 7). Nếu khác, điều chỉnh filter query.

[Risk] Custom day với TourDayId = NULL có thể ảnh hưởng đến code existing đọc instance days
→ **Mitigation:** Code đọc itinerary hiện tại (`days[].tourDay`) sẽ trả về null cho custom days. Cần check frontend render có handle null `tourDay` không. Nếu không, thêm null-check.

[Risk] Images auto-fill — nếu tour có rất nhiều images (50+), pre-fill có thể chậm
→ **Mitigation:** Giới hạn số images auto-fill (VD: chỉ lấy 10 images đầu tiên). Admin vẫn thêm/bớt được.

## Migration Plan

1. **Frontend**: Bỏ Location + ConfirmationDeadline inputs → build xác nhận
2. **Backend**: Thêm filter role vào GetAllUsersQuery → test manual
3. **Frontend**: Cập nhật Guide dropdown gọi API mới → test manual
4. **Frontend**: Thêm auto-fill images → test manual
5. **Backend**: Tạo AddCustomDayCommand + Handler + Endpoint → build
6. **Frontend**: Thêm UI "Thêm ngày" trên trang detail → test E2E

Không cần database migration vì:
- ConfirmationDeadline/Location đã có trong DB (chỉ bỏ ở form/create flow)
- TourInstanceDayEntity.TourDayId đã nullable

## Open Questions

1. ~~**Role name**: Đã xác nhận "TourGuide" là đúng role name (seed: `role.json` → `Name = "TourGuide"`).~~ **RESOLVED.**

2. **Custom day InstanceDayNumber**: Tính tự động bằng `MAX(existing) + 1` — đã quyết định trong design.

3. **Custom day trên Create page**: Không cần — chỉ thêm ngày được phép sau khi instance đã tạo (trên trang detail). **RESOLVED.**

4. **ConfirmationDeadline/Location bỏ ở Command nhưng giữ ở Entity**: Có cần đánh dấu là optional/nullable trong Entity không? Hiện tại entity nhận 2 params bắt buộc nhưng service không truyền → có thể compile nhưng logic hơi lạ. Có thể sửa entity sau nếu cần. **DEFER — không block implementation.**

5. **Delete custom day**: Có cần thêm endpoint `DELETE /api/tour-instance/{id}/days/{dayId}` để xóa custom day không? Spec hiện tại không có, nhưng nếu admin tạo sai thì sao? **DEFER — implement sau nếu cần.**

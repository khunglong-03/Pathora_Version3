## Context

Khi tạo tour instance, backend đã clone `InstanceDays` từ `Classification.Plans` (TourDayEntity) — bao gồm day header info (title, description, actualDate). Activities bên trong mỗi ngày **không được clone riêng** mà chỉ reference ngược về `TourDayEntity` gốc qua `TourDayId`.

```
TourInstance
  └── InstanceDays[]
        └── TourDayId ──────▶ TourDayEntity (template)
              └── Activities[]

Admin không có UI để xem/edit activities.
```

**Hiện trạng phía admin:**
- `CreateTourInstancePage` — chỉ có form cơ bản, không preview itinerary, không upload images được
- `FindByIdWithInstanceDays` repository — thiếu eager-load activities → admin detail page không hiển thị activities
- Không có endpoint update per-day hoặc per-activity
- `POST /api/tour-instance` trả về đầy đủ `TourInstanceDto` nhưng frontend chỉ lấy ID rồi fetch lại bằng GET thứ 2

**Hiện trạng phía public:**
- `TourInstancePublicDetailPage` — đã hiển thị itinerary đầy đủ vì `FindPublicById` load đủ hierarchy

## Goals / Non-Goals

**Goals:**
- Admin có thể xem full itinerary (days + activities) trên trang detail tour instance
- Admin có thể chỉnh sửa thông tin header ngày (title, description, actualDate, time, note)
- Admin có thể cập nhật thông tin activity (thời gian, ghi chú, optional flag)
- Preview itinerary ngay trên màn tạo tour instance
- Upload images ngay lúc tạo tour instance (không cần tạo xong rồi update)
- Loại bỏ HTTP request redundant (dùng lại POST response)

**Non-Goals:**
- Không cho phép xóa/thêm activities mới — chỉ edit thông tin activity hiện có
- Không thay đổi trang public tour instance (chỉ đọc, không sửa)
- Không tạo bảng `TourInstanceActivity` riêng — activities vẫn reference về `TourDayEntity` gốc
- Không thay đổi cấu trúc database
- Không sửa API wrapper structure (backend `ResultSharedResponse` vs frontend `ApiResponse`) — low-risk, JS hoạt động nhờ loose typing

## Decisions

### D1: Activities vẫn reference template, không clone riêng

**Chọn:** Giữ nguyên cấu trúc hiện tại — activities vẫn nằm trong `TourDayEntity` gốc, `InstanceDay` chỉ có `TourDayId`.

**Lý do:**
- Classification là template, nhiều instance có thể share cùng template → tiết kiệm storage.
- Admin chỉ cần "override" thông tin hiển thị (note, time, optional flag) cho từng instance → không cần bảng riêng.
- Nếu sau này cần clone riêng hoàn toàn, có thể migrate lên bảng `TourInstanceActivityEntity` — nhưng hiện tại chưa cần.

**Alternative:** Clone activities sang bảng `TourInstanceActivityEntity` riêng.
- Drawback: Phức tạp hơn, cần migration, sync khi template thay đổi.

### D2: Backend endpoint design — patch-style thay vì full replace

**Chọn:** Dùng `PUT` cho day header, `PATCH` cho activity properties.

**Lý do:**
- Day header có nhiều trường cần update cùng lúc → `PUT /days/{dayId}` với full payload.
- Activity chỉ cần update vài trường (note, time, optional flag) → `PATCH /days/{dayId}/activities/{activityId}` chỉ với changed fields.
- Nếu activity cần override title/description → có thể mở rộng payload sau.

### D3: Activities được phép sửa note, time, optional flag

**Chọn:** Chỉ cho phép edit: `note`, `startTime`, `endTime`, `isOptional`.

**Lý do:**
- Title, description của activity là template content — không nên sửa vì sẽ ảnh hưởng tất cả instance dùng cùng classification.
- `note` là nơi admin ghi chú riêng cho instance này (VD: "Khách yêu cầu thêm 30 phút ở địa điểm này").
- `startTime`/`endTime` là giờ cụ thể cho instance này.
- `isOptional` đánh dấu activity có bắt buộc không.

### D4: Preview itinerary trên CreateTourInstancePage

**Chọn:** Thêm collapsible section "Itinerary Preview" ở Step 2, hiển thị tree: Day 1 → activities list.

**Lý do:**
- Admin biết trước itinerary sẽ được clone, giảm confusion.
- Read-only preview, không cần thêm API call vì `TourDto` (đã được fetch khi chọn classification) đã chứa `plans: TourDayDto[]`.
- UX tốt hơn khi preview collapsible để form không quá dài.

### D5: imageUrls ngay lúc tạo instance

**Chọn:** Thêm `imageUrls` vào `CreateTourInstanceCommand`, `CreateTourInstancePayload`, và `TourInstanceEntity.Create()` — cho phép set images ngay lúc tạo.

**Lý do:**
- Hiện tại `images` luôn là `null` khi tạo → phải tạo xong rồi UPDATE mới thêm được images.
- Một số workflow cần images sẵn ngay từ đầu (VD: preview trên listing page).
- Thêm field đơn giản, không cần migration, backward-compatible.

**Lưu ý:**
- Image upload vẫn cần image hosting service (URL string, không upload file trực tiếp)
- UI trong section Media sẽ là text input (URL) hoặc kéo theo existing image service nếu có

### D6: Dùng lại POST response thay vì redundant GET

**Chọn:** `createInstance()` trong `tourInstanceService.ts` trả về `TourInstanceDto` thay vì chỉ ID string. Trang redirect dùng luôn data này thay vì fetch lại.

**Lý do:**
- Backend trả về đầy đủ `TourInstanceDto` với 201 Created — bao gồm tất cả fields, days, managers, images.
- Frontend hiện tại extract `{ value: string }` và bỏ đi ~20 fields quan trọng.
- Redirect page (`/tour-instances/${id}`) gọi GET `/api/tour-instance/{id}` để fetch lại đúng data vừa bị discard.
- Fix: thay đổi `createInstance()` trả về `TourInstanceDto`, truyền qua sessionStorage hoặc URL state, detail page dùng trực tiếp.

**Trade-off:**
- Nếu instance được tạo từ chỗ khác (API direct call), vẫn cần GET để lấy data.
- sessionStorage có limit ~5MB, đủ cho `TourInstanceDto` (thường < 50KB).

### D7: API response wrapper không cần sửa

**Chọn:** Không sửa `ResultSharedResponse<T>` (backend) hay `ApiResponse<T>` (frontend) vì:

- Backend dùng `Data` (PascalCase), frontend dùng `data` (camelCase) — JS property lookup hoạt động.
- `errors` structure khác nhau (`List<ErrorResult>` vs `Array<{errorMessage, details}>`) — nhưng hiện tại errors không dùng ở chỗ này.
- Fixing wrapper alignment là breaking change cho toàn bộ API, không nằm trong scope change này.

## Risks / Trade-offs

[Risk] Admin sửa note/time nhưng template gốc thay đổi sau đó
→ **Mitigation:** Activities reference theo `TourDayId`, không theo snapshot. Nếu template thay đổi → instance activities cũng thay đổi. Nếu cần snapshot riêng, có thể thêm `TourInstanceActivityEntity` sau.

[Risk] `FindByIdWithInstanceDays` không load activities → detail page trống
→ **Mitigation:** Fix eager loading trong repository. Việc này đơn giản nhưng quan trọng.

[Risk] Frontend admin detail page chưa tồn tại
→ **Mitigation:** Tạo `TourInstanceDetailPage.tsx` mới hoặc extend existing page nếu có.

[Risk] POST response lớn qua sessionStorage
→ **Mitigation:** `TourInstanceDto` thường < 50KB, well within 5MB limit. Nếu > 5MB, fallback về GET request.

## Migration Plan

1. **Backend**: Fix repository eager-load activities (low risk, chỉ fix query)
2. **Backend**: Thêm `imageUrls` vào `CreateTourInstanceCommand` và entity creation
3. **Backend**: Thêm `UpdateTourInstanceDayCommand` + handler + endpoint
4. **Backend**: Thêm `UpdateTourInstanceActivityCommand` + handler + endpoint
5. **Frontend**: Thêm `UpdateInstanceDay` + `UpdateInstanceActivity` API methods
6. **Frontend**: Thêm itinerary preview + images UI trên `CreateTourInstancePage`
7. **Frontend**: Tối ưu `createInstance()` — dùng lại POST response, loại bỏ redundant GET
8. **Frontend**: Tạo/admin detail page với itinerary editing UI
9. Test end-to-end: tạo instance → preview itinerary + images → redirect dùng POST data → sửa note/time → verify public page hiển thị đúng

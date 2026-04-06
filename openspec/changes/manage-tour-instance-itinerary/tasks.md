## 1. Backend — Fix Repository Eager Loading

- [ ] 1.1 Sửa `FindByIdWithInstanceDays` trong `TourInstanceRepository.cs` — thêm `.ThenInclude(d => d.TourDay).ThenInclude(td => td.Activities).ThenInclude(a => a.Routes).ThenInclude(a => a.Accommodation)` để load đầy đủ activities hierarchy cho admin
- [ ] 1.2 Build backend xác nhận không lỗi

## 2. Backend — Add imageUrls to Create Instance

- [ ] 2.1 Thêm `imageUrls?: List<string>` vào `CreateTourInstanceCommand.cs`
- [ ] 2.2 Cập nhật `TourInstanceService.Create` — truyền `imageUrls` vào `TourInstanceEntity.Create()` thay vì `images: null`
- [ ] 2.3 Build xác nhận không lỗi

## 3. Backend — Update Instance Day Endpoint

- [ ] 3.1 Tạo `UpdateTourInstanceDayCommand` record trong `panthora_be/src/Application/Features/TourInstance/Commands/`
- [ ] 3.2 Tạo `UpdateTourInstanceDayHandler` xử lý update `TourInstanceDayEntity` (title, description, actualDate, startTime, endTime, note)
- [ ] 3.3 Thêm `PUT /api/tour-instance/{id}/days/{dayId}` endpoint trong `TourInstanceController`
- [ ] 3.4 Thêm validation: `title` không rỗng, `actualDate` hợp lệ
- [ ] 3.5 Build xác nhận không lỗi

## 4. Backend — Update Activity Endpoint

- [ ] 4.1 Tạo `UpdateTourInstanceActivityCommand` record (các trường nullable: `note`, `startTime`, `endTime`, `isOptional`)
- [ ] 4.2 Tạo `UpdateTourInstanceActivityHandler` xử lý partial update trên `TourDayActivityEntity`
- [ ] 4.3 Thêm `PATCH /api/tour-instance/{id}/days/{dayId}/activities/{activityId}` endpoint trong `TourInstanceController`
- [ ] 4.4 Build xác nhận không lỗi

## 5. Frontend — API Service Methods

- [ ] 5.1 Thêm `updateInstanceDay(instanceId, dayId, payload)` → `PUT /api/tour-instance/{id}/days/{dayId}`
- [ ] 5.2 Thêm `updateInstanceActivity(instanceId, dayId, activityId, payload)` → `PATCH /api/tour-instance/{id}/days/{dayId}/activities/{activityId}`
- [ ] 5.3 Thêm `imageUrls?: string[]` vào `CreateTourInstancePayload` (để gửi cùng lúc lúc tạo)
- [ ] 5.4 Đổi `createInstance()` return type từ `string | null` thành `TourInstanceDto | null` — dùng lại full response từ POST thay vì chỉ lấy ID

## 6. Frontend — Itinerary Preview + Images UI on Create Page

- [ ] 6.1 Trong `CreateTourInstancePage.tsx`, thêm collapsible "Itinerary Preview" section ở cuối Step 2
- [ ] 6.2 Render tree: list các ngày từ `selectedClassification?.plans`, mỗi ngày expand ra list activities
- [ ] 6.3 Trong section Media, thêm text input cho `imageUrls` (hỗ trợ nhiều URL, cách nhau bằng newline hoặc comma)
- [ ] 6.4 Images preview: hiển thị thumbnail đã upload
- [ ] 6.5 Verify: chọn classification → preview hiển thị đúng itinerary, không cần thêm API call

## 7. Frontend — POST Response Reuse (Eliminate Redundant GET)

- [ ] 7.1 Sửa `createInstance()` trong `tourInstanceService.ts` — trả về `TourInstanceDto` (extract từ response.Data)
- [ ] 7.2 Trong `CreateTourInstancePage.tsx`, sau khi tạo thành công — lưu `TourInstanceDto` vào `sessionStorage` với key `"tourInstanceCreated"`
- [ ] 7.3 Trang detail `/tour-instances/[id]/page.tsx` — đọc từ `sessionStorage` trước, nếu có thì dùng trực tiếp thay vì gọi `getInstanceDetail()`
- [ ] 7.4 Fallback: nếu sessionStorage empty hoặc expired → gọi GET như bình thường
- [ ] 7.5 Verify: tạo instance → redirect → trang detail hiển thị ngay không có loading spinner cho data

## 8. Frontend — Admin Detail Page Itinerary Editing

- [ ] 8.1 Kiểm tra xem trang detail tour instance đã tồn tại chưa — nếu chưa thì tạo mới tại `pathora/frontend/src/app/(dashboard)/tour-instances/[id]/page.tsx`
- [ ] 8.2 Thêm tab/section "Itinerary" hiển thị list các ngày với activities (đọc từ `days[].tourDay.activities`)
- [ ] 8.3 Mỗi day header có inline edit form: title, description, actualDate, startTime, endTime, note → gọi `updateInstanceDay`
- [ ] 8.4 Mỗi activity có inline edit cho `note`, `startTime`, `endTime`, `isOptional` → gọi `updateInstanceActivity`
- [ ] 8.5 Verify: activities hiển thị đầy đủ sau khi fix repository (section 1), edit hoạt động, public page hiển thị đúng

## 9. E2E Testing

- [ ] 9.1 Tạo tour instance mới → verify Itinerary Preview hiển thị đúng itinerary (days + activities)
- [ ] 9.2 Tạo tour instance mới → verify images upload hoạt động (nếu có imageUrls)
- [ ] 9.3 Tạo tour instance → redirect → trang detail hiển thị ngay (không có loading data)
- [ ] 9.4 Mở trang detail tour instance → verify activities hiển thị đầy đủ
- [ ] 9.5 Sửa note trên một activity → save → verify API trả về 200 → refresh → data persist
- [ ] 9.6 Sửa day title → save → verify public page hiển thị title mới
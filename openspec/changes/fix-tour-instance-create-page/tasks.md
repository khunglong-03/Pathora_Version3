## 1. Backend — Remove ConfirmationDeadline & Location from Create Command

- [x] 1.1 Xóa `ConfirmationDeadline` và `Location` khỏi `CreateTourInstanceCommand.cs`
- [x] 1.2 Cập nhật `TourInstanceService.Create()` — xóa việc truyền 2 trường này vào entity (KHÔNG sửa `TourInstanceEntity.Create()` — giữ nguyên entity vì có thể cần sau)
- [x] 1.3 Build backend xác nhận không lỗi

## 2. Backend — Add Role Filter to GetAllUsersQuery

- [x] 2.1 Thêm `roleName?: string` parameter vào `GetAllUsersQuery.cs`
- [x] 2.2 Kiểm tra `IRoleRepository` có method `FindByNameAsync()` chưa — nếu chưa, tạo method để lấy RoleEntity theo name
- [x] 2.3 Cập nhật `UserService.GetAll()` — khi có roleName:
  - Lấy RoleEntity theo name = "TourGuide"
  - Dùng `IRoleRepository.FindByUserIds()` hoặc thêm logic JOIN với bảng UserRoles để filter users
  - Nếu không có roleName → trả tất cả (không thay đổi behavior hiện tại)
- [x] 2.4 Cập nhật `UserController.GetAll()` — thêm `[FromQuery] string? role = null`, truyền vào query
- [x] 2.5 Build backend xác nhận không lỗi
- [x] 2.6 Verify: gọi `GET /api/users?role=TourGuide` → chỉ trả về users có role TourGuide

## 3. Backend — Add CreateCustomDay Endpoint

- [x] 3.1 Tạo `CreateTourInstanceDayCommand.cs` record với fields:
  - `InstanceId: Guid`
  - `Title: string`
  - `DateOnly ActualDate`
  - `Description?: string`
- [x] 3.2 Tạo `CreateTourInstanceDayCommandValidator` — validate: InstanceId, Title (not empty), ActualDate
- [x] 3.3 Tạo `CreateTourInstanceDayCommandHandler` — gọi `ITourInstanceService.AddCustomDay()`
- [x] 3.4 Thêm `AddCustomDay()` vào `ITourInstanceService` interface
- [x] 3.5 Kiểm tra `ITourInstanceRepository` có method `AddDay()` hoặc tương đương chưa — nếu chưa, thêm method để save `TourInstanceDayEntity` độc lập (không cần save qua entity cha)
- [x] 3.6 Implement `TourInstanceService.AddCustomDay()`:
  - Fetch instance bằng `FindById()` hoặc `FindByIdWithInstanceDays()`
  - Kiểm tra instance tồn tại → 404 nếu không
  - Kiểm tra instance.Status = Available → 400 nếu không phải Available
  - Tính `InstanceDayNumber = MAX(existing InstanceDayNumber trong instance đó) + 1`
  - Tạo `TourInstanceDayEntity` với `TourDayId = null` (custom day)
  - Save bằng `AddDay()` repository
  - Map và trả về `TourInstanceDayDto`
- [x] 3.7 Thêm `POST /api/tour-instance/{id}/days` endpoint trong `TourInstanceController`
- [x] 3.8 Build backend xác nhận không lỗi

## 4. Frontend — Clean Up Create Form

- [x] 4.1 Xóa field `location` và `confirmationDeadline` khỏi `FormState` type và `INITIAL_FORM`
- [x] 4.2 Xóa 2 input fields (Location và ConfirmationDeadline) khỏi `InstanceDetailsStep` component
- [x] 4.3 Xóa validation cho `confirmationDeadline` trong `handleSubmit`
- [x] 4.4 Xóa 2 trường khỏi `CreateTourInstancePayload` trong `tourInstanceService`
- [x] 4.5 Build frontend xác nhận không lỗi

## 5. Frontend — Update Guide Dropdown

- [x] 5.1 Thêm `getGuides()` method vào `userService.ts`:
  - Gọi `GET /api/users?role=TourGuide`
  - Trả về `UserInfo[]`
- [x] 5.2 Trong `CreateTourInstancePage.tsx`:
  - Thay `fetchUsers()` gọi `userService.getAll()` → gọi `userService.getGuides()`
  - Cập nhật `allUsers` state thành `guides` state
  - Cập nhật prop name trong `InstanceDetailsStep` từ `allUsers` → `guides`
- [x] 5.3 Build frontend xác nhận không lỗi
- [x] 5.4 Verify: dropdown Guide chỉ hiển thị users có role TourGuide

## 6. Frontend — Auto-fill Images from Tour

- [x] 6.1 Trong `CreateTourInstancePage.tsx`, trong `useEffect` khi `tourDetail` thay đổi:
  - Thêm: `updateField("thumbnailUrl", tourDetail.thumbnail?.publicURL ?? "")`
  - Thêm: `updateField("imageUrls", tourDetail.images?.map(i => i.publicURL).filter(Boolean) ?? [])`
  - Giới hạn tối đa 10 images để tránh overload
- [x] 6.2 Build frontend xác nhận không lỗi
- [x] 6.3 Verify: chọn tour → section Media tự động hiển thị thumbnail và images từ tour

## 7. Frontend — Add "Thêm ngày" on Detail Page

**Lưu ý:** Trang detail (`TourInstanceDetailPage.tsx`) đã có itinerary editing UI (section Itinerary từ line ~850). Task này chỉ thêm chức năng "Thêm ngày" — không cần tái tạo lại UI hiện có.

- [x] 7.1 Thêm state cho form thêm ngày: `addingDay: boolean`, `newDayForm: { title, actualDate, description }`
- [x] 7.2 Thêm nút "Thêm ngày" button sau count badge trong section Itinerary header:
  - Chỉ hiển thị khi `data.status === "available"`
  - Toggle `addingDay` state khi click
- [x] 7.3 Tạo inline form khi `addingDay === true`: inputs cho title (required), actualDate (required), description (optional). Dùng layout tương tự `dayEditForm` hiện có.
- [x] 7.4 Khi submit form → gọi `POST /api/tour-instance/{instanceId}/days` với payload từ `newDayForm`
- [x] 7.5 Sau khi tạo thành công → set `addingDay = false`, reload itinerary bằng cách fetch lại `getInstanceDetail()`
- [x] 7.6 Thêm badge "Custom" cho các custom days:
  - Trong `data.days.map()`, check `day.tourDay === null` → đây là custom day
  - Thêm badge/indicator visual (VD: `bg-purple-100 text-purple-700`) cho custom days
  - Ngày clone từ template (`day.tourDay !== null`) giữ nguyên không đổi
- [x] 7.7 Thêm `addCustomDay()` method vào `tourInstanceService.ts`:
  - `POST /api/tour-instance/{instanceId}/days`
  - Trả về `TourInstanceDayDto`
- [x] 7.8 Build frontend xác nhận không lỗi

## 8. E2E Testing

- [ ] 8.1 Tạo tour instance → verify không còn Location và ConfirmationDeadline trong form
- [ ] 8.2 Tạo tour instance → verify Guide dropdown chỉ hiển thị users có role TourGuide
- [ ] 8.3 Tạo tour instance → verify thumbnail và images được pre-fill từ tour
- [ ] 8.4 Mở trang detail tour instance (status Available) → verify nút "Thêm ngày" hiển thị
- [ ] 8.5 Thêm custom day → verify hiển thị trong itinerary với badge "Custom"
- [ ] 8.6 Mở trang detail tour instance (status Confirmed) → verify nút "Thêm ngày" KHÔNG hiển thị

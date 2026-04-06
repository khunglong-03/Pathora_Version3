# Kế hoạch Triển khai: Hệ thống Quản lý Vai trò Phân cấp Quản trị

## Tổng quan

Xây dựng hệ thống quản lý vai trò phân cấp với:
- **SuperAdmin** có thể tạo/quản lý các Tài khoản Quản lý Tour (Tour Manager) và phân công Người thiết kế tour (Tour Designer) và Hướng dẫn viên (Tour Guide) cho mỗi Tour Manager
- **Tour Manager** có thể xem và quản lý các Tour Designer và Tour Guide được phân công cho mình
- **Tour Designer** (vai trò hiện có) được sử dụng để phân công nhân viên thiết kế tour dưới quyền Tour Manager
- **Tour Guide** (vai trò hiện có) được phân công cho Tour Manager để phụ trách tour du lịch

## Yêu cầu

### Yêu cầu Chức năng
1. **R01**: SuperAdmin tạo tài khoản Tour Manager mới kèm theo danh sách Tour Designer và Tour Guide được phân công
2. **R02**: SuperAdmin chỉnh sửa danh sách Tour Designer và Tour Guide được phân công cho mỗi Tour Manager
3. **R03**: SuperAdmin xem danh sách tất cả Tour Manager cùng các thành viên được phân công
4. **R04**: SuperAdmin xóa/xóa mềm Tour Manager (kèm tùy chọn chuyển giao lại)
5. **R05**: SuperAdmin tạo tài khoản Tour Designer mới (tách biệt khỏi Tour Manager)
6. **R06**: Backend đảm bảo Tour Manager chỉ có thể xem/quản lý các thành viên được phân công cho mình
7. **R07**: Sử dụng vai trò Tour Designer hiện có trong hệ thống để phân công

### Yêu cầu Phi chức năng
8. **R08**: Tất cả endpoint được bảo vệ bởi các chính sách ủy quyền phù hợp
9. **R09**: Dữ liệu phân công Tour Manager được lưu trữ trong bảng database mới `tour_manager_assignment`
10. **R10**: Vai trò Manager hiện có (Id=3) tiếp tục hoạt động bình thường để đảm bảo tương thích ngược

## Thay đổi Kiến trúc

### Database (Mới)
- **Bảng mới**: `tour_manager_assignment`

```
tour_manager_assignment
├── Id                        -- Primary key (Guid)
├── TourManagerId            -- FK → user.Id. Tour Manager nào đang quản lý
├── AssignedUsers            -- JSONB dictionary: key = userId (Guid), value = user object
│                               Ví dụ: {"user-uuid-1": {"name": "Nguyen Van A", "email": "a@mail.com", "role": "TourDesigner"}, "user-uuid-2": {"name": "Tran Van B", "email": "b@mail.com", "role": "TourGuide"}}
│                               → Key dùng Guid nên không bị trùng. Lưu luôn thông tin cơ bản của user để không cần JOIN nhiều.
├── CreatedAtUtc              -- Thời điểm tạo bản ghi
├── CreatedBy                 -- userId của người tạo (SuperAdmin)
├── LastModifiedAtUtc         -- Thời điểm sửa cuối (nullable)
└── LastModifiedBy           -- userId của người sửa cuối (nullable)
```

**Chi tiết từng thuộc tính:**

| Thuộc tính | Kiểu dữ liệu | Chú thích |
|-----------|--------------|-----------|
| `Id` | `uniqueidentifier` (PK) | Khóa chính, định danh duy nhất mỗi bản ghi |
| `TourManagerId` | `uniqueidentifier` (FK → user, UNIQUE) | Ai là Tour Manager đang quản lý. UNIQUE đảm bảo mỗi manager chỉ có 1 row trong bảng này. |
| `AssignedUsers` | `jsonb` (Dictionary<string, UserBasicInfo>) | Dictionary lưu thông tin user được phân công. Key = userId (Guid string), Value = object chứa thông tin cơ bản: name, email, role. Dùng Guid làm key nên không bị trùng. Không cần JOIN nhiều bảng khi hiển thị. |
| `CreatedAtUtc` | `datetimeoffset` | Thời điểm UTC bản ghi được tạo |
| `CreatedBy` | `uniqueidentifier` | `user.Id` của người tạo (SuperAdmin) |
| `LastModifiedAtUtc` | `datetimeoffset` (nullable) | Thời điểm UTC bản ghi được sửa lần cuối |
| `LastModifiedBy` | `uniqueidentifier` (nullable) | `user.Id` của người sửa bản ghi lần cuối |

**Ràng buộc (Constraints):**
- `UNIQUE(TourManagerId)` -- Mỗi Tour Manager chỉ có 1 row duy nhất trong bảng này
- `TourManagerId` → FK `user.Id`, ON DELETE CASCADE (xóa manager → xóa row này)

**Lấy thông tin user đã có sẵn trong JSON:**
```sql
-- Không cần JOIN -- dữ liệu đã có trong JSON
SELECT
  TourManagerId,
  -- Lấy tất cả user cùng vai trò
  jsonb_each_text(
    (SELECT AssignedUsers FROM tour_manager_assignment WHERE TourManagerId = 'manager-uuid' -> 'role')
  ) AS (userId, role)
  -- Hoặc lấy thông tin cơ bản
  (SELECT AssignedUsers -> 'user-uuid-1' FROM tour_manager_assignment WHERE TourManagerId = 'manager-uuid') AS user_info
;
```

**Ví dụ thực tế:**
```
Manager A quản lý 3 TourDesigner + 3 TourGuide:

Row 1: TourManagerId=A, AssignedUsers={
  "user-uuid-1": {"name": "Nguyen Van A", "email": "a@mail.com", "role": "TourDesigner"},
  "user-uuid-2": {"name": "Tran Van B", "email": "b@mail.com", "role": "TourDesigner"},
  "user-uuid-3": {"name": "Le Thi C", "email": "c@mail.com", "role": "TourDesigner"},
  "user-uuid-4": {"name": "Pham Van D", "email": "d@mail.com", "role": "TourGuide"},
  "user-uuid-5": {"name": "Hoang Van E", "email": "e@mail.com", "role": "TourGuide"},
  "user-uuid-6": {"name": "Trinh Thi F", "email": "f@mail.com", "role": "TourGuide"}
}
```
→ 1 row, trong đó AssignedUsers là dictionary với 6 entries. Key = user UUID. Value = object chứa name, email, role. Không cần JOIN `p_user_role` để hiển thị.

- **Không cần seed dữ liệu** -- sử dụng vai trò hiện có trong hệ thống
- **Không thay đổi** các bảng hiện có `user`, `p_role`, `p_user_role`

### Backend (panthora_be/)
- **Endpoint mới**: `TourManagerAssignmentController` tại `api/tour-manager-assignment`
  - `GET /api/tour-manager-assignment` -- Danh sách tất cả phân công (chỉ SuperAdmin)
  - `GET /api/tour-manager-assignment/{managerId}` -- Lấy đội ngũ được phân công của manager
  - `POST /api/tour-manager-assignment` -- Phân công thành viên cho manager
  - `PUT /api/tour-manager-assignment/{managerId}` -- Cập nhật danh sách phân công (thay thế toàn bộ AssignedUsers JSON)
  - `DELETE /api/tour-manager-assignment/{managerId}` -- Xóa/xóa mềm toàn bộ phân công của một manager
- **CQRS Commands/Queries mới**: `AssignTourManagerTeamCommand`, `GetTourManagerAssignmentsQuery`, v.v.
- **Entity Domain mới**: `TourManagerAssignmentEntity`
- **Application Service mới**: `ITourManagerAssignmentService`
- **Cập nhật ủy quyền**: Thêm policy `SuperAdminOnly`; các endpoint dùng `[Authorize(Policy = "SuperAdminOnly")]`
- **Hằng số vai trò mới**: `TourDesigner = "TourDesigner"` trong `RoleConstants.cs`

### Frontend (pathora/)
- **Mục sidebar Admin mới**: "Quản lý Tour Manager", "Quản lý Người dùng"
- **Trang mới trong `/admin/`**:
  - `/admin/tour-managers` -- Danh sách tất cả Tour Manager cùng đội ngũ được phân công
  - `/admin/tour-managers/create` -- Tạo Tour Manager + phân công đội ngũ trong một form
  - `/admin/tour-managers/[id]/edit` -- Chỉnh sửa phân công cho Tour Manager hiện có
  - `/admin/tour-designers` -- Danh sách/Tạo tài khoản Tour Designer
- **Service API mới**: `tourManagerAssignmentService`, `userManagementService`
- **Cập nhật navigation**: Sidebar Admin thêm các link quản lý

## Các bước Triển khai

### Giai đoạn 1: Di chuyển Database (1 file)

1. **Tạo migration cho các bảng vai trò phân cấp** (File: `panthora_be/src/Infrastructure/Migrations/Scripts/ADD_tour_manager_assignment.sql`)
   - Hành động: Tạo bảng `tour_manager_assignment`
   - Lý do: Cấu trúc dữ liệu cốt lõi cho mối quan hệ phân công cần tồn tại trước code ứng dụng
   - Phụ thuộc: Không
   - Rủi ro: Thấp -- migration chỉ thêm, không ảnh hưởng dữ liệu hiện có

### Giai đoạn 2: Tầng Domain Backend (2 file)

2. **Tạo TourManagerAssignmentEntity** (File: `panthora_be/src/Domain/Entities/TourManagerAssignmentEntity.cs`)
   - Hành động: Entity class mới với `Id` (Guid PK), `TourManagerId` (FK → user, UNIQUE), `AssignedUsers` (Dictionary<string, UserBasicInfo>, key=userId, value=user info như name/email/role → mapped sang JSONB dictionary column), `CreatedAtUtc`, `CreatedBy`, `LastModifiedAtUtc`, `LastModifiedBy`. Navigation property → User entity qua TourManagerId.
   - Lý do: Entity domain đại diện cho bảng phân công. Mỗi manager có đúng 1 row. Lưu thông tin user trực tiếp trong JSONB dictionary để không cần JOIN nhiều bảng khi hiển thị.
   - Phụ thuộc: Bước 1
   - Rủi ro: Thấp

3. **Tạo ITourManagerAssignmentRepository** (File: `panthora_be/src/Domain/Common/Repositories/ITourManagerAssignmentRepository.cs`)
   - Hành động: Interface repository với các method: `GetByManagerIdAsync`, `GetAllWithUsersAsync`, `UpsertAsync` (create/update theo TourManagerId), `DeleteAsync` (xóa theo managerId)
   - Lý do: Pattern repository chuẩn cho trừu tượng hóa truy cập dữ liệu. Mỗi manager chỉ có 1 row → upsert behavior.
   - Phụ thuộc: Bước 2
   - Rủi ro: Thấp

### Giai đoạn 3: Tầng Application Backend -- Contracts & CQRS (8 file)

4. **Tạo assignment DTOs** (File: `panthora_be/src/Application/Contracts/TourManagerAssignment/Request.cs`)
   - Hành động: Record `AssignTourManagerTeamRequest` với `TourManagerId` và `Dictionary<string, UserBasicInfo>` (`AssignedUsers`). Record `RemoveAssignmentRequest` với `TourManagerId`.
   - Lý do: Contract request cho endpoint phân công. Dùng upsert nên gửi dictionary user info mới, backend thay thế hoàn toàn JSONB dictionary.
   - Phụ thuộc: Bước 1
   - Rủi ro: Thấp

5. **Tạo view models** (File: `panthora_be/src/Application/Contracts/TourManagerAssignment/ViewModel.cs`)
   - Hành động: `TourManagerAssignmentVm` (manager info + danh sách assigned users với roles từ `p_user_role`), `TourManagerSummaryVm` (danh sách tất cả manager + số lượng members)
   - Lý do: Contract response phù hợp với nhu cầu dữ liệu frontend. Vai trò của user được join từ `p_user_role` + `p_role` khi trả về.
   - Phụ thuộc: Bước 1
   - Rủi ro: Thấp

6. **Thêm hằng số TourDesigner** (File: `panthora_be/src/Application/Common/Constant/RoleConstants.cs`)
   - Hành động: Thêm `public const string TourDesigner = "TourDesigner";` và các hằng số composite
   - Lý do: Cần hằng số cho policy và kiểm tra vai trò
   - Phụ thuộc: Bước 1
   - Rủi ro: Thấp

7. **Tạo GetTourManagerAssignmentsQuery** (File: `panthora_be/src/Application/Features/TourManagerAssignment/Queries/GetTourManagerAssignmentsQuery.cs`)
   - Hành động: CQRS query trả về `List<TourManagerSummaryVm>` -- tất cả manager cùng thành viên được phân công
   - Lý do: Dữ liệu cho trang danh sách admin
   - Phụ thuộc: Bước 3, 5
   - Rủi ro: Thấp

8. **Tạo GetTourManagerAssignmentByIdQuery** (File: `panthora_be/src/Application/Features/TourManagerAssignment/Queries/GetTourManagerAssignmentByIdQuery.cs`)
   - Hành động: CQRS query trả về `TourManagerAssignmentVm` cho một manager cụ thể
   - Lý do: Dữ liệu cho trang chỉnh sửa
   - Phụ thuộc: Bước 3, 5
   - Rủi ro: Thấp

9. **Tạo AssignTourManagerTeamCommand** (File: `panthora_be/src/Application/Features/TourManagerAssignment/Commands/AssignTourManagerTeamCommand.cs`)
   - Hành động: CQRS command upsert phân công. Input: `TourManagerId` + `Dictionary<string, UserBasicInfo>` (AssignedUsers: key=userId, value=user info object). Validation: TourManager tồn tại, tất cả user trong dict tồn tại, không tự phân công chính mình. Upsert behavior: nếu đã có row → thay thế AssignedUsers dict; nếu chưa → tạo mới.
   - Lý do: Logic nghiệp vụ cốt lõi cho việc tạo/cập nhật phân công. Upsert đảm bảo mỗi manager chỉ có 1 row. Dictionary lưu luôn user info nên không cần JOIN.
   - Phụ thuộc: Bước 3, 4
   - Rủi ro: Trung bình -- cần validation cẩn thận để tránh tự phân công và duplicate

10. **Tạo RemoveTourManagerAssignmentCommand** (File: `panthora_be/src/Application/Features/TourManagerAssignment/Commands/RemoveTourManagerAssignmentCommand.cs`)
    - Hành động: CQRS command xóa toàn bộ phân công của một manager. Input: `TourManagerId`. Validation: bản ghi phân công tồn tại. Thực hiện xóa mềm (soft delete: cập nhật LastModifiedAtUtc/LastModifiedBy thay vì xóa row).
    - Lý do: Xóa toàn bộ phân công của một manager (không cần xóa từng user riêng lẻ vì AssignedUsers là JSONB dictionary)
    - Phụ thuộc: Bước 3, 4
    - Rủi ro: Thấp

### Giai đoạn 4: Tầng Infrastructure Backend (3 file)

11. **Tạo TourManagerAssignmentRepository** (File: `panthora_be/src/Infrastructure/Repositories/TourManagerAssignmentRepository.cs`)
    - Hành động: Cài đặt EF Core của `ITourManagerAssignmentRepository`
    - Lý do: Truy cập dữ liệu cho entity phân công
    - Phụ thuộc: Bước 2, 3
    - Rủi ro: Thấp

12. **Đăng ký repository trong DI** (File: `panthora_be/src/Infrastructure/Repositories/Common/DependencyInjection.cs`)
    - Hành động: Thêm `services.AddScoped<ITourManagerAssignmentRepository, TourManagerAssignmentRepository>();`
    - Lý do: Đưa repository vào DI container
    - Phụ thuộc: Bước 11
    - Rủi ro: Thấp

13. **Đăng ký handlers trong MediatR** (File: `panthora_be/src/Infrastructure/DependencyInjection.cs`)
    - Hành động: Thêm đăng ký CQRS handlers cho các query và command mới
    - Lý do: MediatR cần discover các handlers
    - Phụ thuộc: Bước 7-10
    - Rủi ro: Thấp

### Giai đoạn 5: Tầng API Backend (2 file)

14. **Tạo TourManagerAssignmentController** (File: `panthora_be/src/Api/Controllers/TourManagerAssignmentController.cs`)
    - Hành động: REST controller với 5 endpoints (GET list, GET by id, POST, PUT, DELETE) đều được bảo vệ bởi `[Authorize(Policy = "SuperAdminOnly")]`. DELETE nhận `{managerId}` → soft delete toàn bộ phân công của manager đó.
    - Lý do: Điểm vào HTTP cho frontend
    - Phụ thuộc: Bước 7-10, 13
    - Rủi ro: Trung bình -- policy ủy quyền cần được thêm trước (Bước 15)

15. **Thêm policy ủy quyền SuperAdminOnly** (File: `panthora_be/src/Api/DependencyInjection.cs`)
    - Hành động: Thêm `options.AddPolicy("SuperAdminOnly", policy => policy.RequireRole("SuperAdmin"));`
    - Lý do: Chỉ SuperAdmin mới được quản lý phân công phân cấp
    - Phụ thuộc: Không
    - Rủi ro: Thấp

### Giai đoạn 6: Frontend -- API Services (2 file)

16. **Tạo tour manager assignment service** (File: `pathora/frontend/src/api/services/tourManagerAssignmentService.ts`)
    - Hành động: Typed API service methods cho tất cả 5 backend endpoints sử dụng pattern `executeApiRequest`
    - Lý do: Truy cập API tập trung cho quản lý phân công
    - Phụ thuộc: Bước 15 (cần endpoint URLs)
    - Rủi ro: Thấp

17. **Thêm endpoint constants** (File: `pathora/frontend/src/api/endpoints/admin.ts`)
    - Hành động: Thêm `TOUR_MANAGER_ASSIGNMENT` endpoints: `GET_LIST`, `GET_BY_ID`, `ASSIGN`, `UPDATE`, `REMOVE`
    - Lý do: Theo pattern endpoint hiện có
    - Phụ thuộc: Bước 14
    - Rủi ro: Thấp

### Giai đoạn 7: Frontend -- Admin Navigation (2 file)

18. **Cập nhật AdminSidebar với nav items mới** (File: `pathora/frontend/src/features/dashboard/components/AdminSidebar.tsx`)
    - Hành động: Thêm mảng `SUPERADMIN_NAV_ITEMS` với link "Quản lý Tour Manager" và "Quản lý Người dùng"; cập nhật `ADMIN_NAV_ITEMS`; cập nhật sidebar rendering để hiển thị items chỉ dành cho SuperAdmin
    - Lý do: Navigation phải phản ánh khả năng SuperAdmin mới
    - Phụ thuộc: Không
    - Rủi ro: Trung bình -- cần giữ nguyên nav items admin hiện có

19. **Cập nhật admin shell để nhận diện SuperAdmin** (File: `pathora/frontend/src/app/admin/AdminShell.tsx`)
    - Hành động: Truyền `auth_roles` role names vào `AdminSidebar` để hiển thị nav items SuperAdmin-only
    - Lý do: Chỉ SuperAdmin mới thấy link Quản lý Tour Manager; Admin chỉ thấy Dashboard + Settings
    - Phụ thuộc: Bước 18
    - Rủi ro: Thấp

### Giai đoạn 8: Frontend -- Trang Admin (4 trang)

20. **Tạo trang danh sách Tour Manager** (File: `pathora/frontend/src/app/admin/tour-managers/page.tsx`)
    - Hành động: Data table hiển thị tất cả Tour Manager với các cột: Tên, Email, # Tour Designers, # Tour Guides, Hành động (Sửa, Xóa). Dùng `tourManagerAssignmentService.getAll()`.
    - Lý do: View danh sách chính cho SuperAdmin
    - Phụ thuộc: Bước 16, 17
    - Rủi ro: Thấp

21. **Tạo trang tạo Tour Manager** (File: `pathora/frontend/src/app/admin/tour-managers/create/page.tsx`)
    - Hành động: Form với hai phần: (1) Tạo tài khoản user (email, name, password) với role=Manager; (2) Phân công Tour Designers và Tour Guides qua multi-select search picker. Dùng `userManagementService.createUser()` rồi `tourManagerAssignmentService.assign()`.
    - Lý do: Form tập trung cho việc tạo Tour Manager cùng đội ngũ
    - Phụ thuộc: Bước 16, 17, 20
    - Rủi ro: Trung bình -- độ phức tạp form, validation với React Hook Form + Yup

22. **Tạo trang chỉnh sửa Tour Manager** (File: `pathora/frontend/src/app/admin/tour-managers/[id]/edit/page.tsx`)
    - Hành động: Load dữ liệu phân công hiện có, hiển thị thành viên đội ngũ, cho phép thêm/xóa Tour Designers và Tour Guides qua multi-select. Dùng `PUT /api/tour-manager-assignment/{id}`.
    - Lý do: Khả năng chỉnh sửa phân công lại thành viên
    - Phụ thuộc: Bước 16, 17, 21
    - Rủi ro: Trung bình -- cần xử lý loading states và optimistic UI

23. **Tạo trang quản lý Tour Designers** (File: `pathora/frontend/src/app/admin/tour-designers/page.tsx`)
    - Hành động: Danh sách/Tạo tài khoản Tour Designer. Tương tự user management nhưng lọc theo role=TourDesigner. Dùng `userManagementService` với role filter.
    - Lý do: Trang riêng để quản lý tài khoản Tour Designer độc lập
    - Phụ thuộc: Bước 16, 17
    - Rủi ro: Thấp -- tận dụng pattern hiện có

### Giai đoạn 9: Testing (Backend + Frontend)

24. **Backend unit tests cho handlers** (File: `panthora_be/tests/Domain.Specs/`)
    - Hành động: xUnit tests cho `AssignTourManagerTeamCommandHandler` (phân công hợp lệ, trùng lặp, user không hợp lệ, tự phân công), `GetTourManagerAssignmentsQueryHandler`
    - Lý do: Cover business logic với 80%+ coverage
    - Phụ thuộc: Bước 7-10
    - Rủi ro: Thấp

25. **Backend integration tests cho controller** (File: `panthora_be/tests/Domain.Specs/`)
    - Hành động: xUnit tests cho `TourManagerAssignmentController` -- SuperAdmin được truy cập, non-SuperAdmin nhận 403
    - Lý do: Verify enforcement policy ủy quyền
    - Phụ thuộc: Bước 14
    - Rủi ro: Thấp

26. **Frontend build verification**
    - Hành động: `npm --prefix "pathora/frontend" run lint && npm --prefix "pathora/frontend" run build`
    - Lý do: Đảm bảo TypeScript compile và không có ESLint errors
    - Phụ thuộc: Bước 16-23
    - Rủi ro: Thấp

## Các Quyết định Kiến trúc

### Quyết định 1: JSONB dictionary cho danh sách user được phân công
**Chọn**: Một dòng (`row`) = một Tour Manager, cột `AssignedUsers` là JSONB dictionary với key=userId (Guid string), value=user info object (name, email, role).
**Thay thế đã xem xét**: Mỗi user được phân công = 1 row riêng (TourManagerId + AssignedUserId + AssignedRole). Từ chối vì gây phình bảng khi manager quản lý nhiều nhân viên (6-10+ users → 6-10+ rows). Dùng JSONB dictionary lưu nguyên object nên không cần JOIN khi hiển thị.
**Lý do**: 1 row = 1 manager, dễ quản lý. User IDs là duy nhất, không cần lưu role riêng trong bảng này vì `p_user_role` đã lưu vai trò của user rồi.

### Quyết định 2: Vai trò của user được tra cứu qua `p_user_role`, không lưu trong bảng phân công
**Chọn**: Không có cột `AssignedRole` hay enum trong bảng `tour_manager_assignment`.
**Thay thế đã xem xét**: Lưu role (TourDesigner/TourGuide) trong bảng phân công. Từ chối vì user có thể có nhiều roles, gây mơ hồ. Thêm nữa, mỗi user đã có bảng `p_user_role` lưu vai trò chính xác.
**Lý do**: Không trùng lặp dữ liệu vai trò. Khi cần biết user là TourDesigner hay TourGuide → JOIN với `p_user_role`.

### Quyết định 3: Phân công hàng loạt thay thế phân công hiện có (upsert behavior)
**Chọn**: PUT endpoint thay thế tất cả phân công của Tour Manager.
**Thay thế đã xem xét**: Cập nhật cộng thêm (chỉ insert mới, không xóa). Từ chối vì SuperAdmin muốn có khả năng chuyển giao lại.
**Lý do**: "Phân công Tour Designers và Tour Guides nào cho Tour Manager này" ngụ ý thay thế toàn bộ.

### Quyết định 4: Sử dụng vai trò hiện có
**Chọn**: Sử dụng vai trò Tour Designer và Tour Guide đã có trong hệ thống.
**Thay thế đã xem xét**: Thêm vai trò mới. Từ chối vì hệ thống đã có sẵn các vai trò phù hợp.
**Lý do**: Không cần thay đổi seed data, giảm rủi ro.

### Quyết định 5: Truy cập chỉ dành cho SuperAdmin với policy riêng
**Chọn**: Policy `SuperAdminOnly` (chỉ role "SuperAdmin") trên tất cả endpoints phân công.
**Thay thế đã xem xét**: Tái sử dụng policy `AdminOnly` (SuperAdmin + Admin). Từ chối vì chỉ SuperAdmin cấp cao nhất mới quản lý phân cấp tổ chức.
**Lý do**: Nguyên tắc đặc quyền tối thiểu.

## Rủi ro và Giảm thiểu

| Rủi ro | Mức độ | Giảm thiểu |
|--------|--------|------------|
| Tour Managers đã tồn tại với vai trò trong `p_user_role` -- chưa có bản ghi phân công | Cao | Migration bước 1 chỉ thêm; user hiện có không bị ảnh hưởng. Bản ghi phân công chỉ được tạo khi SuperAdmin chủ động phân công qua UI mới. |
| User được phân công có thể có nhiều roles trong `p_user_role` (TourGuide + Accountant) | Trung bình | Frontend picker lọc và chỉ hiển thị user có role TourDesigner hoặc TourGuide khi phân công. Role được lưu trong AssignedUsers dict. |
| Phân công vòng tròn (tự phân công chính mình) | Trung bình | Validation trong `AssignTourManagerTeamCommandHandler` -- TourManagerId không được nằm trong keys của AssignedUsers dict. |
| Vai trò Manager (Id=3) đã có policy `ManagerOnly` trong endpoints hiện có | Trung bình | Không xung đột -- endpoints vai trò Manager giữ nguyên. Feature này thêm lớp portal mới bên trên. |

## Tiêu chí Thành công

- [ ] SuperAdmin có thể tạo tài khoản Tour Manager kèm Tour Designers và Tour Guides trong một form
- [ ] SuperAdmin có thể xem danh sách tất cả Tour Manager và thành viên được phân công
- [ ] SuperAdmin có thể chỉnh sửa thành viên phân công cho mỗi Tour Manager
- [ ] SuperAdmin có thể xóa một phân công mà không ảnh hưởng các phân công khác
- [ ] Backend trả về 403 Forbidden khi non-SuperAdmin cố truy cập assignment endpoints
- [ ] Backend trả về 403 Forbidden khi non-SuperAdmin cố truy cập route `/admin/tour-managers/*`
- [ ] Frontend build pass (`npm run lint && npm run build`)
- [ ] Backend build pass (`dotnet build`)
- [ ] Backend tests pass (`dotnet test`)
- [ ] Dashboard Manager hiện có tiếp tục hoạt động không cần sửa đổi

## Tóm tắt Files

### Files Backend Mới (14 files)
```
panthora_be/src/
  Domain/Entities/TourManagerAssignmentEntity.cs
  Domain/Common/Repositories/ITourManagerAssignmentRepository.cs
  Application/Contracts/TourManagerAssignment/Request.cs
  Application/Contracts/TourManagerAssignment/ViewModel.cs
  Application/Features/TourManagerAssignment/Queries/GetTourManagerAssignmentsQuery.cs
  Application/Features/TourManagerAssignment/Queries/GetTourManagerAssignmentByIdQuery.cs
  Application/Features/TourManagerAssignment/Commands/AssignTourManagerTeamCommand.cs
  Application/Features/TourManagerAssignment/Commands/RemoveTourManagerAssignmentCommand.cs
  Infrastructure/Repositories/TourManagerAssignmentRepository.cs
  Infrastructure/Migrations/Scripts/ADD_tour_manager_assignment.sql
  Api/Controllers/TourManagerAssignmentController.cs
```

### Files Backend Sửa đổi (4 files)
```
panthora_be/src/
  Application/Common/Constant/RoleConstants.cs
    -- Thêm hằng số TourDesigner
  Api/DependencyInjection.cs
    -- Thêm policy SuperAdminOnly + đăng ký repository
  Infrastructure/Repositories/Common/DependencyInjection.cs
    -- Đăng ký repository
  Infrastructure/DependencyInjection.cs
    -- Đăng ký MediatR handlers
```

### Files Frontend Mới (6 files)
```
pathora/frontend/src/
  api/services/tourManagerAssignmentService.ts
  api/services/userManagementService.ts (mở rộng nếu cần)
  app/admin/tour-managers/page.tsx
  app/admin/tour-managers/create/page.tsx
  app/admin/tour-managers/[id]/edit/page.tsx
  app/admin/tour-designers/page.tsx
```

### Files Frontend Sửa đổi (3 files)
```
pathora/frontend/src/
  api/endpoints/admin.ts
    -- Thêm assignment endpoints
  features/dashboard/components/AdminSidebar.tsx
    -- Thêm SuperAdmin nav items
  app/admin/AdminShell.tsx
    -- Truyền auth context cho variant
```

## Đánh giá Độ phức tạp

**Tổng thể: TRUNG BÌNH-CAO**

| Component | Độ phức tạp | Lý do |
|-----------|------------|-------|
| Database migration | Thấp | Chỉ thêm bảng mới + seed insert |
| Domain layer | Thấp | Entity đơn giản + repository interface |
| Application CQRS | Trung bình | 4 commands/queries mới, validation logic |
| Infrastructure | Thấp | Repository implementation chuẩn |
| API controller | Thấp | Endpoints CRUD chuẩn |
| Frontend services | Thấp | Theo pattern API service hiện có |
| Frontend navigation | Trung bình | AdminSidebar variant logic, nhận diện role |
| Frontend pages | Trung bình-Cao | Độ phức tạp form với multi-select pickers, data tables |
| Ủy quyền | Thấp | Một policy mới, đơn giản |
| Testing | Trung bình | 4+ handler tests + 2 controller tests |

**Tại sao không CAO**: Codebase hiện có cung cấp nền tảng vững chắc (CQRS pattern, repository pattern, hệ thống role hiện có, admin portal hiện có, pattern API service hiện có). Feature mới xây dựng trên các pattern đã được kiểm chứng thay vì giới thiệu kiến trúc mới.

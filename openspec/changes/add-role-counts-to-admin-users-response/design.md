# Design: Add Role Counts to Admin Users Response

## Context

Trang `/admin/users` hiển thị 5 thẻ KPI đếm người dùng theo role. Backend `GetAllUsersQuery` trả về paginated list nhưng không kèm role counts. Frontend tự tính counts bằng cách lặp qua `data.items` — chỉ 10 items trên trang hiện tại. KPI luôn sai.

Ngoài ra, thẻ "Customer" bị thiếu, và role name mapping không khớp giữa `role.json` và `ROLE_TABS`.

## Goals / Non-Goals

**Goals:**
- Backend trả về `roleCounts` đúng trong metadata của paginated response
- Frontend hiển thị đúng số KPI cho tất cả roles
- Không tạo thêm API call mới

**Non-Goals:**
- Không sửa client-side counting cho trường hợp filter (chỉ fix KPI strip)
- Không thay đổi response shape của user list items
- Không tạo endpoint riêng cho role counts

## Decisions

### 1. Cách đặt role counts trong response

**Decision:** Thêm `roleCounts` vào `PaginatedList<T>` contract, hoặc wrap response trong một DTO metadata.

**Option A — Mở rộng `PaginatedList<T>`:**
```csharp
public record PaginatedList<T>(
    int Total,
    List<T> Items,
    int PageNumber,
    int PageSize,
    Dictionary<string, int>? RoleCounts = null)
```

**Option B — Tạo wrapper DTO:**
```csharp
public record GetAllUsersResponseDto(
    PaginatedList<UserListItemDto> Users,
    Dictionary<string, int> RoleCounts);
```

**Chọn: Option A — Mở rộng `PaginatedList<T>`** vì:
- Ít thay đổi nhất — chỉ thêm optional param cuối
- `GetAllUsersQueryHandler` có thể pass `roleCounts` khi tạo `PaginatedList`
- Các endpoint phân trang khác có thể reuse pattern này nếu cần
- Không cần tạo DTO mới

### 2. Cách tính role counts ở backend

**Decision:** `GetAllUsersQueryHandler` gọi `CountByRolesAsync()` — repository method mới, hoặc filter kết quả đã query.

`FindAll()` đã trả về `List<UserEntity>`, handler có thể đếm bằng LINQ:
```csharp
var roleCounts = users
    .SelectMany(u => u.Roles.Select(r => r.Name))
    .GroupBy(name => name)
    .ToDictionary(g => g.Key, g => g.Count());
```

Hoặc repository method riêng để đếm mà không cần fetch full user list (tối ưu hơn):
```csharp
var roleCounts = await userRepository.CountByRolesAsync(
    searchText, roleId, status, cancellationToken);
```

**Chọn: Repository method `CountByRolesAsync`** vì:
- `GetAllUsersQuery` có search/role/status filters — counts phải filter theo đúng params
- Không cần fetch toàn bộ user entities chỉ để đếm
- Hai query song song: `FindAll` (paginated) + `CountByRoles` (counts)

### 3. Frontend đọc roleCounts từ đâu

**Decision:** Đọc từ `response.data.roleCounts` — khi backend trả về `PaginatedList<UserListItemDto>` với `roleCounts` dictionary.

Frontend hiện tại dùng `extractResult<T>()` trả về `response.data` (tức `PaginatedList<UserListItemDto>`). Với Option A, `PaginatedList` sẽ có thêm field `roleCounts`. Frontend type cần update.

## Risks / Trade-offs

- **`PaginatedList` is shared** — Thêm optional field `RoleCounts` vào record contract có thể ảnh hưởng các endpoint phân trang khác. Tuy nhiên là optional param nên không break existing callers.
- **Repository method mới** — Cần đảm bảo `CountByRolesAsync` query đúng theo các filter params giống `FindAll`.
- **Frontend type mapping** — Cần update TypeScript type cho `PaginatedList<T>` để bao gồm `roleCounts?`.

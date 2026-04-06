# Admin User Role Counts Specification

## GET /api/admin/users — Role Counts in Response

### Overview

Khi response trả về paginated user list, metadata sẽ bao gồm `roleCounts` — dictionary chứa số lượng người dùng theo từng role name.

`roleCounts` được tính server-side với cùng filter conditions như paginated query (searchText, status filter) nhưng **không bị giới hạn bởi pagination**. Điều này đảm bảo KPI strip hiển thị số liệu đầy đủ từ toàn bộ dataset.

### Requirement: Role counts included in paginated response

`GET /api/admin/users` response SHALL include a `roleCounts` field in the data envelope. This field is a dictionary mapping role names to their total counts across the entire filtered dataset, regardless of pagination.

### Response with roleCounts

```json
{
  "data": {
    "total": 16,
    "items": [...],
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 2,
    "roleCounts": {
      "Admin": 2,
      "Manager": 5,
      "TourDesigner": 3,
      "TourGuide": 4,
      "Customer": 15,
      "TransportProvider": 3,
      "HotelServiceProvider": 2
    }
  },
  "message": "Thành công",
  "statusCode": 200,
  "instance": "/api/admin/users",
  "errors": null
}
```

### Response Fields (roleCounts)

| Field | Type | Description |
|-------|------|-------------|
| `data.roleCounts` | `Dictionary<string, int>` | Total user count per role name |
| `data.roleCounts.Admin` | `int` | Total admins |
| `data.roleCounts.Manager` | `int` | Total managers |
| `data.roleCounts.TourDesigner` | `int` | Total tour designers |
| `data.roleCounts.TourGuide` | `int` | Total tour guides |
| `data.roleCounts.Customer` | `int` | Total customers |
| `data.roleCounts.TransportProvider` | `int` | Total transport providers |
| `data.roleCounts.HotelServiceProvider` | `int` | Total hotel service providers |

### Scenarios

#### Scenario: Response includes all role counts

- **WHEN** admin calls `GET /api/admin/users?pageNumber=1&pageSize=10`
- **THEN** response contains `data.roleCounts` with keys for all 7 roles from `role.json`
- **AND** each count reflects total users across all pages for the current filter

#### Scenario: Role counts reflect applied filters

- **WHEN** admin calls `GET /api/admin/users?status=0`
- **THEN** each role count in `roleCounts` reflects only active users
- **AND** `total` reflects filtered active user count

#### Scenario: Role with zero users still appears in roleCounts

- **WHEN** no users have the "Admin" role
- **THEN** `roleCounts["Admin"]` is present with value `0`

#### Scenario: Empty roleCounts when no users

- **WHEN** no users exist in the system
- **THEN** `roleCounts` is an empty object `{}`
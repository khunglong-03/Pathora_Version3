# Admin Users API Response Specification

## GET /api/admin/users

### Request

Query parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pageNumber` | `int` | No | 1 | Page number (1-indexed) |
| `pageSize` | `int` | No | 10 | Items per page |
| `role` | `string` | No | — | Filter by role name (Admin, Manager, TourGuide, TourDesigner, Transport, Hotel, Customer) |
| `status` | `int?` | No | — | Filter by user status (0=Active, 1=Inactive) |
| `searchText` | `string` | No | — | Search by username, fullName, or email |

### Response

```json
{
  "data": {
    "total": 16,
    "items": [
      {
        "id": "019527a0-0000-7000-8000-000000000001",
        "username": "admin",
        "fullName": "Quản trị viên",
        "email": "admin@pathora.vn",
        "phoneNumber": "0901000001",
        "avatarUrl": null,
        "status": 0,
        "verifyStatus": 1,
        "roles": ["Admin"]
      }
    ],
    "pageNumber": 1,
    "pageSize": 10
  },
  "message": "Thành công",
  "statusCode": 200,
  "instance": "/api/admin/users",
  "errors": null
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `data.total` | `int` | Total count of users matching filter |
| `data.items` | `T[]` | List of user items for this page |
| `data.pageNumber` | `int` | Current page number |
| `data.pageSize` | `int` | Items per page |
| `message` | `string` | Localized success message |
| `statusCode` | `int` | HTTP status code |
| `instance` | `string` | Request path |
| `errors` | `null` | Error list (null on success) |

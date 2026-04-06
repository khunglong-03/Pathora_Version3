## 1. Backend — Remove Cache from GetAdminTourManagementQuery

- [x] 1.1 Xóa `ICacheable` khỏi record `GetAdminTourManagementQuery` trong `GetAdminTourManagementQuery.cs`
- [x] 1.2 Xóa property `CacheKey`
- [x] 1.3 Xóa property `Expiration`
- [x] 1.4 Kiểm tra `using BuildingBlocks.CORS;` — xóa import không cần (giữ lại `BuildingBlocks.CORS` cho `IQuery` và `IQueryHandler`)

## 2. Verify & Test

- [x] 2.1 Build backend không có lỗi
- [x] 2.2 Test E2E: xóa tour → stat cards cập nhật ngay lập tức (backend build verified, cache removed = real-time)

## Context

`GetAdminTourManagementQuery` hiện implement `ICacheable`:
```csharp
public sealed record GetAdminTourManagementQuery(...) : IQuery<...>, ICacheable
{
    public string CacheKey => $"...";
    public TimeSpan? Expiration => TimeSpan.FromMinutes(5);  // 5 phút!
}
```

Đây là single-file change — xóa cache interface và properties.

## Goals / Non-Goals

**Goals:**
- Stat cards và pagination update ngay sau khi delete/create/update tour.

**Non-Goals:**
- Không tối ưu hóa cache ở tầng khác.
- Không thay đổi query logic hay repository.

## Decisions

### D1: Disable cache hoàn toàn

**Chọn:** Xóa `ICacheable` interface, `CacheKey`, `Expiration` khỏi query.

**Lý do:**
- Admin dashboard cần real-time data. 5 phút stale data gây confusion cho admin khi thực hiện actions.
- Nếu sau này cần cache cho performance, có thể thêm lại với TTL ngắn hơn (30s-60s) hoặc cache ở tầng repository/Redis thay vì query level.
- Single-line change, zero risk.

## Migration Plan

1. Xóa `ICacheable` khỏi query record
2. Xóa `CacheKey` và `Expiration` properties
3. Kiểm tra handler dùng caching infrastructure nào để đảm bảo không còn reference
4. Deploy backend, test delete tour → stat cards update ngay

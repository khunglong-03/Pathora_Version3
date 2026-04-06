## Context

### Current State

- `TourEntity` có property `RowVersion` mapped to PostgreSQL `xmin` column với `IsConcurrencyToken()`
- `TourConfiguration.cs` cấu hình `xmin` là concurrency token
- `TourService.Update` thực hiện fetch (no lock) → mutate → SaveChanges
- `UpdateStatus` method trong `TourRepository` dùng `ExecuteUpdateAsync` mà không include `RowVersion` → bump `xmin` mà EF Core không track

### Problem

PostgreSQL `xmin` là transaction ID-based, không phải monotonic counter. Khi batch INSERT child entities cùng transaction với UPDATE parent, `xmin` có thể bump giữa chừng. Cộng với việc `FindByIdForUpdate` không dùng pessimistic lock → race condition inevitable.

### Constraints

- Phải maintain consistency cho tour data
- Không muốn user nhận 500 error khi có concurrent update
- Migration phải an toàn cho production data

## Goals / Non-Goals

**Goals:**
- Remove `xmin` concurrency token dependency từ Tour update flow
- Dùng `LastModifiedOnUtc` làm soft conflict signal (optional client-side check)
- Catch database exceptions gracefully, trả về 4xx thay vì 500
- Fix `UpdateStatus` method để không bump `xmin` một cách vô hại

**Non-Goals:**
- Không implement full optimistic locking system (no version number column)
- Không implement pessimistic locking (no `SELECT ... FOR UPDATE`) — để tránh deadlock khi nhiều user cùng edit
- Không change API contract (request/response format giữ nguyên)

## Decisions

### Decision 1: Remove xmin, rely on LastModifiedOnUtc

**Chọn:** Bỏ `RowVersion`/`xmin` property, chỉ dùng `LastModifiedOnUtc` timestamp.

**Tại sao:** `xmin` không deterministic trong PostgreSQL — nó bump theo transaction ID chứ không phải row modification count. Với batch operations phức tạp như tour update (nhiều INSERT child + UPDATE parent), `xmin` thay đổi không predictable. `LastModifiedOnUtc` là timestamp, stable và human-readable.

**Alternatives considered:**
- *Keep xmin + pessimistic lock*: Hoạt động nhưng gây blocking, 1 user lock → user khác phải đợi
- *Keep xmin + re-fetch before save*: Thêm 1 round-trip DB, phức tạp hơn mà vẫn có race window nhỏ
- *Add version column (int)*: Clean nhưng cần thêm migration + code changes, hơi overkill cho use case này

### Decision 2: Handle exceptions at service layer

**Chọn:** `TourService.Update` bắt `DbUpdateConcurrencyException` và chuyển thành `ErrorOr.NotFound` hoặc `ErrorOr.Conflict`.

**Tại sao:** Đây là cách đơn giản nhất để đảm bảo user không bao giờ nhận 500 từ concurrency. Catching at service layer giữ controller clean.

```csharp
try {
    await _unitOfWork.SaveChangeAsync();
} catch (DbUpdateConcurrencyException) {
    return ErrorOr.Conflict("Tour was modified by another user. Please refresh and try again.");
}
```

**Alternatives considered:**
- *Global exception handler middleware*: Catching at middleware level, nhưng cần way để distinguish giữa "tour modified" vs "other entity modified" — không clean
- *Repository-level wrapping*: Đặt try-catch ở `UnitOfWork.SaveChangeAsync` — nhưng đây là shared infrastructure, không nên encode business logic ở đây

### Decision 3: Optional If-Unmodified-Since header support

**Chọn:** Hỗ trợ `If-Unmodified-Since` header ở controller level như một optional optimistic check.

**Tại sao:** Frontend có thể gửi kèm timestamp của lúc user bắt đầu edit. Nếu server detect conflict → 409. Đây là nice-to-have, không required. Implementation đơn giản: đọc header, so sánh với `LastModifiedOnUtc`, return 409 nếu mismatch trước khi process.

### Decision 4: Fix UpdateStatus to be idempotent

**Chọn:** `UpdateStatus` method nên thực hiện `ExecuteUpdateAsync` với `LastModifiedOnUtc` trong SET clause (để update timestamp), nhưng vẫn không dùng concurrency token — vì `UpdateStatus` chỉ change status, không phải content.

**Tại sao:** Status change là independent operation. Nếu concurrent `UpdateStatus` + `Update` xảy ra, cả hai đều nên succeed. `Update` sẽ ghi đè mọi thứ kể cả status, `UpdateStatus` chỉ update status. Không có conflict resolution phức tạp cần thiết.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Lost update**: User A và B cùng edit, A save trước, B save sau → B ghi đè A's changes mà không warning | Triệt để giải quyết: dùng optional `If-Unmodified-Since` header. Frontend có thể gửi timestamp lúc fetch. Tuy nhiên, đây là trade-off chấp nhận được — hầu hết CMS đều hoạt động kiểu "last write wins" |
| **Migration drop xmin column**: Nếu có code nào khác reference `xmin`, migration sẽ fail | Review toàn bộ codebase trước khi generate migration. Chỉ có `TourEntity` + `TourConfiguration` reference `RowVersion`/`xmin` |
| **Breaking change cho clients**: Nếu có client nào đó đọc `RowVersion` từ API response | Hiện tại API không expose `RowVersion` — entity không serialize ra public DTO. Safe |

## Migration Plan

1. **Review**: Verify không có code nào khác reference `RowVersion` hoặc `xmin`
2. **Code changes**:
   - Remove `RowVersion` property từ `TourEntity.cs`
   - Remove `xmin` configuration từ `TourConfiguration.cs`
   - Update `TourService.Update` với try-catch cho `DbUpdateConcurrencyException`
   - Update `TourRepository.UpdateStatus` — không cần thay đổi logic vì không dùng `RowVersion`
   - Optionally thêm `If-Unmodified-Since` check ở `TourController.Update`
3. **EF Core Migration**:
   - `dotnet ef migrations add RemoveTourXminConcurrencyToken`
   - Migration chỉ DROP column `xmin` từ `Tours` table
4. **Test**: Test update tour với concurrent requests
5. **Deploy**: Chạy migration trên production

## Open Questions

1. **Có nên thêm `Version` (int) column thay vì chỉ dùng timestamp?** — Timestamp có thể bị trùng milliseconds. Int version là deterministic hơn, nhưng cần thêm migration + changes. Đánh giá: không cần thiết cho admin dashboard use case.
2. **Nên đặt try-catch ở đâu?** — Ở `TourService.Update` (recommended) vs ở `UpdateTourCommandHandler.Handle`. Handler đang gọi `TourService.Update`, nên catch ở handler là hợp lý hơn.

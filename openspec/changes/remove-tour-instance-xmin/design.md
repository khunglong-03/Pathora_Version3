## Context

### Current State

- `TourInstanceEntity.cs:57-59` có property `RowVersion` mapped to PostgreSQL `xmin` column với `[DatabaseGenerated(DatabaseGeneratedOption.Computed)]` và `IsConcurrencyToken()`
- `TourInstanceConfiguration.cs:125-130` cấu hình `xmin` là concurrency token
- `UpdateTourInstanceCommand.cs:28` nhận `uint? RowVersion` và validator yêu cầu `NotNull()`
- `TourInstanceService.cs:270` gán `entity.RowVersion = request.RowVersion ?? 0`
- `TourInstanceService.cs:276-280` bắt `DbUpdateConcurrencyException` và trả về 409 Conflict
- Frontend gửi `rowVersion` từ API response lên server trên mỗi update

### Problem

PostgreSQL `xmin` bump theo transaction ID chứ không phải row modification count. Khi frontend gửi `RowVersion` từ response trước đó, transaction ID có thể đã thay đổi vì bất kỳ write nào trong transaction — không chỉ user edit. Điều này gây false-positive conflicts.

### Constraints

- Không muốn user nhận 409 khi không có real conflict
- Migration phải an toàn cho production data
- Frontend hiện tại dùng `rowVersion` — cần remove đồng bộ

## Goals / Non-Goals

**Goals:**
- Remove `xmin`/`RowVersion` concurrency token từ `TourInstanceEntity`
- Remove `rowVersion` khỏi toàn bộ chain: DTO, Command, Service, Validator, Mapping, Frontend
- Giữ nguyên flow update — chỉ bỏ concurrency check
- Viết migration drop `xmin` column

**Non-Goals:**
- Không implement alternative concurrency mechanism (no version column, no pessimistic lock)
- Không change API endpoint URL
- Không change request/response structure ngoài việc bỏ `rowVersion`

## Decisions

### Decision 1: Remove xmin entirely, no replacement

**Chọn:** Bỏ hoàn toàn `RowVersion`/`xmin`, không thay thế bằng mechanism nào khác.

**Tại sao:** TourInstance update flow không cần optimistic locking ở cấp độ row. Nếu hai user cùng edit cùng lúc, "last write wins" là acceptable cho admin dashboard use case. Không có financial transaction hay sensitive data cần strict conflict resolution.

**Alternatives considered:**
- *Thêm `Version` int column*: Clean nhưng overkill cho use case này
- *Dùng `LastModifiedOnUtc` timestamp*: Không deterministic vì two writes same millisecond possible

### Decision 2: Remove rowVersion từ Command + Validator

**Chọn:** Bỏ `uint? RowVersion` parameter và `NotNull()` validator rule.

**Tại sao:** Nếu command vẫn nhận `RowVersion` nhưng entity không dùng nữa, client gửi giá trị vô nghĩa. Clean hơn là bỏ hoàn toàn.

### Decision 3: Migration drop xmin from TourInstances

**Chọn:** Tạo migration mới `RemoveTourInstanceXminConcurrencyToken` chỉ DROP `xmin` column.

**Tại sao:** Giống approach đã dùng cho `TourEntity`. Chạy migration thủ công sau khi code deploy — không auto-apply on startup.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Lost update**: User A và B cùng edit, A save trước, B save sau → B ghi đè A | Acceptable trade-off cho admin dashboard. No financial data at risk. |
| **Migration drop xmin**: Nếu có migration khác reference xmin, sẽ fail | Chỉ có `TourInstanceEntity` reference xmin. Designer files có snapshot nhưng không ảnh hưởng. |
| **Frontend chưa sync**: Frontend vẫn gửi rowVersion sau khi backend bỏ | Frontend code cùng change — đảm bảo sync |
| **Breaking API**: Client nào đọc `rowVersion` từ response sẽ break | Change này là part của full xmin removal — tất cả clients cần update cùng |

## Migration Plan

1. **Code changes** (backend):
   - Remove `RowVersion` property từ `TourInstanceEntity.cs`
   - Remove `xmin` config từ `TourInstanceConfiguration.cs`
   - Remove `RowVersion` khỏi `TourInstanceDto.cs`
   - Remove `uint? RowVersion` khỏi `UpdateTourInstanceCommand.cs` + validator
   - Remove `entity.RowVersion = request.RowVersion` khỏi `TourInstanceService.cs`
   - Remove try-catch `DbUpdateConcurrencyException` từ `TourInstanceService.cs`
   - Remove `RowVersion` mapping khỏi `TourInstanceProfile.cs`

2. **Code changes** (frontend):
   - Remove `rowVersion?: number` khỏi `NormalizedTourInstanceDto` type
   - Remove `rowVersion?: number` khỏi `UpdateTourInstancePayload`
   - Remove `rowVersion: data.rowVersion` khỏi service call và component

3. **Database Migration**:
   - `dotnet ef migrations add RemoveTourInstanceXminConcurrencyToken` in `panthora_be/src/Infrastructure`
   - Migration chỉ DROP column `xmin` từ `TourInstances` table
   - Run migration **thủ công** sau code deploy

4. **Test**: Verify tour instance update succeed without `xmin`

## Open Questions

1. **Nên giữ hay bỏ try-catch DbUpdateConcurrencyException?** — Vì không còn concurrency token, exception này không còn throw được. Có thể bỏ hoàn toàn. Tuy nhiên, giữ try-catch để phòng ngừa nếu có entity khác dùng concurrency token. → **Quyết định: Bỏ try-catch** vì nó wrapping success case trong try-catch 불필요.

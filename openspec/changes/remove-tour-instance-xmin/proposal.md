## Why

`TourInstanceEntity` hiện dùng PostgreSQL `xmin` column làm concurrency token (`IsConcurrencyToken()`) để detect concurrent updates. Tương tự vấn đề đã gặp với `TourEntity` — `xmin` bump theo transaction ID chứ không phải row modification count, gây khó kiểm soát trong các operation phức tạp (batch updates, nested entities). Khi frontend gửi `RowVersion` từ API response lên server, nếu transaction ID đã thay đổi giữa fetch và save, user sẽ nhận 409 Conflict dù dữ liệu không thực sự conflict.

## What Changes

- **Remove** `RowVersion`/`xmin` concurrency token khỏi `TourInstanceEntity` (EF Core property + database column)
- **Remove** `xmin` configuration từ `TourInstanceConfiguration.cs`
- **Remove** `RowVersion` khỏi `TourInstanceDto`, `UpdateTourInstanceCommand`, `TourInstanceService.Update`, và `TourInstanceProfile` mapping
- **Update** frontend — remove `rowVersion` từ type definitions, service payload, và component usage
- **Giữ nguyên** conflict handling — `DbUpdateConcurrencyException` không còn throw được vì không có concurrency token, nên trả về success thay vì conflict
- **Viết migration** để drop `xmin` column từ `TourInstances` table

## Capabilities

### New Capabilities

- (none — đây là removal/cleanup, không tạo capability mới)

### Modified Capabilities

- `tour-instance-management`: Yêu cầu "RowVersion concurrency check" bị loại bỏ khỏi spec vì không còn được implement

## Impact

- **EF Core**: `TourInstanceConfiguration.cs` — remove `RowVersion` / `xmin` configuration
- **Entity**: `TourInstanceEntity.cs` — remove `RowVersion` property và `[DatabaseGenerated]` attribute
- **DTO**: `TourInstanceDto.cs` — remove `uint RowVersion` parameter
- **Command**: `UpdateTourInstanceCommand.cs` — remove `uint? RowVersion`, validator rule, nullable requirement
- **Service**: `TourInstanceService.cs` — remove `entity.RowVersion = request.RowVersion ?? 0`, remove try-catch for `DbUpdateConcurrencyException`
- **Mapping**: `TourInstanceProfile.cs` — remove `RowVersion` mapping
- **Database**: Migration mới drop `xmin` column từ `TourInstances` table
- **Frontend**: `types/tour.ts`, `tourInstanceService.ts`, `TourInstanceDetailPage.tsx` — remove all `rowVersion` references
- **API Contract**: Breaking change — `PUT /api/tour-instances/{id}` và response không còn `rowVersion` field

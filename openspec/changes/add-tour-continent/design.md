## Context

Backend `.NET 10` sử dụng Clean Architecture + CQRS + EF Core với PostgreSQL. Enum hiện tại được lưu dạng string (varchar(50)) trong DB, sử dụng `[Description]` attribute cho display. Tour hiện có `TourScope` (Domestic/International) nhưng không xác định được châu lục cụ thể.

## Goals / Non-Goals

**Goals:**
- Thêm Continent enum với 6 giá trị (Asia, Europe, Africa, Americas, Oceania, Antarctica)
- Continent nullable — null khi Domestic, bắt buộc khi International
- Tạo migration an toàn, không mất dữ liệu
- Giữ consistency với pattern enum hiện tại

**Non-Goals:**
- Không thay đổi TourInstanceEntity (chỉ thêm vào TourEntity)
- Không tạo Continent filter/query/endpoint API ở bước này
- Không seed dữ liệu mới

## Decisions

### 1. Enum values: Tiếng Anh với `[Description]` tiếng Việt

Pattern giống hệt các enum hiện tại (`TourScope`, `TourStatus`, etc.):
- Enum value = tiếng Anh (universal anchor, dùng trong code)
- `[Description]` = tiếng Việt (dùng cho i18n/display)

**Alternatives considered:**
- Tiếng Việt toàn bộ → không consistent với codebase, khó maintain

### 2. Continent nullable trên DB

Lưu `varchar(50) NULL` thay vì required.

**Alternatives considered:**
- Required với default Asia → phải set giá trị cho tất cả existing tours (cần backfill data)
- Separate table cho Continent → overkill cho enum đơn giản

**Rationale:** Đơn giản, migration nhẹ nhất, không ảnh hưởng existing data.

### 3. EF Core string conversion

Giống pattern hiện tại:
```csharp
builder.Property(t => t.Continent)
    .HasConversion<string>()
    .HasMaxLength(50);
```

### 4. Validation ở tầng Domain

Validation `International → Continent required` đặt trong entity business logic hoặc FluentValidation, không cần DB constraint.

**Rationale:** Giữ DB schema đơn giản, validation là rule nghiệp vụ.

## Risks / Trade-offs

- [Risk] Existing international tours không có Continent → **Mitigation**: Validation không block existing data, chỉ enforce cho new/update
- [Risk] Confusing giữa `TourScope` và `Continent` trên UI → **Mitigation**: UI nên show continent picker chỉ khi International được chọn

## Migration Plan

```
1. Tạo migration: dotnet ef migrations add AddContinentToTour
2. Apply migration: dotnet ef database update
3. Build verification: dotnet build
```

Rollback: `dotnet ef migrations remove` nếu chưa apply, hoặc manual DROP COLUMN nếu đã apply.

## Open Questions

_(Không có.)_

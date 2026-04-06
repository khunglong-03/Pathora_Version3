# Thiết kế CancellationPolicy có Tiers

## Tổng quan

Cấu trúc lại CancellationPolicy theo mô hình tier (giống PricingPolicy), mỗi policy chứa danh sách các tier với khoảng ngày và % phạt.

## Vấn đề hiện tại

1. **Cấu trúc phẳng** — Mỗi `CancellationPolicyEntity` chỉ lưu 1 `MinDays`, `MaxDays`, `PenaltyPercentage`. Muốn bảng phí hoàn tiền đầy đủ phải tạo nhiều record riêng cho cùng TourScope.

2. **Không gộp được** — 1 tour gắn 1 policy, nhưng bảng hoàn tiền thực tế cần nhiều bậc (ví dụ: 7+ ngày → hoàn 100%, 3-7 ngày → hoàn 70%, 0-3 ngày → hoàn 0%).

3. **Field không dùng** — `ApplyOn` (FullAmount/DepositOnly) luôn là "DepositOnly" → nên xóa.

## Thiết kế

### 1. Domain Model

#### CancellationPolicyTier (value object mới)

```csharp
public sealed record CancellationPolicyTier(
    int MinDaysBeforeDeparture,
    int MaxDaysBeforeDeparture,
    decimal PenaltyPercentage)
{
    // Tạo với kiểm tra hợp lệ: min >= 0, max >= min, penalty 0-100
    public static CancellationPolicyTier? Create(int min, int max, decimal penalty) =>
        min >= 0 && max >= min && penalty >= 0 && penalty <= 100
            ? new CancellationPolicyTier(min, max, penalty)
            : null;
}
```

**Penalty = 0 được phép** — doanh nghiệp có thể cố ý tạo tier 0% (ví dụ: hủy cùng ngày không hoàn tiền).

#### CancellationPolicyEntity (sửa đổi)

**Xóa fields:**
- `MinDaysBeforeDeparture` (int)
- `MaxDaysBeforeDeparture` (int)
- `PenaltyPercentage` (decimal)
- `ApplyOn` (string)

**Thêm fields:**
- `Tiers` (List<CancellationPolicyTier>) — lưu JSONB

**Giữ nguyên:**
- `Id`, `PolicyCode`, `TourScope`, `Status`, `IsDeleted`, `Translations`, audit fields

**Audit trail:** thêm `performedBy` vào `Create()` và `Update()`.

### 2. Validation Rules

| Rule | Mô tả |
|------|--------|
| MIN_TIER_COUNT | Policy phải có ít nhất 1 tier |
| TIER_NO_OVERLAP | Các tiers trong cùng policy không được chồng lấn ngày (áp dụng cho mọi Status) |
| TIER_COVERS_ALL | Các tiers phải cover đầy đủ từ 0 đến `int.MaxValue`, không có khoảng trống. Tier cuối cùng phải có `MaxDaysBeforeDeparture = int.MaxValue`. Kiểm tra: `tiers[^1].MaxDaysBeforeDeparture == int.MaxValue` |
| TIER_MIN_DAYS | Mỗi tier có `MinDaysBeforeDeparture >= 0` |
| TIER_MAX_GE_MIN | Mỗi tier có `MaxDaysBeforeDeparture >= MinDaysBeforeDeparture` |
| TIER_PENALTY_RANGE | Mỗi tier có `PenaltyPercentage` từ 0 đến 100 |

### 3. EF Core Configuration

**Xóa columns:**
- `MinDaysBeforeDeparture`
- `MaxDaysBeforeDeparture`
- `PenaltyPercentage`
- `ApplyOn`

**Thêm/cập nhật:**
- `Tiers` → JSONB column (`List<CancellationPolicyTier>`), lưu dạng JSON array

**Thứ tự migration:**
1. Thêm column `Tiers` (JSONB) trước
2. Populate dữ liệu từ các columns cũ vào JSONB
3. Chỉ sau đó mới xóa các columns cũ

### 4. Repository Interface

**Thêm method mới:**
```csharp
Task<IReadOnlyList<CancellationPolicyEntity>> FindByTourScope(TourScope tourScope);
```

Trả về tất cả policies không bị xóa (`!IsDeleted`), không lọc theo Status.

### 5. Logic CalculateRefund

**Request:**
```csharp
public sealed record CalculateRefundRequest(
    Guid TourId,
    DateTimeOffset CancellationDate,
    decimal DepositAmount);
```

**Response:**
```csharp
public sealed record CalculateRefundResponse(
    decimal DepositAmount,
    int DaysBeforeDeparture,
    CancellationPolicyTier? MatchingTier,
    string? PolicyCode,
    decimal RefundAmount,
    decimal PenaltyAmount,
    CalculationStatus Status);  // Calculated | NoPolicyAssigned | NoTierMatch | AfterDeparture

public enum CalculationStatus { Calculated, NoPolicyAssigned, NoTierMatch, AfterDeparture }
```

**Thuật toán:**
1. Load `Tour` → lấy `CancellationPolicyId`
2. Nếu `CancellationPolicyId` là null → hoàn 100%, `Status = NoPolicyAssigned`
3. Load `CancellationPolicy` → lấy `Tiers`
4. Tính `daysBeforeDeparture = (Tour.DepartureDate - CancellationDate).Days`
5. Nếu `daysBeforeDeparture < 0` → hoàn 0%, `Status = AfterDeparture` (đã khởi hành rồi)
6. Tìm tier phù hợp: tier có `MinDays <= daysBeforeDeparture <= MaxDays`
7. Nếu không tìm được tier → hoàn 0%, `Status = NoTierMatch`
8. Tính `PenaltyAmount = DepositAmount * (PenaltyPercentage / 100)`
9. Tính `RefundAmount = DepositAmount - PenaltyAmount`, `Status = Calculated`

### 6. CQRS Commands

#### CreateCancellationPolicyCommand
```csharp
public sealed record CreateCancellationPolicyCommand(
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null
) : ICommand<ErrorOr<CancellationPolicyResponse>>;
```

#### UpdateCancellationPolicyCommand
```csharp
public sealed record UpdateCancellationPolicyCommand(
    Guid Id,
    TourScope TourScope,
    List<CancellationPolicyTier> Tiers,
    CancellationPolicyStatus? Status = null,
    Dictionary<string, CancellationPolicyTranslationData>? Translations = null
) : ICommand<ErrorOr<Success>>;
```

### 7. CQRS Queries

#### GetCancellationPoliciesByScopeQuery (mới)
```csharp
public sealed record GetCancellationPoliciesByScopeQuery(TourScope TourScope)
    : IQuery<ErrorOr<IReadOnlyList<CancellationPolicyResponse>>>;
```

Các query hiện tại giữ nguyên: `GetAllCancellationPoliciesQuery`, `GetCancellationPolicyByIdQuery`.

### 8. API Endpoints

Giữ nguyên các endpoints hiện tại (POST, PUT, DELETE, GET all, GET by id).

Endpoints mới:
- `GET /api/cancellation-policies/scope/{scope}` → `GetCancellationPoliciesByScopeQuery`
- `POST /api/cancellation-policies/calculate-refund` → `CalculateRefundQuery`

## Ngoài phạm vi

- Thiết kế lại UI frontend (form/list) — chỉ backend
- Thay đổi quan hệ Tour → CancellationPolicyId
- Migration dữ liệu CancellationPolicy hiện tại — cần viết script riêng
- Đa ngôn ngữ cho tier labels (tiers là số/ngày, translations chỉ ở policy level)

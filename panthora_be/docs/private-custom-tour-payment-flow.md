# Private tour — luồng thanh toán và quyết toán

Tài liệu cho dev: mô tả **nghiệp vụ** bằng tiếng Việt; **route API, enum, tên bảng** giữ như trong code.

## Bối cảnh (đồng bộ OpenSpec `private-custom-tour`)

- Tour riêng (`InstanceType = Private`) có thể bắt đầu ở trạng thái instance **`Draft`**.
- Hai nhánh từ **Tour template** (chi tiết `openspec/changes/private-custom-tour/design.md`):
  - **Không chỉnh mẫu:** không bật luồng Manager → Operator chỉnh nội dung như một bước bắt buộc; thanh toán gate **30% hoặc 100%** theo milestone spec.
  - **Có chỉnh thêm:** Manager → Tour Operator; sau khi khách **Đồng ý** bản gửi: **phải** thanh toán **30% hoặc 100%** theo policy; **từ chối** không bắt buộc lý do.
- Operator chỉnh itinerary / **`FinalSellPrice`** (không thay snapshot `BasePrice`).
- **Delta** = `FinalSellPrice` − **tổng đã thanh toán Completed** (gồm mọi đợt: cọc, full ban đầu, v.v.).

## Nhánh Delta sau khi đã có khoản thu và `FinalSellPrice`

| Delta | Hành vi ngắn gọn | Gợi ý trong code |
|--------|------------------|-------------------|
| **> 0** | Booking có thể → **`PendingAdjustment`**, sinh biên nhận top-up (= Delta). | `ApplyPrivateTourSettlementCommand` và REST co-design/settlement hiện có / mở rộng |
| **= 0** | Chốt theo máy trạng thái. | Cùng command settlement |
| **< 0** | Cộng **User.Balance** + **TransactionHistory** (credit). | `User.CreditBalance`, handler settlement |

## Webhook SePay & idempotency

- Callback map theo **`TransactionCode`** và **`TransactionId`** (SePay).
- **`CheckDuplicateBySepayIdAsync`**: tránh cộng trùng.
- **Nhiều** giao dịch Completed trên một booking (30%, 100%, top-up…) — **tổng paid** = SUM Completed.

## Hạn chờ và job nền

- **`TourInstance.ConfirmationDeadline`**: nhắc/hủy top-up chờ trong `PendingAdjustment` nếu quá policy; **trừ phí/hủy** chỉ merge sau chỉ đạo pháp lý/kế toán.
- **`PrivateTourTopUpDeadlineWorkerService`** / **`PrivateTourTopUpDeadlineProcessor`** (tham chiếu repo).

## Trạng thái liên quan

- **`TourInstanceStatus`**: `Draft`, `PendingAdjustment`, `Confirmed`, `Cancelled`, …
- **`BookingStatus`**: `Paid`, `PendingAdjustment`, `Cancelled`, …

## Implementation vs spec

- Code trong repo có thể vẫn có nhánh **100% Base trước co-design**. OpenSpec/spec đã chuyển sang **milestones 30%/100% và hai nhánh** — cần refactor hoặc change follow-up để khớp.

## Regression (gate đề xuất)

```bash
cd panthora_be
dotnet test tests/Domain.Specs/Domain.Specs.csproj \
  --filter "FullyQualifiedName~PrivateTourStateMachine|FullyQualifiedName~UserEntityCreditBalance|FullyQualifiedName~TransactionHistoryEntityTests|FullyQualifiedName~PrivateTourTopUpDeadline|FullyQualifiedName~PrivateTourDomainPersistence|FullyQualifiedName~PrivateTourCoDesign|FullyQualifiedName~ReconcileProviderCallbackAsync_WhenDuplicate|FullyQualifiedName~ProcessSepayCallbackAsync_WhenExternalIdAlreadyCompleted|FullyQualifiedName~ProcessSepayCallbackAsync_BasePlusTopUp"
```

## Đọc thêm

- OpenSpec change: `openspec/changes/private-custom-tour/`

# Private tour — luồng thanh toán hai giai đoạn (co-design)

Tài liệu cho dev: mô tả **nghiệp vụ** bằng tiếng Việt; **route API, mã lệnh, enum, tên bảng** giữ tiếng Anh như trong code.

## Bối cảnh

- Tour riêng (`InstanceType = Private`) bắt đầu ở trạng thái instance **`Draft`**.
- Khách thanh toán **100% Base Price** (giá snapshot tại lúc tạo instance) trước khi co-design.
- Operator chỉnh itinerary / giá chốt tay: **`FinalSellPrice`** (không thay thế `BasePrice`).
- Sau khi có `FinalSellPrice`, hệ thống quyết toán **Delta** = `FinalSellPrice − tổng đã thu (Completed)` trên các giao dịch thanh toán của booking.

## Hai nhánh Delta

| Delta | Hành vi ngắn gọn | Gợi ý endpoint / command (tiếng Anh) |
|--------|------------------|--------------------------------------|
| **> 0** | Booking → **`PendingAdjustment`**, instance → **`PendingAdjustment`**, tạo giao dịch top-up (`TransactionType.FullPayment`). | `ApplyPrivateTourSettlementCommand` — REST do controller co-design/sttlement expose. |
| **= 0** | Instance → **`Confirmed`**. | Cùng command settlement. |
| **< 0** | Cộng tiền vào **`User.Balance`**, ghi **`TransactionHistory`** (credit), instance → **`Confirmed`**. | `User.CreditBalance`, `TransactionHistoryEntity.CreateCredit` trong handler settlement. |

## Webhook SePay & idempotency

- Callback map theo **`TransactionCode`** trong nội dung chuyển khoản và **`TransactionId`** (SePay).
- **`CheckDuplicateBySepayIdAsync`**: nếu đã tồn tại giao dịch cùng SePay id và trạng thái **không phải Pending**, webhook trả snapshot hiện có **không** gọi lại `ProcessSepayCallbackAsync` (tránh cộng tiền / cập nhật booking hai lần).
- Có thể có **nhiều** giao dịch `FullPayment` trên một booking (base + top-up); mỗi giao dịch có `TransactionCode` riêng.

## Hạn xác nhận top-up

- **`TourInstance.ConfirmationDeadline`**: job nền hủy instance/booking **`PendingAdjustment`** nếu quá hạn chưa hoàn tất top-up; đóng giao dịch top-up pending/processing (không tự trừ phí hủy trong code — chờ policy pháp lý/kế toán).
- Worker: **`PrivateTourTopUpDeadlineWorkerService`** (hosted service), xử lý qua **`PrivateTourTopUpDeadlineProcessor`**.

## Trạng thái liên quan (tham chiếu)

- **`TourInstanceStatus`**: `Draft`, `PendingAdjustment`, `Confirmed`, `Cancelled`, …
- **`BookingStatus`**: `Paid`, `PendingAdjustment`, `Cancelled`, …

## Đọc thêm trong repo

- OpenSpec change: `openspec/changes/private-custom-tour/`
- Tests gợi ý: `PrivateTourStateMachineTests`, `PrivateTourTopUpDeadlineProcessorTests`, `PaymentReconciliationServiceTests.ReconcileProviderCallbackAsync_WhenDuplicateSepayId*`, `PaymentServiceTests.ProcessSepayCallbackAsync_*`.

### Lệnh regression (gate cho change này)

```bash
cd panthora_be
dotnet test tests/Domain.Specs/Domain.Specs.csproj \
  --filter "FullyQualifiedName~PrivateTourStateMachine|FullyQualifiedName~UserEntityCreditBalance|FullyQualifiedName~TransactionHistoryEntityTests|FullyQualifiedName~PrivateTourTopUpDeadline|FullyQualifiedName~PrivateTourDomainPersistence|FullyQualifiedName~PrivateTourCoDesign|FullyQualifiedName~ReconcileProviderCallbackAsync_WhenDuplicate|FullyQualifiedName~ProcessSepayCallbackAsync_WhenExternalIdAlreadyCompleted|FullyQualifiedName~ProcessSepayCallbackAsync_BasePlusTopUp"
```

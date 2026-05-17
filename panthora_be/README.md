# Panthora Backend

ASP.NET Core backend for the Panthora travel/tour platform.

## Tech Stack

- .NET 10
- Clean Architecture + CQRS
- xUnit for tests
- GitLab CI


## Documentation

- [Private tour — luồng thanh toán hai giai đoạn (co-design)](docs/private-custom-tour-payment-flow.md) — mô tả nghiệp vụ (VI), route/identifier (EN).

### Manager cancel tour — cascade & refund tracking

- **Khi Manager huỷ tour (status → `Cancelled`)**: hệ thống tự động cascade cancel toàn bộ booking active (`Pending`/`Confirmed`/`Deposited`/`Paid`). Booking đã `Cancelled` / `Completed` bị skip.
- **Tour InProgress / Completed không thể huỷ** — endpoint trả `TourInstance.CannotCancelAfterStart`.
- **Penalty cố định 30%** trên số tiền khách đã thanh toán (không dùng `CancellationPolicyEntity` cho luồng này). 70% còn lại Manager liên hệ khách offline.
- **Không trừ ví Manager** — refund tracking là workflow ngoài, Manager click "Đã liên hệ" → "Đã hoàn tiền" trong dashboard.
- **RefundStatus enum**: `Pending` (cần liên hệ) → `Contacted` (đã gọi) → `Refunded` (đã chuyển khoản) → `NotApplicable` (không có gì hoàn vì khách chưa trả).
- **API**:
  - `PATCH /api/tour-instances/{id}/status` (Authorize Admin/Manager) — cancel tour + cascade booking.
  - `PATCH /api/bookings/{id}/refund-status` (Authorize Admin/Manager) — cập nhật Pending → Contacted → Refunded.
  - `GET /api/bookings?refundStatus=Pending` — filter Manager dashboard.
- **Email**: customer nhận thông báo `tour-cancelled.{vi,en}.html` với `refundOutstandingAmount` + hotline. Mail fail không throw, log warning.
- **Frontend**: route `/manager/dashboard/refund-tracking`, tabs `Pending|Contacted|Refunded|All`, click-to-call `tel:` / `mailto:`, highlight đỏ nếu Pending > 7 ngày.

## Local Development

Run from `D:/DoAn/panthora_be`.

### Restore and build

```bash
dotnet restore LocalService.slnx
dotnet build LocalService.slnx
dotnet build LocalService.slnx -c Release
```

### Run tests

```bash
dotnet test LocalService.slnx
dotnet test tests/Domain.Specs/Domain.Specs.csproj
```

Regression scope cho change **private-custom-tour** (thanh toán 2 pha, webhook, ví): có thể lọc test theo namespace/feature liên quan thay vì chạy toàn bộ `Domain.Specs` nếu môi trường có test legacy đỏ — xem `docs/private-custom-tour-payment-flow.md`.

## SePay Webhook

- **Endpoint**: `POST /api/payment/sepay-webhook` (served by `SepayWebhookController` in `PublicApi`).
- **Purpose**: Receives payment completion notifications from SePay gateway. Updates booking payment status and broadcasts `BookingStatusChanged` via SignalR.
- **Idempotency**: Safe to receive duplicate callbacks — checks transaction state before processing.
- **Fallback**: If webhook delivery fails (5xx), the outbox sweep worker retries periodically with `source = "sepay-sweep"`.
- **Deploy note**: After deploying, update the webhook URL in the SePay dashboard to `/api/payment/sepay-webhook`. No legacy alias is supported.

### Run API locally

We use Nginx as a reverse proxy for both `Api` (authenticated) and `PublicApi` (anonymous). The recommended way to run them locally is via Docker Compose:

```bash
docker-compose up --build -d
```

Alternatively, you can run them manually:
```bash
dotnet run --project src/Api/Api.csproj
dotnet run --project src/PublicApi/ApiPublic/ApiPublic.csproj
```

## Architecture: PublicApi vs Api

The backend is split into two boundary services:
1. **PublicApi** (Port 8081): Handles all anonymous requests (`/api/public/*`, `/api/auth/*`, webhook endpoints). **NO** authentication needed.
2. **Api** (Port 8080): Handles all authenticated customer and admin requests (`/api/customer/*`, `/api/admin/*`, etc.). Requires JWT.

### Decision Tree: Adding a New Endpoint
- Does the endpoint require the user to be logged in? 
  - **Yes**: Add to `Api` project.
  - **No** (anonymous access): Add to `PublicApi` project.

### Migrations Rule
- **NEVER** auto-run migrations on service startup.
- **ALWAYS** run `dotnet ef database update` manually from the `Api` project. Do not run it from `PublicApi`.

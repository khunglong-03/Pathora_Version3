# Panthora Backend

ASP.NET Core backend for the Panthora travel/tour platform.

## Tech Stack

- .NET 10
- Clean Architecture + CQRS
- xUnit for tests
- GitLab CI


## Documentation

- [Private tour — luồng thanh toán hai giai đoạn (co-design)](docs/private-custom-tour-payment-flow.md) — mô tả nghiệp vụ (VI), route/identifier (EN).

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

### Run API

```bash
dotnet run --project src/Api/Api.csproj
```


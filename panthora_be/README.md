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

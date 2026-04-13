# Panthora Backend

ASP.NET Core backend for the Panthora travel/tour platform.

## Tech Stack

- .NET 10
- Clean Architecture + CQRS
- xUnit for tests
- GitLab CI


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

### Run API

```bash
dotnet run --project src/Api/Api.csproj
```


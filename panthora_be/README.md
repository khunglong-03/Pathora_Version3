# Panthora Backend

ASP.NET Core backend for the Panthora travel/tour platform.

## Tech Stack

- .NET 10
- Clean Architecture + CQRS
- xUnit for tests
- GitLab CI
- GitNexus for code intelligence and repository analysis

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

## GitNexus Integration

This repository uses GitNexus to analyze the codebase and provide code intelligence for debugging, impact analysis, and safer refactoring.

### Install dependencies

```bash
npm ci
```

### Check GitNexus status

```bash
npm run gitnexus:status
```

### Build or refresh the GitNexus index

```bash
npm run gitnexus:analyze
```

### Full GitNexus check

```bash
npm run gitnexus:check
```

`gitnexus:check` refreshes the index and then verifies the repository status.

## CI Validation

GitLab CI runs a dedicated GitNexus check job before backend build and test jobs. This makes GitNexus part of the repository validation flow instead of a local-only tool.

## Notes

- `.gitnexus/` is intentionally ignored and is rebuilt locally or in CI when needed.
- If GitNexus reports a stale index, rerun `npm run gitnexus:analyze`.

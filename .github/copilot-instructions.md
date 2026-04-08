# Copilot Instructions

This is a monorepo workspace containing a Next.js frontend admin dashboard and a .NET backend API.

## Repository Structure

**Active codebases:**
- `pathora/frontend/` — Next.js 16 admin dashboard (port 3003)
- `panthora_be/` — .NET 10 Clean Architecture API

**Important:** The root-level `backend/` folder is NOT the active backend. Use `panthora_be/` instead.

## Build, Test, and Lint Commands

### Frontend (`pathora/frontend/`)

```bash
# Install dependencies
npm --prefix "pathora/frontend" ci

# Development server
npm --prefix "pathora/frontend" run dev              # Port 3003 (webpack)
npm --prefix "pathora/frontend" run dev:turbopack    # Port 3003 (Turbopack)

# Validation
npm --prefix "pathora/frontend" run lint             # ESLint
npm --prefix "pathora/frontend" run build            # Production build
npm --prefix "pathora/frontend" run test             # Vitest (all tests)

# Run specific tests
npm --prefix "pathora/frontend" run test -- "path/to/test.tsx"
npm --prefix "pathora/frontend" run test -- "path/to/test.tsx" -t "test name"
```

### Backend (`panthora_be/`)

```bash
# Build
dotnet restore "panthora_be/LocalService.slnx"
dotnet build "panthora_be/LocalService.slnx"

# Test
dotnet test "panthora_be/LocalService.slnx"          # All tests
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj"  # Domain tests only

# Run specific test
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj" --filter "FullyQualifiedName~TestName"

# Format verification
dotnet format "panthora_be/LocalService.slnx" --verify-no-changes

# Run API
dotnet run --project "panthora_be/src/Api/Api.csproj"
```

### Infrastructure

```bash
# Local PostgreSQL 17 + Redis 7
docker-compose -f "panthora_be/docker-compose.yml" up -d
```

## Architecture Overview

### Frontend Architecture

**Framework:** Next.js 16 (App Router), React 18.3.1, TypeScript

**Directory structure:**
- `src/app/` — App Router pages
  - `(auth)/` — Public routes (login, register, forgot-password)
  - `(dashboard)/` — Protected admin routes
- `src/components/` — Reusable components
  - `ui/` — Primitive components (Button, Input, Modal, Dropdown)
  - `partials/` — Feature components (orders/, products/, customers/)
- `src/api/` — Axios instance, endpoints, error handling
- `src/services/` — Domain services (authService, catalogService)
- `src/store/` — Redux Toolkit slices, RTK Query
- `src/contexts/` — React Context (AuthContext)
- `src/hooks/` — Custom hooks (useAuth, useDarkMode, useRealtimeRefresh)
- `src/i18n/` — i18next locales (en.json, vi.json)

**Data fetching layers (2 patterns coexist):**
1. Imperative: `src/api/axiosInstance.ts` + `src/services/*`
2. RTK Query: `src/store/api/*`

**Extend the pattern already used in the feature** — don't introduce a third approach.

**API Response helpers:** Use `src/utils/apiResponse.ts` helpers instead of manually unwrapping backend payloads:
- `extractItems<T>()` — Extract array from nested backend response
- `extractResult<T>()` — Extract single result from `result`, `data`, or `value` field
- `extractData<T>()` — Extract data from `ServiceResponse<T>` checking `success` flag
- `handleApiError()` — Map backend errors to translation keys with proper error codes

**Forms:** Use `react-hook-form` + `yup` validation (existing pattern).

**i18n:** Use `useTranslation()` hook with existing `en`/`vi` locale keys — avoid hardcoded UI strings.

**Testing:** Vitest with global mocks for `framer-motion`, `@phosphor-icons/react`, `next/link`, pagination, and skeleton table helpers (see `vitest.setup.tsx`).

### Backend Architecture

**Framework:** .NET 10, ASP.NET Core, Clean Architecture + CQRS

**Directory structure:**
- `src/Api/` — Controllers, middleware, filters
- `src/Application/` — CQRS handlers (Commands, Queries, Validators)
- `src/Domain/` — Entities, value objects, domain events
- `src/Infrastructure/` — EF Core, JWT auth, external services
- `tests/Domain.Specs/` — xUnit integration tests

**Key patterns:**
- File-scoped namespaces
- `sealed` records/classes with primary constructors where possible
- FluentValidation for command/query validation (in MediatR pipeline, NOT in controllers)
- `ErrorOr<T>` for expected business failures (don't throw exceptions for expected cases)
- `ResultSharedResponse<T>` for API responses (via `BaseApiController`)
- `Program.cs` orchestrates startup; service registration in extension methods

**Build configuration:** `Directory.Build.props` enforces .NET 10, nullable enabled, warnings as errors, code style checks during build.

## Repository-Specific Conventions

### Path Aliases (Frontend)

Use `@/*` for imports: `@/components/ui/Button`, `@/hooks/useAuth`

### API Communication

**Base URLs** (from `src/configs/apiGateway.ts`):
- Dev: `http://localhost:5182`
- Prod: `https://api.vivugo.me`

**Auth:** Cookie-based with `access_token` (HttpOnly=false, SameSite=Lax), refresh token (HttpOnly=true).

**Interceptors:** Axios instance auto-injects Bearer token, handles 401 redirects, sets language header.

### Legacy Code Exclusion

**Do not import** from `src/pages-legacy` or `src/layout-legacy` — these are excluded by `tsconfig.json`.

### Environment Variables

**Frontend:**
- `NEXT_PUBLIC_API_GATEWAY` — API base URL
- `NEXT_PUBLIC_REMOTE_IMAGE_HOSTS` — Allowed image hosts for `next/image`

**Backend:**
- Configuration via `appsettings.json` and environment variables
- Never hardcode secrets — use `builder.Configuration["Key"]`

### GitNexus Code Intelligence

This repository is indexed by GitNexus for code intelligence, impact analysis, and safer refactoring.

**Workflow:**
1. **Before editing any function/class:** Run impact analysis to understand blast radius
2. **Before refactoring:** Use GitNexus rename/context tools to find all references
3. **Before committing:** Run detect changes to verify scope

See `AGENTS.md` for detailed GitNexus workflow and MCP tool usage.

### Execution Policy

**Never automatically:**
- Run build, test, lint, dev servers, or install commands unless explicitly requested
- Start/stop services
- Commit or push code

**Safe to do without asking:**
- Read files, search code, edit files

### Validation Gates

**Frontend changes:**
```bash
npm --prefix "pathora/frontend" run lint && npm --prefix "pathora/frontend" run build
```

**Backend changes:**
```bash
dotnet build "panthora_be/LocalService.slnx"
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj"
```

**Format-sensitive backend changes:**
```bash
dotnet format "panthora_be/LocalService.slnx" --verify-no-changes
```

## CI/CD

**Platform:** GitLab CI (not GitHub Actions)

**Pipelines:**
- `pathora/.gitlab-ci.yml` — Frontend deployment
- `panthora_be/.gitlab-ci.yml` — Backend deployment

Both are deploy-only on `main` branch.

## Real-time Features

**SignalR:** Frontend uses `@microsoft/signalr` with `useRealtimeRefresh` hook for real-time updates.

**Notification hub:** Backend exposes `/hubs/notifications` endpoint.

## Documentation

**Design docs:** `pathora/docs/`  
**Change tracking:** `openspec/changes/` (OpenSpec workflow using spec-driven schema)  
**Architecture details:** See respective `AGENTS.md` and `CLAUDE.md` files in each project root

## Common Pitfalls

**Path confusion:**
- Frontend code is in `pathora/frontend/`, NOT `pathora/` or root-level `backend/`
- Active backend is `panthora_be/`, NOT the root-level `backend/` folder
- Some older docs may reference `D:\DoAn` but workspace is `D:\Doan2`

**Port numbers:**
- Frontend dev server: **port 3003** (some docs incorrectly say 3000/3001)
- Backend API: port 5182 (dev), https://api.vivugo.me (prod)

**React version:**
- Currently using React **18.3.1** (some docs incorrectly mention React 19)

**Data fetching:**
- Two patterns coexist: Axios services (`src/services/*`) and RTK Query (`src/store/api/*`)
- Extend whichever pattern is already used in the feature, don't create a third approach

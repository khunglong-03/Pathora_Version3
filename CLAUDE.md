# CLAUDE.md — DoAn Workspace

Hướng dẫn vận hành cho Claude khi làm việc với workspace `D:\DoAn`.

---

## Cấu Trúc Workspace

```
D:\DoAn\
├── pathora/                          # Repository gốc (git repo)
│   ├── frontend/                     # Frontend: Next.js 16 admin dashboard ★ĐÂY LÀ FRONTEND★
│   │   ├── src/
│   │   │   ├── app/                 # Next.js App Router
│   │   │   │   ├── (auth)/          # Public routes: login, register, forgot-password
│   │   │   │   └── (dashboard)/     # Protected routes: dashboard, products, orders...
│   │   │   ├── components/
│   │   │   │   ├── ui/              # Primitives: Button, Input, Modal, Dropdown...
│   │   │   │   └── partials/        # Feature components: orders/, products/, customers/...
│   │   │   ├── api/                 # Axios instance, endpoints, error handling
│   │   │   ├── services/             # Domain services (authService, catalogService...)
│   │   │   ├── store/               # Redux Toolkit slices, RTK Query apiSlice
│   │   │   ├── contexts/            # AuthContext
│   │   │   ├── hooks/               # Custom hooks: useAuth, useDarkMode, useRealtimeRefresh...
│   │   │   ├── i18n/                # i18next: locales/en.json, locales/vi.json
│   │   │   ├── configs/             # Theme config
│   │   │   └── utils/               # Helpers: apiResponse.ts, formatters...
│   │   ├── public/
│   │   ├── package.json             # dev: port 3003, React 18.3.1, Vitest
│   │   ├── next.config.ts
│   │   ├── eslint.config.mjs
│   │   ├── AGENTS.md                # Frontend-specific rules
│   │   └── CLAUDE.md                # Frontend-specific guidance
│   ├── docs/                        # Design docs & plans
│   ├── openspec/                    # OpenSpec change tracking
│   └── .github/copilot-instructions.md
├── panthora_be/                     # Backend: .NET 10 Clean Architecture + CQRS API
│   ├── src/
│   │   ├── Api/                     # Controllers, middleware, filters
│   │   ├── Application/             # CQRS: Commands, Queries, Handlers, Validators
│   │   ├── Domain/                  # Entities, value objects, domain events
│   │   └── Infrastructure/          # EF Core, JWT auth, external services
│   ├── tests/
│   │   └── Domain.Specs/            # xUnit integration tests
│   ├── LocalService.slnx
│   ├── package.json                 # GitNexus CLI scripts
│   └── README.md                    # Backend build/test/run commands
├── GitNexus/                        # GitNexus CLI tool (dùng qua MCP tools)
├── openspec/                        # OpenSpec workspace config
│   ├── config.yaml
│   ├── specs/
│   │   ├── admin-dashboard-routing/
│   │   ├── admin-tour-request-detail/
│   │   ├── dashboard-navigation-consistency/
│   │   └── role-based-redirect/
│   └── changes/
│       ├── add-bookings-list-endpoint/
│       ├── add-tour-continent/
│       ├── admin-booking-ticket-assignment/
│       ├── admin-role-based-routing/
│       ├── archive/                 # Archived changes
│       ├── fix-*.md                 # Nhiều fix changes
│       ├── frontend-component-refactor/
│       ├── hierarchical-admin/
│       ├── local-postgres-redis-docker/
│       └── ...
├── AGENTS.md                        # Workspace-level agent guide
└── .claude/                         # Claude Opus settings & memory
```

> **Lưu ý quan trọng về đường dẫn:**
>
> - Frontend code ở **`pathora/frontend/`** (KHÔNG PHẢI `pathora/` hay `pathora/frontend/frontend/`)
> - `pathora/` là git repository root, chứa docs và config ở root level
> - `panthora_be/` là backend, **không phải** `backend/`
> - `GitNexus/` chứa CLI tool, dùng qua MCP tools trong Claude Opus
> - Docs cũ có thể ghi sai port (3000/3001), React version (19), hoặc không có tests. Thực tế: **port 3003, React 18.3.1, Vitest có sẵn**

---

## Lệnh Thực Thi

> **Ưu tiên nguồn lệnh:** `package.json` ghi đè mọi docs khác.

### Frontend (`pathora/frontend/`)

```bash
npm --prefix "pathora/frontend" ci                                  # Cài dependencies (exact versions)
npm --prefix "pathora/frontend" run dev                            # Dev server → port 3003
npm --prefix "pathora/frontend" run dev:turbopack                   # Dev server với Turbopack
npm --prefix "pathora/frontend" run lint                            # ESLint (Next.js core-web-vitals + TypeScript)
npm --prefix "pathora/frontend" run build                          # Production build
npm --prefix "pathora/frontend" run start                          # Production server (sau build)
npm --prefix "pathora/frontend" run analyze                        # Bundle analysis
npm --prefix "pathora/frontend" run test                           # Vitest
npm --prefix "pathora/frontend" run test -- "path/to/test.tsx"     # Chạy một file test
npm --prefix "pathora/frontend" run test -- "path" -t "name"       # Chạy test theo tên
```

Frontend scripts thực tế (từ `package.json`):

- `dev` → `next dev --webpack -p 3003`
- `dev:turbopack` → `next dev -p 3003`
- `build` → `next build`
- `start` → `next start -p 3003`
- `lint` → `eslint`
- `test` → `vitest run --pool=threads --maxWorkers=1 --no-file-parallelism`

### Backend (`panthora_be/`)

```bash
dotnet restore "panthora_be/LocalService.slnx"
dotnet build "panthora_be/LocalService.slnx"
dotnet build "panthora_be/LocalService.slnx" -c Release
dotnet test "panthora_be/LocalService.slnx"                               # Tất cả tests
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj"          # Chỉ Domain.Specs
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj" --filter "FullyQualifiedName~TestClassName"
dotnet format "panthora_be/LocalService.slnx" --verify-no-changes       # Format verification
dotnet run --project "panthora_be/src/Api/Api.csproj"                    # Chạy API
```

### GitNexus (Backend — dùng MCP tools)

```bash
npm --prefix "panthora_be" ci                          # Cài GitNexus CLI dependencies
npm --prefix "panthora_be" run gitnexus:status         # Kiểm tra trạng thái index
npm --prefix "panthora_be" run gitnexus:analyze         # Rebuild index
npm --prefix "panthora_be" run gitnexus:check          # Refresh + verify (CI workflow)
```

---

## Kiến Trúc Chi Tiết

### Frontend (`pathora/frontend/`)

| Layer     | Công nghệ                                 | Ghi chú                                                                             |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Framework | Next.js 16 (App Router)                   | React 18.3.1, TypeScript (strict off)                                               |
| State     | Redux Toolkit + RTK Query + React Context | Global: auth/layout/cart; API: RTK Query; Auth ops: Context                         |
| API       | Axios (`axiosInstance.ts`)                | Interceptors: bearer token, 401 redirect, language header                           |
| Auth      | Cookie-based                              | Cookies: `access_token`, `auth_status`, `auth_portal`, `auth_roles`                 |
| Routing   | App Router route groups                   | `(auth)/` (public), `(dashboard)/` (protected); middleware đọc `auth_status` cookie |
| Styling   | Tailwind CSS v4 + Sass                    | Dark mode (class-based), RTL, multiple layout modes                                 |
| i18n      | i18next                                   | Locales: `en`, `vi`                                                                 |
| Real-time | SignalR (`@microsoft/signalr`)            | `useRealtimeRefresh` hook để trigger refetch                                        |
| Forms     | React Hook Form + Yup                     | Validation pattern nhất quán                                                        |
| Env       | `NEXT_PUBLIC_API_GATEWAY`                 | dev: `http://localhost:5182`, prod: `https://api.vivugo.me`                         |

**API Flow:**

```
Component → Service (authService, catalogService...) → axiosInstance.ts → Backend API
                         ↓
              interceptors: inject Bearer token, handle 401, set language header
```

**Response helpers:** `extractItems<T>()`, `extractResult<T>()`, `extractData<T>()`, `handleApiError()` trong `src/utils/apiResponse.ts`

### Backend (`panthora_be/`)

| Layer         | Công nghệ                 | Ghi chú                                                                                                                 |
| ------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Framework     | .NET 10, ASP.NET Core     | Clean Architecture                                                                                                      |
| CQRS          | MediatR                   | Command/Query → Handler → Validator pattern                                                                             |
| Auth          | JWT Bearer tokens         | `access_token` cookie: `HttpOnly=false` (JS-readable), `SameSite=Lax`, `Secure`=IsHttps. Refresh token: `HttpOnly=true` |
| Validation    | FluentValidation          | Trong MediatR pipeline behaviors, KHÔNG viết trong controller                                                           |
| Error flow    | `ErrorOr<T>`              | Expected failures → ErrorOr, KHÔNG throw exceptions                                                                     |
| API responses | `ResultSharedResponse<T>` | Qua `BaseApiController`, localization-aware                                                                             |
| Localization  | Built-in .NET             | Success/error messages từ `Application.Common.Constant.ErrorConstants`                                                  |
| Tests         | xUnit + NSubstitute       | Domain.Specs project                                                                                                    |

### GitNexus (panthora_be/)

Repository `pathora` được GitNexus index. Sử dụng **MCP tools** trong Claude Opus:

- **Trước khi edit bất kỳ symbol nào**: `gitnexus_impact({target: "symbolName", direction: "upstream"})`
- **Trước khi commit**: `gitnexus_detect_changes({scope: "staged"})`
- **Trước khi rename**: `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})`
- **Sau commit**: refresh index qua MCP hoặc `npm --prefix "panthora_be" run gitnexus:analyze`

---

## Quy Tắc Vận Hành

### Nguyên Tắc Chung

- **Không tự động chạy code.** Đây là quy định nghiêm ngặt — xem chi tiết ở phần **"Quy Định Nghiêm Ngặt Về Chạy Code"** bên dưới.
- **Multi-step work**: Dùng multi-agent approach khi phù hợp.
- **Conflicting docs**: Ưu tiên `package.json`, `tsconfig.json`, `eslint.config.mjs`, `.csproj`, và tests đang chạy thực tế.

### Frontend-Specific

- Giữ code mới trong `pathora/frontend/src/app`
- **KHÔNG import** từ `src/pages-legacy` hoặc `src/layout-legacy`
- Route groups: `(auth)/` (public) và `(dashboard)/` (protected)
- Ưu tiên shared primitives ở `src/components/ui`, domain components ở `src/components/partials`
- Dùng backend API làm primary data source cho admin/dashboard pages, tránh hardcoded seed data
- Dark mode dùng class-based — KHÔNG tạo parallel theme mechanism
- Tailwind utility strings là dominant pattern — giữ nguyên style hiện tại
- Forms: React Hook Form + Yup (pattern đã có sẵn)
- Xem thêm: **Frontend — TypeScript/JavaScript** và **Testing**, **Bảo Mật** sections bên dưới

### Backend-Specific

- File-scoped namespaces
- Nullable enabled, warnings as errors
- `sealed` records/classes, primary constructors khi phù hợp
- Validation trong FluentValidation validators + MediatR behaviors
- Controller actions phải thin — business logic ở application services + repositories
- Dùng `ErrorOr<T>` cho expected failures, KHÔNG throw exceptions cho expected cases
- Giữ `Program.cs` startup orchestration gọn
- Dùng `dotnet format` để format code — KHÔNG format thủ công
- Xem thêm: **Backend — C#** và **Testing**, **Bảo Mật** sections bên dưới

---

## Quy Tắc Code

### Frontend — TypeScript/JavaScript (`pathora/frontend/`)

#### Formatting & Naming

| Aspect        | Quy tắc                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| Formatting    | 2-space indent, semicolons, double quotes, LF line endings              |
| Path aliases  | `@/*` → `pathora/frontend/src/*`                                        |
| Import order  | React/Next → external packages → `@/` aliases → relative → type imports |
| Components    | PascalCase: `UserProfile.tsx`, `OrderList.tsx`                          |
| Hooks         | camelCase + `use` prefix: `useAuth.ts`, `useRealtimeRefresh.ts`         |
| Utilities     | camelCase: `formatCurrency.ts`, `apiResponse.ts`                        |
| Constants     | `UPPER_SNAKE_CASE`: `API_ENDPOINTS`, `MAX_UPLOAD_SIZE`                  |
| Route folders | lowercase: `(dashboard)/orders/page.tsx`                                |
| Middleware    | `"use client"` chỉ khi cần client-side behavior                         |

#### TypeScript

- **Tránh `any`** — dùng `unknown` + type guards cho dữ liệu ngoài kiểm soát
- **Public APIs** phải có explicit types trên tham số và return
- **Interfaces vs Types**: `interface` cho object shapes có thể extend; `type` cho union, intersection, mapped types
- **React Props**: định nghĩa bằng `interface` hoặc `type`, type callback props rõ ràng, KHÔNG dùng `React.FC` trừ khi có lý do cụ thể

```typescript
// ĐÚNG: Explicit types trên public API
interface UserCardProps {
  user: { id: string; email: string }
  onSelect: (id: string) => void
}

function UserCard({ user, onSelect }: UserCardProps) {
  return <button onClick={() => onSelect(user.id)}>{user.email}</button>
}

// SAI: Dùng any
function getErrorMessage(error: any) {
  return error.message // Mất type safety!
}

// ĐÚNG: Dùng unknown + narrowing
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Unexpected error'
}
```

#### Immutability (TypeScript)

```typescript
// SAI: Mutation
function updateUser(user: User, name: string): User {
  user.name = name // MUTATION!
  return user
}

// ĐÚNG: Immutable update
function updateUser(user: Readonly<User>, name: string): User {
  return { ...user, name }
}
```

#### API Response Format (TypeScript)

```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
  }
}
```

#### Custom Hooks Pattern

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
```

#### Repository Pattern (TypeScript)

```typescript
interface Repository<T> {
  findAll(filters?: Filters): Promise<T[]>
  findById(id: string): Promise<T | null>
  create(data: CreateDto): Promise<T>
  update(id: string, data: UpdateDto): Promise<T>
  delete(id: string): Promise<void>
}
```

#### Console.log

- KHÔNG có `console.log` trong production code — dùng proper logging library

---

### Backend — C# (`panthora_be/`)

#### Formatting & Naming

| Aspect         | Quy tắc                                                                       |
| -------------- | ----------------------------------------------------------------------------- |
| Namespaces     | File-scoped                                                                   |
| CQRS           | `Command`, `Query`, `Handler`, `Validator` suffix pattern                     |
| Classes        | `sealed` records/classes khi có thể                                           |
| Constructors   | Primary constructors ưu tiên                                                  |
| Error handling | `ErrorOr<T>` cho business failures; KHÔNG throw exceptions cho expected cases |
| Controller     | Thin actions — logic ở services/repositories                                  |
| Errors         | Dùng centralized constants từ `ErrorConstants`, localization-aware            |
| Formatting     | Dùng `dotnet format` để auto-format; KHÔNG format thủ công                  |

#### Types & Models (C#)

```csharp
// ĐÚNG: Dùng record cho immutable value-like models
public sealed record UserDto(Guid Id, string Email);

// ĐÚNG: Dùng interface cho service boundaries
public interface IUserRepository
{
    Task<UserDto?> FindByIdAsync(Guid id, CancellationToken cancellationToken);
}

// ĐÚNG: Sealed class cho entities có identity và lifecycle
public sealed class UserEntity { ... }
```

#### Immutability (C#)

```csharp
// ĐÚNG: init setters, constructor params
public sealed record UserProfile(string Name, string Email);

// ĐÚNG: Immutable update với 'with'
public static UserProfile Rename(UserProfile profile, string name) =>
    profile with { Name = name };
```

#### Async & Error Handling (C#)

```csharp
// ĐÚNG: async/await + CancellationToken
public async Task<Order> LoadOrderAsync(
    Guid orderId,
    CancellationToken cancellationToken)
{
    try
    {
        return await repository.FindAsync(orderId, cancellationToken)
            ?? throw new InvalidOperationException($"Order {orderId} was not found.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to load order {OrderId}", orderId);
        throw;
    }
}

// SAI: Blocking calls
var result = task.Result; // KHÔNG làm vậy!
```

#### API Response Pattern (C#)

```csharp
public sealed record ApiResponse<T>(
    bool Success,
    T? Data = default,
    string? Error = null,
    object? Meta = null);
```

#### Repository Pattern (C#)

```csharp
public interface IRepository<T>
{
    Task<IReadOnlyList<T>> FindAllAsync(CancellationToken cancellationToken);
    Task<T?> FindByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<T> CreateAsync(T entity, CancellationToken cancellationToken);
    Task<T> UpdateAsync(T entity, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
}
```

#### Options Pattern (C#)

```csharp
public sealed class PaymentsOptions
{
    public const string SectionName = "Payments";
    public required string BaseUrl { get; init; }
    public required string ApiKeySecretName { get; init; }
}
```

#### Dependency Injection (C#)

- Depend on interfaces at service boundaries
- Constructor focused — split nếu dependencies quá nhiều
- Singleton cho stateless/shared services, scoped cho request data, transient cho lightweight pure workers

---

## Validation Gate

Trước khi tuyên bố hoàn thành, **BẮT BUỘC** chạy:

**Frontend:**

```bash
npm --prefix "pathora/frontend" run lint && npm --prefix "pathora/frontend" run build
```

**Backend:**

```bash
dotnet build "panthora_be/LocalService.slnx"
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj"
```

**Nếu có thay đổi format-sensitive:**

```bash
dotnet format "panthora_be/LocalService.slnx" --verify-no-changes
```

---

## Bảo Mật

- **KHÔNG BAO GIỜ** commit secrets, credentials, API keys vào source
- **KHÔNG BAO GIỜ** auto-commit hoặc auto-push trừ khi user yêu cầu rõ ràng
- Backend cookies: `access_token` (`HttpOnly=false` để frontend đọc được), refresh token (`HttpOnly=true`)
- Frontend env: `NEXT_PUBLIC_API_GATEWAY`, `NEXT_PUBLIC_REMOTE_IMAGE_HOSTS` cho `next/image`

### Frontend Security (TypeScript/JavaScript)

- **Secret Management**: Luôn dùng `process.env.X` thay vì hardcode API keys

```typescript
// SAI: Hardcoded secret
const apiKey = "sk-proj-xxxxx"

// ĐÚNG: Environment variable
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')
```

- **XSS Prevention**: KHÔNG dùng `innerHTML` hoặc `dangerouslySetInnerHTML` nếu không sanitize trước
- Dùng **security-reviewer** agent để audit security

### Backend Security (C#)

- **Secret Management**: Dùng `builder.Configuration["Key"]` thay vì hardcode

```csharp
// SAI: Hardcoded secret
const string ApiKey = "sk-live-123";

// ĐÚNG: Configuration
var apiKey = builder.Configuration["OpenAI:ApiKey"]
    ?? throw new InvalidOperationException("OpenAI:ApiKey is not configured.");
```

- **SQL Injection**: Luôn dùng parameterized queries với EF Core — KHÔNG concatenate user input vào SQL

```csharp
const string sql = "SELECT * FROM Orders WHERE CustomerId = @customerId";
await connection.QueryAsync<Order>(sql, new { customerId });
```

- **Authentication/Authorization**: Prefer framework auth handlers, enforce policies at endpoint/handler boundaries
- **Error Handling**: KHÔNG expose stack traces, SQL text, hoặc filesystem paths trong API responses

---

## Testing

### Frontend (`pathora/frontend/`) — Vitest

```bash
npm --prefix "pathora/frontend" run test                           # Tất cả tests
npm --prefix "pathora/frontend" run test -- "path/to/test.tsx"    # Một file
npm --prefix "pathora/frontend" run test -- "path" -t "name"       # Theo tên
```

- **E2E Testing**: Dùng **Playwright** cho critical user flows
- Target 80%+ coverage
- **Test Structure**: Arrange-Act-Assert

```typescript
test('calculates similarity correctly', () => {
  // Arrange
  const vector1 = [1, 0, 0]
  const vector2 = [0, 1, 0]

  // Act
  const similarity = calculateCosineSimilarity(vector1, vector2)

  // Assert
  expect(similarity).toBe(0)
})
```

### Backend (`panthora_be/`) — xUnit + NSubstitute

```bash
dotnet test "panthora_be/LocalService.slnx"                          # Tất cả tests
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj"     # Chỉ Domain.Specs
```

- **Test Framework**: xUnit, FluentAssertions, NSubstitute cho mocking
- Target 80%+ line coverage
- Tập trung vào domain logic, validation, auth, và failure paths
- **Test Organization**: Mirror `src/` structure dưới `tests/`

```csharp
public sealed class OrderServiceTests
{
    [Fact]
    public async Task FindByIdAsync_ReturnsOrder_WhenOrderExists()
    {
        // Arrange
        // Act
        // Assert
    }
}
```

---

## Quy Định Nghiêm Ngặt Về Chạy Code

> **QUAN TRỌNG: Claude KHÔNG được tự động chạy bất kỳ code nào.**

- **Không tự động chạy lệnh** build, test, lint, hay dev server. Chỉ chạy khi user yêu cầu rõ ràng hoặc khi validation gate bắt buộc.
- **Không tự động start/stop** bất kỳ service nào (Next.js dev server, dotnet run, Docker, v.v.).
- **Không tự động commit, push, hoặc tạo PR.**
- **Không tự động cài đặt package** (`npm install`, `dotnet add package`, v.v.) trừ khi được yêu cầu.
- **Luôn chờ user xác nhận** trước khi thực thi bất kỳ lệnh nào ảnh hưởng đến hệ thống.
- **Việc duy nhất được làm mà không cần hỏi** là đọc file, tìm kiếm code, và trả lời câu hỏi về code.

Nếu user muốn chạy lệnh, họ sẽ nói rõ: "chạy lint", "build thử", "chạy test", v.v.

---

## Tài Liệu Liên Quan

| File                                   | Phạm vi                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------- |
| `AGENTS.md`                            | Workspace-level: commands, architecture rules, validation, safety              |
| `pathora/AGENTS.md`                    | Repository-level: project overview, frontend conventions                       |
| `pathora/frontend/AGENTS.md`           | Frontend-specific: component conventions, Cursor workflow                     |
| `pathora/CLAUDE.md`                    | Frontend-specific: GitNexus MCP tools reference                              |
| `panthora_be/README.md`                | Backend: build/test/run commands, GitNexus setup                             |
| `pathora/docs/`                        | Design docs & plans (seed-data-integration, ui-ux-landing, superpowers)       |
| `openspec/changes/`                    | 20+ OpenSpec changes: specs, tasks, decisions                                |
| `.claude/rules/typescript/`            | TypeScript/JS: coding style, testing, patterns, security, hooks              |
| `.claude/rules/csharp/`                | C#: coding style, testing, patterns, security, hooks                         |
| `.claude/rules/common/`                 | Common rules: agents, code-review, coding-style, development-workflow, hooks, patterns, performance, security, testing, git-workflow |

---

## GitNexus Quick Reference (MCP Tools)

```typescript
// Tìm code theo concept
gitnexus_query({query: "auth validation", limit: 5})

// View 360° của một symbol
gitnexus_context({name: "validateUser"})

// Blast radius trước khi edit
gitnexus_impact({target: "X", direction: "upstream"})

// Safe rename
gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})

// Pre-commit scope check
gitnexus_detect_changes({scope: "staged"})

// Trace execution flow
gitnexus_query({query: "UserLogin", goal: "process flows"})
READ gitnexus://repo/pathora/process/{processName}
```

**Risk Levels:**

| Depth | Meaning                         | Action           |
| ----- | ------------------------------- | ---------------- |
| d=1   | WILL BREAK — direct callers     | MUST update      |
| d=2   | LIKELY AFFECTED — indirect deps | Should test      |
| d=3   | MAY NEED TESTING — transitive   | Test if critical |

---

## OpenSpec Changes (Active)

Có **~17 active changes** trong `openspec/changes/`:

| Change                             | Trạng thái                                            |
| ---------------------------------- | ----------------------------------------------------- |
| `local-postgres-redis-docker`      | Active — thêm docker-compose local PostgreSQL + Redis |
| `frontend-component-refactor`      | Active                                                |
| `hierarchical-admin`               | Active                                                |
| `add-tour-continent`               | Active                                                |
| `admin-role-based-routing`         | Active                                                |
| `manager-restrict-customers-route` | Active                                                |
| `add-bookings-list-endpoint`       | Active                                                |
| `admin-booking-ticket-assignment`  | Active                                                |
| `manage-tour-instance-itinerary`   | Active                                                |
| `fix-*.md` (nhiều fix)             | Various stages                                        |
| `archive/`                         | Archived completed changes                            |

Specs (4): `admin-dashboard-routing`, `admin-tour-request-detail`, `dashboard-navigation-consistency`, `role-based-redirect`

---

## Operating Modes

### Solo Mode (Quick Fixes / Questions)

1. Check context: đọc file liên quan trước
2. Run validation commands khi cần
3. Implement fix hoặc answer question
4. Verify với validation gate

### GitNexus-Enhanced Mode (Refactoring / Understanding)

1. Query GitNexus trước khi bắt đầu (`gitnexus_query`)
2. Run impact analysis cho all symbols sẽ thay đổi (`gitnexus_impact`)
3. Implement changes
4. Run detect_changes để verify scope (`gitnexus_detect_changes`)
5. Commit và refresh index

### OpenSpec Mode (Feature Work)

1. Explore `openspec/changes/` để hiểu scope công việc
2. Theo dõi PROPOSAL.md, TASKS.md, DECISIONS.md trong từng change
3. Implement theo tasks đã định nghĩa
4. Validation gate trước khi hoàn thành

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Doan2** (12085 symbols, 28849 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/Doan2/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Doan2/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Doan2/clusters` | All functional areas |
| `gitnexus://repo/Doan2/processes` | All execution flows |
| `gitnexus://repo/Doan2/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

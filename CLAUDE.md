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
│   ├── package.json                 # Backend dependencies
│   └── README.md                    # Backend build/test/run commands

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

### OpenSpec Mode (Feature Work)

1. Explore `openspec/changes/` để hiểu scope công việc
2. Theo dõi PROPOSAL.md, TASKS.md, DECISIONS.md trong từng change
3. Implement theo tasks đã định nghĩa
4. Validation gate trước khi hoàn thành



## gstack — Web Browsing & Design Tools

This workspace is configured to use **gstack** for all web browsing and design tasks. The `/browse` skill replaces any `mcp__claude-in-chrome__*` tools.

**Important:** Always use gstack skills for web-related operations. Do not use MCP Chrome tools.

### Available gstack Skills

| Skill | Purpose |
|-------|---------|
| `/browse` | Browse websites and retrieve content |
| `/office-hours` | Schedule and manage office hours |
| `/plan-ceo-review` | Plan CEO review sessions |
| `/plan-eng-review` | Plan engineering reviews |
| `/plan-design-review` | Plan design reviews |
| `/design-consultation` | Get design consultation |
| `/design-shotgun` | Rapid design exploration |
| `/design-html` | Generate HTML from designs |
| `/review` | Conduct reviews |
| `/ship` | Ship/deploy features |
| `/land-and-deploy` | Land and deploy changes |
| `/canary` | Manage canary releases |
| `/benchmark` | Performance benchmarking |
| `/connect-chrome` | Connect to Chrome browser |
| `/qa` | Quality assurance testing |
| `/qa-only` | QA-focused testing only |
| `/design-review` | Design review process |
| `/setup-browser-cookies` | Configure browser cookies |
| `/setup-deploy` | Setup deployment |
| `/retro` | Retrospective meetings |
| `/investigate` | Investigate issues |
| `/document-release` | Document releases |
| `/codex` | Code documentation |
| `/cso` | Customer success operations |
| `/autoplan` | Auto-generate plans |
| `/plan-devex-review` | Plan developer experience reviews |
| `/devex-review` | Developer experience review |
| `/careful` | Caution mode for risky operations |
| `/freeze` | Freeze changes |
| `/guard` | Guard/protect resources |
| `/unfreeze` | Unfreeze changes |
| `/gstack-upgrade` | Upgrade gstack itself |
| `/learn` | Learning resources |


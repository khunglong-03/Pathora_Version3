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

## Frontend Components & Utils

- **`approvalStatusHelper` (`src/utils/approvalStatusHelper.ts`)**: Standardizes the normalization and appearance (colors, icons) of transportation approval statuses.
- **`SupplierReassignmentModal` (`src/features/dashboard/components/SupplierReassignmentModal.tsx`)**: Reusable modal for reassigning suppliers. Handles backend API calls and re-renders smoothly.
- **`handleApiError` (`src/utils/apiResponse.ts`)**: Extended to localize backend error codes via a sentinel-list pattern (`TOUR_INSTANCE_TRANSPORT_ERROR_CODES`). Do not use raw error messages in `toast`; instead map through `handleApiError` and translate via `t()`.
- **Bulk Approve Button**: Present in `TransportTourAssignmentPage`. Provides a `BulkApproveConfirmationModal` with inline error localization, `failedState` tracking, and a disabled-state warning list for incomplete drafts.

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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Pathora_Version3** (21359 symbols, 42170 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Pathora_Version3/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Pathora_Version3/clusters` | All functional areas |
| `gitnexus://repo/Pathora_Version3/processes` | All execution flows |
| `gitnexus://repo/Pathora_Version3/process/{name}` | Step-by-step execution trace |

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

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

---

## Domain note — per-activity transport approval

Transport approval is **per-activity**, not per-instance. This was moved out of
`TourInstance.TransportProviderId` (now `[Obsolete]`, kept as a derived getter for
one release) onto `TourInstanceDayActivityEntity`:

- `RequestedVehicleType`, `RequestedSeatCount`, `TransportSupplierId` — the plan
  fields the Manager picks at creation time.
- `ApproveTransportation(vehicleId, driverId, note)` — called by the Transport
  provider. Caller is responsible for inserting a `VehicleBlock` (Hard hold).
- `RejectTransportation(note)` — caller deletes the `VehicleBlock`.
- `AreAllTransportationApproved()` + `AreAllAccommodationsApproved()` drive
  `CheckAndActivateTourInstance()` — the tour transitions to `Available` only
  when **every** per-activity supplier has approved.

Concurrency rules (ER-1/ER-2/ER-4/ER-8):

- Approve paths run inside `IUnitOfWork.ExecuteTransactionAsync(IsolationLevel.RepeatableRead, …)`
  and re-check availability inside the transaction before INSERT.
- `TourInstanceEntity.RowVersion` is an EF `IsRowVersion()` token — handlers catch
  `DbUpdateConcurrencyException`, reload, and return idempotent success if the
  target state was reached by another request.
- Bulk transport approve (`ProviderApproveTourInstanceCommand` Transport branch)
  is all-or-nothing: a mid-loop failure throws `BulkApproveValidationException`
  mapped to `TourInstance.BulkApproveFailed`.

Cleanup rules (ER-3):

- `TourInstanceService.Delete` and `ChangeStatus(Cancelled)` call both
  `IRoomBlockRepository.DeleteByTourInstanceAsync` and
  `IVehicleBlockRepository.DeleteByTourInstanceAsync` so inventory is freed.
- `AssignTransportSupplier` and `AssignAccommodationSupplier` delete the prior
  supplier's block when the supplier actually changes.

Error code registry: `Application/Common/Constant/ErrorConstants.TourInstanceTransport.cs`.

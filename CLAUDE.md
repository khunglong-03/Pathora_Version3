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

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Doan2** (14164 symbols, 35252 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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

# Workspace Agent Guide

This file is for agentic coding assistants working in `D:\DoAn`.

## Workspace Layout
- `pathora/frontend`: Next.js 16 admin dashboard.
- `panthora_be`: ASP.NET Core API gateway/backend.
- `CLAUDE.md`: workspace-level operational rules.
- Nested guidance also exists in `pathora/AGENTS.md`, `pathora/frontend/AGENTS.md`, and `pathora/.github/copilot-instructions.md`.

## Operating Rules
- Do not auto-start frontend or backend services. `CLAUDE.md` says both are already running.
- Do not automatically run any program unless the user explicitly asks. This includes backend and frontend services, dev servers, browsers, workers, and setup scripts.

> ⚠️ **QUY ĐỊNH NGHIÊM NGẶT: Claude KHÔNG được tự động chạy bất kỳ code nào.**
>
> - **Không tự động chạy lệnh** build, test, lint, hay dev server. Chỉ chạy khi user yêu cầu rõ ràng hoặc khi validation gate bắt buộc.
> - **Không tự động start/stop** bất kỳ service nào (Next.js dev server, dotnet run, Docker, v.v.).
> - **Không tự động commit, push, hoặc tạo PR.**
> - **Không tự động cài đặt package** (`npm install`, `dotnet add package`, v.v.) trừ khi được yêu cầu.
> - **Luôn chờ user xác nhận** trước khi thực thi bất kỳ lệnh nào.
> - **Việc duy nhất được làm mà không cần hỏi** là đọc file, tìm kiếm code, và trả lời câu hỏi về code.
- For multi-step work, act as a coordinator and split responsibilities across frontend, backend, and tester work where practical.
- Use `pathora/frontend/package.json` and `panthora_be/README.md` as command truth before trusting older docs.
- Frontend docs are partially stale: some files say port `3000` or `3001`, say React 19, and say no tests; actual `package.json` uses port `3003`, React `18.3.1`, and Vitest.
- No `.cursor/rules/` or `.cursorrules` were found anywhere under this workspace.
- Copilot instructions exist at `pathora/.github/copilot-instructions.md`; the frontend-specific guidance below includes the useful parts.

## High-Value Commands
All commands below can be run from `D:\DoAn`.

### Frontend
```bash
npm --prefix "pathora/frontend" ci
npm --prefix "pathora/frontend" run dev
npm --prefix "pathora/frontend" run dev:turbopack
npm --prefix "pathora/frontend" run lint
npm --prefix "pathora/frontend" run build
npm --prefix "pathora/frontend" run start
npm --prefix "pathora/frontend" run analyze
npm --prefix "pathora/frontend" run test
```

Frontend scripts resolve to:
- `next dev --webpack -p 3003`
- `next dev -p 3003`
- `eslint`
- `next build`
- `next start -p 3003`
- `vitest run --pool=threads --maxWorkers=1 --no-file-parallelism`

### Frontend Single-Test Commands
Use these when you need fast feedback instead of the whole Vitest suite.

```bash
npm --prefix "pathora/frontend" run test -- "src/components/ui/__tests__/LanguageTabs.test.tsx"
npm --prefix "pathora/frontend" run test -- "src/components/ui/__tests__/LanguageTabs.test.tsx" -t "renders Vietnamese and English tabs with active state"
```

If you are already inside `pathora/frontend`, the equivalent direct command is:

```bash
npx vitest run --pool=threads --maxWorkers=1 --no-file-parallelism "src/components/ui/__tests__/LanguageTabs.test.tsx" -t "test name"
```

### Backend
```bash
dotnet restore "panthora_be/LocalService.slnx"
dotnet build "panthora_be/LocalService.slnx"
dotnet build "panthora_be/LocalService.slnx" -c Release
dotnet test "panthora_be/LocalService.slnx"
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj"
dotnet run --project "panthora_be/src/Api/Api.csproj"
npm --prefix "panthora_be" ci
npm --prefix "panthora_be" run gitnexus:status
npm --prefix "panthora_be" run gitnexus:analyze
npm --prefix "panthora_be" run gitnexus:check
```

### Backend Single-Test Commands
Prefer xUnit filters instead of running the full solution when narrowing a failure.

```bash
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj" --filter "FullyQualifiedName~CustomExceptionHandlerTests"
dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj" --filter "FullyQualifiedName~Domain.Specs.Api.CustomExceptionHandlerTests.TryHandleAsync_WhenArgumentException_ShouldReturnBadRequest"
```

Useful backend verification command:

```bash
dotnet format "panthora_be/LocalService.slnx" --verify-no-changes
```

## Frontend Architecture Rules
- Keep new route work in `pathora/frontend/src/app`.
- Do not modify or import from `src/pages-legacy` or `src/layout-legacy`.
- Route groups are split into `(auth)` and `(dashboard)`.
- Prefer shared primitives in `src/components/ui` and domain components in `src/components/partials`.
- Use Redux Toolkit and RTK Query patterns already in `src/store`.
- Use the existing auth flow in `src/contexts/AuthContext.tsx` and `src/middleware.ts`.
- Use `i18next` with `en` and `vi`; prefer `useTranslation()` over hardcoded UI strings.
- For admin/dashboard pages, prefer backend API data over new hardcoded seeded datasets.

## Frontend Style Guide
- Formatting: 2-space indentation, semicolons, double quotes, LF line endings.
- Use `@/*` path aliases for app code.
- Preferred import order: React/Next, external packages, `@/` aliases, then relative imports.
- `import type` is common and should be used when it keeps runtime imports smaller or clearer.
- Do not churn existing files just to normalize imperfect import order.
- Components and component files use PascalCase.
- Hooks use camelCase with a `use` prefix.
- Utility and service files use camelCase.
- Constants use `UPPER_SNAKE_CASE`.
- Route segment folders stay lowercase.
- Use typed function components or `React.forwardRef` patterns that match nearby code.
- Add `"use client";` only when a component actually needs client-side behavior.
- TypeScript is not strict in config, but still avoid `any`; prefer `unknown`, explicit props, and narrow helper types.
- `interface` and `type` both exist in the repo; use the simpler option that fits the local file.
- Tailwind utility strings are the dominant styling pattern; preserve existing class-heavy JSX style.
- Dark mode is class-based; do not introduce a parallel theme mechanism.
- Forms should follow the existing React Hook Form + Yup pattern.

## Frontend API and Error Handling
- Reuse the shared Axios client in `src/api/axiosInstance.ts`.
- Reuse centralized endpoint definitions instead of hardcoding URLs in components.
- Reuse response helpers such as `extractItems<T>()`, `extractResult<T>()`, `extractData<T>()`, and `handleApiError()`.
- When wrapping service calls, follow patterns like `executeApiRequest()` that return structured success/error payloads.
- For async UI actions, use `try/catch`, user-friendly toast or error state, and i18n-aware messages.
- Let the Axios layer own auth headers, language headers, 401 redirects, and multipart `Content-Type` handling.
- Do not manually set `Content-Type` for `FormData` requests unless you have a concrete reason.

## Backend Architecture Rules
- The backend is a .NET 10 Clean Architecture + CQRS codebase.
- Use file-scoped namespaces.
- Nullable is enabled; warnings are treated as errors at build time.
- Follow existing CQRS naming: `Command`, `Query`, `Handler`, `Validator`.
- Prefer `sealed` records or classes and primary constructors when the nearby code uses them.
- Put validation in FluentValidation validators and MediatR behaviors, not ad hoc controller checks.
- Keep controller actions thin; business logic belongs in application services and repositories.
- Expected business failures should usually flow through `ErrorOr<T>`, not thrown exceptions.
- Use centralized localized errors from `Application.Common.Constant.ErrorConstants`.
- API responses are shaped through `ResultSharedResponse<T>` helpers in `BaseApiController`.
- Preserve localization-aware success and error messages.

## Backend Test and Error Handling Style
- Tests use xUnit with `[Fact]` and NSubstitute.
- Match the existing Arrange/Act/Assert flow.
- For expected failures, assert HTTP status codes, error codes, and response bodies instead of only checking for exceptions.
- Keep `Program.cs` startup orchestration thin; existing tests guard database bootstrap behavior.
- Respect dev or prod differences already encoded in DI, cache, and auth configuration.

## GitNexus and Analysis Rules
- `panthora_be` is GitNexus-enabled.
- `pathora/AGENTS.md` also requires GitNexus-based impact analysis for Pathora work.
- When editing unfamiliar Pathora code, prefer GitNexus queries and context over blind grep.
- Before risky refactors or renames, use GitNexus impact, context, and rename tooling first.
- Before committing Pathora changes, run a scope check such as `gitnexus_detect_changes()` if that tool is available in your harness.

## Inherited Copilot Guidance
The following rules come from `pathora/.github/copilot-instructions.md` and are still useful:
- `NEXT_PUBLIC_API_GATEWAY` is the frontend API base URL.
- `NEXT_PUBLIC_REMOTE_IMAGE_HOSTS` controls extra allowed `next/image` hosts.
- Layout preferences persist in local storage.
- `buildThemeInitScript()` prevents theme flash during initial paint.
- `hydrateClientLanguage()` is used to safely sync the client language after SSR.
- `useRealtimeRefresh` is the standard SignalR refresh hook.

## Validation Before You Finish
- Do not claim success without running the smallest relevant validation commands.
- Frontend minimum gate: `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`.
- If you changed frontend tests or logic with test coverage, also run a focused Vitest command first, then the broader test command if needed.
- Backend minimum gate: `dotnet build "panthora_be/LocalService.slnx"` and the smallest relevant `dotnet test` command.
- If you touch backend formatting-sensitive files or CI complaints mention style, run `dotnet format --verify-no-changes`.
- Do not start long-running dev servers unless the user explicitly asks or the task absolutely requires it.

## Safety Rules
- Never commit secrets or copy credentials from backend config into new files.
- Treat checked-in secret-like values as legacy repo state, not as permission to add more.
- Never auto-commit or auto-push unless the user explicitly asks.
- Prefer minimal changes that match the local style of the file you are in.
- When repo docs disagree, prefer the nearest executable source of truth: `package.json`, `tsconfig`, `eslint.config`, `.csproj`, `Directory.Build.props`, and working tests.

This file is intentionally workspace-wide.
Nested `AGENTS.md` files inside `pathora/` and `pathora/frontend/` add more specific rules for those subtrees.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Doan2** (16620 symbols, 35193 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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

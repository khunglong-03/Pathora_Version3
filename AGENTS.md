# Workspace Agent Guide

- Actual source trees are `pathora/frontend` and `panthora_be`. Do not assume the root-level `backend/` folder is the active backend.
- `pathora/package.json` is effectively empty. Real frontend commands live in `pathora/frontend/package.json`.
- Checked-in docs and scripts still often say `D:\DoAn`; this harness runs the workspace at `D:\Doan2`.
- More specific instructions exist in `pathora/AGENTS.md`, `pathora/frontend/AGENTS.md`, `panthora_be/AGENTS.md`, and the matching `CLAUDE.md` files.

## Execution Policy

- Existing repo instructions forbid auto-running build, test, lint, dev servers, installs, commits, and pushes unless the user explicitly asks.
- Safe default without user approval: read files, search code, edit files.
- Do not start or stop services just to inspect the repo.

## Source Of Truth

- Prefer executable config over prose: `pathora/frontend/package.json`, `panthora_be/README.md`, `panthora_be/LocalService.slnx`, `panthora_be/Directory.Build.props`, `pathora/frontend/tsconfig.json`, `pathora/frontend/eslint.config.mjs`, `pathora/frontend/vitest.config.ts`, `pathora/frontend/next.config.ts`, and each app's `.gitlab-ci.yml`.
- Stale docs still mention port `3000`/`3001`, React `19`, and no tests. Verified frontend values are port `3003`, React `18.3.1`, and Vitest is configured.

## Frontend

- App code lives in `pathora/frontend/src`. Route work belongs in `src/app`.
- `src/pages-legacy` and `src/layout-legacy` are excluded by `tsconfig.json`; do not add imports back into them.
- Frontend scripts:
  - `npm --prefix "pathora/frontend" run dev` -> `next dev --webpack -p 3003`
  - `npm --prefix "pathora/frontend" run dev:turbopack` -> `next dev -p 3003`
  - `npm --prefix "pathora/frontend" run lint`
  - `npm --prefix "pathora/frontend" run build`
  - `npm --prefix "pathora/frontend" run test`
- Focused Vitest runs:
  - `npm --prefix "pathora/frontend" run test -- "path/to/test.tsx"`
  - `npm --prefix "pathora/frontend" run test -- "path/to/test.tsx" -t "test name"`
- Two data-fetching layers coexist: imperative services through `src/api/axiosInstance.ts` + `src/services/*`, and RTK Query through `src/store/api/*`. Extend the layer already used in the feature instead of adding a third pattern.
- API base URL defaults come from `src/configs/apiGateway.ts`: dev `http://localhost:5182`, prod `https://api.vivugo.me`.
- Reuse `src/utils/apiResponse.ts` helpers (`extractItems`, `extractResult`, `extractData`, `handleApiError`) instead of re-unwrapping backend payloads ad hoc.
- i18n is live: use `useTranslation()` and existing `en`/`vi` locale keys instead of hardcoded UI strings.
- Forms follow the repo's `react-hook-form` + `yup` pattern.
- `vitest.setup.tsx` globally mocks `framer-motion`, `@phosphor-icons/react`, `next/link`, pagination, and skeleton table helpers. New UI tests can rely on those mocks.
- `next.config.ts` uses `output: "standalone"`; remote image hosts are controlled by `NEXT_PUBLIC_REMOTE_IMAGE_HOSTS` plus the checked-in allowlist.

## Backend

- Backend command truth lives under `panthora_be`, not the workspace root.
- `panthora_be/LocalService.slnx` contains `src/Api`, `src/Application`, `src/Domain`, `src/Infrastructure`, `Share/*`, and `tests/Domain.Specs`.
- `panthora_be/Directory.Build.props` enforces `.NET 10`, nullable enabled, warnings as errors, and code-style checks during build.
- Backend commands:
  - `dotnet restore "panthora_be/LocalService.slnx"`
  - `dotnet build "panthora_be/LocalService.slnx"`
  - `dotnet test "panthora_be/LocalService.slnx"`
  - `dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj"`
  - `dotnet test "panthora_be/tests/Domain.Specs/Domain.Specs.csproj" --filter "FullyQualifiedName~TestName"`
  - `dotnet format "panthora_be/LocalService.slnx" --verify-no-changes`
- `src/Api/Program.cs` is intentionally thin: service registration happens in extension methods, then controllers and `/hubs/notifications` are mapped.
- `panthora_be/docker-compose.yml` is the checked-in local infra bootstrap for PostgreSQL 17 and Redis 7.

## CI And Deploy

- No GitHub Actions workflows were found. Deployment automation lives in `pathora/.gitlab-ci.yml` and `panthora_be/.gitlab-ci.yml`.
- Those GitLab pipelines are deploy-only on `main`; they are not the source of lint/test gate ordering.
- Frontend deploy builds Docker from `pathora/frontend` and the checked-in compose file exposes `3003:3003`.
- Backend deploy builds `panthora_be/src/Api/Dockerfile`.



## Validation When Asked

- Frontend: run the smallest relevant test first, then `npm --prefix "pathora/frontend" run lint`, then `npm --prefix "pathora/frontend" run build`.
- Backend: `dotnet build "panthora_be/LocalService.slnx"`, then the smallest relevant `dotnet test` filter. Add `dotnet format --verify-no-changes` if style-sensitive backend files changed.

## gstack For Codex

- This workspace is set up to use the installed `gstack-*` Codex skills when the request matches one of those workflows.
- Prefer `gstack-browse` for browser-driven external research and page interaction instead of ad-hoc browser tooling.
- Prefer `gstack-office-hours` for scoping and planning, `gstack-review` for code review, `gstack-investigate` for debugging, `gstack-qa`/`gstack-qa-only` for QA flows, and `gstack-ship` before release prep.
- If the task clearly matches an installed `gstack-*` skill, invoke that skill first instead of answering directly.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Pathora_Version3** (5014 symbols, 7740 relationships, 71 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
3. `READ gitnexus://repo/Pathora_Version3/process/{processName}` — trace the full execution flow step by step
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
| `gitnexus://repo/Pathora_Version3/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Pathora_Version3/clusters` | All functional areas |
| `gitnexus://repo/Pathora_Version3/processes` | All execution flows |
| `gitnexus://repo/Pathora_Version3/process/{name}` | Step-by-step execution trace |

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


<claude-mem-context>
# Memory Context

# [Pathora_Version3] recent context, 2026-04-22 5:48am GMT+7

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 38 obs (17,885t read) | 1,761,657t work | 99% savings

### Apr 21, 2026
15 2:57a 🔵 CEO Plan Review Reveals Missing Tasks and Ordering Gaps in remove-tour-policy-fk
17 3:01a 🔵 TourEntity.Create() Silently Drops Policy IDs — Params Accepted But Never Assigned
18 " 🔵 TourRepository .Include() Policy Navigation Calls Are Missing from tasks.md
19 " 🔵 Task 5.8 References Wrong Filename — DataSeeder.cs Does Not Exist
20 " 🔵 Five Test Files Contain Policy FK References Not Covered by tasks.md
21 " 🔵 Two Duplicate TourForm.tsx Files Exist — Legacy and Refactored Versions Both Have Policy Code
22 " 🔵 CalculateRefund Should Use FindByTourScopeAndDays Not FindByTourScope — Task 4.1 Picks Wrong Method
### Apr 22, 2026
91 2:04a 🔵 Pathora_Version3 multi-hotel-per-instance audit: project structure and pending work identified
92 " 🔵 multi-hotel-per-instance OpenSpec change: full spec, design, and pending task list located
93 " 🔵 Pathora_Version3 project layout: active backend is panthora_be, not backend/; no panthora_be/AGENTS.md exists
94 3:13a ✅ multi-hotel-per-instance OpenSpec Docs Refined
95 3:14a 🔵 multi-hotel-per-instance Implementation Progress: 37/66 Tasks Done
96 5:04a 🔵 fix-tour-edit-bugs openspec directory structure confirmed
97 " 🔵 fix-tour-edit-bugs: 5 critical Tour Builder edit bugs fully documented
98 5:05a 🔵 Tour edit form has two TourForm.tsx files — dashboard and tour-designer paths
99 5:11a 🔵 fix-tour-edit-bugs Task Structure in Pathora_Version3
100 " 🔵 fix-tour-edit-bugs: Five Critical Bugs Identified in Tour Edit Workflow
101 " 🔵 fix-tour-edit-bugs Task List: 9 Tasks Across 3 Groups
102 " 🔵 Pathora_Version3 Project Architecture and Agent Instructions
103 5:12a 🔵 Transportation Location Mapping Already Fixed in Main TourForm.tsx (lines 669-672)
104 " 🔵 Image Retention Bug: existingImages Sent as JSON Object Array, Not retainedImageIds
105 " 🔵 Validation UI: TourForm.tsx Already Has Red Border Logic; BasicInfoSection.tsx Also Has It
106 " 🔵 TourDayActivityDto Type: fromLocationName/toLocationName Are Optional Fields on Backend DTO
107 5:13a 🔵 Backend Tour Update API: existingImages Key Confirmed; Concurrency Check Has 1-Second Tolerance
108 " 🔵 buildTourFormData Does NOT Append retainedImageIds — Image Retention Handled Separately in TourForm.tsx
109 " 🔵 Autoplan Investigation Complete: Tasks 1.1 and 2.1-2.2 Already Partially Implemented
110 " 🔵 TourImageUpload.tsx: imagesError IS Displayed; showExistingThumbnail Uses Computed Value (No useState Bug)
111 " 🔵 Autoplan Full Audit Summary: All fix-tour-edit-bugs Tasks Appear Pre-Implemented; Focus Needed on Verification
112 5:18a ⚖️ Adversarial CEO Review: Admin-Manage-Transport-Vehicles OpenSpec
113 " 🔵 KPI Bug Confirmed: activeCount Computed from Current Page Slice
114 " 🔵 Vehicles Tab is Read-Only; No Admin CRUD UI or Service Methods Exist
115 " 🔵 Admin Vehicle Endpoints to Reuse Existing CQRS Commands via Provider ID Injection
116 5:19a 🔵 Backend KPI Bug: total Is Filter-Scoped; pendingCount IS Global; activeCount Missing Entirely
117 " 🔵 Security Gap: UpdateVehicle and DeleteVehicle Commands Use FindByPlateAndOwnerId — Incompatible with Admin Flow
118 " 🔵 Transport Provider Admin Endpoints Served by ManagerController (ManagerOnly Policy), Not AdminController
119 5:20a 🔵 Critical: pendingCount Is Also Broken — "Pending" Falls Through UserStatus Filter, Returns Total Count
120 " 🔵 GetTransportProviderByIdQueryHandler Uses Dual Lookup Path: User ID or Supplier ID
121 " 🔵 TransportProviderListItemDto Exposes UserStatus Enum (Not VerifyStatus) — No Pending State Representable

Access 1762k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
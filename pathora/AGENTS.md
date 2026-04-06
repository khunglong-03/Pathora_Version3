# Repository Guidelines for Agents

## Project Overview

Pathora is an admin dashboard/portal with a frontend in `frontend/` built on **Next.js 16 and **React (App Router)**19**. It communicates with a backend API gateway via Axios and receives real-time updates via SignalR.

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router (layout.tsx, page.tsx)
│   │   ├── (auth)/             # Public routes: login, register
│   │   └── (dashboard)/        # Protected: dashboard, products, orders, etc.
│   ├── components/ui/          # Reusable UI primitives (Button, Input, etc.)
│   ├── components/partials/    # Feature-specific components by domain
│   ├── api/                    # Axios instance, endpoints
│   ├── services/              # Domain services (catalogService, orderService, etc.)
│   ├── store/                  # Redux Toolkit + RTK Query
│   ├── hooks/                  # Custom hooks (useAuth, useRealtimeRefresh)
│   ├── contexts/               # React Context (AuthContext)
│   └── i18n/                   # i18next locales (en.json, vi.json)
├── public/                     # Static assets
└── package.json
```

**Legacy code** (`src/pages-legacy`, `src/layout-legacy`) is excluded—do not use.

---

## Build, Test, and Development Commands

All commands run from `frontend/`:

```bash
npm ci                          # Install exact dependencies from lockfile
npm run dev                     # Start dev server at http://localhost:3000
npm run lint                    # Run ESLint (Next.js core-web-vitals + TypeScript)
npm run build                   # Production build (primary validation)
npm run start                   # Run production server after build
npm run lint && npm run build   # Full validation gate
```

**Testing**: No test suite configured. Validate changes with `npm run lint && npm run build`.

---

## Coding Style & Conventions

### Formatting

- **2-space indentation**, semicolons required, **double quotes**, LF line endings
- Follow ESLint in `eslint.config.mjs`

### TypeScript

- Use strict typing where possible
- Define domain types in `src/store/domain/`
- Use interfaces for objects, types for unions/primitives

### Path Aliases

Use `@/*` imports (maps to `./src/*`):

```typescript
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
```

### Naming Conventions

| Type             | Convention               | Example                               |
| ---------------- | ------------------------ | ------------------------------------- |
| Components       | PascalCase               | `UserProfile.tsx`, `OrderList.tsx`    |
| Hooks            | camelCase + `use` prefix | `useAuth.ts`, `useRealtimeRefresh.ts` |
| Constants        | UPPER_SNAKE_CASE         | `API_ENDPOINTS`, `MAX_UPLOAD_SIZE`    |
| Interfaces/Types | PascalCase               | `User`, `OrderItem`, `ApiResponse<T>` |
| Route folders    | lowercase                | `(dashboard)/orders/page.tsx`         |
| Utilities        | camelCase                | `formatCurrency.ts`, `apiResponse.ts` |

### Imports Order

1. React/Next.js imports
2. External libraries (axios, redux, etc.)
3. Path alias imports (`@/...`)
4. Relative imports
5. Type imports

---

## Component Architecture

- **UI Components** (`src/components/ui/`): Reusable primitives (Button, Input, Modal, Dropdown)
- **Feature Components** (`src/components/partials/`): Domain-specific (e.g., `orders/OrderTable.tsx`)
- **Forms**: Use **React Hook Form** + **Yup** for validation

---

## API Layer

- **Axios** (`src/api/axiosInstance.ts`): Centralized with interceptors, auto-injects bearer token, redirects to login on 401
- **Endpoints** (`src/api/endpoints.ts`): Define all API endpoints centrally
- **Services** (`src/services/`): Domain services (catalogService, orderService, etc.)
- **RTK Query**: Data fetching/caching via `src/store/api/apiSlice.ts`
- **Response handling**: Use helpers from `src/utils/apiResponse.ts`
- **Admin seeded-data policy**: For dashboard/admin pages, use backend API as primary data source; avoid introducing new hardcoded datasets as default behavior.

---

## State Management

- **Redux Toolkit**: Global state (auth, layout, cart) in `src/store/index.ts`
- **RTK Query**: API data fetching/caching in `src/store/api/apiSlice.ts`
- **React Context**: Auth operations in `src/contexts/AuthContext.tsx`

---

## Real-time Updates

SignalR via `src/services/signalRService.ts`. Use `useRealtimeRefresh` hook to trigger refetches on server events.

---

## Internationalization (i18n)

- Uses **i18next** with `en` and `vi` locales in `src/i18n/locales/`
- Error toasts include i18n translation support
- Use `useTranslation()` hook for strings

---

## Styling

- **Tailwind CSS v4** with Sass
- Supports dark mode, RTL, multiple layout modes
- Custom hooks: `useDarkMode`, `useRtl`, `useSidebar`
- Theme config in `src/configs/themeConfig.ts`

---

## Security

- Never commit secrets; use `.env.local`
- Important variable: `NEXT_PUBLIC_API_GATEWAY` (default: `http://localhost:5000`)
- Add external image domains to `images.remotePatterns` in `next.config.ts`

---

## Error Handling

- Use try-catch for async operations
- Display user-friendly errors via toast notifications
- Include i18n translation keys for error messages
- Log errors appropriately for debugging

---

## Commit & Pull Request Guidelines

- Use short, imperative commit subjects (e.g., `Fix login redirect issue`, `Add order export feature`)
- Keep commits focused on one logical change
- Avoid combining refactors and feature work in one commit
- **PRs should include**: summary, linked issue/task, validation steps, screenshots for UI changes

---

## Cursor Workflow Commands

- `/opsx-propose` - Propose a new change with proposal, design, and tasks
- `/opsx-apply` - Implement tasks from an OpenSpec change
- `/opsx-archive` - Archive a completed change
- `/opsx-explore` - Explore and investigate codebase

---

## Validation

Before marking work complete, run:

```bash
cd frontend && npm run lint && npm run build
```

Ensure no ESLint errors and build succeeds.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **pathora** (2301 symbols, 4406 relationships, 82 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

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
3. `READ gitnexus://repo/pathora/process/{processName}` — trace the full execution flow step by step
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
| `gitnexus://repo/pathora/context` | Codebase overview, check index freshness |
| `gitnexus://repo/pathora/clusters` | All functional areas |
| `gitnexus://repo/pathora/processes` | All execution flows |
| `gitnexus://repo/pathora/process/{name}` | Step-by-step execution trace |

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

## gstack

Use gstack skills for work in this repository.

Use the /browse skill from gstack for all web browsing.
Never use mcp**claude-in-chrome**\* tools.

Prefer these gstack commands for backend work:

- /office-hours for scoping and planning
- /review for code review
- /investigate for debugging and issue analysis
- /ship before release preparation
- /browse when external documentation is needed

Available gstack skills:
/office-hours
/review
/investigate
/ship
/browse

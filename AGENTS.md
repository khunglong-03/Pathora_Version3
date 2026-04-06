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

## GitNexus

- Indexed repos currently available are `Doan2`, `pathora`, and `panthora_be`.
- `.mcp.json` points the default GitNexus MCP server at `panthora_be`. When investigating frontend or workspace-wide code, pass `repo: "pathora"` or `repo: "Doan2"` explicitly.
- Use GitNexus impact analysis before risky refactors/renames and run `gitnexus_detect_changes` before commits.

## Validation When Asked

- Frontend: run the smallest relevant test first, then `npm --prefix "pathora/frontend" run lint`, then `npm --prefix "pathora/frontend" run build`.
- Backend: `dotnet build "panthora_be/LocalService.slnx"`, then the smallest relevant `dotnet test` filter. Add `dotnet format --verify-no-changes` if style-sensitive backend files changed.

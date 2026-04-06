# Repository Guidelines

## Project Structure & Module Organization
- Core code lives in `src/`.
- App Router entry files are in `src/app` (`layout.tsx`, `page.tsx`, `not-found.tsx`).
- Reusable UI and feature blocks are in `src/components` (`ui/`, `partials/`, `skeleton/`).
- API and domain logic are split across `src/api`, `src/services`, `src/store`, and `src/hooks`.
- Localization lives in `src/i18n/locales` (`en.json`, `vi.json`).
- Static files are in `public/`; bundled images/styles also exist in `src/assets` and `src/styles`.
- Legacy code (`src/pages-legacy`, `src/layout-legacy`) is excluded from TypeScript builds; prefer new work in `src/app`.

## Build, Test, and Development Commands
- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start local dev server at `http://localhost:3000`.
- `npm run lint`: run ESLint (Next.js core-web-vitals + TypeScript rules).
- `npm run build`: create production build and catch build-time issues.
- `npm run start`: run the production server after a successful build.

## Coding Style & Naming Conventions
- Language: TypeScript + React (Next.js 16, React 19).
- Use 2-space indentation, semicolons, and double quotes to match existing files.
- Use path alias imports with `@/*` (example: `@/components/ui/Button`).
- Components: PascalCase file and export names (`HeroSection.tsx`).
- Hooks: camelCase with `use` prefix (`useRealtimeRefresh.ts`).
- Constants: `UPPER_SNAKE_CASE`; route segment folders should stay lowercase.
- Keep Tailwind utility usage consistent with existing patterns.

## Frontend Design Skill Policy
- When implementing or refactoring frontend UI/UX, use available skills from `D:\DoAn\pathora\skills` to guide design decisions.
- Prioritize these local design skills when relevant: `design-taste-frontend`, `high-end-visual-design`, `minimalist-ui`, `redesign-existing-projects`, `stitch-design-taste`, `industrial-brutalist-ui`.
- Apply those skills to improve layout hierarchy, typography, spacing, visual consistency, and responsive behavior while preserving existing product patterns.
- Keep design changes practical and compatible with current architecture (`src/app`, `src/components`, `src/styles`) and avoid cosmetic-only churn.

## Testing Guidelines
- There is currently no dedicated `npm test` script in this repository.
- Minimum validation for each change: `npm run lint` and `npm run build`.
- Add focused manual checks for impacted pages/flows (especially auth, i18n, and dashboard widgets).
- If adding tests, prefer `*.test.ts`/`*.test.tsx` naming and include the run command in the PR.

## Commit & Pull Request Guidelines
- Follow concise, imperative commit subjects (examples in history: `Internationalize landing and header components`, `Standardize Tailwind utility classes`).
- Keep commits scoped to one logical change.
- Never auto-commit code changes. Commit only when the user explicitly requests a commit.
- Never auto-push to remote. Push only when the user explicitly requests a push.
- PRs should include:
  - what changed and why
  - linked issue/task ID
  - validation commands run
  - screenshots or short recordings for UI changes

## Security & Configuration Tips
- Never commit secrets; `.env*` files are ignored by default.
- Follow workspace hardcoded-value governance in `../../docs/hardcoded-value-governance.md` for runtime URLs/config defaults.
- When introducing new remote image hosts, update `images.remotePatterns` in `next.config.ts`.

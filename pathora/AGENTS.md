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

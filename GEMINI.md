# GEMINI.md — Pathora Workspace

Instructional context for Gemini CLI in the `Pathora_Version3` workspace.

---

## Project Overview

**Pathora** (or **Panthora**) is a comprehensive travel and tour platform built with a modern monorepo-style architecture. It consists of a high-performance .NET backend and a feature-rich Next.js frontend.

### Core Technologies
- **Frontend:** Next.js 16 (App Router, React 18.3.1), Tailwind CSS v4, Redux Toolkit + RTK Query, Axios, Vitest, Playwright.
- **Backend:** .NET 10, Clean Architecture, CQRS (MediatR), EF Core, FluentValidation, `ErrorOr<T>`, xUnit.
- **Code Intelligence:** GitNexus (Graph-based symbol indexing and impact analysis).
- **Change Management:** OpenSpec (Structured tracking of features, tasks, and decisions).
- **Infrastructure:** Docker (PostgreSQL, Redis, MinIO, Portainer).

---

## Directory Structure

- `pathora/frontend/`: **Primary Frontend** (Next.js 16). Note: `pathora/` is the git root for frontend docs/config.
- `panthora_be/`: **Primary Backend** (.NET 10 API).
- `openspec/`: Centralized change tracking and specifications.
- `docs/`: Global design documents and project plans.
- `.agents/skills/`: Specialized AI agent instructions.

---

## Key Commands

### Frontend (`pathora/frontend/`)
| Action | Command |
| :--- | :--- |
| **Dev Server** | `npm --prefix "pathora/frontend" run dev` (Port 3003) |
| **Build** | `npm --prefix "pathora/frontend" run build` |
| **Lint** | `npm --prefix "pathora/frontend" run lint` |
| **Test (Vitest)** | `npm --prefix "pathora/frontend" run test` |
| **E2E (Playwright)** | `npx playwright test --project=chromium` (inside `pathora/frontend`) |

### Backend (`panthora_be/`)
| Action | Command |
| :--- | :--- |
| **Restore/Build** | `dotnet build "panthora_be/LocalService.slnx"` |
| **Run API** | `dotnet run --project "panthora_be/src/Api/Api.csproj"` |
| **Run Tests** | `dotnet test "panthora_be/LocalService.slnx"` |
| **Format** | `dotnet format "panthora_be/LocalService.slnx"` |

### GitNexus (Code Intel)
| Action | Command |
| :--- | :--- |
| **Status** | `npm --prefix "panthora_be" run gitnexus:status` |
| **Analyze/Re-index**| `npm --prefix "panthora_be" run gitnexus:analyze` |
| **CI Check** | `npm --prefix "panthora_be" run gitnexus:check` |

---

## Development Conventions

### General Principles
- **No Unrequested Execution:** Never run build, test, or dev commands unless explicitly asked or required by a validation gate.
- **Validation Gate:** Before completing any task, verify with `lint` and `build` (frontend) or `build` and `test` (backend).
- **Security First:** Never commit secrets. Use `.env` or configuration providers.

### Frontend (Next.js/TypeScript)
- **App Router:** Use `src/app` with route groups: `(auth)` for public, `(dashboard)` for protected.
- **Components:** Shared UI primitives in `src/components/ui`, domain-specific in `src/components/partials`.
- **Naming:** PascalCase for components, camelCase for hooks/utilities.
- **State:** RTK Query for server state, Redux/Context for global UI state.

### Backend (.NET/C#)
- **Clean Architecture:** Strict separation between `Api`, `Application`, `Domain`, and `Infrastructure`.
- **CQRS:** Every operation is a MediatR `Command` or `Query`. Logic belongs in Handlers.
- **Error Handling:** Use `ErrorOr<T>` for business logic failures; avoid throwing exceptions for expected cases.
- **Standards:** File-scoped namespaces, nullable enabled, primary constructors, `sealed` classes.

### GitNexus Workflow
- **Impact Analysis:** Always run `gitnexus_impact` before modifying shared symbols to check the "blast radius."
- **Change Detection:** Run `gitnexus_detect_changes` before committing to verify the scope of modifications.

---

## Troubleshooting & Resources

- **Stale Index:** If GitNexus symbols are missing/outdated, run `npm --prefix "panthora_be" run gitnexus:analyze`.
- **Port Conflict:** Frontend defaults to **3003**. Backend API typically runs on **5182**.
- **Change Logs:** Check `openspec/changes/` for the history and status of specific features.
- **Agent Rules:** Detailed coding standards are in `.claude/rules/` and `CLAUDE.md`.

# Pathora (Version 3)

Pathora (Panthora) is a comprehensive travel and tour platform built with a modern monorepo-style architecture. It consists of a high-performance .NET backend and a feature-rich Next.js frontend.

## 🚀 Core Technologies

### Frontend
- **Framework:** Next.js 16 (App Router)
- **Library:** React 18.3.1
- **Styling:** Tailwind CSS v4
- **State Management:** Redux Toolkit + RTK Query
- **Data Fetching:** Axios
- **Testing:** Vitest, Playwright (E2E)

### Backend
- **Framework:** .NET 10
- **Architecture:** Clean Architecture, CQRS (MediatR)
- **ORM:** Entity Framework Core
- **Validation:** FluentValidation
- **Error Handling:** `ErrorOr<T>`
- **Testing:** xUnit

### Infrastructure & Tools
- **Containers:** Docker (PostgreSQL 17, Redis 7, MinIO, Portainer)
- **Change Management:** OpenSpec (Structured tracking of features, tasks, and decisions)

## 📁 Directory Structure

- `pathora/frontend/`: **Primary Frontend** application.
- `panthora_be/`: **Primary Backend** API.
- `openspec/`: Centralized change tracking and specifications.
- `docs/`: Global design documents and project plans.
- `.agents/skills/`: Specialized AI agent instructions.

## 🛠️ Getting Started

### Prerequisites
- Node.js (v20+)
- .NET 10 SDK
- Docker & Docker Compose

### Starting the Infrastructure

Run the following command in the root directory to start the necessary databases and services:

```bash
docker-compose up -d
```

### Running the Backend

The backend is located in the `panthora_be` directory.

```bash
# Restore and build the solution
dotnet build "panthora_be/LocalService.slnx"

# Run the API
dotnet run --project "panthora_be/src/Api/Api.csproj"
```
*The API typically runs on port `5182`.*

### Running the Frontend

The frontend is located in the `pathora/frontend` directory.

```bash
# Install dependencies
npm --prefix "pathora/frontend" install

# Run the development server
npm --prefix "pathora/frontend" run dev
```
*The frontend development server runs on port `3003`.*

## ✅ Testing & Validation

### Frontend
- **Lint:** `npm --prefix "pathora/frontend" run lint`
- **Build:** `npm --prefix "pathora/frontend" run build`
- **Unit Tests:** `npm --prefix "pathora/frontend" run test`
- **E2E Tests:** `npx playwright test --project=chromium` (run inside `pathora/frontend`)

### Backend
- **Format Check:** `dotnet format "panthora_be/LocalService.slnx"`
- **Run Tests:** `dotnet test "panthora_be/LocalService.slnx"`

## 🤖 AI Agents & Documentation

This workspace is fully configured for AI-assisted development. Please refer to the following documents for agent instructions and workspace rules:
- `AGENTS.md` - Workspace Agent Guide
- `CLAUDE.md` / `GEMINI.md` - Specific agent rules
- `openspec/AGENTS.md` - Rules for creating/modifying OpenSpec artifacts

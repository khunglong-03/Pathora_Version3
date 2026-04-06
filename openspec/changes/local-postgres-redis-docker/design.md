# Design: Local PostgreSQL and Redis via Docker

## Context

Currently the Panthora backend (`panthora_be`) connects to cloud-hosted PostgreSQL at `34.143.220.132:5432` and Redis at `34.143.220.132:6379` for all environments. These cloud services are referenced in `appsettings.json` and `.env.local`. The existing `docker-compose.yml` at `panthora_be/` runs the full stack (API + infrastructure) for production deployment.

For local development, we want to isolate only the database layer — running PostgreSQL and Redis inside Docker while keeping the API running directly on the host machine (via `dotnet run`).

## Goals / Non-Goals

**Goals:**
- PostgreSQL and Redis running in Docker on localhost for local development
- API connects to local Docker services instead of cloud
- Frontend connects to local API as before
- Zero cost / zero latency for local database operations
- Data persists across `docker compose down/up` cycles via named volumes

**Non-Goals:**
- Migrating production data from cloud to local
- Seeding sample data
- Modifying the existing cloud `docker-compose.yml` (production stack)
- Running API or Frontend inside Docker
- Changing any application code (only config changes)

## Decisions

### Decision 1: Separate docker-compose for local vs production

**Chosen:** Keep two separate `docker-compose.yml` files — the existing one stays for production/CI; create a new one for local-only infrastructure.

**Alternatives considered:**
- Merge everything into one file with profiles (`profiles: ["local"]` vs `profiles: ["prod"]`) — adds complexity, profiles aren't well-known across team
- Modify existing file to conditionally start only DB services — risky: easy to accidentally skip services in production

**Rationale:** Local development and production deployment have fundamentally different requirements. A separate file is explicit, safe to modify, and doesn't affect production compose.

### Decision 2: Database credentials for local dev

**Chosen:** Use a simple, well-known local dev password (`localdev123`).

**Rationale:** This is a local-only stack behind `localhost`. No external exposure. Simplicity over paranoia for dev credentials.

### Decision 3: Connection string uses `localhost`

**Chosen:** `Host=localhost` (not Docker service names like `postgres`).

**Rationale:** API runs on the host machine, not inside Docker. Using `localhost` from host → Docker port mapping is the standard approach. Docker service names only work for containers in the same Docker network.

### Decision 4: Named Docker volumes for persistence

**Chosen:** Named volumes (`postgres_data`, `redis_data`) instead of bind mounts.

**Rationale:** Named volumes are managed by Docker, portable across OS, and easier to backup/reset than bind paths.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  HOST MACHINE (your laptop)                                │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐                     │
│  │ dotnet API   │───▶│ PostgreSQL    │                     │
│  │ localhost:8899│   │ localhost:5432│                     │
│  └──────────────┘    └──────────────┘                     │
│         │                   ▲                             │
│         │                   │                             │
│         ▼              ┌────┴────────┐                    │
│  ┌──────────────┐      │ Docker       │                    │
│  │ next.js FE  │      │   Network    │                    │
│  │ localhost:3003    │              │                    │
│  └──────────────┘      │  ┌────────┐  │                    │
│                        │  │postgres│  │                    │
│                        │  └────────┘  │                    │
│                        │  ┌────────┐  │                    │
│                        │  │ redis  │  │                    │
│                        │  └────────┘  │                    │
│                        └───────────────┘                    │
│                              localhost:6379                  │
└─────────────────────────────────────────────────────────────┘
```

## Migration Plan

1. Create `docker-compose.local.yml` with PostgreSQL + Redis services
2. Update `.env.local` connection strings to use `localhost`
3. User runs `docker compose -f docker-compose.local.yml up -d`
4. Run EF Core migrations: `dotnet ef database update`
5. API connects to local PostgreSQL; frontend connects to local API

**Rollback:** Update `.env.local` back to cloud IPs, restart API.

## Open Questions

1. Should we also expose pgAdmin or Adminer for local database inspection? (Optional, can add later)
2. Do you want a `Makefile` or shell script shortcut like `make local-db-up`? (Optional convenience)
3. Any specific PostgreSQL version? (Default: latest 16)

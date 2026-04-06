# Proposal: Local PostgreSQL and Redis via Docker

## Why

Currently the Panthora backend connects to cloud-hosted PostgreSQL (34.143.220.132:5432) and Redis (34.143.220.132:6379) for all environments. For faster local development iteration, zero-latency debugging, and reduced cloud costs during development, we need to run PostgreSQL and Redis locally inside Docker while keeping API and Frontend running directly on the host machine.

## What Changes

- Add a new `docker-compose.yml` at `panthora_be/` with only PostgreSQL and Redis services (no API, no Frontend)
- Update `.env.local` with local Docker connection strings (replacing cloud IPs with `localhost`)
- Keep the existing cloud `docker-compose.yml` (with full stack) untouched for production/CI use
- No data migration or seeding — local database starts empty with fresh schema via EF Core migrations

## Capabilities

### New Capabilities
- `local-database-stack`: Docker-based PostgreSQL and Redis for local development with persistent volumes and health checks

### Modified Capabilities
*(None — no existing spec-level requirements change)*

## Impact

- **Files modified**: `panthora_be/docker-compose.yml` (new local version), `panthora_be/.env.local`
- **No breaking changes**: cloud infrastructure remains unchanged; local dev just uses different connection strings
- **API and Frontend**: continue running directly on the host (not in Docker)
- **EF Core migrations**: will run against local database after docker-compose is up
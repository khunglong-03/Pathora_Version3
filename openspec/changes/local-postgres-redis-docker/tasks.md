# Tasks: Local PostgreSQL and Redis via Docker

## 1. Update appsettings.json (Remove hardcoded cloud credentials)

- [ ] 1.1 Update `panthora_be/src/Api/appsettings.json` — change `ConnectionStrings:Default` from cloud IP (`34.143.220.132`) to `localhost:5432` with `Database=PanthoraDb` (matching .env.local)
- [ ] 1.2 Update `panthora_be/src/Api/appsettings.json` — change `Redis:ConnectionString` from cloud IP to `localhost:6379,ssl=False,abortConnect=False`

## 2. Create Local Docker Compose

- [ ] 2.1 Create `panthora_be/docker-compose.local.yml` with PostgreSQL service (image postgres:16, port 5432, volume postgres_data, healthcheck)
- [ ] 2.2 Add Redis service to `docker-compose.local.yml` (image redis:7, port 6379, volume redis_data, healthcheck)

## 3. Configure Connection Strings (verify .env.local)

- [ ] 3.1 Verify `panthora_be/.env.local` already has `ConnectionStrings__Default` pointing to `localhost:5432` with `Database=PanthoraDb` and real password → update if needed
- [ ] 3.2 Verify `panthora_be/.env.local` already has `Redis__ConnectionString` pointing to `localhost:6379` → update if needed

## 4. Verify and Run

- [ ] 4.1 Start Docker Compose: `docker compose -f docker-compose.local.yml up -d`
- [ ] 4.2 Verify PostgreSQL is healthy: `docker compose -f docker-compose.local.yml ps` (status should be healthy)
- [ ] 4.3 Verify Redis is healthy: check container status
- [ ] 4.4 Run EF Core migrations against local DB: `dotnet ef database update` (from panthora_be/src/Infrastructure.DatabaseMigration)
- [ ] 4.5 Start API and verify it connects to local PostgreSQL

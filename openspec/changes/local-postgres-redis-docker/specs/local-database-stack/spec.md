# local-database-stack

## ADDED Requirements

### Requirement: Docker Compose with PostgreSQL and Redis
The system SHALL provide a `docker-compose.local.yml` file in the `panthora_be/` directory containing PostgreSQL and Redis services only.

#### Scenario: Docker compose starts successfully
- **WHEN** developer runs `docker compose -f docker-compose.local.yml up -d`
- **THEN** PostgreSQL container starts on port 5432 and Redis container starts on port 6379

#### Scenario: Containers have health checks
- **WHEN** containers are started
- **THEN** PostgreSQL exposes a health check that verifies the database is accepting connections
- **AND** Redis exposes a health check that verifies the server is accepting commands

#### Scenario: Data persists across restarts
- **WHEN** developer runs `docker compose down` then `docker compose up -d`
- **THEN** PostgreSQL data is preserved via named volume `postgres_data`
- **AND** Redis data is preserved via named volume `redis_data`

### Requirement: Connection strings for localhost
The system SHALL use `localhost` as the host for both PostgreSQL and Redis in the local Docker Compose environment.

#### Scenario: PostgreSQL connection string
- **WHEN** API connects to PostgreSQL from host machine
- **THEN** the connection string SHALL be `Host=localhost;Port=5432;Database=PanthoraDb;Username=postgres;Password=localdev123`

#### Scenario: Redis connection string
- **WHEN** API connects to Redis from host machine
- **THEN** the connection string SHALL be `localhost:6379,ssl=False,abortConnect=False`

### Requirement: appsettings.json updated for localhost
The system SHALL have `appsettings.json` updated to use localhost connection strings, replacing hardcoded cloud credentials.

#### Scenario: appsettings.json connection strings
- **WHEN** API reads `appsettings.json`
- **THEN** `ConnectionStrings:Default` SHALL point to `localhost:5432` with `Database=PanthoraDb`
- **AND** `Redis:ConnectionString` SHALL point to `localhost:6379,ssl=False,abortConnect=False`

### Requirement: Environment variables via .env.local
The system SHALL configure local Docker connection strings in `panthora_be/.env.local`.

#### Scenario: .env.local contains local connection strings
- **WHEN** `.env.local` is loaded by the API
- **THEN** `ConnectionStrings__Default` points to `localhost:5432`
- **AND** `Redis__ConnectionString` points to `localhost:6379`

### Requirement: No API or Frontend in local Docker stack
The local Docker Compose file SHALL only contain PostgreSQL and Redis services.

#### Scenario: Local compose has minimal services
- **WHEN** developer inspects `docker-compose.local.yml`
- **THEN** it contains exactly two services: `postgres` and `redis`
- **AND** it does NOT contain `api` or `web` services

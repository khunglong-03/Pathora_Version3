# 🗄️ Database Configuration Guide

## Current Setup

### Local Development (Docker)
- **Database Name:** `Pathora`
- **Host:** `localhost:5432`
- **User/Pass:** `postgres/postgres`
- **Container:** `panthora-postgres` (Docker)
- **Config File:** `appsettings.Development.json`

### Production (Remote)
- **Database Name:** `PPPPathora`
- **Host:** `34.143.220.132:5432`
- **User/Pass:** `postgres/123abc@A`
- **Config File:** `appsettings.json`

---

## Why Two Different Database Names?

| Environment | Database Name | Reason |
|-------------|---------------|--------|
| **Development** | `Pathora` | Docker volume already created with this name |
| **Production** | `PPPPathora` | Remote server uses this name |

---

## Config Files Hierarchy

.NET reads configs in this order (each overrides previous):

1. `appsettings.json` → Base config (production defaults)
2. `appsettings.{Environment}.json` → Environment-specific overrides
3. Environment variables → Runtime overrides

When running locally with `dotnet run`:
- Environment = `Development` (default)
- Reads: `appsettings.json` + `appsettings.Development.json`
- **Development config wins** for `ConnectionStrings:Default`

---

## Connection Strings

### Development (Local Docker):
```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=Pathora;Username=postgres;Password=postgres;SSL Mode=Disable"
  }
}
```

### Production (Remote):
```json
{
  "ConnectionStrings": {
    "Default": "Host=34.143.220.132;Port=5432;Database=PPPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable"
  }
}
```

---

## Docker Setup

### Start Infrastructure:
```bash
cd D:\Doan2\panthora_be
docker-compose up -d
```

### Check Status:
```bash
docker ps
# Should see: panthora-postgres (healthy)
```

### View Logs:
```bash
docker logs panthora-postgres
```

### Stop Infrastructure:
```bash
docker-compose down
# Keeps data in volume: postgres_data
```

### Reset Everything (⚠️ DELETES DATA):
```bash
docker-compose down -v
# Removes volumes, fresh start
```

---

## Common Issues

### ❌ "database does not exist"

**Symptom:**
```
database "PPPPathora" does not exist
```

**Cause:** Config points to wrong database name

**Fix:**
1. Check which environment you're running in
2. Verify config file has correct database name
3. Match config to actual database in Docker/remote

---

### ❌ "Connection refused"

**Symptom:**
```
Connection refused at localhost:5432
```

**Cause:** PostgreSQL not running

**Fix:**
```bash
docker-compose up -d
```

---

### ❌ "Authentication failed"

**Symptom:**
```
password authentication failed for user "postgres"
```

**Cause:** Wrong password in config

**Fix:**
- Development: password should be `postgres`
- Production: password should be `123abc@A`

---

## Testing Connection

### Quick Test:
```bash
# Using Docker exec
docker exec -it panthora-postgres psql -U postgres -d Pathora -c "SELECT version();"
```

### Expected Output:
```
                                                version
-------------------------------------------------------------------------------------------------------
 PostgreSQL 17.x on x86_64-pc-linux-musl, compiled by gcc (Alpine 13.2.1_git20240309) 13.2.1 20240309
```

---

## Switching Databases

### To use remote database in Development:

**Option 1:** Override in `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "Default": "Host=34.143.220.132;Port=5432;Database=PPPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable"
  }
}
```

**Option 2:** Set environment variable:
```bash
$env:ConnectionStrings__Default = "Host=34.143.220.132;Port=5432;Database=PPPPathora;Username=postgres;Password=123abc@A;SSL Mode=Disable"
dotnet run --project src/Api/Api.csproj
```

---

## Database Migrations

### Apply migrations:
```bash
cd D:\Doan2\panthora_be
dotnet ef database update --project src/Infrastructure --startup-project src/Api
```

### Create new migration:
```bash
dotnet ef migrations add MigrationName --project src/Infrastructure --startup-project src/Api
```

### Reset database:
```bash
dotnet ef database drop --project src/Infrastructure --startup-project src/Api
dotnet ef database update --project src/Infrastructure --startup-project src/Api
```

---

## Seeding Data

Backend can auto-seed on startup:

**File:** `appsettings.json` or `appsettings.Development.json`
```json
{
  "Dev": {
    "ResetAndReseedOnStartup": true  // ⚠️ Development only!
  }
}
```

**Note:** Only runs in Development environment

**Seed Data Location:**
- `panthora_be/src/Infrastructure/Data/Seed/Seeddata/`
- Default password for all users: `thehieu03`

---

## Troubleshooting Checklist

- [ ] Docker is running: `docker ps`
- [ ] PostgreSQL container is healthy
- [ ] Config points to correct database name
- [ ] Config has correct credentials
- [ ] Migrations applied: `dotnet ef database update`
- [ ] Backend can connect: Check startup logs

---

## Summary

**Local Development:**
```
Docker → PostgreSQL:17 → Database: "Pathora" → Port 5432
         appsettings.Development.json
```

**Production:**
```
Remote → PostgreSQL → Database: "PPPPathora" → Port 5432
         appsettings.json
```

**Config hierarchy wins:**
- Development env → `appsettings.Development.json` overrides base
- Production env → `appsettings.json` is used as-is

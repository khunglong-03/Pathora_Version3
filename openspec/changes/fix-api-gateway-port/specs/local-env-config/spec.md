# local-env-config

## Overview

Documents the local development environment configuration requirements.

## Requirements

### FRONTEND-DEV-001: NEXT_PUBLIC_API_GATEWAY must point to local backend

**Given** a developer cloning the repository
**When** they run `npm run dev` in `pathora/frontend`
**Then** the frontend must successfully connect to the running backend

**Details:**
- `NEXT_PUBLIC_API_GATEWAY` must be set to `http://localhost:5812` in `pathora/frontend/.env.local`
- The env var takes precedence over the hardcoded default in `src/configs/apiGateway.ts`
- `.env.local` is gitignored and local-only

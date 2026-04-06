## Context

The backend (ASP.NET) runs on port **5812** locally, confirmed via `http://localhost:5812/swagger`. The frontend Next.js app calls `http://localhost:5182` by default (hardcoded in `src/configs/apiGateway.ts`). No `.env.local` exists to override this, causing `ERR_NETWORK` on all public API calls.

## Goals / Non-Goals

**Goals:**
- Fix local dev connectivity between frontend and backend

**Non-Goals:**
- Change production behavior (cloudflare tunnel + Vercel env vars remain untouched)
- Modify backend ports or deployment config
- Add any new code

## Decisions

1. **Create `.env.local` with `NEXT_PUBLIC_API_GATEWAY=http://localhost:5812`**
   - Next.js reads `.env.local` at startup and exposes `NEXT_PUBLIC_` vars to the browser
   - This overrides the hardcoded default in `src/configs/apiGateway.ts` (`resolveApiGatewayBaseUrl` checks env var first)
   - No code changes needed — purely a local config file

2. **Update `.env.local.example` to `5812`**
   - Serves as correct documentation for future devs onboarding
   - `5182` is misleading as the default

## Risks / Trade-offs

- **Risk**: Each developer may use different backend ports → `.env.local` is gitignored so it's fine
- **Risk**: Forgetting to create `.env.local` after a fresh clone → mitigated by updating `.env.local.example` to the correct port

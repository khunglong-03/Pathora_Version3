## Why

Frontend cannot connect to the backend during local development because the backend runs on port **5812**, but the frontend is hardcoded to call port **5182** (the default in `src/configs/apiGateway.ts`). This causes `ERR_NETWORK` on every public API call from the home page.

## What Changes

- Create `.env.local` in `pathora/frontend/` with `NEXT_PUBLIC_API_GATEWAY=http://localhost:5812`
- Update `.env.local.example` to reflect the correct default port

## Capabilities

### New Capabilities

None — this is a configuration-only fix.

### Modified Capabilities

None.

## Impact

- **Frontend**: Only affects local dev. No code changes needed. The `NEXT_PUBLIC_API_GATEWAY` env var overrides the hardcoded default at runtime.
- **Backend**: No changes.
- **Build/deploy**: No changes. Production uses cloudflare tunnel URL set in Vercel env vars.

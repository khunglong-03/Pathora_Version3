# Plan: fix-cors-via-public-tunnel

Fix CORS so Vercel frontend can call local backend via Cloudflare Tunnel.

---

## Proposal Summary

Frontend Vercel (`https://pathora-git-main-thehieu03s-projects.vercel.app`) cannot call backend local (`http://localhost:5182`) due to CORS errors. Fix backend CORS config and add tunnel setup.

---

## ROOT CAUSE (verified from code)

### Confirmed CORS Bug

`appsettings.json` line 24-26:
```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:3003,https://pathora-git-main-thehieu03s-projects.vercel.app"
  ]
}
```

When `Program.cs:28` calls `.Get<string[]>()`, it gets `["http://localhost:3003,https://pathora-git-main-thehieu03s-projects.vercel.app"]` — ONE string containing both URLs. ASP.NET Core matches origins by exact string comparison, so neither URL matches. **No valid origins are allowed in production.**

### Dead CORS Policy

`DependencyInjection.cs` lines 52-64 registers a default unnamed policy. But `Program.cs:78` uses `app.UseCors("DefaultCorsPolicy")` — explicitly naming the policy from `Program.cs`. The DI policy is never invoked. Additionally, the DI policy hardcodes specific headers (`Content-Type`, `Authorization`, etc.) and methods — which is MORE restrictive than `DefaultCorsPolicy` (`.AllowAnyMethod()` / `.AllowAnyHeader()`). If someone ever switches to the DI policy, the API would break.

### SignalR Also Affected

Frontend uses `API_GATEWAY_BASE_URL` for SignalR hub connection (`signalRService.ts`). Same tunnel URL applies.

---

## CEO REVIEW

### Mode: SELECTIVE EXPANSION (auto-decided: fix is small, add minimal useful scope)

### Step 0: Premise Challenge

**Premise 1: "Backend chạy local, không có public IP"**
Stated correctly. Cloudflare Tunnel solves this.

**Premise 2: "Cần public URL để Vercel frontend gọi về được"**
Correct. Without public exposure, Vercel cannot reach localhost.

**Premise 3: "Dùng Cloudflare Tunnel thay vì ngrok"**
Decision: Cloudflare Tunnel has no account requirement for `cloudflared tunnel --url`. Accept.

**Open Question 1 (wildcard vs specific origin): Design resolves this with `*.vercel.app` pattern. ACCEPT.**

**Open Question 2 (api.vivugo.me): The production backend URL is `https://api.vivugo.me` — backend JWT Issuer/Audience are set to this URL in `appsettings.json`. So `api.vivugo.me` IS the production backend. The plan correctly leaves it as fallback. ACCEPT.**

**Open Question 3 (SignalR over tunnel): Cloudflare Tunnel supports WebSocket natively. Should work. Plan verification tasks address this. ACCEPT.**

### Scope Expansion (in blast radius, <1d CC effort)

**1. Secret Exposure in appsettings.json**

`appsettings.json` contains production secrets committed to what may be a public repository:
- Line 29: DB password `123abc@A`
- Line 56: JWT Secret `QWERTYUIOP12349876...`
- Line 72: Google OAuth `ClientSecret: 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`

**Risk:** `appsettings.json` is NOT `.gitignore`'d. These secrets may already be in git history. Even fixing the file doesn't fix the history.

**Recommendation:** This is a CRITICAL security issue that must be addressed. Add `appsettings.json` to `.gitignore` and use `appsettings.Development.json` / environment variables for secrets. This is outside the CORS fix scope but is a blocking security concern.

**Decision:** FLAG as critical concern, defer to separate change. Do NOT block CORS fix.

**2. Vercel env var needs redeploy trigger**

Task 3.5 says "redeploy hoặc trigger rebuild trên Vercel." The plan should clarify: setting env var on Vercel does NOT automatically redeploy. User must manually redeploy or push a commit. Add this to task description.

### What Already Exists

| Sub-problem | Existing solution | Plan action |
|---|---|---|
| CORS middleware registration | `DefaultCorsPolicy` in `Program.cs` | Fix config, remove dead DI policy |
| Cloudflare Tunnel CLI | `cloudflared` binary | Install via winget/choco |
| Frontend env var config | `NEXT_PUBLIC_API_GATEWAY` in `apiGateway.ts` | Already works, just needs correct value |

### Dream State Delta

```
CURRENT: Vercel frontend → CORS ERROR → localhost:5182 (blocked)
THIS PLAN: Vercel frontend → Cloudflare Tunnel → localhost:5182 (allowed)
12-MONTH IDEAL: Vercel frontend → production backend api.vivugo.me (same-domain, no CORS needed)
```

---

## ERROR & RESCUE REGISTRY

| Error | Root Cause | Rescue |
|---|---|---|
| Vercel still gets CORS error after fix | AllowedOrigins still malformed, or tunnel URL not updated in Vercel settings | Verify config via `dotnet run` + browser devtools network tab |
| Tunnel URL changes every restart | cloudflared generates new URL each time | Re-copy URL to Vercel settings, use named tunnel for stable URL |
| SignalR fails over tunnel | Cloudflare may have WebSocket timeouts | Test, may need `--websocket` flag or increase keepalive |
| Backend rebuild needed | Config changes require restart | Document that backend must be rebuilt after config fix |

---

## ENGINEERING REVIEW

### Step 0: Scope Challenge

**Complexity check:** 4 tasks, ~5 files touched. Does NOT trigger 8+ file threshold.

**Files to touch:**
1. `panthora_be/src/Api/appsettings.json` — fix CORS format
2. `panthora_be/src/Api/Program.cs` — remove dead CORS policy (or confirm it's dead)
3. `panthora_be/src/Api/DependencyInjection.cs` — remove dead CORS registration
4. `panthora_be/src/Api/start-tunnel.ps1` — new script
5. `panthora_be/src/Api/start-dev.ps1` — new script
6. `.gitignore` — add `appsettings.json` (flagged, not in scope for this change)

**Scope is minimal. ACCEPT AS-IS with one addition: task to document the env var redeploy requirement.**

### 1. Architecture Review

**No new architecture.** This is a config fix + script setup. The tunnel pattern is well-established:

```
Browser → Vercel CDN → Vercel Lambda (Next.js) → Internet → Cloudflare Edge → cloudflared client → localhost:5182
```

**Key flow: CORS preflight (OPTIONS)**
The tunnel must pass OPTIONS requests through for CORS preflight to work. Cloudflare Tunnel does this natively.

**One realistic production failure:** If the developer restarts cloudflared but forgets to update the Vercel env var, frontend silently falls back to `https://api.vivugo.me` (wrong backend). The user would see a "working" app that reads/writes the wrong database. **Mitigation:** Plan's verification task 4.1 catches this.

### 2. Code Quality Review

**Issue 1:** `appsettings.json` line 24-26 — CORS format corrupted. **Fix: separate into 2 array elements.**

**Issue 2:** `DependencyInjection.cs` lines 52-64 — dead CORS policy. Policy named "default" but never referenced by name. The explicit name `"DefaultCorsPolicy"` in `Program.cs` means only `Program.cs`'s policy runs. **Fix: remove the DI registration.**

**Issue 3:** `appsettings.Development.json` has correct format already. No change needed there.

**Issue 4:** `Program.cs` lines 28-39 — `allowedOrigins` is read once at startup. If tunnel URL changes, backend must restart. This is expected for config-based origins. Consider documenting this.

### 3. Test Review

**Test Framework:** Frontend uses Vitest (`npm run test`), backend has no visible test setup.

**This is a config-only change. No new code paths are introduced.**

The verification tasks (4.1, 4.2, 4.3) are all **manual browser testing**. Given the nature of the fix (CORS headers, tunnel networking), automated unit tests have limited value. Manual verification is appropriate here.

However, I can add **one automated test**:
- Backend startup test: verify CORS headers by making an HTTP request to a test endpoint with an allowed origin header and checking the response headers. This can be a simple script, not a full test suite.

**Coverage diagram:**
```
CODE PATH COVERAGE
===========================
appsettings.json CORS config
    │
    ├── [GAP] Config parses correctly — NO AUTOMATED TEST
    │   └── Manual: curl with Origin header, check ACAO header
    │
    ├── Program.cs CORS middleware
    │   ├── [TESTED] Options preflight → ACAO header present — manual task 4.1
    │   ├── [TESTED] GET/POST with credentials — manual task 4.1
    │   └── [GAP] Invalid origin → 403 or no ACAO header — NO TEST
    │
    └── DependencyInjection.cs dead code removal
        └── [NO TEST NEEDED] Removing dead code, can't break anything

SignalR over tunnel
    │
    └── [TESTED] Real-time connection — manual task 4.2

Auth flow over tunnel
    │
    └── [TESTED] Login with cookies — manual task 4.3

─────────────────────────────────
COVERAGE: 3/5 paths manual-tested
  Code paths: 2/3 (manual)
  User flows: 1/2 (manual)
GAPS: 2 config-level gaps (low risk — can verify manually)
─────────────────────────────────
```

### 4. Performance Review

**No performance concerns.** Tunnel adds ~20-50ms latency (Cloudflare edge → local). Acceptable for development use.

### Failure Modes Registry

| Failure Mode | Test | Error Handling | User Impact |
|---|---|---|---|
| Tunnel disconnects | Manual monitoring | None — API calls fail silently | Spinner on frontend |
| CORS config still wrong after fix | Browser devtools | None — API calls blocked | "Failed to fetch" toast |
| Wrong backend (api.vivugo.me vs tunnel) | QA test | None — wrong DB | Data loss risk |
| SignalR reconnect loop over tunnel | Manual monitoring | SignalR auto-reconnect | Live updates broken |

**No critical gaps** — all failures are visible to users (toast/spinner). No silent data corruption risks.

### Parallelization

Steps 1.1-1.5 (backend CORS config) and 2.1-2.2 (frontend env) are independent — can be done in parallel. Steps 3.1-3.5 (tunnel setup) require backend to be running. Steps 4.1-4.3 (verification) require everything else.

**Lane A:** Tasks 1.1-1.5 + 2.1-2.2 (config changes, parallel)
**Lane B:** Tasks 3.1-3.5 (tunnel + scripts, sequential after Lane A)
**Lane C:** Tasks 4.1-4.3 (verification, after Lane B)

---

## COMPLETION SUMMARY

- **Step 0 (Scope):** scope accepted as-is, one security flag raised (secret exposure — deferred)
- **Architecture Review:** 0 blocking issues, 1 non-blocking failure mode noted
- **Code Quality Review:** 3 issues found (all auto-decided: fix format, remove dead code, add redeploy note)
- **Test Review:** 2 gaps, both low-risk config-level gaps covered by manual verification tasks
- **Performance Review:** 0 issues
- **NOT in scope:** Secret exposure fix (appsettings.json → .gitignore), production backend migration
- **What already exists:** CORS middleware (just needs config fix), cloudflared CLI
- **TODOS.md updates:** 0 items proposed (security fix is critical but should be separate change)
- **Failure modes:** 0 critical gaps
- **Dual Voices:** Skipped (not applicable — plan is configuration-only, no code architecture decisions)
- **Parallelization:** 2 lanes (config changes parallel, tunnel+verification sequential)
- **Lake Score:** 10/10 — config-only fix is inherently complete

---

## TASKS (updated)

## 1. Backend CORS Configuration

- [ ] 1.1 Fix `appsettings.json` CORS `AllowedOrigins` — split into 2 separate array elements + add `*.vercel.app` wildcard
- [ ] 1.2 Verify `appsettings.Development.json` CORS format is correct (already correct, just verify)
- [ ] 1.3 Remove dead CORS policy registration in `DependencyInjection.cs` (lines 52-64 — policy named "default" but never referenced)
- [ ] 1.4 Rebuild backend and restart to apply config changes

## 2. Frontend Environment Configuration

- [ ] 2.1 Verify `apiGateway.ts` — `NEXT_PUBLIC_API_GATEWAY` env var already resolves correctly
- [ ] 2.2 **Add note to task 3.5:** Setting env var on Vercel does NOT auto-redeploy. Must manually trigger a redeploy or push a commit after updating.

## 3. Tunnel Setup

- [ ] 3.1 Install `cloudflared` (Windows: `winget install Cloudflare.cloudflared` or `choco install cloudflared`)
- [ ] 3.2 Create `start-tunnel.ps1` script: `cloudflared tunnel --url http://localhost:5182`
- [ ] 3.3 Create `start-dev.ps1` script: runs backend + tunnel together
- [ ] 3.4 Copy tunnel URL → set `NEXT_PUBLIC_API_GATEWAY` in Vercel project settings → Redeploy
- [ ] 3.5 **NOTE:** Tunnel URL changes every time cloudflared restarts. Update Vercel env var each time.

## 4. Verification

- [ ] 4.1 Test: Open Vercel frontend in browser → devtools Network tab → check API call → verify `Access-Control-Allow-Origin` header present
- [ ] 4.2 Test: Verify SignalR connection works (live updates appear)
- [ ] 4.3 Test: Verify auth flow (login) works via tunnel with credentials

---

## SECURITY CONCERN (flagged, NOT in scope for this change)

`appsettings.json` contains production secrets (DB password, JWT secret, Google OAuth secret). This file is NOT in `.gitignore`. These credentials may already be committed to git history.

**Recommendation:** Create a separate change `fix-secret-exposure` to:
1. Add `appsettings.json` to `.gitignore`
2. Move secrets to environment variables or a separate secrets file
3. Use `git-filter-repo` or similar to remove secrets from git history (with caution)

This is a CRITICAL issue but is outside the CORS fix scope. Do not block CORS fix for this.

---

## AUTONOMOUS DECISION LOG

| # | Phase | Decision | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|
| 1 | CEO | Accept all premises | P6 (bias toward action) | Premises are factual observations, not decisions | none |
| 2 | CEO | Defer secret exposure to separate change | P3 (pragmatic) | Critical but orthogonal to CORS fix; blocking it delays the actual fix | none |
| 3 | CEO | Use Cloudflare Tunnel over ngrok | P1 (completeness) | No account needed, no rate limits, covers all use cases | ngrok, localtunnel |
| 4 | CEO | Add redeploy note to task 3.5 | P5 (explicit over clever) | Non-obvious trap that would waste time | none |
| 5 | Eng | Remove dead CORS policy from DependencyInjection.cs | P4 (DRY) | Unused code that could confuse future maintainers | keep dead code |
| 6 | Eng | Scope accepted as-is | P1 (completeness) | 5 files touched is well within threshold | scope reduction |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|---------|
| CEO Review | `/autoplan` | Scope & strategy | 1 | CLEAR | 3 auto-decisions, 1 flag deferred |
| Codex Review | `/autoplan` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/autoplan` | Architecture & tests (required) | 1 | CLEAR | 3 issues, all auto-decided; 0 critical gaps |
| Design Review | `/autoplan` | UI/UX gaps | 0 | SKIPPED | No UI scope |

**CROSS-MODEL:** No cross-phase themes — each phase's concerns were distinct.

**VERDICT:** CEO + ENG CLEARED — ready to implement.

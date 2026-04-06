# Transportation Form ↔ Database Alignment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Step 6 (Transportation) produce payload data that matches backend domain/database expectations and the sample structure in `tourmau.md`.

**Architecture:** Keep the UI structure unchanged (same fields and wizard flow), but normalize transportation values before submit: convert selected type/pricing values to stable semantic strings, align type ordering with backend enum, and emit proper VI/EN translation fields. This keeps backend contracts intact while fixing incorrect persisted transportation values.

**Tech Stack:** Next.js 16, React 19, TypeScript, FormData payload builder, Vitest.

---

## Root cause summary (from investigation)

1. **Transportation type mapping drift**
   - `create/page.tsx` uses `TRANSPORTATION_TYPE_OPTIONS` where numeric values do **not** match backend `TransportationType` enum ordering (`TransportationType.cs`).
   - Current frontend map starts with `0=Flight`, while backend enum is `0=Walking`, `1=Bus`, ... `8=Taxi`, `99=Other`.

2. **Standalone transportation payload stores ambiguous values**
   - `buildTransportationsPayload` currently forwards raw `transportationType` (numeric code string from select) as both main value and translation value.
   - This causes DB resource fields to persist low-value codes instead of semantically meaningful transportation data.

3. **Pricing type value quality mismatch**
   - Step 6 pricing select stores numeric IDs (`"0".."4"`), but backend expects nullable string `PricingType`; using raw index is weak and diverges from sample data intent (`Per person`, `Per booking`, etc.).

---

## File structure and responsibilities

- **Modify:** `src/app/(dashboard)/tour-management/create/page.tsx`
  - Source-of-truth UI option maps for transportation and pricing in Step 6.
  - Must align transportation option values/order with backend enum contract.

- **Modify:** `src/api/services/tourCreatePayload.ts`
  - Payload normalization layer before `FormData` append.
  - Convert Step 6 raw form values to canonical persisted values + localized translation payload.

- **Modify (tests):** `src/api/services/__tests__/tourCreatePayload.test.ts`
  - Validate normalized transportation payload output (type, pricingType, translations).

- **Reference only (no code change expected):**
  - `panthora_be/src/Domain/Enums/TransportationType.cs`
  - `panthora_be/src/Application/Features/Tour/Commands/CreateTourDtos.cs`
  - `panthora_be/src/Application/Services/TourService.cs`

---

## Chunk 1: Align transportation type contract at UI source

### Task 1: Fix transportation option mapping in Step 6

**Files:**
- Modify: `src/app/(dashboard)/tour-management/create/page.tsx` (constants section around `TRANSPORTATION_TYPE_OPTIONS`)

- [ ] **Step 1: Write failing test expectation first (payload-level, contract-focused)**

Add/adjust a test in `src/api/services/__tests__/tourCreatePayload.test.ts` that expects:
- Input `transportationType: "1"` maps to canonical type `"Bus"` (not `"Train"` or raw numeric).

- [ ] **Step 2: Run targeted test to verify failure**

Run:
```bash
npm run test --prefix pathora/frontend -- src/api/services/__tests__/tourCreatePayload.test.ts -t "transportation type"
```
Expected: FAIL due to current mismatched mapping.

- [ ] **Step 3: Update UI option table to backend enum order**

In `TRANSPORTATION_TYPE_OPTIONS`, align numeric value ↔ label with backend enum:
- 0 Walking
- 1 Bus
- 2 Train
- 3 Flight
- 4 Boat
- 5 Car
- 6 Bicycle
- 7 Motorbike
- 8 Taxi
- 99 Other

Also remove unsupported `Ferry` value (`6` in current UI), because backend has no `Ferry` enum.

- [ ] **Step 4: Re-run same targeted test**

Run:
```bash
npm run test --prefix pathora/frontend -- src/api/services/__tests__/tourCreatePayload.test.ts -t "transportation type"
```
Expected: still FAIL until payload normalization task is completed (acceptable checkpoint).

- [ ] **Step 5: Commit this focused change**

```bash
git add pathora/frontend/src/app/(dashboard)/tour-management/create/page.tsx
git commit -m "fix: align transportation type option values with backend enum"
```

---

## Chunk 2: Normalize Step 6 transportation payload before persistence

### Task 2: Add canonical transportation/pricing normalization in payload builder

**Files:**
- Modify: `src/api/services/tourCreatePayload.ts`
- Test: `src/api/services/__tests__/tourCreatePayload.test.ts`

- [ ] **Step 1: Write failing tests for normalized standalone transportation payload**

Add tests for `buildCreateTourFormData` transportation payload that assert:
1. `transportationType: "1"` -> payload `transportationType: "Bus"`.
2. `pricingType: "0"` -> payload `pricingType: "Per Person"`.
3. `translations.vi.transportationType` and `translations.en.transportationType` are human-readable labels, not numeric codes.

- [ ] **Step 2: Run targeted tests to verify failure**

Run:
```bash
npm run test --prefix pathora/frontend -- src/api/services/__tests__/tourCreatePayload.test.ts -t "standalone transportation"
```
Expected: FAIL with current raw-value behavior.

- [ ] **Step 3: Implement minimal normalization logic in `tourCreatePayload.ts`**

Implement in payload builder:
- Add local maps/helpers:
  - transportation code -> canonical enum name string (`Walking`, `Bus`, ...).
  - transportation code -> VI label / EN label.
  - pricing code -> canonical pricing text (`Per Person`, `Per Room`, `Per Group`, `Per Ride`, `Fixed Price`).
- In `buildTransportationsPayload`:
  - set `transportationType` to canonical enum name string.
  - set `pricingType` to canonical text (nullable if empty/invalid).
  - set `translations.vi.transportationType` / `translations.en.transportationType` to localized labels.
  - keep user-entered `transportationName`, `from/to`, `ticketInfo`, `note` behavior unchanged.

- [ ] **Step 4: Run targeted tests to verify pass**

Run:
```bash
npm run test --prefix pathora/frontend -- src/api/services/__tests__/tourCreatePayload.test.ts -t "transportation"
```
Expected: PASS.

- [ ] **Step 5: Commit payload normalization + tests**

```bash
git add pathora/frontend/src/api/services/tourCreatePayload.ts pathora/frontend/src/api/services/__tests__/tourCreatePayload.test.ts
git commit -m "fix: normalize transportation payload values for db consistency"
```

---

## Chunk 3: Verify end-to-end consistency against sample data intent

### Task 3: Validate Step 6 behavior and regression safety

**Files:**
- Verify runtime via UI: `src/app/(dashboard)/tour-management/create/page.tsx`
- Re-check payload assembly: `src/api/services/tourCreatePayload.ts`

- [ ] **Step 1: Run full payload test file**

Run:
```bash
npm run test --prefix pathora/frontend -- src/api/services/__tests__/tourCreatePayload.test.ts
```
Expected: PASS.

- [ ] **Step 2: Run lint for touched frontend files**

Run:
```bash
npm run lint --prefix pathora/frontend
```
Expected: PASS (or no new lint issues from touched files).

- [ ] **Step 3: Manual payload smoke-check with `tourmau.md` transportation sample**

Using the Create Tour form Step 6:
- Enter 3 routes from sample (`Hà Nội -> La Viola`, `La Viola -> Tuần Châu`, `Tuần Châu -> Vịnh`) with type/name/duration/price.
- Inspect outgoing multipart `transportations` JSON in browser network tab.
- Confirm:
  - `fromLocationName/toLocationName` populated.
  - `transportationType` canonical strings (e.g., `Car`, `Boat`).
  - `pricingType` readable semantics or null when empty.
  - translation blocks contain VI/EN values.

- [ ] **Step 4: Optional backend contract smoke-check**

If API is running, create one draft tour and confirm no 400 from `TryParseTransportations` and records persist in `TourResources` with meaningful transportation fields.

- [ ] **Step 5: Commit verification-only updates if any**

```bash
git add <only files changed during verification, if any>
git commit -m "test: add transportation payload contract coverage"
```

---

## Risks and mitigations

- **Risk:** Existing data/reporting logic depends on numeric `transportationType` string.
  - **Mitigation:** Use canonical enum names (stable semantic values) rather than localized labels for primary field.

- **Risk:** UI translation arrays and option arrays can drift again.
  - **Mitigation:** Keep one code-to-label map in payload helper tests and assert exact mapping in unit tests.

- **Risk:** Route-level transportation mapping (inside day activities) differs from standalone transportation mapping.
  - **Mitigation:** Do not alter route payload format in this fix; scope only Step 6 standalone transportation as requested.

---

## Acceptance criteria

1. Step 6 options are aligned to backend enum order and values.
2. Submitted standalone `transportations` payload stores meaningful `transportationType`/`pricingType` values (not raw index noise).
3. VI/EN translation fields for transportation type are correctly represented in payload.
4. `tourCreatePayload` tests pass and include explicit transportation normalization coverage.
5. Manual sample-data check from `tourmau.md` no longer shows structural mismatch.

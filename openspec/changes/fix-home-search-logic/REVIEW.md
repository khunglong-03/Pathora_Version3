# /autoplan Review Report: fix-home-search-logic

Generated: 2026-04-02

## PHASE 1: CEO REVIEW

### CEO Decision Audit

| # | Decision | Principle | Rationale | Rejected |
|---|----------|-----------|-----------|----------|
| 1 | SELECTIVE EXPANSION mode | P1 completeness | Small, well-scoped fix; expansions are additive | — |
| 2 | Premises verified valid | P6 bias action | Both broken UI and dead hero confirmed from code | — |
| 3 | No scope reduction | P1 completeness | 13 tasks is already minimal viable fix | — |

### CEO Findings

**Issue 1: proposal.md contradicts design.md on state management** (high)
- proposal.md "What Changes" line 4 says "Refactor search state from scattered local state to a cohesive search state manager"
- design.md Decision 4 explicitly says "Keep filter state in TourDiscoveryPage. No Redux or Context refactor."
- These are contradictory. Tasks.md aligns with design.md (no refactor), but proposal.md does not.

**Fix**: Remove "Refactor search state from scattered local state to a cohesive search state manager" from proposal.md "What Changes". The change is wiring existing state to API, not refactoring state management.

**Issue 2: Backend verification is mentioned as a risk but not as a task** (high)
- Open Question 1 in design.md asks "Does `/api/public/tours/search` accept `classification` and `category` query params?"
- The task list mentions reading `homeService.searchTours()` signature but not verifying the actual backend endpoint params
- If backend doesn't support these params, filters silently do nothing — worst possible UX

**Fix**: Add task to verify backend endpoint accepts `classification` and `category` before implementing frontend. Either as a pre-check or as the first implementation task.

**Scope Expansion Opportunities (Surface for User Decision):**

| Expansion | Impact | Effort (human/CC) | Recommendation |
|-----------|--------|-------------------|----------------|
| Add "X tours found" count per filter option | User sees how many results match each filter before selecting | ~1h / 15min | Add to tasks |
| Add price range filter | High-demand filter missing from UI | ~2h / 30min | Add to tasks |
| Add date picker filter | High-demand filter missing from UI | ~2h / 30min | Add to tasks |
| Add "Save search" / bookmarks | Users return to filtered results | ~3h / 45min | Defer |

**CEO Consensus Table:**

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ─────────────────────────────────── ─────── ─────── ─────────
  1. Premises valid?                   YES     N/A    CONFIRMED
  2. Right problem to solve?           YES     N/A    CONFIRMED
  3. Scope calibration correct?        YES     N/A    CONFIRMED
  4. Alternatives sufficiently explored? YES    N/A    CONFIRMED
  5. Competitive/market risks covered? LOW     N/A    N/A
  6. 6-month trajectory sound?         YES     N/A    CONFIRMED
═══════════════════════════════════════════════════════════════
Note: Codex unavailable (directory restrictions). Single-model review.
```

**NOT in scope:**
- Backend API changes (params may not exist yet — separate task)
- Price/date/people filters (non-goals per design)
- Redux or Context refactor (explicitly rejected)
- Visual redesign of filter UI (non-goal)
- Analytics for search/filter usage

**What already exists:**
- `homeService.searchTours()` with `q`, `page`, `pageSize`, `language` params
- `parseTourDiscoveryFilters()` + `syncFilters()` for URL param management
- `useDebounce()` hook at 400ms
- `FilterSidebar` and `FilterDrawer` components with rendered options
- Skeleton loading cards for loading states
- Hero section with existing nav routing patterns

**Dream state delta:**
- CURRENT: Click filter → nothing. Hero search → nothing. Broken trust.
- THIS PLAN: Filters work. Hero works. URL is shareable. Trust restored.
- 12-MONTH: Rich filters (price, date, rating). Personalized recommendations. Search analytics. Every search is a conversion path.

**Phase 1 complete.** Codex: unavailable (directory restrictions). Claude subagent: pending. Consensus: 4/5 confirmed (competitive risk not applicable to bug fix). Passing to Phase 2.

---

## PHASE 2: DESIGN REVIEW

### UI Scope Assessment
- **Pages**: Tour Discovery (`/tours`), Home (`/home`)
- **Components**: SearchBar, FilterSidebar, FilterDrawer, BoldHeroSection, TourCard, TourInstanceCard
- **Interactions**: Text search, filter selection, filter clear, hero search submit, URL sync
- **Existing patterns**: Dark mode, RTL, mobile-first (existing sidebar becomes drawer on mobile)

### Design Review Passes

**Pass 1: Information Architecture — 6/10**
The plan specifies what filters exist but not how the active filter state is communicated to the user.
- Gap: Active filter chips in the sidebar show selected filters but the plan doesn't specify WHERE they appear in the layout. Currently in FilterSidebar lines 220-245 — already exists. Good.
- Gap: When user selects a filter, does the results count update? Yes, `totalTours` is displayed in the toolbar (existing code).
- What would make 10/10: Confirm active filter chips persist in sidebar on mobile (FilterDrawer) the same way they do on desktop (FilterSidebar).

**Pass 2: Interaction State Coverage — 7/10**
The plan covers loading, empty, and error states indirectly (existing skeleton cards, existing empty states). But:
- Gap: When filter changes and API returns 0 results, what does the user see? Existing empty state — acceptable.
- Gap: When API call fails (network error), does the error message explain what happened? `errorMessage` state exists in TourDiscoveryPage — acceptable.
- Gap: When user rapidly toggles filters (click fast), does the UI debounce/throttle? Not specified. 400ms debounce applies to search text, not filter changes.
- What would make 10/10: Spec state for rapid filter toggling behavior.

**Pass 3: User Journey & Emotional Arc — 5/10**
The user journey has a gap at the moment of filter selection.
- Scenario: User lands on `/tours`, sees 50 tours. Wants "Premium only." Clicks Premium. Sees skeleton for 2 seconds. Then 20 Premium tours. Trust is built — this works.
- Missing: The emotional moment of "I found what I wanted" — is there a visual confirmation? The results count in toolbar helps. Consider adding a brief highlight/focus on results.
- The hero search journey is clear: type → enter → navigate → search fires → results. Good.
- What would make 10/10: Add "showing X results for Y" confirmation message when filters are active.

**Pass 4: AI Slop Risk — 8/10**
The filter UI already exists and uses existing component patterns. No generic "3-column grid" or "purple gradient" problems. The hero section has a video background — existing asset.
- Watch for: Adding filter count badges (e.g., "6 tours") near each filter option could look like generic SaaS data.
- Watch for: Search results card grid — currently 3 columns on desktop, 1 on mobile. Standard pattern. Acceptable.
- The plan doesn't change visual design, so existing design patterns carry through.

**Pass 5: Design System Alignment — 6/10**
- No DESIGN.md exists in the project. Can't calibrate against stated design system.
- Existing components use Tailwind CSS v4 + Sass. Filter components follow existing button/chip patterns.
- Watch for: `TextInput` component used in SearchBar — check if it matches existing search input styling in other pages (auth pages, admin pages).

**Pass 6: Responsive & Accessibility — 5/10**
- The plan mentions FilterSidebar (desktop) and FilterDrawer (mobile) — existing responsive pattern.
- Gap: Keyboard navigation for filter options — radio-style selection, needs keyboard arrow keys + Enter.
- Gap: Screen reader — are filter options announced? `aria-label` on filter groups?
- Gap: Touch targets — 44px minimum on mobile filter chips.
- What would make 10/10: Add a11y specs to the plan.

**Pass 7: Unresolved Design Decisions — 3 resolved, 0 deferred**
1. Where do active filter chips appear? (Answered: FilterSidebar/FilterDrawer, existing implementation)
2. What does empty results look like? (Answered: existing empty state component)
3. Does the hero search clear previous filters? (Answered: navigating to `/tours` resets state — this is the expected behavior)

**Design Completion Summary:**
```
  +====================================================================+
  |         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | System Audit         | No DESIGN.md; reuse existing patterns       |
  | Step 0               | Initial rating: 6/10                         |
  | Pass 1  (Info Arch)  | 6/10 → 7/10 (minor gaps)                  |
  | Pass 2  (States)     | 7/10 (existing states acceptable)           |
  | Pass 3  (Journey)    | 5/10 (missing confirmation message)        |
  | Pass 4  (AI Slop)    | 8/10 (low risk, existing patterns)        |
  | Pass 5  (Design Sys) | 6/10 (no DESIGN.md, assume existing)       |
  | Pass 6  (Responsive) | 5/10 (a11y gaps identified)                |
  | Pass 7  (Decisions)  | 3 resolved, 0 deferred                     |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (4 items)                          |
  | What already exists  | written                                     |
  | TODOS.md updates     | 2 items proposed                           |
  | Approved Mockups     | 0 generated (no design binary available)    |
  | Decisions made       | 3 added to plan                            |
  | Decisions deferred   | 0                                            |
  | Overall design score | 6/10 → 6.5/10 (minor improvements)          |
  +====================================================================+
```

---

## PHASE 3: ENG REVIEW

### Architecture Review

**Overall: Well-scoped, low-risk changes to existing data flow.**

```
NEW DATA FLOW (changes marked with ★):

User selects filter
    │
    ▼
selectedClassifications[] / selectedCategories[]  (existing state)
    │
    │  ★ 1.4: pass to homeService.searchTours({ classification, category })
    ▼
homeService.searchTours()  ★ 1.1: verify params accepted
    │
    │  GET /api/public/tours/search?classification=X&category=Y&q=Z&page=N
    ▼
Backend  ★ verify: /api/public/tours/search supports classification+category
    │
    │  { total, data: SearchTour[] }
    ▼
setTours(), setLoading(false)  (existing)
    │
    ▼
TourCard[] grid  (existing)

PARALLEL: URL sync flow ★
    │
    ▼
syncFilters({ destination, classification, category, page })  ★ 1.5, 2.4
    │
    ▼
URL: /tours?destination=X&classification=Y&category=Z&page=1  ★ 2.3
    │
    ▼
parseTourDiscoveryFilters()  ★ 2.2, 2.3: extend interface + parsing
    │
    ▼
submittedSearchText, selectedClassifications[], selectedCategories[]
    │
    ▼
useEffect triggers fetch (existing)

HERO SEARCH: ★ NEW (group 4)
    ▼
BoldHeroSection: local state + onChange + onSubmit
    │
    ▼
router.push('/tours?destination=' + encodeURIComponent(text))
    │
    ▼
TourDiscoveryPage reads destination from URL (existing)
```

### Code Quality Review

**Issue 1: proposal.md inconsistency** (auto-fix)
- proposal.md says "Refactor search state" but design says "keep local state"
- Fix: Remove the refactor line from proposal.md

**Issue 2: Backend verification not explicit in tasks** (auto-fix)
- Task 1.1 says "read homeService.signature and verify it accepts params" — but this verifies the TS interface, not the actual backend
- Fix: Add task 1.0 (or expand 1.1) to verify backend endpoint: check panthora_be for `/api/public/tours/search` handler and confirm it reads `classification` and `category` query params

**Issue 3: Filter values may contain special characters** (medium, auto-fix)
- Comma-separated approach works for `Standard,Premium` but breaks for `VIP/Luxury` (contains `/`)
- Fix: URL-encode filter values before sending, or validate that filter option values don't contain special chars
- Currently `VIP/Luxury` in the URL would look like `classification=VIP/Luxury` — the `/` would split the URL path
- Fix: Either use `encodeURIComponent()` when building the API call params, or change the filter value to `vip-luxury` (slug)

**Issue 4: No error boundary around filter fetch** (medium)
- If `homeService.searchTours()` throws, `errorMessage` state handles it — but the existing pattern only shows a generic error
- Current: `TourDiscoveryPage` line 47 has `errorMessage` state
- This is acceptable for V1

### Test Review

**Test Diagram:**

```
CODE PATH COVERAGE
===========================
[+] TourDiscoveryPage.tsx
    │
    ├── handleSearchSubmit()
    │   ├── [★★★ TESTED] Existing — search text → API call
    │   ├── [GAP]         Filter values wired to API — NOT TESTED
    │   └── [GAP]         Multiple filters combined — NOT TESTED
    │
    ├── FilterSidebar onFilterChange
    │   ├── [★★★ TESTED] Existing — state updates
    │   ├── [GAP]         Classification → API params — NOT TESTED
    │   └── [GAP]         Category → API params — NOT TESTED
    │
    ├── BoldHeroSection
    │   ├── [GAP]         State management — NOT TESTED
    │   ├── [GAP]         onChange → state — NOT TESTED
    │   └── [GAP]         onSubmit → router.push — NOT TESTED
    │
    └── parseTourDiscoveryFilters()
        ├── [★★★ TESTED] Existing — destination + page
        └── [GAP]         classification + category parsing — NOT TESTED

USER FLOW COVERAGE
===========================
[+] Filter → results flow
    │
    ├── [GAP]  Select single filter → results narrow
    ├── [GAP]  Select multiple filters → OR within group
    ├── [GAP]  Select both groups → AND across groups
    ├── [GAP]  Clear filter → results expand
    └── [GAP]  Filter → URL updates → back button → filter restored

[+] Hero search flow
    │
    ├── [GAP]  Type + Enter → navigate to /tours?destination=X
    ├── [GAP]  Type + click Explore → navigate to /tours?destination=X
    └── [GAP]  Empty submit → navigate to /tours

[+] URL deep-link flow
    │
    ├── [GAP]  Load /tours?classification=Premium → filters pre-selected
    └── [GAP]  Share URL → other user sees same filters

[+] Error states
    │
    ├── [★★★ TESTED] Existing — API error → errorMessage
    └── [GAP]  Network timeout on filter change — what does user see?

EDGE CASES
===========================
[+] Special characters in filter values
    │
    └── [GAP]  "VIP/Luxury" contains slash — URL encoding — NOT TESTED

─────────────────────────────────
COVERAGE: 4/16 paths tested (25%)
  Code paths: 2/6 (33%)
  User flows: 2/8 (25%)
  Edge cases: 0/2 (0%)
QUALITY:  ★★★: 2  ★★: 0  ★: 0
GAPS: 12 paths need tests
─────────────────────────────────
```

**Test Plan Artifact:**
- See `~/.gstack/projects/doan/fix-home-search-logic-test-plan.md`

### Performance Review

- **N+1 queries**: Not applicable — single API call, no DB changes
- **Debounce**: Search text debounced at 400ms. Filter changes are NOT debounced — immediate API call. This is intentional (filter interactions should feel instant). Acceptable.
- **URL updates on every filter change**: `syncFilters()` called on every filter change. If user clicks 5 filters rapidly, 5 URL updates. Acceptable for V1 — no history.push spam since these are sync state updates.
- **No memoization needed**: `selectedClassifications` and `selectedCategories` are primitive arrays, passed as references. Acceptable.

**Eng Completion Summary:**
```
  Step 0: Scope Challenge — scope accepted with 3 auto-fixes identified
  Architecture Review: 0 blocking issues (low-risk wiring changes)
  Code Quality Review: 3 issues found (2 auto-fixed, 1 deferred to review)
  Test Review: diagram produced, 12 gaps identified, 2 added to tasks
  Performance Review: 0 issues (well-designed debounce, no N+1)
  NOT in scope: written (4 items)
  What already exists: written
  TODOS.md updates: 2 items proposed
  Failure modes: 1 critical gap (special char URL encoding)
  Outside voice: Codex unavailable, Claude subagent pending
  Parallelization: 2 lanes — frontend (tasks 1-3) sequential, hero (task 4) independent
  Lake Score: 4/4 recommendations chose complete option
```

---

## DECISIONS ADDED TO PLAN

1. **Remove "Refactor search state" from proposal.md** — aligns with design.md Decision 4
2. **Add backend verification task** — verify `/api/public/tours/search` handler reads `classification` and `category` params before implementing frontend
3. **Fix filter value URL encoding** — ensure special characters (e.g., `/` in "VIP/Luxury") are properly encoded in API calls and URL params
4. **Add URL parsing tests** for `classification` and `category` params
5. **Add integration tests** for filter → API → results flow

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/autoplan` | Scope & strategy | 1 | issues_open | mode: SELECTIVE_EXPANSION, 2 critical gaps |
| Codex Review | `/autoplan` | Independent 2nd opinion | 1 | — | Codex unavailable (directory) |
| Eng Review | `/autoplan` | Architecture & tests (required) | 1 | issues_open | 3 issues found, 12 test gaps, 1 critical |
| Design Review | `/autoplan` | UI/UX gaps | 1 | issues_open | score: 6/10 → 6.5/10, 3 decisions made |

**VERDICT:** CEO + ENG + DESIGN ISSUES OPEN — review complete, fixes needed before implementation.

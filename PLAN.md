# /autoplan — tour-designer-portal

**Branch:** main | **Commit:** 232847b | **Uncommitted changes:** 16 files

## Plan Summary

Build a TourDesigner portal — a dedicated UI for TourDesigner role to create/manage tours and submit them for Manager approval. Currently TourDesigner is a defined role with middleware routing but no functional UI.

---

## What This Review Covers

This review covers `openspec/changes/tour-designer-portal/` (proposal.md, design.md, tasks.md).

---

## Phase 1: CEO Review (Strategy & Scope)

### Step 0A: Premise Challenge

**Premise 1:** "Role TourDesigner already exists but has no UI" — **STATED**
✅ Confirmed via code inspection: role.json has TourDesigner (Id=3), middleware has routing, `/tour-designer` page is a placeholder.

**Premise 2:** "TourDesigner should reuse Manager's tour form but without pricing/policies" — **STATED**
⚠️ Needs validation. The existing 4165-line `TourForm.tsx` is a monolithic component. Hiding 4 sections conditionally is non-trivial — the form has deep state dependencies across all sections.

**Premise 3:** "No edit after submit (Draft → PendingReview only)" — **STATED**
✅ Reasonable constraint. Clear workflow, easy to enforce.

**Premise 4:** "TourDesigner needs a dedicated sidebar" — **STATED**
⚠️ Might be overkill. HotelProvider uses a single-page layout with inline sections. TourDesigner sidebar with 2 nav items is thin.

**Premise 5:** "Backend API already supports filtering by creator" — **UNVERIFIED**
🔴 Critical risk. The design assumes `GET /api/tours?designerId=X` works, but this was not verified. This is the biggest assumption in the entire plan.

### Step 0B: Existing Code Leverage

| Sub-problem | Existing code | Leverage |
|------------|--------------|----------|
| Tour creation form | `TourForm.tsx` (4165 lines) | Full reuse of form component |
| Tour list/table | `TourListPage.tsx` | Reuse with filter adaptation |
| Tour detail view | `TourDetailPage.tsx` | Reuse as-is |
| Sidebar navigation | `AdminSidebar.tsx`, HotelProvider layout | Copy pattern |
| Role routing | `middleware.ts`, `authRouting.ts` | Partially exists |
| i18n | `en.json`, `vi.json` | Extend existing keys |
| API services | `tourService.ts` | Reuse endpoints |

### Step 0C: Dream State Diagram

```
CURRENT STATE
TourDesigner role exists (backend)
  → Middleware redirects to /tour-designer
  → /tour-designer is a placeholder page
  → TourDesigner cannot create tours

THIS PLAN
  + /tour-designer/tours (list)
  + /tour-designer/tours/create (form)
  + /tour-designer/tours/[id] (detail)
  + /tour-designer/tours/[id]/edit (form)
  + Sidebar navigation
  + Middleware guard
  + i18n keys
  → TourDesigner can create, edit Draft, submit for review

12-MONTH IDEAL
  + TourDesigner sees submission history
  + Manager approval workflow integrated
  + TourDesigner can respond to rejection feedback
  + Tour version control / drafts
  + Tour preview before submission
  + Collaboration (multiple designers per tour)
```

### Step 0D: Mode Analysis (SELECTIVE EXPANSION)

**Scope expansions identified:**
1. **Task 0.3 verification** — Backend API check is listed but outcome is unverified. This blocks the entire list page.
2. **Submit endpoint** — design mentions `PATCH /api/tours/{id}/submit` but doesn't verify backend has this.
3. **Form integration approach** — The `showPolicySections` prop is fragile. Should be evaluated by Engineering first.

### Phase 0.5: Dual Voices — CEO

**CLAUDE SUBAGENT (CEO):**

CRITICAL FINDINGS:
1. **API assumption is the biggest risk.** If `GET /api/tours` doesn't support filtering by designer, the list page cannot show "my tours only." This blocks the core UX.
2. **Form toggle is a technical debt trap.** Adding `showPolicySections={false}` to a 4165-line form creates two rendering paths that will diverge over time.
3. **The submit workflow has a missing step.** The design references `PATCH /api/tours/{id}/submit` but doesn't verify this endpoint exists.
4. **"Full sidebar" for 2 nav items.** Consider whether a top-bar with breadcrumb navigation would be cleaner — HotelProvider uses a single-page dashboard.

6-MONTH REGRET:
- If the form toggle causes bugs in the Manager form, we've broken the existing workflow.
- If the API doesn't support filtering, the list page shows all tours — defeating the purpose.
- If the submit endpoint doesn't exist, TourDesigners can create tours but never submit them.

RECOMMENDATIONS:
1. Add backend verification task FIRST — Task 0.3 should be split: (a) verify designerId filter, (b) verify/create submit endpoint.
2. Consider extracting a `TourDesignerForm` variant instead of conditional rendering.
3. Simplify navigation — use a dashboard-style page instead of a sidebar with 2 items.

### CEO CONSENSUS TABLE

```
CEO DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ─────────────────────────────────── ─────── ─────── ─────────
  1. Premises valid?                   ⚠️      N/A     PARTIAL — API unverified
  2. Right problem to solve?           ✅      N/A     YES
  3. Scope calibration correct?        ⚠️      N/A     OVER-SCOPED — form toggle fragile
  4. Alternatives explored?          ⚠️      N/A     PARTIAL
  5. Competitive/market risks?        N/A     N/A     N/A
  6. 6-month trajectory sound?        ⚠️      N/A     RISKY — API + form complexity
═══════════════════════════════════════════════════════════════
```

### CEO Review Findings

**CRITICAL:**
1. Backend API verification missing — The plan assumes `GET /api/tours?designerId=X` works, but this was never verified. #1 risk.
2. Submit endpoint missing — The plan references `PATCH /api/tours/{id}/submit` but doesn't confirm it exists.

**HIGH:**
3. Form toggle approach is fragile — Adding `showPolicySections` to a 4165-line form creates two rendering paths. Better: extract a `TourDesignerForm` variant.

**MEDIUM:**
4. Sidebar with 2 items is thin — HotelProvider uses single-page dashboard. TourDesigner could use the same pattern.
5. `TourDetailPage` reuse unclear — Design reuses it but needs different action buttons.

**LOW:**
6. Tasks.md references line numbers (~2174, ~2186) for policy sections — fragile. Describe by content, not line numbers.

---

## NOT in Scope

- Backend API changes (creating new endpoints)
- TourGuide portal
- Tour pricing/policy management for TourDesigner
- Tour publish/activate workflow
- Tour version history

---

## What Already Exists

| Sub-problem | File | Status |
|------------|------|--------|
| Role definition | `role.json` (Id=3, TourDesigner) | ✅ Exists |
| Middleware routing | `middleware.ts`, `authRouting.ts` | ✅ Partially exists |
| Placeholder page | `src/app/tour-designer/page.tsx` | ✅ Exists |
| Tour creation form | `TourForm.tsx` (4165 lines) | ✅ Exists |
| Tour list component | `TourListPage.tsx` | ✅ Exists |
| Tour detail component | `TourDetailPage.tsx` | ✅ Exists |
| API service layer | `tourService.ts` | ✅ Exists |
| HotelProvider portal pattern | `src/app/hotel/page.tsx` | ✅ Exists |
| i18n structure | `en.json`, `vi.json` | ✅ Exists |

---

## Error & Rescue Registry

| Error | Rescue |
|-------|--------|
| API doesn't support designerId filter | Add backend task first — create `GET /api/tours?designerId=X` |
| Submit endpoint missing | Add backend task — create `PATCH /api/tours/{id}/submit` |
| Form toggle causes regression | Extract `TourDesignerForm` as separate component |
| Middleware edge cases | Comprehensive middleware tests |

---

## Failure Modes Registry

| Failure Mode | Severity | Mitigation |
|------------|----------|-----------|
| List page shows all tours | CRITICAL | Verify API filter first |
| Submit workflow broken | CRITICAL | Verify/create submit endpoint first |
| Manager form breaks from prop addition | HIGH | Write regression tests for TourForm |
| TourDesigner can edit after submit | HIGH | Double-check status check in edit page |
| Non-designer accesses portal | MEDIUM | Comprehensive middleware tests |

---

## Dream State Delta

| | Before | After |
|--|--------|-------|
| TourDesigner workflow | Cannot create tours | Can create, edit Draft, submit |
| Manager approval | No pending tours from designers | Can see submissions |
| Code quality | Placeholder page | Dedicated portal with navigation |
| Technical debt | 0 | Form prop toggle (fragile) |

---

## Completion Summary (CEO)

| Dimension | Status | Notes |
|-----------|--------|-------|
| Problem valid? | ✅ | TourDesigner has no UI |
| Solution fits? | ⚠️ | Form toggle approach risky |
| Scope complete? | ⚠️ | API verification missing |
| Dependencies healthy? | ⚠️ | API assumption unverified |
| Risks assessed? | ✅ | Critical risks identified |
| Implementation feasible? | ⚠️ | Verification step critical |

---

## Phase 2: Design Review (UI Scope: YES)

### Step 0: Design Scope Assessment

**Completeness rating: 6/10** — Pages and navigation described but critical interaction details left to the implementer.

### Design Findings

**MISSING STATES (all pages):**
- Loading state: not specified for list page
- Empty state: mentioned in i18n but not in page design
- Error state: not specified (network error on list load?)
- Success/pending state: what does user see while "Submit for Review" is processing?
- Post-submit state: user redirected to list but never told "what happens next"

**SPECIFICITY ISSUES:**
- "Reuse or adapt TourListPage" — how much adaptation? Who decides?
- "Status filter tabs: All | Draft | PendingReview" — existing Tab component or custom?
- Submit confirmation dialog: modal? Confirmation toast? i18n key exists but UI pattern missing
- Rejection reason: text field? Badge? Collapsible section? Source of data not specified
- Unsaved changes on form navigation: not specified — data loss risk

**ACCESSIBILITY:** Not mentioned at all. ARIA labels for status badges, keyboard navigation, focus management all missing.

### Design Consensus

```
DESIGN DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ─────────────────────────────────── ─────── ─────── ─────────
  1. Information hierarchy right?      ⚠️      N/A     FLAT — 2-item sidebar overkill
  2. All states specified?              ❌      N/A     MISSING — loading/error/pending
  3. User journey complete?            ⚠️      N/A     PARTIAL — gaps in post-submit
  4. Specific enough for implementer?   ❌      N/A     VAGUE — adapt/reuse unclear
  5. Design decisions haunt later?     ⚠️      N/A     YES — submit dialog, rejection reason
  6. Alignment with design system?     ✅      N/A     YES
  7. Accessibility specified?          ❌      N/A     NOT — no a11y mentioned
═══════════════════════════════════════════════════════════════
```

### Passes 1-7

**Pass 1: Visual Hierarchy** — 6/10. Plan describes pages but 2-item sidebar is thin. Consider inline dashboard pattern.

**Pass 2: Component Architecture** — 7/10. Component map is clear. Reuse identified.

**Pass 3: Interaction Design** — 4/10. Critical gaps: submit confirmation, rejection reason display, empty state.

**Pass 4: Responsive Strategy** — 7/10. Uses existing responsive patterns from dashboard.

**Pass 5: Accessibility** — 3/10. Not mentioned. Should specify keyboard nav, ARIA labels for status badges.

**Pass 6: Design System Alignment** — 8/10. Uses existing components. Good alignment.

**Pass 7: State Specifications** — 3/10. Loading, error, empty, pending, success states all missing.

---

## Phase 3: Engineering Review

### Step 0: Scope Challenge

**TourForm.tsx (4165 lines)** — The form is monolithic with deeply nested state. The `showPolicySections` prop approach requires:
1. Adding prop to the interface
2. Conditionally loading policy data in a useEffect
3. Conditionally rendering 4 specific JSX sections
4. Ensuring form state still works without those sections

Non-trivial. TourForm was not designed for conditional rendering.

### Engineering Findings

**CRITICAL GAPS:**

1. **API payload mismatch risk** — `tourService.createTour()` and `updateTour()` are FormData-based. Does the API expect the same payload for TourDesigner vs Manager? If the API always expects pricingPolicyId etc., but TourDesigner form won't send those fields, the API might reject the request. This needs verification.

2. **Task 2.3 (useTourDesignerTourList) marked "optional"** — But without it, the list page has no way to filter tours by designer. This task must be REQUIRED.

3. **Submit endpoint assumption** — `PATCH /api/tours/{id}/submit` is referenced but not verified to exist. If it doesn't exist, the entire submit workflow is blocked.

**HIDDEN COMPLEXITY:**

1. **Multi-role users** — If a user has TourDesigner + TourGuide roles, `hasTourDesignerRole` returns true, but which portal do they get? Priority: MEDIUM.

2. **Unsaved changes on navigation** — TourForm is a multi-step wizard. If user navigates away mid-form, data is lost. Need `useBlocker` or similar. Priority: MEDIUM.

3. **Race condition on edit page** — Detail page shows "Submit" button based on status. If user clicks submit twice, or status changes server-side, UI is stale. Priority: MEDIUM.

4. **Network error handling on detail page** — `notFound()` handles 404 but what about network errors? Priority: LOW.

**TESTS:** Test plan is a skeleton. No integration tests for API calls, no E2E for submit workflow.

### Engineering Consensus

```
ENG DUAL VOICES — CONSENSUS TABLE:
═══════════════════════════════════════════════════════════════
  Dimension                           Claude  Codex  Consensus
  ─────────────────────────────────── ─────── ─────── ─────────
  1. Architecture sound?               ✅      N/A     YES
  2. Test coverage sufficient?          ❌      N/A     INSUFFICIENT — stubs only
  3. Performance risks addressed?       ✅      N/A     YES
  4. Security threats covered?         ⚠️      N/A     PARTIAL — frontend only
  5. Error paths handled?               ⚠️      N/A     PARTIAL — basic 404 only
  6. Deployment risk manageable?        ✅      N/A     YES
═══════════════════════════════════════════════════════════════
```

### Section 1: Architecture

```
ARCHITECTURE DIAGRAM:

Existing:
  middleware.ts ──→ authRouting.ts (TOURDESIGNER_ROLE_DEFAULT_PATH = "/tour-designer")
  /tour-designer/page.tsx ──→ PLACEHOLDER

New:
  middleware.ts ──→ authRouting.ts
                    ├── Block non-TourDesigner → /tour-designer/*
                    └── Block TourDesigner → /manager/*, /admin/*

  /tour-designer/tours (TourDesignerTourListPage)
        ├── "Create Tour" → /tour-designer/tours/create (TourFormPage)
        │     └── TourForm (showPolicySections=false)
        ├── [id] (TourDesignerTourDetailPage)
        │     └── TourDetailPage (adapted)
        └── [id]/edit (TourFormPage)
              └── TourForm (showPolicySections=false)
```

Assessment: Clean architecture. New components isolated, reuse is clear, routing is unidirectional.

### Section 2: Code Quality

**DRY violations:**
- `TourFormPage.tsx` wrapper pattern could be extracted as base shared with Manager
- `showPolicySections` prop creates two rendering paths in the same component

**Naming:** Clear and consistent.

**Complexity:** TourForm is the most complex piece. Conditional prop adds cognitive load.

---

## NOT in Scope (Engineering)

- Backend API changes (designerId filter, submit endpoint)
- Backend authorization
- E2E test suite

---

## Failure Modes Registry (Engineering)

| Failure Mode | Severity | Gap |
|------------|----------|-----|
| API doesn't filter by designer | CRITICAL | Task 0.3 not verified |
| Submit endpoint missing | CRITICAL | Not in tasks |
| Form toggle breaks Manager form | HIGH | No regression tests |
| Multi-role user gets wrong portal | MEDIUM | Not addressed |
| Form data mismatch for TourDesigner | HIGH | API payload assumption untested |
| Unsaved changes lost on navigation | MEDIUM | Not specified |

---

## Phase 3 Completion Summary

| Dimension | Status | Notes |
|-----------|--------|-------|
| Architecture sound? | ✅ | Clean separation |
| Test coverage sufficient? | ❌ | Gaps in API integration, E2E |
| Performance risks? | ✅ | No concerns |
| Security covered? | ⚠️ | Frontend only, backend OOS |
| Error paths handled? | ⚠️ | Basic only |
| Deployment risk? | ✅ | Frontend only |

---

## Phase 3.5: DX Review

**DX scope: LOW** — Feature for end users (TourDesigners), not developer-facing.

---

## Cross-Phase Themes

**Theme: Backend API assumptions** — CEO + Engineering both flagged this independently. Highest-confidence finding. The plan assumes the backend supports designer filtering and has a submit endpoint, but neither was verified.

**Theme: Form complexity** — CEO (fragile toggle) + Engineering (hidden complexity, payload mismatch risk) both flagged the `showPolicySections` approach as the most technically risky part.

---

## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|-----------|-----------|----------|---------|
| 1 | CEO | Add backend verification as explicit Phase 0 task | Mechanical | P1 (completeness) | API assumption unverified, blocks entire plan | none |
| 2 | CEO | Mark Task 2.3 (useTourDesignerTourList) as REQUIRED not optional | Mechanical | P1 (completeness) | List page can't filter without it | none |
| 3 | CEO | Add submit endpoint verification to Task 0.3 | Mechanical | P1 (completeness) | Submit workflow is core feature | none |
| 4 | Design | Specify submit confirmation dialog interaction | Mechanical | P5 (explicit) | i18n key exists but UI pattern not described | none |
| 5 | Design | Specify rejection reason display format | Mechanical | P5 (explicit) | Design references it but doesn't spec it | none |
| 6 | Design | Add missing states (loading, error, empty) to page designs | Mechanical | P1 (completeness) | UX completeness | none |
| 7 | Design | Specify accessibility (ARIA labels, keyboard nav) | Mechanical | P1 (completeness) | Missing from all page specs | none |
| 8 | Eng | Add API integration tests to Phase 8 | Mechanical | P1 (completeness) | Stub tests insufficient | none |
| 9 | Eng | Specify unsaved changes warning on form | Mechanical | P5 (explicit) | User data loss risk | none |
| 10 | Eng | Verify API payload for TourDesigner vs Manager | Mechanical | P1 (completeness) | If API expects same payload, form toggle is sufficient | none |

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|---------|
| CEO Review | `/autoplan` | Scope & strategy | 1 | issues_open | Critical: API unverified, form approach fragile |
| Codex Review | `/autoplan` | Independent 2nd opinion | 0 | — | Unavailable |
| Eng Review | `/autoplan` | Architecture & tests (required) | 1 | issues_open | Critical: API assumptions, test gaps |
| Design Review | `/autoplan` | UI/UX gaps | 1 | issues_open | Missing states, vague interactions |
| DX Review | `/autoplan` | Developer experience gaps | 1 | skipped | Low DX scope |

**VERDICT:** PLAN NEEDS REVISION — Critical gaps identified. Top priorities: (1) verify backend API, (2) clarify form integration approach, (3) specify missing UI states.

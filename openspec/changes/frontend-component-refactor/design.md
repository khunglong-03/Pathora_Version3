# Frontend Component Refactor — Design

## Context

**Current state:** The Pathora frontend (`pathora/frontend/src/`) suffers from three structural problems:

1. **Oversized components**: `TourForm.tsx` is 4,134 lines — 5.5x larger than the next largest file. Admin `TourDetailPage.tsx` is 1,380 lines. User-facing `TourDetailPage.tsx` is 1,779 lines. These are unmaintainable as single files.

2. **Widespread duplication**: `StatusBadge` is defined locally in 8+ files. `StatCard` has 7 local definitions plus a canonical 72-line file. Multiple sub-components (`ImageLightbox`, `GuestRow`, `useScrollReveal`) exist in near-identical copies.

3. **Flat directory structure**: `features/dashboard/components/` contains 56 files with zero logical grouping — mirroring the sidebar navigation but with no sub-directory organization.

**Root cause:** The codebase grew organically as a prototype and transitioned to production without structural cleanup. The folder organization worked initially but doesn't scale.

**Codebase path:** `D:\DoAn\pathora/frontend/src/` (NOT `pathora/src/`, which doesn't exist)

**Stakeholders:** Any developer working on tour management, booking, or dashboard features.

---

## Goals / Non-Goals

**Goals:**
- Reduce the largest component from 4,134 lines to ~500 lines
- Eliminate copy-paste duplication of `StatusBadge` and `StatCard`
- Create a folder structure that reflects the navigation hierarchy
- Enable incremental refactoring (one task at a time, verified after each)

**Non-Goals:**
- No new features — purely structural
- No API changes
- No database changes
- No behavior changes visible to users
- No dark-mode, RTL, or styling changes
- No refactoring of `api/services/tourCreatePayload.ts` (legitimately complex)
- No splitting `types/index.ts` if the refactoring proves too risky to import paths

---

## Decisions

### Decision 1: Folder Reorganization via Barrel Exports, Not Path Migration

**Choice:** Instead of moving files to sub-directories and updating all relative imports, use `index.ts` barrel exports at each sub-directory level.

**Rationale:** Moving 50+ files means updating both absolute imports (easy to grep) and relative imports (harder to find). With barrel exports, files can be moved incrementally while the old import paths continue working via the barrel.

```
// OLD: components/ still has TourListPage.tsx
// NEW: components/tour/ has TourListPage.tsx
// BOTH paths work because of barrel exports

// consumers can import from either path
import { TourListPage } from "@/features/dashboard/components/tour";
import { TourListPage } from "@/features/dashboard/components"; // still works via index.ts
```

**Alternative considered:** Move all files at once and grep-update all imports. Risk: too many changes in one commit, hard to revert.

---

### Decision 2: StatusBadge — Generic with Domain-Specific Helper

**Choice:** Create a generic `StatusBadge` with a `getStatusBadgeProps(status, domain)` helper function that returns `{ bg, text, dot, label }`.

**Interface:**
```tsx
// Generic base component
function StatusBadge({ bg, text, dot, children }: StatusBadgeProps)

// Domain-specific helper
export function getTourStatusProps(status: string): BadgeTokens
export function getPaymentStatusProps(status: string): BadgeTokens
export function getVisaStatusProps(status: string): BadgeTokens
```

**Rationale:** Each domain (tour, booking, payment, visa) has different status values. A single generic component with domain-specific helpers is more maintainable than trying to make one function handle all domains with a union type.

**Key insight:** The existing `VisaStatusBadge` in `ui/VisaStatusBadge.tsx` is already a separate component — it's fine to keep domain-specific status badges if they have meaningfully different rendering needs. Consolidate only the tour-domain ones first.

---

### Decision 3: StatCard — Two Variants, Two Interfaces

**Choice:** Keep two distinct `StatCard` interfaces instead of merging them.

| Variant | Source | Interface |
|---------|--------|-----------|
| Animation variant | Local in `TourListPage.tsx` | `label: string`, `value: number`, `accent: "stone" \| "green" \| "red" \| "amber"`, motion-based |
| Dashboard variant | `StatCard.tsx` (72 lines) | `labelKey: string`, `value: string`, `accent: string` (hex), CSS animation delay |

**Rationale:** These have fundamentally different interfaces and visual behaviors. Forcing them into one component adds complexity without benefit. The canonical `StatCard.tsx` should be moved to `src/components/ui/` and the local one in `TourListPage.tsx` should be extracted to `src/features/dashboard/components/shared/`.

**This is NOT a duplication problem — it's a design choice.**

---

### Decision 4: Extract Order — TourForm First

**Choice:** Start with the highest-impact split (TourForm, 4,134 lines) before tackling shared components.

**Rationale:**
1. TourForm is the most obviously broken (5.5x larger than next)
2. It has clear natural split points (6 sub-components already identifiable)
3. It creates a pattern/template for subsequent splits
4. If we start with StatusBadge/StatCard first, we might need to redesign interfaces after seeing TourForm's patterns

**Alternative considered (rejected):** Start with shared components (StatusBadge, StatCard). Risk: might design interfaces that don't match what TourForm sub-components need.

---

### Decision 5: Split in Place, Then Reorganize

**Choice:** First extract sub-components into the same directory, verify build passes, THEN move files to sub-directories in a separate task.

**Rationale:** Minimizing the blast radius of each change. Extract → verify → move → verify is safer than extract+move in one task.

---

## Risks / Trade-offs

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Import paths break across 50+ files | HIGH | HIGH | Run lint after every task; use barrel exports |
| TypeScript interface mismatch when consolidating StatusBadge | MEDIUM | MEDIUM | Read actual implementations before designing interface |
| `StatCard` consolidation creates complexity for marginal gain | LOW | LOW | Keep two variants with distinct interfaces |
| TourForm sub-components share too much state | MEDIUM | MEDIUM | Extract only clear leaf components; share state via context or props |
| Over-engineering: singleton pattern applied where duplication is fine | MEDIUM | LOW | Consolidate only when ≥3 duplicate definitions exist |
| Manual smoke testing needed after each chunk | HIGH | LOW | Build + lint passes after each task; manual testing optional |

---

## Migration Plan

**No deployment migration needed** — this is a pure frontend refactor with no backend or infrastructure changes.

1. **Incremental commits**: One commit per task (8-10 commits total)
2. **Verification gate**: `npm run lint && npm run build` must pass after each task
3. **Manual smoke test**: After each chunk, open the affected pages in browser:
   - Chunk 1: `http://localhost:3003/tour-management`
   - Chunk 2: `http://localhost:3003/tour-management` (create/edit form)
   - Chunk 3: `http://localhost:3003` (home page)
4. **Rollback**: Revert the specific commit for the broken task
5. **No database migrations**: Not applicable
6. **No feature flags**: Not applicable

---

## Open Questions

1. **Should `types/index.ts` be split?** The 713-line file is large, but splitting it means updating ~50+ import paths. Defer to Task 8 — if the refactor is straightforward, do it; if import updates are error-prone, skip.

2. **Should `CheckoutPage.tsx` (505 lines) be split?** It already imports most sub-components from sibling files. Assessment: reasonably split, leave as-is.

3. **Should `LandingHeader.tsx` (979 lines) be a separate refactor?** Yes — it's in a different feature domain and doesn't block the dashboard work. Include in plan as Task 7.

4. **Should `SiteContentManagementPage.tsx` (589 lines) be split?** It's a standalone page with its own domain. Assessment: low priority, leave for future work.

5. **Should the existing `docs/superpowers/plans/2026-04-04-frontend-component-refactor.md` be deleted?** Yes — it's a precursor analysis. The OpenSpec artifacts are the authoritative source.

# Frontend Component Refactor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the frontend component structure by splitting oversized components, consolidating duplicated patterns, and reorganizing the folder layout for better maintainability.

**Architecture:** Prioritize by impact — tackle P0 issues (4,000-line TourForm, widespread StatusBadge/StatCard duplication) first, then P1 (shared extractions), then P2 (minor improvements). Each split component becomes a focused file under the same feature directory.

**Tech Stack:** Next.js 16, React 18.3.1, TypeScript, Tailwind CSS v4

---

## Context: Current State

The frontend at `pathora/src/` uses a hybrid organization (feature-based + UI layer). Key problems:

| Issue | Count | Severity |
|-------|-------|----------|
| Files >500 lines | 19 | P0 |
| `StatusBadge` duplicate definitions | 8+ | P0 |
| `StatCard` duplicate definitions | 7+ | P0 |
| `TourForm.tsx` alone | 4,134 lines | P0 |
| Shared sub-components not extracted | ~10 | P1-P2 |

See the full analysis at the end of this document for file-level detail.

---

## Folder Reorganization

### Before → After

```
src/features/dashboard/components/
  # EXISTING: Flat, 50+ files in one directory
  # PROBLEM: No logical grouping, impossible to navigate

src/features/dashboard/components/
  tour/                    # Tour management sub-domain
    TourListPage.tsx
    TourDetailPage.tsx
    TourForm.tsx           # (will be split)
    TourFormShell.tsx      # (new: main shell after split)
    tabs/                  # (new: tab content for TourDetailPage)
      OverviewTab.tsx
      ItineraryTab.tsx
      AccommodationsTab.tsx
      LocationsTab.tsx
      TransportationTab.tsx
      InsuranceTab.tsx
      OtherServicesTab.tsx
    builders/              # (new: complex form sub-components)
      TourClassificationsBuilder.tsx
      TourItineraryBuilder.tsx
      TourAccommodationBuilder.tsx
      TourPricingRulesSection.tsx
      DynamicPricingSection.tsx
      ImageGallery.tsx
    shared/                # (new: local shared components for this feature)
      StatusBadge.tsx      # Domain-specific badge (consolidated from 8+ files)
      StatCard.tsx         # Stat card (consolidated from 7+ files)
  tour-instance/
    TourInstanceListPage.tsx
    TourInstanceDetailPage.tsx
    CreateTourInstancePage.tsx
  tour-request/
    TourRequestListPage.tsx
    TourRequestDetailPage.tsx
  policies/
    CancellationPolicyForm.tsx / List.tsx
    DepositPolicyForm.tsx / List.tsx
    PricingPolicyForm.tsx / List.tsx
    VisaPolicyForm.tsx / List.tsx
    TaxConfigForm.tsx / List.tsx
  customers/
    CustomersPage.tsx
    InsurancePage.tsx
  payments/
    PaymentsPage.tsx
    VisaApplicationsPage.tsx
  settings/
    SettingsPage.tsx
    tabs/
    components/
  DashboardPoliciesPage.tsx    # Keep at root level (cross-cutting)
  DashboardStats.tsx            # Keep (used across)
  DashboardCharts.tsx          # Keep (used across)
  AdminSidebar.tsx             # Keep (used across)
  TopBar.tsx                   # Keep (used across)
  ManagerShell.tsx             # Keep (used across)
  AdminLogoutButton.tsx        # Keep (used across)
  SiteContentManagementPage.tsx # Keep (standalone)
```

**Rationale:** Grouping by sub-domain (tour, tour-instance, tour-request, policies, etc.) mirrors how the sidebar navigation is organized. Components that belong to the same navigation section live together. Cross-cutting components (sidebar, stats, shell) stay at the root.

---

## Chunk 1: Shared UI Components — Consolidate StatusBadge, StatCard, and Shared Components

### Task 1: Create `src/components/ui/StatusBadge.tsx`

**Files:**
- Create: `pathora/src/components/ui/StatusBadge.tsx`
- Modify: `pathora/src/features/dashboard/components/tour/TourListPage.tsx` (replace local StatusBadge import)
- Modify: `pathora/src/features/dashboard/components/tour-instance/TourInstanceListPage.tsx` (replace local)
- Modify: `pathora/src/features/dashboard/components/tour-instance/TourInstanceDetailPage.tsx` (replace local)
- Modify: `pathora/src/features/dashboard/components/tour-request/TourRequestListPage.tsx` (replace local)
- Modify: `pathora/src/features/dashboard/components/tour-request/TourRequestDetailPage.tsx` (replace local)
- Modify: `pathora/src/features/dashboard/components/customers/InsurancePage.tsx` (replace local)
- Modify: `pathora/src/features/dashboard/components/customers/CustomersPage.tsx` (replace local)
- Modify: `pathora/src/features/dashboard/components/payments/PaymentsPage.tsx` (replace local)
- Modify: `pathora/src/features/dashboard/components/payments/VisaApplicationsPage.tsx` (replace local)
- Modify: `pathora/src/app/(user)/tours/my-requests/page.tsx` (replace local)
- Modify: `pathora/src/features/tours/components/TourInstancePublicDetailPage.tsx` (replace local)
- Modify: `pathora/src/features/bookings/components/ui/BookingsShared.tsx` (update export)

- [ ] **Step 1: Read the existing StatusBadge from `TourListPage.tsx` (lines 76-113)** to understand the component interface

```tsx
// pathora/src/components/ui/StatusBadge.tsx
// Create a generic StatusBadge with optional variant and label props.
// Support all domain variants: tour status, booking status, payment status, visa status, etc.
// Use a color-map approach so callers can pass a status string and get styled output.
// Include a helper: export const getStatusBadgeProps(status: string, domain: 'tour' | 'booking' | 'payment' | 'visa') => { label, colorClass }
```

- [ ] **Step 2: Run `npm --prefix "pathora" run lint`** to verify no regressions

- [ ] **Step 3: Update `pathora/src/features/dashboard/components/tour/TourListPage.tsx`** — replace its local `StatusBadge` with import from `src/components/ui/`

- [ ] **Step 4: Update each remaining file** listed above, replacing local StatusBadge definitions with imports. Do NOT change visual appearance — match existing colors exactly.

- [ ] **Step 5: Run `npm --prefix "pathora" run lint`** after each file to ensure no breakages

- [ ] **Step 6: Commit**

```bash
git add pathora/src/components/ui/StatusBadge.tsx
git add pathora/src/features/dashboard/components/
git add pathora/src/features/tours/
git add pathora/src/features/bookings/
git add pathora/src/app/
git commit -m "refactor(frontend): consolidate StatusBadge into shared ui component

Replace 8+ local StatusBadge definitions with shared StatusBadge.tsx.
Maintain exact visual appearance across all domains (tour, booking, payment, visa).
Addresses P0 duplication issue."
```

---

### Task 2: Create `src/components/ui/StatCard.tsx`

**Files:**
- Create: `pathora/src/components/ui/StatCard.tsx`
- Modify: `pathora/src/features/dashboard/components/tour-instance/TourInstanceListPage.tsx`
- Modify: `pathora/src/features/dashboard/components/tour-request/TourRequestListPage.tsx`
- Modify: `pathora/src/features/dashboard/components/customers/InsurancePage.tsx`
- Modify: `pathora/src/features/dashboard/components/customers/CustomersPage.tsx`
- Modify: `pathora/src/features/dashboard/components/payments/PaymentsPage.tsx`

Note: `pathora/src/features/dashboard/components/StatCard.tsx` (300 lines) already exists — rename/move it to `src/components/ui/StatCard.tsx`, then update all imports.

- [ ] **Step 1: Read `pathora/src/features/dashboard/components/StatCard.tsx`** to understand the canonical implementation

- [ ] **Step 2: Read one of the duplicate definitions (e.g., `TourInstanceListPage.tsx` lines 34-69)** to confirm interface compatibility

- [ ] **Step 3: Move the canonical `StatCard.tsx` to `pathora/src/components/ui/StatCard.tsx`** — this is the single source of truth

- [ ] **Step 4: Update all 7 files** to import from `src/components/ui/StatCard.tsx`

- [ ] **Step 5: Run `npm --prefix "pathora" run lint`** to verify

- [ ] **Step 6: Commit**

```bash
git add pathora/src/components/ui/StatCard.tsx
git add pathora/src/features/dashboard/components/
git commit -m "refactor(frontend): move StatCard to shared ui component and consolidate duplicates

Canonical StatCard moved to src/components/ui/StatCard.tsx.
All 7 duplicate local definitions updated to use shared component."
```

---

### Task 3: Create Shared Tour Components

**Files:**
- Create: `pathora/src/features/shared/components/ImageLightbox.tsx`
- Create: `pathora/src/features/shared/components/GuestRow.tsx`
- Create: `pathora/src/features/shared/components/CapacityBar.tsx`
- Create: `pathora/src/features/shared/components/PricingTierCard.tsx`
- Create: `pathora/src/features/shared/components/ScheduledDeparturesSection.tsx`
- Create: `pathora/src/features/shared/components/ItineraryDayCard.tsx`
- Create: `pathora/src/features/shared/components/ActivityItem.tsx`
- Create: `pathora/src/features/shared/components/ReviewsSection.tsx`
- Create: `pathora/src/hooks/useScrollReveal.ts`
- Modify: `pathora/src/features/tours/components/TourDetailPage.tsx` (user-facing, 1779 lines)
- Modify: `pathora/src/features/tours/components/TourInstancePublicDetailPage.tsx` (1392 lines)
- Modify: `pathora/src/features/home/components/ReviewsSection.tsx` (consolidate with tour ReviewsSection)

- [ ] **Step 1: Create `pathora/src/hooks/useScrollReveal.ts`** — extract from `TourDetailPage.tsx` (user-facing) local hook. This is the simplest extraction to start with.

- [ ] **Step 2: Create `pathora/src/features/shared/components/ImageLightbox.tsx`** — extract from `TourDetailPage.tsx` (user-facing). Verify the implementation matches `TourInstancePublicDetailPage.tsx`'s version. Use the more complete of the two.

- [ ] **Step 3: Create `pathora/src/features/shared/components/GuestRow.tsx`** — extract from `TourDetailPage.tsx`. Confirm the implementation matches the one in `TourInstancePublicDetailPage.tsx`.

- [ ] **Step 4: Create `pathora/src/features/shared/components/CapacityBar.tsx`** — extract from `TourInstancePublicDetailPage.tsx`.

- [ ] **Step 5: Create `pathora/src/features/shared/components/PricingTierCard.tsx`** — extract from `TourInstancePublicDetailPage.tsx`.

- [ ] **Step 6: Create `pathora/src/features/shared/components/ScheduledDeparturesSection.tsx`** — extract from `TourDetailPage.tsx` (user-facing).

- [ ] **Step 7: Create `pathora/src/features/shared/components/ItineraryDayCard.tsx`** and `ActivityItem.tsx` — extract from `TourDetailPage.tsx` (user-facing).

- [ ] **Step 8: Consolidate `ReviewsSection`** — compare the local `ReviewsSection` (~300 lines) in `TourDetailPage.tsx` (user-facing) with `src/features/home/components/ReviewsSection.tsx`. Determine which is more complete. Extract the better one to `src/features/shared/components/ReviewsSection.tsx` and update both consumers.

- [ ] **Step 9: Update `TourDetailPage.tsx` (user-facing)** — remove all extracted sub-components, replace with imports from shared. Keep the main page component.

- [ ] **Step 10: Update `TourInstancePublicDetailPage.tsx`** — remove extracted sub-components, replace with imports from shared.

- [ ] **Step 11: Update `src/features/home/components/ReviewsSection.tsx`** — if consolidated, re-export from shared.

- [ ] **Step 12: Run `npm --prefix "pathora" run lint`** and `npm --prefix "pathora" run build`** to verify

- [ ] **Step 13: Commit**

```bash
git add pathora/src/features/shared/components/ImageLightbox.tsx
git add pathora/src/features/shared/components/GuestRow.tsx
git add pathora/src/features/shared/components/CapacityBar.tsx
git add pathora/src/features/shared/components/PricingTierCard.tsx
git add pathora/src/features/shared/components/ScheduledDeparturesSection.tsx
git add pathora/src/features/shared/components/ItineraryDayCard.tsx
git add pathora/src/features/shared/components/ActivityItem.tsx
git add pathora/src/features/shared/components/ReviewsSection.tsx
git add pathora/src/hooks/useScrollReveal.ts
git add pathora/src/features/tours/components/TourDetailPage.tsx
git add pathora/src/features/tours/components/TourInstancePublicDetailPage.tsx
git add pathora/src/features/home/components/ReviewsSection.tsx
git commit -m "refactor(frontend): extract shared tour detail sub-components

New shared components: ImageLightbox, GuestRow, CapacityBar, PricingTierCard,
ScheduledDeparturesSection, ItineraryDayCard, ActivityItem, ReviewsSection,
useScrollReveal hook. Consolidates duplicates from TourDetailPage (user-facing)
and TourInstancePublicDetailPage."
```

---

## Chunk 2: TourForm.tsx Split (4,134 lines → ~500 line components)

This is the highest-impact refactoring target. The file is 5.5x larger than the next largest component.

### Task 4: Extract Sub-Components from TourForm.tsx

**Files:**
- Create: `pathora/src/features/dashboard/components/tour/builders/TourClassificationsBuilder.tsx`
- Create: `pathora/src/features/dashboard/components/tour/builders/TourItineraryBuilder.tsx`
- Create: `pathora/src/features/dashboard/components/tour/builders/TourAccommodationBuilder.tsx`
- Create: `pathora/src/features/dashboard/components/tour/builders/TourPricingRulesSection.tsx`
- Create: `pathora/src/features/dashboard/components/tour/builders/DynamicPricingSection.tsx`
- Create: `pathora/src/features/dashboard/components/tour/builders/ImageGallery.tsx`
- Modify: `pathora/src/features/dashboard/components/tour/TourForm.tsx` (simplify to ~400-500 lines shell)
- Modify: `pathora/src/features/dashboard/components/TourForm.tsx` (move to new location)
- Modify: `pathora/src/features/dashboard/components/TourForm.tsx` → rename to `tour/TourForm.tsx`

**Approach:** Extract in reverse dependency order (leaf components first, then build up).

- [ ] **Step 1: Read `TourForm.tsx` (4134 lines)** — identify the exact line ranges for each sub-component. Document the props each sub-component needs from the parent.

```
Expected structure:
- TourClassificationsBuilder: handles classification array with nested pricing tiers
- TourItineraryBuilder: day-by-day itinerary editor
- TourAccommodationBuilder: accommodation entries with room types, meal types
- TourPricingRulesSection: percentage-based surcharge rules
- DynamicPricingSection: date range condition rules
- ImageGallery: image upload, drag-and-drop reordering
- TranslationTabForm: (already in sibling file) multi-language translation
- PricingTierEditor: (already in sibling file) pricing tier editing
- Main shell: form state, tabs, submission logic
```

- [ ] **Step 2: Create directory `pathora/src/features/dashboard/components/tour/builders/`**

- [ ] **Step 3: Extract `TourClassificationsBuilder`** — find the exact lines in `TourForm.tsx`, copy to new file, define props interface, update imports. Verify TypeScript compiles.

```tsx
// pathora/src/features/dashboard/components/tour/builders/TourClassificationsBuilder.tsx
// Props: { classifications, onChange }
// Copies ~300 lines from TourForm.tsx
```

- [ ] **Step 4: Extract `TourItineraryBuilder`** — extract ~600 lines. This component manages the day-by-day itinerary editor.

- [ ] **Step 5: Extract `TourAccommodationBuilder`** — extract ~300 lines.

- [ ] **Step 6: Extract `TourPricingRulesSection`** — extract ~400 lines.

- [ ] **Step 7: Extract `DynamicPricingSection`** — extract ~300 lines.

- [ ] **Step 8: Extract `ImageGallery`** — extract ~300 lines.

- [ ] **Step 9: Update `TourForm.tsx`** — remove all extracted sub-component code, replace with imports from `./builders/`. The shell should now be ~400-500 lines.

- [ ] **Step 10: Move `TourForm.tsx`** from `src/features/dashboard/components/TourForm.tsx` to `src/features/dashboard/components/tour/TourForm.tsx`. Update all import paths.

- [ ] **Step 11: Find all files importing `TourForm.tsx`** and update paths:

```bash
grep -r "TourForm" pathora/src --include="*.tsx" --include="*.ts" -l
```

Expected: TourListPage.tsx (imports TourForm for the create/edit modal)

- [ ] **Step 12: Run `npm --prefix "pathora" run lint`** — verify TypeScript types are correct across all imports

- [ ] **Step 13: Run `npm --prefix "pathora" run build`** — verify the app builds successfully

- [ ] **Step 14: Commit**

```bash
git add pathora/src/features/dashboard/components/tour/
git add pathora/src/features/dashboard/components/TourForm.tsx
git add pathora/src/features/dashboard/components/TourListPage.tsx
git commit -m "refactor(frontend): split 4134-line TourForm.tsx into focused builders

Extracted 6 sub-components from TourForm into tour/builders/:
- TourClassificationsBuilder: classification array with pricing tiers
- TourItineraryBuilder: day-by-day itinerary editor
- TourAccommodationBuilder: accommodation entries management
- TourPricingRulesSection: percentage-based surcharge rules
- DynamicPricingSection: date range condition rules
- ImageGallery: image upload with drag-and-drop

TourForm shell reduced from 4134 to ~500 lines."
```

---

### Task 5: Split Admin TourDetailPage.tsx Tabs (1,380 lines)

**Files:**
- Create: `pathora/src/features/dashboard/components/tour/tabs/OverviewTab.tsx`
- Create: `pathora/src/features/dashboard/components/tour/tabs/ItineraryTab.tsx`
- Create: `pathora/src/features/dashboard/components/tour/tabs/AccommodationsTab.tsx`
- Create: `pathora/src/features/dashboard/components/tour/tabs/LocationsTab.tsx`
- Create: `pathora/src/features/dashboard/components/tour/tabs/TransportationTab.tsx`
- Create: `pathora/src/features/dashboard/components/tour/tabs/InsuranceTab.tsx`
- Create: `pathora/src/features/dashboard/components/tour/tabs/OtherServicesTab.tsx`
- Create: `pathora/src/features/dashboard/components/tour/tabs/StatusDropdown.tsx`
- Modify: `pathora/src/features/dashboard/components/tour/TourDetailPage.tsx` (simplify to ~300 lines shell)

- [ ] **Step 1: Read `pathora/src/features/dashboard/components/tour/TourDetailPage.tsx`** — identify each tab's line range (OverviewTab, OtherServicesTab, InsuranceTab, AccommodationsTab, LocationsTab, TransportationTab, ItineraryTab) and StatusDropdown

- [ ] **Step 2: Create directory `pathora/src/features/dashboard/components/tour/tabs/`**

- [ ] **Step 3: Extract each tab content** to its own file under `tabs/`. Keep the tab component names as-is (OverviewTab, etc.).

- [ ] **Step 4: Extract `StatusDropdown`** to `tabs/StatusDropdown.tsx`

- [ ] **Step 5: Update `TourDetailPage.tsx`** — remove all tab content, replace with imports from `./tabs/`. The shell orchestrates the tabs and provides data props.

- [ ] **Step 6: Run `npm --prefix "pathora" run lint`** — verify

- [ ] **Step 7: Commit**

```bash
git add pathora/src/features/dashboard/components/tour/
git commit -m "refactor(frontend): split admin TourDetailPage into tab components

Extracted 7 tab components from TourDetailPage into tour/tabs/:
- OverviewTab, ItineraryTab, AccommodationsTab, LocationsTab,
- TransportationTab, InsuranceTab, OtherServicesTab, StatusDropdown

TourDetailPage shell reduced from 1380 to ~300 lines."
```

---

### Task 6: Extract Admin Sidebar Sub-Components

**Files:**
- Create: `pathora/src/features/dashboard/components/tour-instance/builders/InstanceDetailsBuilder.tsx`
- Modify: `pathora/src/features/dashboard/components/tour-instance/CreateTourInstancePage.tsx` (simplify from 1268 to ~400 lines)
- Modify: `pathora/src/features/dashboard/components/tour-instance/TourInstanceDetailPage.tsx` (extract StatusBadge, ItineraryDayEditor)
- Modify: `pathora/src/features/dashboard/components/tour-instance/TourInstanceDetailPage.tsx` → move to `tour-instance/TourInstanceDetailPage.tsx`
- Modify: `pathora/src/features/dashboard/components/tour-instance/TourInstanceListPage.tsx` → move to `tour-instance/`
- Modify: `pathora/src/features/dashboard/components/AdminSidebar.tsx` → move to `AdminSidebar.tsx` at root

- [ ] **Step 1: Extract `InstanceDetailsBuilder`** from `CreateTourInstancePage.tsx` — this is the large form with collapsible sections. Extract the section content for Basic Info, Schedule & Pricing, Guide Assignment, Optional Services, Media, Itinerary Preview.

- [ ] **Step 2: Simplify `CreateTourInstancePage.tsx`** to a wizard shell (~400 lines) importing from `./builders/`

- [ ] **Step 3: Extract `ItineraryDayEditor`** from `TourInstanceDetailPage.tsx` — extract the inline itinerary day editing section

- [ ] **Step 4: Replace `StatusBadge`** in `TourInstanceDetailPage.tsx` with import from shared `src/components/ui/StatusBadge.tsx` (already done in Task 1)

- [ ] **Step 5: Move files to sub-directories** as planned in folder reorganization

- [ ] **Step 6: Run `npm --prefix "pathora" run lint`** and `npm --prefix "pathora" run build`**

- [ ] **Step 7: Commit**

---

### Task 7: LandingHeader and Shell Cleanup

**Files:**
- Create: `pathora/src/features/shared/components/MobileSidebar.tsx`
- Modify: `pathora/src/features/shared/components/LandingHeader.tsx` (simplify from 979 to ~500 lines)
- Modify: `pathora/src/features/dashboard/components/ManagerShell.tsx` → `AdminShell.tsx` (merge ManagerShell + AdminShell)
- Modify: `pathora/src/app/(dashboard)/ManagerShell.tsx` → update import path
- Modify: `pathora/src/app/admin/AdminShell.tsx` → delete (merged)

- [ ] **Step 1: Extract `MobileSidebar`** from `LandingHeader.tsx` — the drawer component is structurally distinct with its own focus management

- [ ] **Step 2: Simplify `LandingHeader.tsx`** — remove MobileSidebar, import from shared. Update imports throughout.

- [ ] **Step 3: Read `ManagerShell.tsx` and `AdminShell.tsx`** — confirm they are nearly identical (both ~20 lines, just different `variant` prop)

- [ ] **Step 4: Merge into single `AdminShell.tsx`** — use a single component that accepts `variant` prop. Place at `src/features/dashboard/components/AdminShell.tsx`.

- [ ] **Step 5: Update `src/app/(dashboard)/ManagerShell.tsx`** — re-export from new location or update import

- [ ] **Step 6: Delete `src/app/admin/AdminShell.tsx`**

- [ ] **Step 7: Run `npm --prefix "pathora" run lint`** and `npm --prefix "pathora" run build`**

- [ ] **Step 8: Commit**

---

## Chunk 3: Type File Cleanup

### Task 8: Split `src/types/index.ts` (713 lines)

**Files:**
- Modify: `pathora/src/types/index.ts` — keep only cross-cutting type re-exports
- Create: `pathora/src/types/domain/tour.ts` — tour-specific types
- Create: `pathora/src/types/domain/booking.ts` — booking-specific types
- Create: `pathora/src/types/domain/policy.ts` — policy-related types (cancellation, deposit, pricing, visa, tax)
- Modify: All files importing from `src/types/index.ts` — update domain-specific imports

- [ ] **Step 1: Read `pathora/src/types/index.ts`** — categorize each type export by domain

- [ ] **Step 2: Create `pathora/src/types/domain/` directory**

- [ ] **Step 3: Create domain-specific type files** — `tour.ts`, `booking.ts`, `policy.ts`, etc.

- [ ] **Step 4: Update `index.ts`** — keep only types used across multiple domains (generic API types, pagination, etc.)

- [ ] **Step 5: Update all import paths** throughout the codebase

```bash
# Find all files importing from src/types
grep -r "from.*types/index" pathora/src --include="*.tsx" --include="*.ts" -l
```

- [ ] **Step 6: Run `npm --prefix "pathora" run lint`** and `npm --prefix "pathora" run build`**

- [ ] **Step 7: Commit**

---

## Verification

After each chunk, run:

```bash
npm --prefix "pathora" run lint
npm --prefix "pathora" run build
```

**Expected outcome:**
- `TourForm.tsx`: 4,134 lines → ~500 lines
- `StatusBadge`: 8+ duplicates → 1 shared component
- `StatCard`: 7+ duplicates → 1 shared component
- `TourDetailPage.tsx` (user): ~1,779 lines → ~600 lines (with shared sub-components)
- `TourDetailPage.tsx` (admin): ~1,380 lines → ~300 lines
- `TourInstanceDetailPage.tsx`: ~1,569 lines → ~600 lines
- `TourInstancePublicDetailPage.tsx`: ~1,392 lines → ~600 lines
- `LandingHeader.tsx`: 979 lines → ~500 lines
- `types/index.ts`: 713 lines → ~200 lines (cross-cutting only)
- `src/features/dashboard/components/`: reorganized into sub-directories by domain

---

## Full File Analysis Reference

### Files > 500 Lines (priority order)

| Lines | File | Action |
|-------|------|--------|
| 4,134 | `features/dashboard/components/TourForm.tsx` | Split into 6 builders (Task 4) |
| 1,779 | `features/tours/components/TourDetailPage.tsx` | Extract shared sub-components (Task 3) |
| 1,569 | `features/dashboard/components/TourInstanceDetailPage.tsx` | Extract StatusBadge + ItineraryEditor (Task 6) |
| 1,392 | `features/tours/components/TourInstancePublicDetailPage.tsx` | Extract shared sub-components (Task 3) |
| 1,380 | `features/dashboard/components/TourDetailPage.tsx` | Split into tabs (Task 5) |
| 1,268 | `features/dashboard/components/CreateTourInstancePage.tsx` | Extract InstanceDetailsBuilder (Task 6) |
| 979 | `features/shared/components/LandingHeader.tsx` | Extract MobileSidebar (Task 7) |
| 799 | `features/dashboard/components/TourListPage.tsx` | Move to `tour/` directory (Task 6) |
| 757 | `features/dashboard/components/TourRequestListPage.tsx` | Move to `tour-request/` directory (Task 6) |
| 713 | `types/index.ts` | Split into domain files (Task 8) |
| 661 | `features/dashboard/components/TourRequestDetailPage.tsx` | Move to `tour-request/` directory (Task 6) |
| 658 | `api/services/tourCreatePayload.ts` | Keep as-is (legitimately complex) |
| 645 | `features/shared/components/AuthModal.tsx` | Keep as-is (well-structured) |
| 634 | `constant/appex-chart.ts` | Keep as-is (config file) |
| 589 | `features/dashboard/components/SiteContentManagementPage.tsx` | Keep as-is (already standalone) |
| 578 | `features/dashboard/components/TourInstanceListPage.tsx` | Move to `tour-instance/` (Task 6) |
| 567 | `features/tours/components/TourDiscoveryPage.tsx` | Keep as-is |
| 523 | `features/dashboard/components/InsurancePage.tsx` | Move to `customers/` (Task 6) |
| 512 | `features/dashboard/components/CustomersPage.tsx` | Move to `customers/` (Task 6) |
| 505 | `features/checkout/components/CheckoutPage.tsx` | Keep as-is (reasonably split) |

### Duplicate Patterns (consolidation priority)

**StatusBadge** — 8+ local definitions across: TourListPage, TourInstanceListPage, TourInstanceDetailPage, TourRequestListPage, TourRequestDetailPage, InsurancePage, CustomersPage, PaymentsPage, VisaApplicationsPage, TourInstancePublicDetailPage, my-requests/page.tsx

**StatCard** — 7 local definitions across: TourListPage, TourInstanceListPage, TourRequestListPage, InsurancePage, CustomersPage, PaymentsPage, + canonical StatCard.tsx

**ImageLightbox** — 2 local definitions in TourDetailPage (user) and TourInstancePublicDetailPage

**GuestRow** — 2 local definitions in TourDetailPage (user) and TourInstancePublicDetailPage

**useScrollReveal** — 2 local definitions in TourDetailPage (user) and TourInstancePublicDetailPage

**ManagerShell + AdminShell** — nearly identical ~20-line wrappers

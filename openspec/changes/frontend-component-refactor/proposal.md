# Frontend Component Refactor — Proposal

## Why

The Pathora frontend codebase has accumulated severe structural debt: one component file exceeds 4,000 lines, the same UI patterns are duplicated 7-8 times across files, and the `dashboard/components/` directory is a flat 56-file sprawl with no logical grouping. This makes the codebase slow to navigate, risky to modify, and difficult to onboard new developers. A targeted refactor is needed before this debt compounds further.

## What Changes

- **Split `TourForm.tsx`** (4,134 lines) into 7 focused sub-components: `TourClassificationsBuilder`, `TourItineraryBuilder`, `TourAccommodationBuilder`, `TourPricingRulesSection`, `DynamicPricingSection`, `ImageGallery`, plus a reduced shell (~500 lines).
- **Consolidate `StatusBadge`** — 8+ local definitions across list pages → 1 shared component in `src/components/ui/`.
- **Consolidate `StatCard`** — canonical `StatCard.tsx` (72 lines) moves to `src/components/ui/`; 6 duplicate local definitions updated to import from shared.
- **Extract shared tour sub-components** — `ImageLightbox`, `GuestRow`, `CapacityBar`, `PricingTierCard`, `ScheduledDeparturesSection`, `ItineraryDayCard`, `ActivityItem`, `ReviewsSection`, `useScrollReveal` hook. Shared between user-facing and admin tour detail pages.
- **Split admin `TourDetailPage.tsx`** (1,380 lines) into 7 tab files under `tabs/`: `OverviewTab`, `ItineraryTab`, `AccommodationsTab`, `LocationsTab`, `TransportationTab`, `InsuranceTab`, `OtherServicesTab`.
- **Reorganize `dashboard/components/`** into sub-directories by sub-domain: `tour/`, `tour-instance/`, `tour-request/`, `policies/`, `customers/`, `payments/`, `settings/`. Use barrel exports (`index.ts`) to avoid breaking import paths.
- **Extract `MobileSidebar`** from `LandingHeader.tsx` (979 lines → ~500 lines).
- **Merge `ManagerShell` + `AdminShell`** — nearly identical 20-line wrappers → single `AdminShell` component.
- **Split `types/index.ts`** (713 lines) into domain-specific files: `types/domain/tour.ts`, `types/domain/booking.ts`, `types/domain/policy.ts`.

**No new features, no breaking API changes, no behavior changes.** This is purely a maintainability refactor.

## Capabilities

### New Capabilities

- `shared-ui-components`: Reusable UI primitives (`StatusBadge`, `StatCard`) shared across the dashboard domain, eliminating copy-paste duplication.
- `dashboard-component-split`: Pattern for splitting oversized feature components into focused sub-components, enabling maintainability at scale.

### Modified Capabilities

*(none — no spec-level behavior changes; purely structural refactoring)*

## Impact

**Frontend only** — `pathora/frontend/src/`.

| Area | Impact |
|------|--------|
| `features/dashboard/components/` | Reorganized into sub-dirs; 50+ import paths updated |
| `features/tours/components/` | Sub-components extracted to `features/shared/components/` |
| `features/shared/components/` | 8 new shared components created |
| `src/components/ui/` | 2 new shared components (`StatusBadge`, `StatCard`) |
| `src/hooks/` | 1 new hook (`useScrollReveal`) |
| `src/types/` | Split into `domain/` sub-directory |
| `(dashboard)/`, `(admin)/`, `(user)/` route groups | Import paths updated to follow new directory layout |

No API endpoints, database schema, or authentication changes. Build and lint must pass after each task. Manual smoke testing recommended after each chunk.

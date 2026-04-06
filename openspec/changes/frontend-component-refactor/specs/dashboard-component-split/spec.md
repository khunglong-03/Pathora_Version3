# Dashboard Component Split

## ADDED Requirements

### Requirement: TourForm is split into focused sub-components

The system SHALL split `TourForm.tsx` (4,134 lines) into focused sub-components, reducing the main file to approximately 500 lines.

#### Scenario: TourForm main shell contains only orchestration logic
- **WHEN** `TourForm.tsx` is opened
- **THEN** it contains form state management, tab definitions, submission logic, and imports of sub-components
- **AND** it does NOT contain inline definitions of classification builder, itinerary builder, accommodation builder, pricing rules section, dynamic pricing section, or image gallery

#### Scenario: TourClassificationsBuilder handles classification array
- **WHEN** the "Classifications" tab is active in `TourForm`
- **THEN** `TourClassificationsBuilder` renders and manages the classification array with nested pricing tiers
- **AND** it receives `classifications` and `onChange` props from the parent

#### Scenario: TourItineraryBuilder handles day-by-day itinerary
- **WHEN** the "Itinerary" tab is active in `TourForm`
- **THEN** `TourItineraryBuilder` renders and manages the day-by-day itinerary editor
- **AND** it receives `itinerary` and `onChange` props from the parent

### Requirement: Admin TourDetailPage is split into tab components

The system SHALL split `TourDetailPage.tsx` (1,380 lines) into 7 tab components, reducing the main file to approximately 300 lines.

#### Scenario: TourDetailPage shell orchestrates tabs
- **WHEN** `TourDetailPage.tsx` (admin) is opened
- **THEN** it contains tab navigation, data fetching, and imports of tab content components
- **AND** it does NOT contain inline tab content definitions (OverviewTab, ItineraryTab, AccommodationsTab, LocationsTab, TransportationTab, InsuranceTab, OtherServicesTab)

#### Scenario: Tab components are in `tour/tabs/` directory
- **WHEN** `OverviewTab.tsx` is imported in `TourDetailPage`
- **THEN** it is located at `features/dashboard/components/tour/tabs/OverviewTab.tsx`
- **AND** it receives tour data and callbacks as props from the parent

### Requirement: Shared tour sub-components are extracted

The system SHALL extract duplicated sub-components from tour detail pages into `src/features/shared/components/`.

#### Scenario: ImageLightbox is shared between user-facing and admin pages
- **WHEN** `TourDetailPage.tsx` (user-facing) renders an image gallery
- **AND** `TourInstancePublicDetailPage.tsx` renders an image gallery
- **THEN** both use `ImageLightbox` from `@/features/shared/components/ImageLightbox`
- **AND** the component supports full-screen lightbox with navigation

#### Scenario: GuestRow is shared between tour detail pages
- **WHEN** guest information is displayed on `TourDetailPage.tsx` (user-facing)
- **AND** guest information is displayed on `TourInstancePublicDetailPage.tsx`
- **THEN** both use `GuestRow` from `@/features/shared/components/GuestRow`

#### Scenario: useScrollReveal is a shared hook
- **WHEN** scroll-reveal animation is needed on any page
- **THEN** `useScrollReveal` from `@/hooks/useScrollReveal` is used
- **AND** it provides `ref` and `isVisible` state for intersection observer

### Requirement: Dashboard components directory is reorganized

The system SHALL reorganize `features/dashboard/components/` into sub-directories that mirror the navigation structure.

#### Scenario: Barrel exports maintain import compatibility
- **WHEN** a component imports `from "@/features/dashboard/components/TourListPage"`
- **AND** `TourListPage.tsx` has been moved to `tour/TourListPage.tsx`
- **THEN** `tour/index.ts` re-exports `TourListPage`, making the old import path still valid
- **AND** `components/index.ts` re-exports from `tour`, creating a second valid path

#### Scenario: Components are grouped by sub-domain
- **WHEN** files are inspected in `features/dashboard/components/`
- **THEN** `TourListPage.tsx`, `TourDetailPage.tsx`, `TourForm.tsx` are in `tour/`
- **AND** `TourInstanceListPage.tsx`, `TourInstanceDetailPage.tsx`, `CreateTourInstancePage.tsx` are in `tour-instance/`
- **AND** `TourRequestListPage.tsx`, `TourRequestDetailPage.tsx` are in `tour-request/`
- **AND** `CancellationPolicyForm.tsx`, `DepositPolicyForm.tsx`, etc. are in `policies/`

### Requirement: LandingHeader MobileSidebar is extracted

The system SHALL extract the `MobileSidebar` component from `LandingHeader.tsx`, reducing it from 979 lines to approximately 500 lines.

#### Scenario: MobileSidebar is in shared components
- **WHEN** the mobile menu is opened on a public page
- **THEN** `MobileSidebar` from `@/features/shared/components/MobileSidebar` renders
- **AND** it maintains its existing focus management and accessibility behavior

### Requirement: ManagerShell and AdminShell are merged

The system SHALL merge the nearly identical `ManagerShell.tsx` and `AdminShell.tsx` into a single `AdminShell` component.

#### Scenario: Single AdminShell handles both variants
- **WHEN** `AdminShell` is rendered with `variant="manager"`
- **THEN** it renders with manager-specific navigation items
- **AND** when rendered with `variant="admin"`
- **THEN** it renders with admin-specific navigation items

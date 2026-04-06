## Why

The Tour Discovery page (`/tours`) has a filter UI (sidebar on desktop, drawer on mobile) with classification and category filters, but these filters are stored in local state and never passed to the API. Users can select filters but see no results change. Additionally, the hero search bar on the public home page (`/home`) is a dead UI element with no wired handlers.

## What Changes

- Wire classification and category filter values to `homeService.searchTours()` API call in `TourDiscoveryPage`
- Update `FilterSidebar` and `FilterDrawer` to pass selected filter values up to `TourDiscoveryPage`
- Fix hero search bar on `/home` to navigate to `/tours?destination=X`
- Extend URL param parsing to handle `classification` and `category` for deep-linking and URL restore

## Capabilities

### New Capabilities

- `tour-discovery-filters`: End-to-end filter system that accepts classification and category filters, sends them to the backend API, and returns filtered results
- `home-hero-search`: Functional search bar on the public home page that navigates to the tour discovery page with the destination pre-filled

### Modified Capabilities

- (none)

## Impact

- **Frontend**: `TourDiscoveryPage.tsx`, `SearchBar.tsx`, `FilterSidebar.tsx`, `FilterDrawer.tsx`, `BoldHeroSection.tsx`, `homeService.ts`
- **Backend**: `/api/public/tours/search` supports `classification` and `category` query params (verified + implemented). Changes: `TourEntity.Category` field, `SearchTourVm.CategoryName`, `SearchToursQuery.Category`, `ITourRepository`, `TourRepository.BuildSearchQuery()`, `PublicHomeController`.

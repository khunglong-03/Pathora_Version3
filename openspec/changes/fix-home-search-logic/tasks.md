## 1. Verify Backend API

- [ ] 1.0 Read `homeService.searchTours()` in `src/api/services/homeService.ts` to see what params it constructs for the API call
- [ ] 1.1 Find the backend handler for `/api/public/tours/search` in `panthora_be/` and verify it accepts `classification` and `category` query parameters
- [ ] 1.2 If backend does NOT support these params, file a separate backend task before proceeding with frontend changes

## 2. Wire Filters to API

- [ ] 2.1 Read `FilterSidebar.tsx` to understand current `onFilterChange` prop signature and how it passes values
- [ ] 2.2 Read `FilterDrawer.tsx` to understand current `onFilterChange` prop signature
- [ ] 2.3 Update `TourDiscoveryPage` to pass `selectedClassifications` and `selectedCategories` as `classification` and `category` params to `homeService.searchTours()`
- [ ] 2.4 Update `syncFilters()` to include `classification` and `category` in URL params
- [ ] 2.5 Ensure filter option values use URL-safe slugs (e.g., `vip-luxury` not `VIP/Luxury`) — check existing values in FilterSidebar and FilterDrawer
- [ ] 1.2 Read `FilterSidebar.tsx` to understand current `onFilterChange` prop signature and how it passes values
- [ ] 1.3 Read `FilterDrawer.tsx` to understand current `onFilterChange` prop signature
- [ ] 1.4 Update `TourDiscoveryPage` to pass `selectedClassifications` and `selectedCategories` as `classification` and `category` params to `homeService.searchTours()`
- [ ] 1.5 Update `syncFilters()` to include `classification` and `category` in URL params

## 3. Parse URL Filter Params

- [ ] 3.1 Read `parseTourDiscoveryFilters()` in `src/utils/tourDiscoveryFilters.ts` to understand current parsing
- [ ] 3.2 Add `classification` and `category` fields to `TourDiscoveryFilters` interface
- [ ] 3.3 Update `parseTourDiscoveryFilters()` to extract `classification` and `category` from URL search params (comma-separated strings to arrays)
- [ ] 3.4 Update `syncFilters()` (or equivalent URL builder) to serialize filter arrays back to URL params

## 4. Sync URL State to Filter State

- [ ] 4.1 Update `TourDiscoveryPage` `useEffect` that calls `syncFilters()` to include filter arrays
- [ ] 4.2 On page load from URL with `classification` or `category` params, initialize `selectedClassifications` and `selectedCategories` from URL

## 5. Wire Hero Search Bar

- [ ] 5.1 Read `BoldHeroSection.tsx` to find the search input and button
- [ ] 5.2 Add local state for hero search text
- [ ] 5.3 Wire `onChange` handler to update search text state
- [ ] 5.4 Wire form `onSubmit` and button `onClick` to navigate to `/tours?destination=<text>` using `router.push()`

## 6. Add Tests

- [ ] 6.1 Add unit test: `parseTourDiscoveryFilters()` correctly parses `classification=premium,vip-luxury` into `['premium', 'vip-luxury']` array
- [ ] 6.2 Add unit test: `parseTourDiscoveryFilters()` returns empty arrays when `classification`/`category` params are absent
- [ ] 6.3 Add unit test: filter params with special characters are URL-encoded properly
- [ ] 6.4 Add integration test: select classification filter → API call includes `classification` param → results narrow
- [ ] 6.5 Add integration test: navigate to `/tours?classification=premium` → filter chip pre-selected → results filtered

## 7. Verify End-to-End

- [ ] 7.1 Run `npm run test` in `pathora/frontend/` to confirm all tests pass
- [ ] 7.2 Manual test: select classification + category → URL updates → navigate to URL → filters restored
- [ ] 7.3 Manual test: hero search bar → type "Ha Long Bay" → click Explore → lands on `/tours?destination=Ha+Long+Bay` with results

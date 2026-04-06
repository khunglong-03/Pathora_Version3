## Context

**Current State**: The Tour Discovery page (`/tours`) has a fully functional text search with debounce, URL sync, and pagination. The `FilterSidebar` and `FilterDrawer` components render classification and category filter options. However, the selected filter values are stored in local state (`selectedClassifications[]`, `selectedCategories[]`) and never included in the `homeService.searchTours()` API call.

**Hero Search**: The `BoldHeroSection` on `/home` renders a search input and "Explore" button, but neither has any wired event handler.

**Constraint**: Backend `/api/public/tours/search` may or may not already support `classification` and `category` query params — needs verification. We will pass them regardless; backend returns results unchanged if params are unsupported.

## Goals / Non-Goals

**Goals:**
- Make filter selections actually filter tour results via API
- Wire hero search bar to navigate to `/tours?destination=X`
- Ensure URL reflects all active filters (destination, classification, category, page)
- Maintain existing search behavior (debounce, pagination, view toggle)

**Non-Goals:**
- Modifying backend API (only verifying params work; backend changes are separate)
- Adding new filter types (date, price range, people count are out of scope for now)
- Changing the visual design of filter UI
- Rewriting search state management (keeping local state, just wiring filters)

## Decisions

### Decision 1: Pass filter arrays as comma-separated strings

**Choice**: Pass `selectedClassifications` as `classification=Standard,Premium` and `selectedCategories` as `category=Adventure,Cultural` in the API call. Filter option values use URL-safe slugs (e.g., `vip-luxury` not `VIP/Luxury`) to avoid encoding issues with the `/` character.

**Rationale**: Simpler than creating a new API contract. Backend can split by comma. Using slugs avoids URL-encoding issues with special characters like `/` in "VIP/Luxury".

### Decision 2: Filter values sync to URL params

**Choice**: Sync `classification` and `category` to URL search params alongside `destination` and `page`.

**Rationale**: Enables deep-linking and browser back/forward navigation for filters, matching how destination already works.

### Decision 3: Hero search navigates via router.push

**Choice**: On hero search submit, call `router.push('/tours?destination=' + encodeURIComponent(searchText))`.

**Rationale**: Keeps it simple — the Tour Discovery page already reads `destination` from URL and triggers a search. No new API call needed on `/home`.

### Decision 4: Keep filter state in TourDiscoveryPage

**Choice**: Filter state remains as local React state in `TourDiscoveryPage` (existing `selectedClassifications`, `selectedCategories`). No Redux or Context refactor.

**Rationale**: Minimal change — just wire existing state to the API call. A full state management refactor is out of scope.

## Risks / Trade-offs

- **[Risk] Backend doesn't support classification/category params** → Mitigation: Verify backend endpoint params first. If unsupported, file a separate backend task. Filters will silently do nothing until backend is updated.
- **[Risk] Quick destination chips already call `onSearchSubmit()` directly** → Mitigation: No change needed to this behavior; it's already correct (immediate search).
- **[Trade-off] Filter sync to URL may cause URL to become long** → Acceptable for now; URL length is well within browser limits.
- **[Trade-off] No loading state per filter change** → Current loading state (entire page skeleton) covers this. Acceptable for V1 of filter wiring.

## Open Questions

1. Does `/api/public/tours/search` accept `classification` and `category` query params? Need to verify.
2. Does the backend return filtered counts or just filtered results? (For showing "X tours found" per filter)
3. Should clearing a filter animate/morph the results or hard-replace? (Current behavior is hard-replace, acceptable)

# Landing UI/UX Improvement Checklist

Date: 2026-02-24
Scope: `frontend/src/components/partials/landing/*`

## Designed Tasks

1. Remove misleading non-functional navigation controls.
2. Fix form semantics and keyboard accessibility in auth flows.
3. Improve touch target sizes for critical interactive controls.
4. Improve slider indicator semantics for reviews.
5. Improve baseline image optimization on key landing surfaces.

## Implementation Status

- [x] Removed non-functional `NavArrows` in destination sections.
- [x] Added semantic `label`/`input` linkage in auth modal fields (`htmlFor` + `id`).
- [x] Replaced clickable backdrop `div` with semantic `button` in modal + mobile drawer.
- [x] Added focus trap for auth modal and mobile sidebar drawer.
- [x] Increased touch target sizes in calendar navigation/day selection and review indicators.
- [x] Reworked review slide indicators to semantic button controls with active state.
- [x] Added `aria-expanded`/`aria-haspopup` to custom select triggers in hero search.
- [x] Migrated key images in updated files to `next/image` (`HeroSection`, `LandingHeader`, `AuthModal`, `FeaturedTripsSection`).

## Remaining (Next Pass)

- [ ] Migrate remaining landing images to `next/image` (`DestinationsSection`, `ReviewsSection`, `LatestToursSection`, `StatsSection`, `BottomSections`, `LandingFooter`).
- [ ] Run full landing interaction QA on mobile widths (375/768) and desktop (1024/1440).

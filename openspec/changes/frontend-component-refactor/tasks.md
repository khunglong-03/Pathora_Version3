# Frontend Component Refactor — Tasks

## 1. Shared UI: StatusBadge

- [x] 1.1 Read existing `StatusBadge` definitions from: `TourListPage.tsx` (lines 76-113), `TourInstanceListPage.tsx`, `TourRequestListPage.tsx`, `TourInstanceDetailPage.tsx`, `InsurancePage.tsx`, `CustomersPage.tsx`, `PaymentsPage.tsx`, `VisaApplicationsPage.tsx`. Document each status value and its color tokens.

- [x] 1.2 Read existing `VisaStatusBadge` at `src/components/ui/VisaStatusBadge.tsx` to understand domain-specific badge patterns.

- [x] 1.3 Create `src/components/ui/StatusBadge.tsx` — generic component with `{ bg, text, dot, children }` props.

- [x] 1.4 Create domain-specific helpers: `getTourStatusProps()`, `getPaymentStatusProps()`, `getVisaStatusProps()`, `getBookingStatusProps()`. Each returns `{ bg, text, dot, label }`.

- [x] 1.5 Update `src/components/ui/index.ts` barrel export to include `StatusBadge`.

- [x] 1.6 Replace local `StatusBadge` in `TourListPage.tsx` with import from shared. Verify lint passes.

- [x] 1.7 Replace local `StatusBadge` in `TourInstanceListPage.tsx`, `TourRequestListPage.tsx`, `TourRequestDetailPage.tsx`, `TourInstanceDetailPage.tsx`. Verify lint after each.

- [x] 1.8 Replace local `StatusBadge` in `InsurancePage.tsx`, `CustomersPage.tsx`, `PaymentsPage.tsx`. Verify lint after each.

- [x] 1.9 Replace local `StatusBadge` in `VisaApplicationsPage.tsx` (may use `getVisaStatusProps`).

- [x] 1.10 Update `TourInstancePublicDetailPage.tsx` (user-facing) — extract its `StatusBadge` to shared if applicable.

- [x] 1.11 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

## 2. Shared UI: StatCard

- [x] 2.1 Read canonical `StatCard.tsx` (72 lines) at `src/features/dashboard/components/StatCard.tsx`.

- [x] 2.2 Read local `StatCard` in `TourListPage.tsx` (lines 37-70) and `TourInstanceListPage.tsx` (lines 34-69). Confirm they have different interfaces.

- [x] 2.3 Move canonical `StatCard.tsx` to `src/components/ui/StatCard.tsx`. Update internal imports.

- [x] 2.4 Update `src/components/ui/index.ts` barrel export to include `StatCard`.

- [x] 2.5 Update `DashboardStats.tsx` import path to `@/components/ui/StatCard`. (Kept barrel re-export for backward compatibility)

- [x] 2.6 Extract local `StatCard` from `TourListPage.tsx` into `src/features/dashboard/components/shared/StatCardAnimation.tsx` (preserve motion.div animation pattern — this is a variant, not duplication).

- [x] 2.7 Update `TourListPage.tsx` to import from shared variant.

- [x] 2.8 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

## 3. Shared Tour Sub-Components

- [x] 3.1 Extract `useScrollReveal` from `TourDetailPage.tsx` (user-facing) — move to `src/features/shared/components/useScrollReveal.ts`.

- [x] 3.2 Create `src/features/shared/components/ImageLightbox.tsx` — read both existing implementations (`TourDetailPage.tsx` user-facing, `TourInstancePublicDetailPage.tsx`), use the more complete version.

- [x] 3.3 Create `src/features/shared/components/GuestRow.tsx` — read both implementations, use the more complete version.

- [x] 3.4 Create `src/features/shared/components/CapacityBar.tsx` — extract from `TourInstancePublicDetailPage.tsx`.

- [x] 3.5 Create `src/features/shared/components/PricingTierCard.tsx` — extract from `TourInstancePublicDetailPage.tsx`.

- [x] 3.6 Create `src/features/shared/components/ScheduledDeparturesSection.tsx` — extract from `TourDetailPage.tsx` (user-facing).

- [x] 3.7 Create `src/features/shared/components/ItineraryDayCard.tsx` — extract from `TourDetailPage.tsx` (user-facing).

- [x] 3.8 Create `src/features/shared/components/ActivityItem.tsx` — extract from `TourDetailPage.tsx` (user-facing).

- [x] 3.9 Consolidate `ReviewsSection` — compare local `ReviewsSection` in `TourDetailPage.tsx` (user-facing, ~300 lines) with `src/features/home/components/ReviewsSection.tsx`. Extract the more complete version to `src/features/shared/components/ReviewsSection.tsx`. Update both consumers.

- [x] 3.10 Update `src/features/shared/components/index.ts` barrel export for all new shared components.

- [x] 3.11 Update `TourDetailPage.tsx` (user-facing, 1,779 lines) — remove all extracted sub-component definitions, replace with imports from shared.

- [x] 3.12 Update `TourInstancePublicDetailPage.tsx` (1,392 lines) — remove all extracted sub-component definitions, replace with imports from shared.

- [x] 3.13 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

## 4. TourForm Split (4,134 lines → ~500 lines)

- [ ] 4.1 Read `TourForm.tsx` — identify exact line ranges for each sub-component: `TourClassificationsBuilder` (~300 lines), `TourItineraryBuilder` (~600 lines), `TourAccommodationBuilder` (~300 lines), `TourPricingRulesSection` (~400 lines), `DynamicPricingSection` (~300 lines), `ImageGallery` (~300 lines).

- [ ] 4.2 Create `src/features/dashboard/components/tour/` directory.

- [ ] 4.3 Create `src/features/dashboard/components/tour/builders/` directory.

- [ ] 4.4 Extract `TourClassificationsBuilder.tsx` — define props interface: `{ classifications, onChange }`. Copy code, update imports.

- [ ] 4.5 Extract `TourItineraryBuilder.tsx` — define props interface: `{ itinerary, onChange }`. Copy code, update imports.

- [ ] 4.6 Extract `TourAccommodationBuilder.tsx` — define props interface: `{ accommodations, onChange }`. Copy code, update imports.

- [ ] 4.7 Extract `TourPricingRulesSection.tsx` — define props interface: `{ pricingRules, onChange }`. Copy code, update imports.

- [ ] 4.8 Extract `DynamicPricingSection.tsx` — define props interface: `{ dynamicPricing, onChange }`. Copy code, update imports.

- [ ] 4.9 Extract `ImageGallery.tsx` — define props interface: `{ images, onChange }`. Copy code, update imports.

- [ ] 4.10 Create `src/features/dashboard/components/tour/builders/index.ts` barrel export.

- [ ] 4.11 Rewrite `TourForm.tsx` shell — remove all extracted code, replace with imports from `./builders/`. Verify the shell is ~500 lines.

- [ ] 4.12 Move `TourForm.tsx` to `src/features/dashboard/components/tour/TourForm.tsx`. Update import in `TourListPage.tsx`.

- [ ] 4.13 Create `src/features/dashboard/components/tour/index.ts` barrel export: `export * from "./TourListPage"; export * from "./TourDetailPage"; export * from "./TourForm";`.

- [ ] 4.14 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

## 5. Admin TourDetailPage Split (1,380 lines → ~300 lines)

- [ ] 5.1 Read `TourDetailPage.tsx` (admin) — identify each tab's line range: `OverviewTab`, `ItineraryTab`, `AccommodationsTab`, `LocationsTab`, `TransportationTab`, `InsuranceTab`, `OtherServicesTab`, `StatusDropdown`.

- [ ] 5.2 Create `src/features/dashboard/components/tour/tabs/` directory.

- [ ] 5.3 Extract `OverviewTab.tsx` — define props interface. Copy code, update imports.

- [ ] 5.4 Extract `ItineraryTab.tsx` — define props interface. Copy code, update imports.

- [ ] 5.5 Extract `AccommodationsTab.tsx` — define props interface. Copy code, update imports.

- [ ] 5.6 Extract `LocationsTab.tsx` — define props interface. Copy code, update imports.

- [ ] 5.7 Extract `TransportationTab.tsx` — define props interface. Copy code, update imports.

- [ ] 5.8 Extract `InsuranceTab.tsx` — define props interface. Copy code, update imports.

- [ ] 5.9 Extract `OtherServicesTab.tsx` — define props interface. Copy code, update imports.

- [ ] 5.10 Extract `StatusDropdown.tsx` — define props interface. Copy code, update imports.

- [ ] 5.11 Create `src/features/dashboard/components/tour/tabs/index.ts` barrel export.

- [ ] 5.12 Rewrite `TourDetailPage.tsx` (admin) shell — remove all tab content, replace with imports from `./tabs/`. Verify the shell is ~300 lines.

- [ ] 5.13 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

## 6. Tour Instance Components

- [ ] 6.1 Read `TourInstanceDetailPage.tsx` (1,569 lines) — identify `StatusBadge` and inline itinerary editing sections.

- [ ] 6.2 Extract `StatusBadge` from `TourInstanceDetailPage.tsx` — replace with shared `StatusBadge` (from Task 1.7).

- [ ] 6.3 Extract `ItineraryDayEditor.tsx` — identify the inline itinerary day editing code, create focused component.

- [ ] 6.4 Read `CreateTourInstancePage.tsx` (1,268 lines) — identify the large form with collapsible sections.

- [ ] 6.5 Create `src/features/dashboard/components/tour-instance/builders/` directory.

- [ ] 6.6 Extract `InstanceDetailsBuilder.tsx` from `CreateTourInstancePage.tsx` — collapsible sections: Basic Info, Schedule & Pricing, Guide Assignment, Optional Services, Media, Itinerary Preview.

- [ ] 6.7 Rewrite `CreateTourInstancePage.tsx` shell — remove extracted code, replace with imports. Verify ~400 lines.

- [ ] 6.8 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

## 7. Dashboard Directory Reorganization

- [ ] 7.1 Create sub-directories under `src/features/dashboard/components/`: `tour-instance/`, `tour-request/`, `policies/`, `customers/`, `payments/`, `settings/`.

- [ ] 7.2 Move `TourInstanceListPage.tsx` and `CreateTourInstancePage.tsx` to `tour-instance/`. Create `tour-instance/index.ts` barrel export.

- [ ] 7.3 Move `TourInstanceDetailPage.tsx` to `tour-instance/`. Update barrel export.

- [ ] 7.4 Move `TourRequestListPage.tsx` and `TourRequestDetailPage.tsx` to `tour-request/`. Create `tour-request/index.ts` barrel export.

- [ ] 7.5 Move policy form and list components (`CancellationPolicyForm`, `DepositPolicyForm`, `PricingPolicyForm`, `VisaPolicyForm`, `TaxConfigForm`, `TaxConfigList`) to `policies/`. Create `policies/index.ts` barrel export.

- [ ] 7.6 Move `CustomersPage.tsx` and `InsurancePage.tsx` to `customers/`. Create `customers/index.ts` barrel export.

- [ ] 7.7 Move `PaymentsPage.tsx` and `VisaApplicationsPage.tsx` to `payments/`. Create `payments/index.ts` barrel export.

- [ ] 7.8 Create `src/features/dashboard/components/shared/` directory — move `StatCardAnimation.tsx` (from Task 2.6) here. Create `shared/index.ts` barrel export.

- [ ] 7.9 Update `src/features/dashboard/components/index.ts` barrel export to include all sub-directory exports.

- [ ] 7.10 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

## 8. LandingHeader and Shell Cleanup

- [ ] 8.1 Read `LandingHeader.tsx` (979 lines) — identify `MobileSidebar` sub-component boundaries.

- [ ] 8.2 Extract `MobileSidebar.tsx` from `LandingHeader.tsx`. Create at `src/features/shared/components/MobileSidebar.tsx`.

- [ ] 8.3 Rewrite `LandingHeader.tsx` shell — remove MobileSidebar, import from shared. Verify ~500 lines.

- [ ] 8.4 Read `ManagerShell.tsx` (23 lines) and `AdminShell.tsx` (24 lines). Confirm they differ only by `variant` prop.

- [ ] 8.5 Merge into single `AdminShell.tsx` at `src/features/dashboard/components/AdminShell.tsx` — accepts `variant: "manager" | "admin"` prop.

- [ ] 8.6 Update `src/app/(dashboard)/ManagerShell.tsx` — re-export from new `AdminShell` location, pass `variant="manager"`.

- [ ] 8.7 Update `src/app/admin/AdminShell.tsx` — re-export from new `AdminShell` location, pass `variant="admin"`.

- [ ] 8.8 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

## 9. Type File Cleanup (Optional — Skip If Risky)

- [ ] 9.1 Read `src/types/index.ts` (713 lines) — categorize each type export by domain: tour types, booking types, policy types, generic cross-cutting types.

- [ ] 9.2 Create `src/types/domain/` directory.

- [ ] 9.3 Create `src/types/domain/tour.ts` — move tour-specific types from `index.ts`.

- [ ] 9.4 Create `src/types/domain/booking.ts` — move booking-specific types from `index.ts`.

- [ ] 9.5 Create `src/types/domain/policy.ts` — move policy types (cancellation, deposit, pricing, visa, tax) from `index.ts`.

- [ ] 9.6 Rewrite `index.ts` — keep only cross-cutting generic types (API response shapes, pagination, etc.). Re-export from domain files for backward compatibility during transition.

- [ ] 9.7 Update import paths in affected files (use grep to find: `grep -r "from.*types/index" pathora/frontend/src --include="*.tsx" --include="*.ts"`).

- [ ] 9.8 Run `npm --prefix "pathora/frontend" run lint` and `npm --prefix "pathora/frontend" run build`. All must pass.

- [ ] 9.9 **SKIP this task if Task 9.6-9.8 prove too many import updates.** Document the decision in a comment at the top of `types/index.ts`: "This file is pending domain split. See tasks.md Task 9."

## 10. Cleanup and Verification

- [ ] 10.1 Delete the precursor plan file: `docs/superpowers/plans/2026-04-04-frontend-component-refactor.md`.

- [ ] 10.2 Run full `npm --prefix "pathora/frontend" run lint` — zero errors.

- [ ] 10.3 Run full `npm --prefix "pathora/frontend" run build` — successful production build.

- [ ] 10.4 Manual smoke test: open `http://localhost:3003/tour-management` — verify Tour List, Create, Edit all work.

- [ ] 10.5 Manual smoke test: open `http://localhost:3003` — verify home page, navigation, mobile menu work.

- [ ] 10.6 Manual smoke test: open admin dashboard pages — verify sidebar navigation, stats, all list/detail pages work.

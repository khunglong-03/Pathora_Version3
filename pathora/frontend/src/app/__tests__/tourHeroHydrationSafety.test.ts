import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour hero hydration safety", () => {
  it("keeps breadcrumb labels deterministic before mount", () => {
    const source = readFile("src/features/tours/components/HeroSection.tsx");

    expect(source.includes("useSyncExternalStore")).toBe(true);
    expect(
      source.includes('const mounted = useSyncExternalStore('),
    ).toBe(true);
    expect(
      source.includes('safeT("landing.nav.home", "Home")'),
    ).toBe(true);
    expect(
      source.includes(
        'safeT("landing.tourDiscovery.packageTours", "Package Tours")',
      ),
    ).toBe(true);
  });

  it("suppresses hydration warning on decorative compass svg", () => {
    const source = readFile("src/features/tours/components/HeroSection.tsx");

    expect(source.includes("<svg suppressHydrationWarning")).toBe(true);
  });

  it("keeps tours discovery labels deterministic before mount", () => {
    const searchBar = readFile("src/features/tours/components/SearchBar.tsx");
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");
    const sidebar = readFile("src/features/tours/components/FilterSidebar.tsx");
    const customizeBanner = readFile("src/features/tours/components/CustomizeBanner.tsx");

    expect(searchBar.includes("useSyncExternalStore")).toBe(true);
    expect(
      searchBar.includes(
        'placeholder={safeT("landing.tourDiscovery.searchFullPlaceholder", "Search tours, destinations, activities...")}',
      ),
    ).toBe(true);
    expect(
      searchBar.includes('safeT("landing.tourDiscovery.filtersLabel", "Filters")'),
    ).toBe(true);

    expect(
      discovery.includes('safeT("landing.tourDiscovery.toursFound", "tours found")'),
    ).toBe(true);
    expect(
      sidebar.includes('safeT("landing.tourDiscovery.filter", "Filter")'),
    ).toBe(true);
    expect(
      customizeBanner.includes(
        'safeT("landing.tourDiscovery.customizeYourTour", "Customize Your Tour")',
      ),
    ).toBe(true);
  });
});

import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour discovery filter integration (Groups 6.4 & 6.5)", () => {
  it("passes classification to searchTours API call", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/searchTours\s*\(\s*\{[^}]*classification\s*:/);
    expect(discovery).toMatch(/classification:\s*selectedClassifications\.length\s*>\s*0\s*\?\s*selectedClassifications\.join\(","\)/);
  });

  it("passes instanceType to getAvailablePublicInstances for departure catalog", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/getAvailablePublicInstances\s*\(/);
    expect(discovery).toMatch(/filters\.instanceType\s*===\s*["']private["']\s*\?\s*["']private["']\s*:\s*undefined/);
  });

  it("selectedClassifications state is initialized from URL on mount", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/filters\.classifications/);
    expect(discovery).toMatch(/selectedClassifications.*useState/);
  });

  it("URL-derived filters include instanceType via parseTourDiscoveryFilters", () => {
    const filters = readFile("src/utils/tourDiscoveryFilters.ts");
    expect(filters).toMatch(/instanceType/);
    expect(filters).toMatch(/parseTourDiscoveryFilters/);
  });

  it("syncs filter state changes to URL", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?syncFilters/);
    expect(discovery).toMatch(/prevFiltersRef/);
    expect(discovery).toMatch(/JSON\.stringify\s*\(\s*\{\s*selectedClassifications\s*\}\s*\)/);
  });

  it("syncFilters builds URL with classifications via buildTourDiscoverySearchParams", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/buildTourDiscoverySearchParams/);
    expect(discovery).toMatch(/classifications:\s*selectedClassifications/);
  });

  it("parseTourDiscoveryFilters extracts classification from URL params", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");
    expect(discovery).toMatch(/parseTourDiscoveryFilters/);
  });

  it("filters effect depends on selectedClassifications to refetch tours", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    const afterFetchTours = discovery.indexOf("const fetchTours");
    expect(afterFetchTours).toBeGreaterThan(0);

    const afterFetchToursContent = discovery.substring(afterFetchTours);
    expect(afterFetchToursContent).toContain("selectedClassifications");
  });

  it("FilterSidebar receives classification and catalog departure-type props", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/selectedClassifications=\{selectedClassifications/);
    expect(discovery).toMatch(/onClassificationToggle=\{handleClassificationToggle/);
    expect(discovery).toMatch(/catalogInstanceType=\{filters\.instanceType\}/);
    expect(discovery).toMatch(/onCatalogInstanceTypeChange=\{handleCatalogInstanceTypeChange/);
  });

  it("FilterDrawer receives classification and catalog departure-type props", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/selectedClassifications=\{selectedClassifications/);
    expect(discovery).toMatch(/catalogInstanceType=\{filters\.instanceType\}/);
  });

  it("handleClearFilters resets selectedClassifications and clears private catalog filter in URL", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/setSelectedClassifications\s*\(\s*\[\s*\]\s*\)/);
    expect(discovery).toMatch(/syncFilters\s*\(\s*\{\s*instanceType:\s*null/);
  });

  it("SearchBar supports search submission that updates URL destination", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    expect(discovery).toMatch(/handleSearchSubmit[\s\S]*?syncFilters\s*\(\s*\{[\s\S]*?destination:\s*searchText/);
  });

  it("quick destination chips click submits search immediately", () => {
    const searchBar = readFile("src/features/tours/components/SearchBar.tsx");

    expect(searchBar).toMatch(/handleChipClick[\s\S]*?onSearchChange[\s\S]*?onSearchSubmit/);
  });

  it("homeService.searchTours accepts classification param", () => {
    const service = readFile("src/api/services/homeService.ts");
    expect(service).toMatch(/classification\?:\s*string/);
  });

  it("homeService.getAvailablePublicInstances accepts instanceType param", () => {
    const service = readFile("src/api/services/homeService.ts");
    expect(service).toMatch(/instanceType\?:\s*string\s*\|\s*null/);
    expect(service).toMatch(/params\.append\s*\(\s*["']instanceType["']/);
  });

  it("SEARCH_TOURS endpoint builder includes category param", () => {
    const endpoints = readFile("src/api/endpoints/auth.ts");
    expect(endpoints).toMatch(/url\.append\s*\(\s*["']category["']/);
  });

  it("fetchTours effect depends on filters.instanceType to refetch departures", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    const afterFetchTours = discovery.indexOf("const fetchTours");
    expect(afterFetchTours).toBeGreaterThan(0);

    const afterFetchToursContent = discovery.substring(afterFetchTours);
    expect(afterFetchToursContent).toContain("filters.instanceType");
  });

  it("BoldHeroSection navigates to /tours?destination=<text> on search", () => {
    const boldHero = readFile("src/features/home/components/BoldHeroSection.tsx");

    expect(boldHero).toMatch(/router\.push/);
    expect(boldHero).toMatch(/\/tours\?destination=/);
    expect(boldHero).toMatch(/encodeURIComponent/);
    expect(boldHero).toMatch(/onKeyDown.*Enter.*handleHeroSearch/);
    expect(boldHero).toMatch(/onClick.*handleHeroSearch/);
  });

  it("BoldHeroSection has heroSearchText state for the search input", () => {
    const boldHero = readFile("src/features/home/components/BoldHeroSection.tsx");

    expect(boldHero).toMatch(/heroSearchText/);
    expect(boldHero).toMatch(/value=\{heroSearchText\}/);
    expect(boldHero).toMatch(/onChange.*setHeroSearchText/);
  });
});

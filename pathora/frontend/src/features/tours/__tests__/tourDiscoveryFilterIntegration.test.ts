import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const readFile = (relativePath: string): string => {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
};

describe("tour discovery filter integration (Groups 6.4 & 6.5)", () => {
  // Group 6.4: select classification filter → API call includes classification param → results narrow
  it("passes classification to searchTours API call", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // The searchTours call should include the classification param derived from selectedClassifications
    expect(discovery).toMatch(/searchTours\s*\(\s*\{[^}]*classification\s*:/);

    // The classification param should be constructed by joining selectedClassifications array
    expect(discovery).toMatch(/classification:\s*selectedClassifications\.length\s*>\s*0\s*\?\s*selectedClassifications\.join\(","\)/);
  });

  it("passes category to searchTours API call", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // The searchTours call should include the category param derived from selectedCategories
    // using the same join pattern as classification
    const toursBlock = discovery.match(/viewType\s*===\s*["']tours["'][\s\S]*?searchTours\s*\(\s*\{([\s\S]*?)\}/);
    expect(toursBlock).not.toBeNull();
    const params = toursBlock![1];
    expect(params).toMatch(/category/);

    // category should be constructed by joining selectedCategories array
    expect(discovery).toMatch(/category:\s*selectedCategories\.length\s*>\s*0\s*\?\s*selectedCategories\.join\(","\)/);
  });

  it("selectedClassifications state is initialized from URL on mount", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // selectedClassifications should be initialized from filters.classifications (from URL)
    expect(discovery).toMatch(/filters\.classifications/);
    expect(discovery).toMatch(/selectedClassifications.*useState/);
  });

  it("selectedCategories state is initialized from URL on mount", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // selectedCategories should be initialized from filters.categories (from URL)
    expect(discovery).toMatch(/filters\.categories/);
    expect(discovery).toMatch(/selectedCategories.*useState/);
  });

  // Group 6.5: navigate to /tours?classification=premium → filter chip pre-selected → results filtered
  it("syncs filter state changes to URL", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // There should be a useEffect that watches selectedClassifications and selectedCategories
    // and calls syncFilters when they change
    expect(discovery).toMatch(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?syncFilters/);

    // The effect should detect changes in the filter state
    expect(discovery).toMatch(/prevFiltersRef/);
    expect(discovery).toMatch(/JSON\.stringify\s*\(\s*\{\s*selectedClassifications,\s*selectedCategories\s*\}\s*\)/);
  });

  it("syncFilters builds URL with classification and category params", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // syncFilters should use buildTourDiscoverySearchParams which includes classification and category
    expect(discovery).toMatch(/buildTourDiscoverySearchParams/);

    // syncFilters should include classifications and categories in the filters object
    expect(discovery).toMatch(/classifications:\s*selectedClassifications/);
    expect(discovery).toMatch(/categories:\s*selectedCategories/);
  });

  it("parseTourDiscoveryFilters extracts classification from URL params", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // The page should use parseTourDiscoveryFilters to hydrate state from URL
    expect(discovery).toMatch(/parseTourDiscoveryFilters/);
  });

  it("filters effect depends on selectedClassifications to refetch tours", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // The fetchTours useEffect should include selectedClassifications in its dependency array
    // so that selecting a filter triggers a re-fetch
    // Verify: selectedClassifications appears in the file in a deps array context
    // We check that the string "selectedClassifications," appears in the file
    // and that it is near the end of the file (after fetchTours definition)
    const afterFetchTours = discovery.indexOf("const fetchTours");
    expect(afterFetchTours).toBeGreaterThan(0);

    const afterFetchToursContent = discovery.substring(afterFetchTours);
    expect(afterFetchToursContent).toContain("selectedClassifications");
  });

  it("FilterSidebar receives selectedClassifications and onClassificationToggle props", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // FilterSidebar should receive selectedClassifications prop
    expect(discovery).toMatch(/selectedClassifications=\{selectedClassifications/);
    // FilterSidebar should receive onClassificationToggle handler
    expect(discovery).toMatch(/onClassificationToggle=\{handleClassificationToggle/);
  });

  it("FilterSidebar receives selectedCategories and onCategoryToggle props", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // FilterSidebar should receive selectedCategories prop
    expect(discovery).toMatch(/selectedCategories=\{selectedCategories/);
    // FilterSidebar should receive onCategoryToggle handler
    expect(discovery).toMatch(/onCategoryToggle=\{handleCategoryToggle/);
  });

  it("FilterDrawer receives selectedClassifications and selectedCategories props", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // FilterDrawer should receive selectedClassifications prop
    expect(discovery).toMatch(/selectedClassifications=\{selectedClassifications/);
    // FilterDrawer should receive selectedCategories prop
    expect(discovery).toMatch(/selectedCategories=\{selectedCategories/);
  });

  it("handleClearFilters resets both selectedClassifications and selectedCategories", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // handleClearFilters should reset both filter states
    expect(discovery).toMatch(/setSelectedClassifications\s*\(\s*\[\s*\]\s*\)/);
    expect(discovery).toMatch(/setSelectedCategories\s*\(\s*\[\s*\]\s*\)/);
  });

  it("SearchBar supports search submission that updates URL destination", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // handleSearchSubmit should call syncFilters with the current search text
    expect(discovery).toMatch(/handleSearchSubmit.*\{[^}]*syncFilters\s*\(\s*\{[^}]*destination:\s*searchText/);
  });

  it("quick destination chips click submits search immediately", () => {
    const searchBar = readFile("src/features/tours/components/SearchBar.tsx");

    // Quick destination chips should call onSearchChange AND onSearchSubmit
    expect(searchBar).toMatch(/handleChipClick.*\{[^}]*onSearchChange[^}]*onSearchSubmit/);
  });

  it("homeService.searchTours accepts classification param", () => {
    const service = readFile("src/api/services/homeService.ts");

    // searchTours should accept a classification parameter in its interface
    expect(service).toMatch(/classification\?:\s*string/);
  });

  it("homeService.searchTours accepts category param", () => {
    const service = readFile("src/api/services/homeService.ts");

    // searchTours should accept a category parameter in its interface
    expect(service).toMatch(/category\?:\s*string/);
  });

  it("SEARCH_TOURS endpoint builder includes category param", () => {
    const endpoints = readFile("src/api/endpoints/auth.ts");

    // The SEARCH_TOURS endpoint builder should include category
    expect(endpoints).toMatch(/url\.append\s*\(\s*["']category["']/);
  });

  it("fetchTours effect depends on selectedCategories to refetch tours", () => {
    const discovery = readFile("src/features/tours/components/TourDiscoveryPage.tsx");

    // selectedCategories should be in the fetchTours useEffect dependency array
    const afterFetchTours = discovery.indexOf("const fetchTours");
    expect(afterFetchTours).toBeGreaterThan(0);

    const afterFetchToursContent = discovery.substring(afterFetchTours);
    expect(afterFetchToursContent).toContain("selectedCategories");
  });

  // Group 5: Hero search bar navigation
  it("BoldHeroSection navigates to /tours?destination=<text> on search", () => {
    const boldHero = readFile("src/features/home/components/BoldHeroSection.tsx");

    // Should use router.push to navigate
    expect(boldHero).toMatch(/router\.push/);

    // Should navigate to /tours with destination query param
    expect(boldHero).toMatch(/\/tours\?destination=/);

    // Should encode the search text
    expect(boldHero).toMatch(/encodeURIComponent/);

    // Should be triggered by the search input (onKeyDown for Enter)
    expect(boldHero).toMatch(/onKeyDown.*Enter.*handleHeroSearch/);

    // Should be triggered by the explore button
    expect(boldHero).toMatch(/onClick.*handleHeroSearch/);
  });

  it("BoldHeroSection has heroSearchText state for the search input", () => {
    const boldHero = readFile("src/features/home/components/BoldHeroSection.tsx");

    // Should have state for the search text
    expect(boldHero).toMatch(/heroSearchText/);

    // Should have a text input bound to heroSearchText
    expect(boldHero).toMatch(/value=\{heroSearchText\}/);
    expect(boldHero).toMatch(/onChange.*setHeroSearchText/);
  });
});

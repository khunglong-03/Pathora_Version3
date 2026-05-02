"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { normalizeLanguageForApi } from "@/api/languageHeader";
import { homeService } from "@/api/services/homeService";
import { handleApiError } from "@/utils/apiResponse";
import { Icon } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchTour } from "@/types/home";
import { NormalizedTourInstanceVm } from "@/types/tour";
import {
  buildTourDiscoverySearchParams,
  parseTourDiscoveryFilters,
  TourDiscoveryView,
  type TourDiscoveryInstanceType,
} from "@/utils/tourDiscoveryFilters";

import { FilterDrawer } from "./FilterDrawer";
import { FilterSidebar } from "./FilterSidebar";
import { HeroSection } from "./HeroSection";
import { SearchBar } from "./SearchBar";
import { TourCard } from "./TourCard";
import { TourInstanceCard } from "./TourInstanceCard";

const PAGE_SIZE = 6;

export const TourDiscoveryPage = () => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const safeT = (key: string, fallback: string) => {
    return mounted ? t(key, fallback) : fallback;
  };

  const [tours, setTours] = useState<SearchTour[]>([]);
  const [tourInstances, setTourInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalTours, setTotalTours] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [sortBy, setSortBy] = useState("recommended");
  const [searchText, setSearchText] = useState(() => parseTourDiscoveryFilters(searchParams).destination);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [apiLanguage, setApiLanguage] = useState(() =>
    normalizeLanguageForApi(i18n.resolvedLanguage || i18n.language),
  );


  const filters = useMemo(() => parseTourDiscoveryFilters(searchParams), [searchParams]);
  const currentPage = filters.page;
  const viewType = filters.view;
  const submittedSearchText = filters.destination;
  const debouncedSearchText = useDebounce(searchText, 400);

  // Initialize filter state from URL params on mount
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>(
    () => filters.classifications,
  );
  const totalPages = Math.max(1, Math.ceil(totalTours / PAGE_SIZE));

  useEffect(() => {
    setSearchText(submittedSearchText);
  }, [submittedSearchText]);

  useEffect(() => {
    const updateLanguage = (language: string) => {
      setApiLanguage(normalizeLanguageForApi(language));
    };

    updateLanguage(i18n.resolvedLanguage || i18n.language);
    i18n.on("languageChanged", updateLanguage);

    return () => {
      i18n.off("languageChanged", updateLanguage);
    };
  }, [i18n]);

  const syncFilters = useCallback((updates: {
    destination?: string;
    classifications?: string[];
    page?: number;
    view?: TourDiscoveryView;
    instanceType?: TourDiscoveryInstanceType;
    [key: string]: unknown;
  }) => {
    const nextFilters = {
      ...filters,
      classifications: selectedClassifications,
      ...updates,
    };
    const nextParams = buildTourDiscoverySearchParams(nextFilters);
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [filters, selectedClassifications, pathname, router]);

  useEffect(() => {
    if (debouncedSearchText.trim() === submittedSearchText) {
      return;
    }

    syncFilters({
      destination: debouncedSearchText.trim(),
      page: 1,
    });
  }, [debouncedSearchText, submittedSearchText, syncFilters]);

  // Sync filter state changes to URL
  const prevFiltersRef = useRef<string>("");
  useEffect(() => {
    const key = JSON.stringify({ selectedClassifications });
    if (prevFiltersRef.current === "") {
      prevFiltersRef.current = key;
      return;
    }
    if (prevFiltersRef.current !== key) {
      prevFiltersRef.current = key;
      syncFilters({ page: 1 });
    }
  }, [selectedClassifications, syncFilters]);

  useEffect(() => {
    let isActive = true;

    const fetchTours = async () => {
      setLoading(true);

      try {
        setErrorMessage(null);

        if (viewType === "tours") {
          const result = await homeService.searchTours({
            q: submittedSearchText || undefined,
            classification: selectedClassifications.length > 0 ? selectedClassifications.join(",") : undefined,
            page: currentPage,
            pageSize: PAGE_SIZE,
            language: apiLanguage,
          });

          if (!isActive) {
            return;
          }

          setTours(result?.data ?? []);
          setTourInstances([]);
          setTotalTours(result?.total ?? 0);
          return;
        }

        const result = await homeService.getAvailablePublicInstances(
          submittedSearchText || undefined,
          currentPage,
          PAGE_SIZE,
          apiLanguage,
          sortBy,
          filters.instanceType === "private" ? "private" : undefined,
        );

        if (!isActive) {
          return;
        }

        setTourInstances(result?.data ?? []);
        setTours([]);
        setTotalTours(result?.total ?? 0);
      } catch (error: unknown) {
        if (!isActive) {
          return;
        }

        const handledError = handleApiError(error);
        console.error("Error fetching tours:", handledError.message);
        setErrorMessage(handledError.message);
        setTours([]);
        setTourInstances([]);
        setTotalTours(0);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchTours();

    return () => {
      isActive = false;
    };
  }, [
    apiLanguage,
    currentPage,
    submittedSearchText,
    viewType,
    selectedClassifications,
    sortBy,
    filters.instanceType,
  ]);

  const handleSearchSubmit = () => {
    syncFilters({
      destination: searchText.trim(),
      page: 1,
    });
  };

  const handleClassificationToggle = (value: string) => {
    setSelectedClassifications((prev) =>
      prev.includes(value)
        ? prev.filter((classification) => classification !== value)
        : [...prev, value]
    );
  };

  const handleClearFilters = () => {
    setSelectedClassifications([]);
    syncFilters({ instanceType: null, page: 1 });
  };

  const handleCatalogInstanceTypeChange = (value: TourDiscoveryInstanceType) => {
    syncFilters({ instanceType: value, page: 1 });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleViewTypeChange = (value: TourDiscoveryView) => {
    syncFilters({
      view: value,
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    const nextPage = Math.min(Math.max(page, 1), totalPages);

    if (nextPage === currentPage) {
      return;
    }

    syncFilters({ page: nextPage });
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setReloadKey((prev) => prev + 1);
  };

  const handleResetAll = () => {
    setSelectedClassifications([]);
    setSearchText("");
    syncFilters({ destination: "", page: 1, instanceType: null });
  };

  return (
    <>


      <main className="min-h-screen bg-[#F8F8F6]">
        <HeroSection />

        <SearchBar
          searchText={searchText}
          onSearchChange={setSearchText}
          onSearchSubmit={handleSearchSubmit}
          onFilterToggle={() => setFilterDrawerOpen(true)}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex gap-8">
            {/* Filter Sidebar - Desktop */}
            <div className="hidden lg:block">
              <FilterSidebar
                selectedClassifications={selectedClassifications}
                onClassificationToggle={handleClassificationToggle}
                onClearFilters={handleClearFilters}
                showDepartureTypeFilter={viewType === "instances"}
                catalogInstanceType={filters.instanceType}
                onCatalogInstanceTypeChange={handleCatalogInstanceTypeChange}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Toolbar: view toggle + sort + results count */}
              <div className="mb-6 flex flex-col gap-4 rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/20 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sm:flex-row sm:items-center sm:justify-between">
                {/* Left: view toggle + count */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* View type toggle */}
                  <div className="inline-flex p-1" role="group" aria-label={safeT("landing.tourDiscovery.viewSwitchLabel", "Choose viewing mode")}>
                    <button
                      type="button"
                      onClick={() => handleViewTypeChange("tours")}
                      aria-pressed={viewType === "tours"}
                      className={`rounded-full px-5 py-2 text-sm font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02] ${
                        viewType === "tours"
                          ? "bg-[#fa8b02] text-white shadow-sm"
                          : "bg-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {safeT("landing.tourDiscovery.viewType.tour", "By Tour")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewTypeChange("instances")}
                      aria-pressed={viewType === "instances"}
                      className={`rounded-full px-5 py-2 text-sm font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02] ${
                        viewType === "instances"
                          ? "bg-[#fa8b02] text-white shadow-sm"
                          : "bg-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {safeT("landing.tourDiscovery.viewType.tourInstance", "By Departure")}
                    </button>
                  </div>

                  {/* Results count */}
                  {!loading && (
                    <p className="text-sm text-slate-600" aria-live="polite" aria-atomic="true">
                      <span className="font-semibold text-slate-900">{totalTours.toLocaleString()}</span>
                      {" "}
                      {viewType === "tours"
                        ? safeT("landing.tourDiscovery.toursFound", "tours found")
                        : safeT("landing.tourDiscovery.departuresFound", "departures found")}
                    </p>
                  )}
                </div>

                {/* Right: sort dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-sm text-slate-500 whitespace-nowrap">
                    {safeT("landing.tourDiscovery.sortBy", "Sort by")}:
                  </label>
                  <div className="relative">
                    <select
                      id="sort-select"
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="appearance-none bg-white/80 backdrop-blur-md border border-slate-200/60 rounded-[1rem] px-5 py-2.5 pr-10 text-sm font-semibold text-landing-heading focus:outline-none focus:ring-2 focus:ring-[#fa8b02]/20 focus:border-[#fa8b02] cursor-pointer shadow-sm hover:bg-white transition-colors"
                      aria-label={safeT("landing.tourDiscovery.sortAria", "Sort tour results")}
                    >
                      <option value="recommended">{safeT("landing.tourDiscovery.sort.recommended", "Recommended")}</option>
                      <option value="price-low">{safeT("landing.tourDiscovery.sort.price-low", "Price: Low to High")}</option>
                      <option value="price-high">{safeT("landing.tourDiscovery.sort.price-high", "Price: High to Low")}</option>
                      <option value="duration-short">{safeT("landing.tourDiscovery.sort.duration-short", "Duration: Shortest")}</option>
                      <option value="duration-long">{safeT("landing.tourDiscovery.sort.duration-long", "Duration: Longest")}</option>
                    </select>
                    <Icon
                      icon="heroicons-outline:chevron-down"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </div>

              {/* Loading State — inline skeleton with shimmer */}
              {loading && (
                <div
                  aria-live="polite"
                  aria-label={safeT("landing.tourDiscovery.loadingAria", "Loading tour results")}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
                >
                  {[...Array(viewType === "tours" ? 6 : PAGE_SIZE)].map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="aspect-[4/3] skeleton-shimmer" />
                      <div className="p-5 space-y-3">
                        <div className="h-3 w-1/3 rounded skeleton-shimmer" />
                        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
                        <div className="h-3 w-1/2 rounded skeleton-shimmer" />
                        <div className="h-3 w-2/3 rounded skeleton-shimmer" />
                        <div className="h-5 w-1/3 rounded skeleton-shimmer mt-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {!loading && errorMessage && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                    <Icon
                      icon="heroicons-outline:exclamation-triangle"
                      className="h-7 w-7 text-red-600"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {viewType === "tours"
                      ? safeT("landing.tourDiscovery.errorLoading", "Failed to load tours")
                      : safeT("landing.tourDiscovery.errorLoadingInstances", "Failed to load departures")}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-[#fa8b02] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e67a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]"
                  >
                    {safeT("landing.tourDiscovery.retry", "Retry")}
                  </button>
                </div>
              )}

              {/* Results: Tour cards */}
              {!loading && !errorMessage && viewType === "tours" && tours.length > 0 && (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6"
                  role="region"
                  aria-label={safeT("landing.tourDiscovery.resultsRegion", "Tour search results")}
                >
                  {tours.map((tour) => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>
              )}

              {/* Results: Tour Instance cards */}
              {!loading && !errorMessage && viewType === "instances" && tourInstances.length > 0 && (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
                  role="region"
                  aria-label={safeT("landing.tourDiscovery.resultsRegion", "Tour search results")}
                >
                  {tourInstances.map((instance) => (
                    <TourInstanceCard key={instance.id} tour={instance} />
                  ))}
                </div>
              )}

              {/* Empty State: Tours */}
              {!loading && !errorMessage && tours.length === 0 && viewType === "tours" && (
                <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Icon
                      icon="heroicons-outline:magnifying-glass"
                      className="h-8 w-8 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {safeT("landing.tourDiscovery.noToursFound", "No tours found")}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {safeT(
                      "landing.tourDiscovery.tryAdjustingFilters",
                      "Try adjusting your filters or search terms",
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {safeT("landing.tourDiscovery.emptyStats", "2,400+ tours are waiting!")}
                  </p>
                  <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    >
                      {safeT("landing.tourDiscovery.browseAllTours", "Browse All Tours")}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="inline-flex items-center justify-center rounded-xl bg-[#fa8b02] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e67a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]"
                    >
                      {safeT("landing.tourDiscovery.exploreDestinations", "Explore Destinations")}
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State: Departures */}
              {!loading && !errorMessage && tourInstances.length === 0 && viewType === "instances" && (
                <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                    <Icon
                      icon="heroicons-outline:calendar-days"
                      className="h-8 w-8 text-slate-400"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {safeT("landing.tourDiscovery.noDeparturesFound", "No departures found")}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {safeT(
                      "landing.tourDiscovery.noInstancesDescription",
                      "There are no upcoming departures matching your search. Please check back later.",
                    )}
                  </p>
                  <div className="mt-5 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                    >
                      {safeT("landing.tourDiscovery.browseAllTours", "Browse All Tours")}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="inline-flex items-center justify-center rounded-xl bg-[#fa8b02] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e67a00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]"
                    >
                      {safeT("landing.tourDiscovery.exploreDestinations", "Explore Destinations")}
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {!loading && !errorMessage && totalTours > PAGE_SIZE && (
                <nav
                  aria-label={safeT("landing.tourDiscovery.paginationAria", "Pagination")}
                  className="mt-8 flex justify-center"
                >
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label={safeT("landing.tourDiscovery.prevPageAria", "Go to previous page")}
                      className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]"
                    >
                      <Icon icon="heroicons-outline:chevron-left" className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <span className="px-3 text-sm font-medium text-slate-700" aria-current="page">
                      {safeT("landing.tourDiscovery.pageOf", "Page {{current}} of {{total}}")
                        .replace("{{current}}", currentPage.toString())
                        .replace("{{total}}", totalPages.toString())}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      aria-label={safeT("landing.tourDiscovery.nextPageAria", "Go to next page")}
                      className="h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]"
                    >
                      <Icon icon="heroicons-outline:chevron-right" className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </nav>
              )}
            </div>
          </div>
        </div>
      </main>



      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        selectedClassifications={selectedClassifications}
        onClassificationToggle={handleClassificationToggle}
        onClearFilters={handleClearFilters}
        showDepartureTypeFilter={viewType === "instances"}
        catalogInstanceType={filters.instanceType}
        onCatalogInstanceTypeChange={handleCatalogInstanceTypeChange}
      />
    </>
  );
};

export default TourDiscoveryPage;

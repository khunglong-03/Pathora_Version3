"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Suspense, useEffect, useCallback, useState } from "react";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import { tourService } from "@/api/services/tourService";
import { extractItems } from "@/utils/apiResponse";
import { handleApiError } from "@/utils/apiResponse";
import { SkeletonTable } from "@/components/ui/SkeletonTable";

interface TourListItem {
  id: string;
  tourName: string;
  shortDescription: string;
  status: string;
  thumbnail?: { publicURL?: string };
  tourCode: string;
  createdOnUtc: string;
}

type SearchState = "loading" | "ready" | "empty" | "error";

function SearchContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<SearchState>("loading");
  const [results, setResults] = useState<TourListItem[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const searchText = searchParams.get("q") || "";

  const fetchResults = useCallback(async () => {
    setState("loading");
    try {
      const data = await tourService.getAllTours(searchText, page, pageSize);
      const items = extractItems<TourListItem>(data);
      if (!items || items.length === 0) {
        setState("empty");
        setResults([]);
      } else {
        setResults(items);
        setState("ready");
      }
    } catch (err) {
      const handled = handleApiError(err);
      setErrorMsg(handled.message);
      setState("error");
    }
  }, [searchText, page]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const statusBadge = (status: string) => {
    const lower = (status || "").toLowerCase();
    if (lower === "active") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">Active</span>;
    if (lower === "inactive") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">Inactive</span>;
    if (lower === "pending") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Pending</span>;
    if (lower === "rejected") return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Rejected</span>;
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-600">{status}</span>;
  };

  const totalPages = Math.ceil(results.length / pageSize);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            {searchText ? `Search: "${searchText}"` : "All Tours"}
          </h1>
          <p className="text-sm text-stone-400 mt-0.5 font-normal">
            {results.length > 0 ? `${results.length} result${results.length !== 1 ? "s" : ""} found` : "No tours found"}
          </p>
        </div>
        <Button
          type="button"
          className="btn btn-dark btn-sm"
          onClick={() => router.push("/tour-management?create=true")}>
          <Icon icon="heroicons:plus" className="size-4" />
          Create Tour
        </Button>
      </div>

      {/* Search Params Display */}
      {(searchParams.get("destination") || searchParams.get("classification") || searchParams.get("date") || searchParams.get("people")) && (
        <Card bodyClass="p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.05em] text-stone-400 mb-3">Applied Filters</h2>
          <div className="flex flex-wrap gap-2">
            {searchParams.get("destination") && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                <Icon icon="heroicons:map-pin" className="size-3" />
                {searchParams.get("destination")}
              </span>
            )}
            {searchParams.get("classification") && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                <Icon icon="heroicons:tag" className="size-3" />
                {searchParams.get("classification")}
              </span>
            )}
            {searchParams.get("date") && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                <Icon icon="heroicons:calendar" className="size-3" />
                {searchParams.get("date")}
              </span>
            )}
            {searchParams.get("people") && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-xs font-medium text-stone-600">
                <Icon icon="heroicons:user-group" className="size-3" />
                {searchParams.get("people")} people
              </span>
            )}
          </div>
        </Card>
      )}

      {/* Results Table */}
      <Card bodyClass="p-0 overflow-hidden">
        {state === "loading" && <SkeletonTable rows={5} columns={5} />}
        {state === "error" && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Icon icon="heroicons:exclamation-triangle" className="size-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">Failed to load tours</h3>
            <p className="text-sm text-stone-400">{errorMsg}</p>
            <Button type="button" className="btn btn-outline-dark btn-sm mt-4" onClick={fetchResults}>
              Try Again
            </Button>
          </div>
        )}
        {state === "empty" && (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
              <Icon icon="heroicons:magnifying-glass" className="size-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-700 mb-2">No tours found</h3>
            <p className="text-sm text-stone-400 max-w-sm">
              {searchText ? `No tours match "${searchText}". Try a different search term.` : "No tours available. Create your first tour to get started."}
            </p>
          </div>
        )}
        {state === "ready" && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/50">
                    <th className="text-left text-xs font-semibold uppercase tracking-[0.05em] text-stone-500 px-4 py-3">Tour</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-[0.05em] text-stone-500 px-4 py-3">Code</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-[0.05em] text-stone-500 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-[0.05em] text-stone-500 px-4 py-3">Created</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-[0.05em] text-stone-500 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {results.map((tour) => (
                    <tr key={tour.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                            {tour.thumbnail?.publicURL ? (
                              <img src={tour.thumbnail.publicURL} alt={tour.tourName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon icon="heroicons:photo" className="size-5 text-stone-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-stone-900 truncate">{tour.tourName || "Untitled Tour"}</p>
                            <p className="text-xs text-stone-400 truncate mt-0.5">{tour.shortDescription || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-1 rounded">{tour.tourCode || "—"}</span>
                      </td>
                      <td className="px-4 py-3">{statusBadge(tour.status)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-stone-400">
                          {tour.createdOnUtc ? new Date(tour.createdOnUtc).toLocaleDateString() : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            className="text-stone-400 hover:text-stone-600 p-1.5"
                            onClick={() => window.location.href = `/tour-management/${tour.id}`}>
                            <Icon icon="heroicons:eye" className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            className="text-stone-400 hover:text-stone-600 p-1.5"
                            onClick={() => window.location.href = `/tour-management/${tour.id}/edit`}>
                            <Icon icon="heroicons:pencil-square" className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-stone-200 bg-stone-50/50">
                <span className="text-xs text-stone-400">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="btn btn-outline-dark btn-xs"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <Icon icon="heroicons:chevron-left" className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    className="btn btn-outline-dark btn-xs"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    <Icon icon="heroicons:chevron-right" className="size-3" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function SearchLoadingFallback() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-8 w-48 rounded mb-1" />
      <div className="skeleton h-4 w-64 rounded mb-5" />
      <div className="skeleton h-32 rounded-xl" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  );
}

export default function SearchPage() {
  return (
    <main id="main-content" className="p-6">
      <Suspense fallback={<SearchLoadingFallback />}>
        <SearchContent />
      </Suspense>
    </main>
  );
}

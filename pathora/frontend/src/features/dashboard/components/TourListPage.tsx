"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui";
import { StatCardAnimation } from "./shared/StatCardAnimation";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { tourService } from "@/api/services/tourService";
import { handleApiError } from "@/utils/apiResponse";
import { useDebounce } from "@/hooks/useDebounce";
import { TourVm, TourStatus } from "@/types/tour";
import { AdminSidebar, TopBar } from "./AdminSidebar";

/* ── Animation Variants ───────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

type TourListDataState = "loading" | "ready" | "empty" | "error";

/* (StatusBadge imported from @/components/ui) */

/* ══════════════════════════════════════════════════════════════
   TourListPage - Main Export
   ══════════════════════════════════════════════════════════════ */
export function TourListPage() {
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const safeT = (key: string, fallback: string) =>
    mounted ? t(key, fallback) : fallback;
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tours, setTours] = useState<TourVm[]>([]);
  const [dataState, setDataState] = useState<TourListDataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [tourScope, setTourScope] = useState("all");
  const [continent, setContinent] = useState("all");
  const debouncedSearch = useDebounce(searchText, 400);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [failedThumbnailIds, setFailedThumbnailIds] = useState<Set<string>>(new Set());
  const [reloadToken, setReloadToken] = useState(0);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, rejected: 0 });

  /* ── Fetch stats (independent of current status filter and page) ── */
  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const effectiveTourScope = tourScope === "all" ? undefined : tourScope;
        const effectiveContinent = continent === "all" ? undefined : continent;
        const result = await tourService.getAdminTourManagementStats(
          debouncedSearch || undefined,
          effectiveTourScope,
          effectiveContinent,
        );
        if (active && result) {
          setStats(result);
        }
      } catch (error) {
        console.error("Failed to fetch tour stats:", error);
      }
    };
    void fetchStats();
    return () => { active = false; };
  }, [debouncedSearch, tourScope, continent, reloadToken]);

  /* ── Fetch tours (always uses page 1, resets on search/filter change) ── */
  useEffect(() => {
    let active = true;
    const doFetch = async () => {
      try {
        setDataState("loading");
        setErrorMessage(null);
        setCurrentPage(1);
        const effectiveStatus = statusFilter === "all" ? undefined : statusFilter;
        const effectiveTourScope = tourScope === "all" ? undefined : tourScope;
        const effectiveContinent = continent === "all" ? undefined : continent;
        const result = await tourService.getAdminTourManagement(
          debouncedSearch || undefined,
          effectiveStatus,
          effectiveTourScope,
          effectiveContinent,
          1,
          pageSize,
        );
        if (!active) return;
        if (result) {
          setTours(result.data ?? []);
          setTotalItems(result.total ?? 0);
          setFailedThumbnailIds(new Set());
          if (!result.data || result.data.length === 0) {
            setDataState("empty");
          } else {
            setDataState("ready");
          }
        }
      } catch (error: unknown) {
        if (!active) return;
        const handledError = handleApiError(error);
        console.error("Failed to fetch tours:", handledError.message);
        setTours([]);
        setDataState("error");
        setErrorMessage(handledError.message);
      }
    };
    void doFetch();
    return () => { active = false; };
  }, [debouncedSearch, statusFilter, tourScope, continent, pageSize, reloadToken]);

  /* ── Filtered tours ───────────────────────────────────────── */
  const filteredTours = tours;

  /* ── Derived stat counts ──────────────────────────────────── */
  const statCounts = stats;

  /* ── Pagination ───────────────────────────────────────────── */
  const totalPages = Math.ceil(totalItems / pageSize);
  const showingFrom = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalItems);

  return (
    <>
      <main id="main-content" className="p-6 space-y-8 max-w-[87.5rem] mx-auto">
        {/* ── Page Header ────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">
              {safeT("tourList.pageTitle", "Tours")}
            </h1>
            <p className="text-sm text-stone-500">
              {safeT("tourList.pageSubtitle", "Manage your tour packages and itineraries")}
            </p>
          </div>
        </motion.div>

        {/* ── Stat Cards (asymmetric: 3+1) ─────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardAnimation
            label={safeT("tourList.stat.totalTours", "Total Tours")}
            value={statCounts.total}
            accent="stone"
            icon="heroicons:globe-alt"
            variants={itemVariants}
          />
          <StatCardAnimation
            label={safeT("tourList.stat.active", "Active")}
            value={statCounts.active}
            accent="green"
            icon="heroicons:check-circle"
            variants={itemVariants}
          />
          <StatCardAnimation
            label={safeT("tourList.stat.inactive", "Inactive")}
            value={statCounts.inactive}
            accent="red"
            icon="heroicons:x-circle"
            variants={itemVariants}
          />
          <StatCardAnimation
            label={safeT("tourList.stat.rejected", "Rejected")}
            value={statCounts.rejected}
            accent="amber"
            icon="heroicons:x-circle"
            variants={itemVariants}
          />
        </motion.div>

        {/* ── Search & Filter ────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
          <select
            value={tourScope}
            onChange={(e) => {
              setTourScope(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 focus:ring-2 focus:ring-stone-900 border border-stone-200 rounded-xl transition-all outline-none"
          >
            <option value="all">{safeT("tourList.scopes.all", "Tất cả vùng")}</option>
            <option value="1">{safeT("tourList.scopes.domestic", "Trong nước")}</option>
            <option value="2">{safeT("tourList.scopes.international", "Quốc tế")}</option>
          </select>

          <select
            value={continent}
            onChange={(e) => {
              setContinent(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2.5 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 focus:ring-2 focus:ring-stone-900 border border-stone-200 rounded-xl transition-all outline-none"
          >
            <option value="all">{safeT("tourList.continents.all", "Tất cả châu lục")}</option>
            <option value="1">{safeT("tourList.continents.asia", "Châu Á")}</option>
            <option value="2">{safeT("tourList.continents.europe", "Châu Âu")}</option>
            <option value="3">{safeT("tourList.continents.africa", "Châu Phi")}</option>
            <option value="4">{safeT("tourList.continents.americas", "Châu Mỹ")}</option>
            <option value="5">{safeT("tourList.continents.oceania", "Châu Đại Dương")}</option>
            <option value="6">{safeT("tourList.continents.antarctica", "Châu Nam Cực")}</option>
          </select>

          <div className="relative flex-1 max-w-sm w-full">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={safeT("tourList.searchPlaceholder", "Search by name or code...")}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-stone-200/80 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                <Icon icon="heroicons:x-mark" className="size-4" />
              </button>
            )}
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-2xl border border-stone-200/80 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer">
            <option value="all">{safeT("tourList.statusFilter.all", "All Status")}</option>
            <option value="active">{safeT("tourList.statusFilter.active", "Active")}</option>
            <option value="inactive">{safeT("tourList.statusFilter.inactive", "Inactive")}</option>
            <option value="pending">{safeT("tourList.statusFilter.pending", "Pending")}</option>
            <option value="rejected">{safeT("tourList.statusFilter.rejected", "Rejected")}</option>
          </select>
        </motion.div>

        {/* ── Tour Table ─────────────────────────────────── */}
        <div className="bg-white border border-stone-200/50 rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          {/* Error State */}
          {dataState === "error" && (
            <motion.div
              className="m-6 p-6 bg-white border border-red-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
              variants={itemVariants}
              initial="hidden"
              animate="show">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-red-800">
                    {safeT("tourList.error.title", "Could not load tours")}
                  </h2>
                  <p className="text-sm text-red-700 mt-1">
                    {errorMessage ?? safeT("tourList.error.fallback", "Unable to load tour data. Please try again.")}
                  </p>
                </div>
                <button
                  onClick={() => setReloadToken((v) => v + 1)}
                  className="px-3 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-colors">
                  {safeT("common.retry", "Retry")}
                </button>
              </div>
            </motion.div>
          )}

          {/* Loading */}
          {dataState === "loading" && (
            <div className="p-6">
              <SkeletonTable rows={4} columns={5} />
            </div>
          )}

          {/* Empty state */}
          {(dataState === "empty") && filteredTours.length === 0 && (
            <motion.div
              className="m-6 p-12 text-center"
              variants={itemVariants}
              initial="hidden"
              animate="show">
              <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Icon
                  icon="heroicons:map"
                  className="size-7 text-stone-300"
                />
              </div>
              <h2 className="text-lg font-bold text-stone-800">
                {safeT("tourList.empty.title", "No tours found")}
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                {safeT("tourList.empty.description", "There are no tours to display yet. Create your first tour to get started.")}
              </p>
            </motion.div>
          )}

          {/* Table */}
          {dataState === "ready" && filteredTours.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-8 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourList.column.tour", "Tour")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourList.column.code", "Code")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourList.column.status", "Status")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourList.column.updated", "Updated")}
                    </th>
                    <th className="text-center px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourList.column.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-stone-100">
                  <AnimatePresence>
                    {filteredTours.map((tour) => (
                      <motion.tr
                        variants={itemVariants}
                        layout
                        key={tour.id}
                        className="hover:bg-amber-50/30 transition-colors duration-150 group">
                        {/* Tour Name */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl border border-stone-200/80 bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-amber-300 transition-colors duration-200">
                              {!failedThumbnailIds.has(tour.id) &&
                              tour.thumbnail?.publicURL ? (
                                <img
                                  src={tour.thumbnail.publicURL}
                                  alt={tour.tourName || "Tour thumbnail"}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                  onError={() =>
                                    setFailedThumbnailIds((prev) => {
                                      const next = new Set(prev);
                                      next.add(tour.id);
                                      return next;
                                    })
                                  }
                                />
                              ) : (
                                <Icon
                                  icon="heroicons:photo"
                                  className="size-5 text-stone-400"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-stone-900 truncate tracking-tight">
                                {tour.tourName}
                              </p>
                              <p className="text-xs text-stone-500 mt-0.5 truncate max-w-[12.5rem]">
                                {tour.shortDescription || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-6 py-5">
                          <span className="font-mono text-sm text-stone-600 tracking-tight">
                            {tour.tourCode}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          {(() => {
                            const lower = (tour.status || "unknown").toLowerCase();
                            const activeBg = "bg-emerald-50";
                            const activeText = "text-emerald-700";
                            const inactiveBg = "bg-red-50";
                            const inactiveText = "text-red-700";
                            const pendingBg = "bg-amber-50";
                            const pendingText = "text-amber-700";
                            const rejectedBg = "bg-rose-50";
                            const rejectedText = "text-rose-700";
                            const defaultBg = "bg-stone-100";
                            const defaultText = "text-stone-600";
                            const bg =
                              lower === "active" ? activeBg :
                              lower === "inactive" ? inactiveBg :
                              lower === "pending" ? pendingBg :
                              lower === "rejected" ? rejectedBg :
                              defaultBg;
                            const text =
                              lower === "active" ? activeText :
                              lower === "inactive" ? inactiveText :
                              lower === "pending" ? pendingText :
                              lower === "rejected" ? rejectedText :
                              defaultText;
                            return (
                              <select
                                value={tour.status ?? "Unknown"}
                                disabled={updatingStatusId === tour.id}
                                onChange={async (e) => {
                                  const newStatus = e.target.value;
                                  setUpdatingStatusId(tour.id);
                                  try {
                                    await tourService.updateTourStatus(tour.id, TourStatus[newStatus as keyof typeof TourStatus]);
                                    setReloadToken((v) => v + 1);
                                    toast.success(t("tourList.statusUpdateSuccess"));
                                  } catch {
                                    toast.error(t("tourList.statusUpdateError"));
                                  } finally {
                                    setUpdatingStatusId(null);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-full text-xs font-bold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                                  updatingStatusId === tour.id ? "opacity-50 cursor-not-allowed" : ""
                                } ${bg} ${text}`}>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Pending">Pending</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            );
                          })()}
                        </td>

                        {/* Updated */}
                        <td className="px-6 py-5">
                          <span className="text-sm text-stone-500 tracking-tight">
                            {tour.createdOnUtc
                              ? new Date(tour.createdOnUtc).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                router.push(`/manager/tour-management/${tour.id}`)
                              }
                              aria-label={`View ${tour.tourName}`}
                              className="p-2.5 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset">
                              <Icon icon="heroicons:eye" className="size-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </motion.tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────── */}
        {(dataState === "ready" || dataState === "empty") && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-stone-500">
                Showing {showingFrom}–{showingTo} of {totalItems}
              </p>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2.5 py-1.5 rounded-xl border border-stone-200/80 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer">
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-2 rounded-xl text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Icon icon="heroicons:chevron-double-left" className="size-4" />
                </button>
                {/* Previous */}
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-2 rounded-xl text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Icon icon="heroicons:chevron-left" className="size-4" />
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1,
                  )
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="text-sm text-stone-400 px-1.5">…</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 ${
                          p === currentPage
                            ? "bg-primary text-white shadow-sm"
                            : "text-stone-600 hover:bg-stone-100 active:scale-[0.95]"
                        }`}>
                        {p}
                      </button>
                    </React.Fragment>
                  ))}

                {/* Next */}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-2 rounded-xl text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Icon icon="heroicons:chevron-right" className="size-4" />
                </button>
                {/* Last Page */}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-2 rounded-xl text-sm text-stone-500 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Icon icon="heroicons:chevron-double-right" className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

"use client";

import React, {
  useCallback,
  useState,
  useEffect,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, TourStatusBadge } from "@/components/ui";

import {
  getTourInstanceRequestStatus,
  tourInstanceService,
} from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/utils/format";
import { NormalizedTourInstanceDto, NormalizedTourInstanceVm } from "@/types/tour";
import { getCookie } from "@/utils/cookie";

/* ── Animation Variants ───────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 56, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: [0.32, 0.72, 0, 1] as const },
  },
};



/* (TourStatusBadge imported from @/components/ui) */

const AUTH_FAILURE_STATUSES = new Set([401, 403]);
const TOUR_OPERATOR_VISIBLE_STATUSES = [
  "PendingAdjustment",
  "PendingManagerReview",
];
const MANAGER_VISIBLE_STATUSES = [
  "Draft",
  "PendingManagerReview",
];

/* ══════════════════════════════════════════════════════════════
   TourInstanceListPage - Main Export
   ══════════════════════════════════════════════════════════════ */
type InstanceListDataState = "loading" | "ready" | "empty" | "error";

export interface CustomTourInstanceRequestListPageProps {
  role?: "manager" | "tour-operator";
}

export function CustomTourInstanceRequestListPage({
  role = "manager",
}: CustomTourInstanceRequestListPageProps = {}) {
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const safeT = useCallback(
    (key: string, fallback: string) => (mounted ? t(key, fallback) : fallback),
    [mounted, t],
  );
  const router = useRouter();
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [dataState, setDataState] = useState<InstanceListDataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [excludePast, setExcludePast] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<NormalizedTourInstanceDto | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const statusOptions = role === "tour-operator"
    ? [
        { value: "all", label: "Tất cả" },
        { value: "pendingadjustment", label: "Cần điều chỉnh" },
        { value: "pendingmanagerreview", label: "Chờ Quản lý duyệt" },
      ]
    : [
        { value: "all", label: "Tất cả" },
        { value: "draft", label: "Người dùng mới yêu cầu" },
        { value: "pendingmanagerreview", label: "Chờ Quản lý duyệt" },
      ];
  const requestStatuses = statusFilter !== "all"
    ? undefined
    : role === "tour-operator"
      ? TOUR_OPERATOR_VISIBLE_STATUSES
      : MANAGER_VISIBLE_STATUSES;

  /* ── Fetch instances ─────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    const doFetchInstances = async () => {
      // Guard: skip if no auth tokens present at all (hard logout / expired session)
      const hasToken = getCookie("access_token") || getCookie("refresh_token");
      if (!hasToken) {
        setInstances([]);
        setDataState("error");
        setErrorMessage(
          safeT(
            "tourInstance.form.error.authFailure",
            "Your session does not have access to these tour instances. Please sign in again.",
          ),
        );
        return;
      }
      try {
        setDataState("loading");
        setErrorMessage(null);
        const result = await tourInstanceService.getAllInstances(
          debouncedSearchText || undefined,
          statusFilter,
          currentPage,
          pageSize,
          excludePast,
          undefined,
          "private",
          requestStatuses,
        );
        if (!active) return;
        if (result) {
          const filteredInstances = result.data ?? [];

          // Sort logic for tour operator role:
          // 1. Prioritize status === "pendingadjustment" first.
          // 2. Otherwise, preserve the original API order (which is sorted by LastModifiedOnUtc/CreatedOnUtc descending).
          // 3. Fallback to sorting by tourInstanceCode descending.
          let sortedInstances = filteredInstances;
          if (role === "tour-operator") {
            sortedInstances = [...filteredInstances].sort((a, b) => {
              const isAdjA = a.status === "pendingadjustment";
              const isAdjB = b.status === "pendingadjustment";

              if (isAdjA && !isAdjB) return -1;
              if (!isAdjA && isAdjB) return 1;

              const indexA = filteredInstances.indexOf(a);
              const indexB = filteredInstances.indexOf(b);
              if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
              }

              const codeA = a.tourInstanceCode || "";
              const codeB = b.tourInstanceCode || "";
              return codeB.localeCompare(codeA);
            });
          }

          setInstances(sortedInstances);
          setTotalItems(result.total ?? filteredInstances.length);
          if (!filteredInstances || filteredInstances.length === 0) {
            setDataState("empty");
          } else {
            setDataState("ready");
          }
        }
      } catch (error: unknown) {
        if (!active) return;
        const status = getTourInstanceRequestStatus(error);
        const handledError = handleApiError(error);
        const isAuthError = AUTH_FAILURE_STATUSES.has(status ?? 0);
        if (!isAuthError) {
          console.error("Failed to fetch tour instances:", handledError.message);
        }
        setInstances([]);
        setDataState("error");
        setErrorMessage(
          isAuthError
            ? safeT(
                "tourInstance.form.error.authFailure",
                "Your session does not have access to these tour instances. Please sign in again.",
              )
            : safeT(handledError.message, "Unable to load tour instance data. Please try again."),
        );
      }
    };
    void doFetchInstances();
    return () => {
      active = false;
    };
  }, [
    debouncedSearchText,
    statusFilter,
    excludePast,
    currentPage,
    pageSize,
    reloadToken,
    role,
    // safeT intentionally excluded: it changes on hydration (false→true) and
    // would cause a duplicate fetch. It is only used for error display strings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ]);

  /* ── Pagination ───────────────────────────────────────────── */
  const totalPages = Math.ceil(totalItems / pageSize);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + " VND";

  return (
    <>
      <main id="main-content" className="relative min-h-[100dvh] overflow-hidden px-4 py-10 md:px-8 md:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_12%_16%,rgba(245,158,11,0.18),transparent_30%),radial-gradient(circle_at_86%_10%,rgba(120,113,108,0.14),transparent_30%),linear-gradient(180deg,#fffaf0_0%,#f5f5f4_100%)]" />
        <div className="mx-auto max-w-[87.5rem] space-y-10">
        {/* ── Page Header ────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500 ring-1 ring-black/[0.05]">
              {safeT("customTourRequests.eyebrow", "Private itinerary desk")}
            </span>
            <h1 className="text-5xl font-bold tracking-[-0.06em] text-stone-950 md:text-7xl">
              {role === "tour-operator"
                ? safeT("customTourRequests.tourOperatorTitle", "Design Queue")
                : safeT("customTourRequests.managerTitle", "Custom Tour Requests")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-500">
              {role === "tour-operator"
                ? safeT("customTourRequests.tourOperatorSubtitle", "Review assigned private itineraries that need adjustment or manager approval.")
                : safeT("customTourRequests.managerSubtitle", "Review new private tour requests and operator revisions waiting for manager approval.")}
            </p>
          </div>
        </motion.div>



        {/* ── Search & Filter ────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          layout
          className="relative z-10 rounded-[2.25rem] bg-white/55 p-1.5 ring-1 ring-black/[0.045] shadow-[0_30px_90px_-58px_rgba(28,25,23,0.7)]">
          <div className="flex flex-col items-center justify-between gap-4 rounded-[calc(2.25rem-0.375rem)] bg-white p-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] md:flex-row">
          <div className="relative flex-1 w-full min-w-[300px]">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={safeT(
                "placeholder.searchByTitleLocationCountry",
                "Search scheduled instances...",
              )}
              className="w-full rounded-full border-none bg-stone-50/80 py-3 pl-12 pr-10 text-sm font-medium text-stone-900 ring-1 ring-black/[0.04] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            <AnimatePresence>
              {searchText && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => {
                    setSearchText("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-stone-200 text-stone-500 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-105 hover:bg-stone-300 hover:text-stone-700">
                  <Icon icon="heroicons:x-mark" className="size-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex w-full shrink-0 items-center gap-3 border-t border-stone-100 pt-3 md:w-auto md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <div className="relative flex-1 md:flex-none min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full cursor-pointer appearance-none rounded-full border-none bg-stone-50/80 px-4 py-3 pl-10 text-sm font-medium text-stone-700 ring-1 ring-black/[0.04] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <Icon
                icon="heroicons:chevron-down"
                className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none"
              />
              <Icon
                icon="heroicons:funnel"
                className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none"
              />
            </div>


            
            <label className="ml-2 flex min-w-max cursor-pointer items-center gap-2 rounded-full bg-stone-50/80 px-4 py-3 text-sm font-medium text-stone-700 ring-1 ring-black/[0.04]">
              <input 
                type="checkbox" 
                checked={excludePast} 
                onChange={(e) => {
                  setExcludePast(e.target.checked);
                  setCurrentPage(1);
                }}
                className="size-4 rounded border-stone-300 text-amber-500 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus:ring-amber-500/20"
               />
              {safeT("tourInstance.filter.excludePast", "Ẩn tour đã qua")}
            </label>
          </div>
          </div>
        </motion.div>

        {/* ── Lists ──────────────────────────────────────── */}
        <div className="mt-8 space-y-4 relative z-0">
          {/* Error State */}
          {dataState === "error" && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              className="p-8 bg-red-50/50 border border-red-200 border-dashed rounded-[2.5rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-red-800">
                    {safeT(
                      "tourInstance.form.error.title",
                      "Could not load tour instances",
                    )}
                  </h2>
                  <p className="text-sm text-red-600 mt-1 max-w-[65ch]">
                    {errorMessage ??
                      safeT(
                        "tourInstance.form.error.fallback",
                        "Unable to load tour instance data. Please try again.",
                      )}
                  </p>
                </div>
                <button
                  onClick={() => setReloadToken((v) => v + 1)}
                  className="px-4 py-2 rounded-2xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all">
                  {safeT("common.retry", "Retry")}
                </button>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {dataState === "loading" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-5">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  variants={itemVariants}
                  className="bg-white/60 border border-stone-200/50 rounded-[2.5rem] p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="w-24 h-24 rounded-[1.5rem] bg-stone-200/50 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-4 w-full">
                    <div className="w-1/3 h-6 bg-stone-200/50 animate-pulse rounded-lg" />
                    <div className="flex gap-4">
                      <div className="w-1/4 h-4 bg-stone-200/50 animate-pulse rounded-md" />
                      <div className="w-1/4 h-4 bg-stone-200/50 animate-pulse rounded-md" />
                      <div className="w-1/4 h-4 bg-stone-200/50 animate-pulse rounded-md" />
                    </div>
                  </div>
                  <div className="w-24 h-10 bg-stone-200/50 animate-pulse rounded-2xl shrink-0" />
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty state */}
          {dataState === "empty" && instances.length === 0 && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
              layout
              className="p-16 text-center border-2 border-dashed border-stone-200 rounded-[2.5rem] bg-stone-50/50 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-[2rem] bg-white border border-stone-200/50 shadow-sm flex items-center justify-center mb-6">
                <Icon
                  icon="heroicons:calendar-days"
                  className="size-8 text-stone-300"
                />
              </div>
              <h2 className="text-xl font-bold text-stone-800 tracking-tight">
                {safeT(
                  "tourInstance.form.empty.title",
                  "No scheduled instances",
                )}
              </h2>
              <p className="text-sm text-stone-500 mt-2 max-w-[50ch] mx-auto leading-relaxed">
                {safeT(
                  "tourInstance.form.empty.description",
                  "You haven't scheduled any tour departures matching this filter. Clear filters or create a new instance to get started.",
                )}
              </p>
            </motion.div>
          )}

          {/* Intelligent List Mode */}
          {dataState === "ready" && instances.length > 0 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              layout
              className="space-y-4">
              <AnimatePresence>
                {instances.map((inst) => {
                  const isPublic =
                    inst.instanceType?.toLowerCase() === "public";
                  return (
                      <motion.div
                        variants={itemVariants}
                        layout
                        layoutId={`instance-${inst.id}`}
                        key={inst.id}
                        onClick={async () => {
                          setSelectedInstanceId(inst.id);
                          setDrawerDetail(null);
                          setDrawerLoading(true);
                          try {
                            const detail = await tourInstanceService.getInstanceDetail(inst.id);
                            setDrawerDetail(detail);
                          } finally {
                            setDrawerLoading(false);
                          }
                        }}
                        className="group rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-black/[0.045] shadow-[0_26px_80px_-54px_rgba(28,25,23,0.7)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 cursor-pointer">
                        <div className="flex flex-col justify-between gap-5 rounded-[calc(2rem-0.375rem)] bg-white p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] md:flex-row md:items-center">
                        
                        <div className="flex items-start md:items-center gap-4 min-w-0">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-amber-50 ring-1 ring-black/[0.04]">
                            {inst.thumbnail?.publicURL ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={inst.thumbnail.publicURL}
                                alt={inst.title || inst.tourName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-600">
                                <Icon icon="heroicons:document-text" className="w-7 h-7" />
                              </div>
                            )}
                          </div>
                          
                          <div className="min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                              <h3 className="truncate text-xl font-bold tracking-[-0.035em] text-stone-950">
                                {inst.title || inst.tourName}
                              </h3>
                              <TourStatusBadge status={inst.status} />
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
                              <span className="font-medium text-stone-700">
                                {inst.tourInstanceCode}
                              </span>
                              <span className="hidden sm:inline text-stone-300">•</span>
                              <span className="flex items-center gap-1">
                                <Icon icon="heroicons:calendar" className="w-4 h-4" />
                                {formatDate(inst.startDate)}
                              </span>
                              <span className="hidden sm:inline text-stone-300">•</span>
                              <span className="flex items-center gap-1">
                                <Icon icon="heroicons:clock" className="w-4 h-4" />
                                {inst.durationDays} ngày
                              </span>
                              <span className="hidden sm:inline text-stone-300">•</span>
                              <span className="flex items-center gap-1">
                                <Icon icon="heroicons:map-pin" className="w-4 h-4" />
                                <span className="truncate max-w-[120px]">{inst.location || "N/A"}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-stone-100 pt-3 md:flex-col md:items-end md:border-t-0 md:pt-0">
                          <div className="flex items-center gap-1.5 rounded-full bg-stone-50 px-3 py-1.5 text-sm font-medium text-stone-600 ring-1 ring-black/[0.04]">
                            <Icon icon="heroicons:user-group" className="w-4 h-4 text-stone-400" />
                            {inst.maxParticipation} khách
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:text-stone-950">
                            {safeT("common.viewDetails", "Details")}
                            <span className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                            <Icon
                              icon="heroicons:arrow-right"
                              className="size-4"
                            />
                            </span>
                          </div>
                        </div>
                        </div>
                      </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* ── Pagination ─────────────────────────────────── */}
        {(dataState === "ready" || dataState === "empty") && totalPages > 1 && (
          <div className="flex items-center justify-between rounded-[2rem] bg-white/70 p-4 ring-1 ring-black/[0.045] shadow-[0_24px_70px_-54px_rgba(28,25,23,0.65)]">
            <span className="text-sm text-stone-600">
              {safeT("common.page", "Page")} {currentPage} {safeT("common.of", "of")} {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-600 ring-1 ring-black/[0.06] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 disabled:opacity-50 active:scale-[0.98]">
                {safeT("common.previous", "Previous")}
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 disabled:opacity-40 active:scale-[0.98]">
                {safeT("common.next", "Next")}
              </button>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* ── Detail Drawer ───────────────────────────────── */}
      <AnimatePresence>
        {selectedInstanceId && (
          <>
            {/* Backdrop */}
            <motion.div
              key="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={() => { setSelectedInstanceId(null); setDrawerDetail(null); }}
            />
            {/* Panel */}
            <motion.aside
              key="drawer-panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                <span className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Chi tiết yêu cầu</span>
                <button
                  onClick={() => { setSelectedInstanceId(null); setDrawerDetail(null); }}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
                >
                  <Icon icon="heroicons:x-mark" className="size-5 text-stone-500" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {drawerLoading && (
                  <div className="flex flex-col items-center justify-center h-64 gap-3">
                    <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-stone-400">Đang tải...</p>
                  </div>
                )}

                {!drawerLoading && drawerDetail && (
                  <div className="p-6 space-y-6">
                    {/* Hero image */}
                    <div className="w-full h-48 rounded-2xl overflow-hidden bg-stone-100">
                      {drawerDetail.thumbnail?.publicURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={drawerDetail.thumbnail.publicURL} alt={drawerDetail.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <Icon icon="heroicons:photo" className="size-16" />
                        </div>
                      )}
                    </div>

                    {/* Title + status */}
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <h2 className="text-xl font-bold text-stone-900 flex-1 leading-snug">{drawerDetail.title || drawerDetail.tourName}</h2>
                        <TourStatusBadge status={drawerDetail.status} />
                      </div>
                      <p className="text-sm text-stone-400 font-mono">{drawerDetail.tourInstanceCode}</p>
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: "heroicons:calendar", label: "Ngày khởi hành", value: formatDate(drawerDetail.startDate) },
                        { icon: "heroicons:calendar-days", label: "Ngày kết thúc", value: formatDate(drawerDetail.endDate) },
                        { icon: "heroicons:clock", label: "Thời gian", value: `${drawerDetail.durationDays} ngày` },
                        { icon: "heroicons:user-group", label: "Số khách", value: `${drawerDetail.currentParticipation}/${drawerDetail.maxParticipation}` },
                        { icon: "heroicons:map-pin", label: "Địa điểm", value: drawerDetail.location || "N/A" },
                        { icon: "heroicons:banknotes", label: "Giá cơ bản", value: new Intl.NumberFormat("vi-VN").format(drawerDetail.basePrice) + " ₫" },
                      ].map(({ icon, label, value }) => (
                        <div key={label} className="bg-stone-50 rounded-xl p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-stone-400">
                            <Icon icon={icon} className="size-3.5" />
                            {label}
                          </div>
                          <p className="text-sm font-semibold text-stone-800 truncate">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Customization notes */}
                    {drawerDetail.customizationNotes && (
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
                          <Icon icon="heroicons:chat-bubble-left-ellipsis" className="size-4" />
                          Ghi chú tuỳ chỉnh từ khách
                        </div>
                        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{drawerDetail.customizationNotes}</p>
                      </div>
                    )}

                    {/* Current base price */}
                    {drawerDetail.basePrice != null && drawerDetail.basePrice > 0 && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Giá hiện tại (per person)</p>
                        <p className="text-lg font-bold text-green-700">{new Intl.NumberFormat("vi-VN").format(drawerDetail.basePrice)} ₫</p>
                      </div>
                    )}

                    {/* Included services */}
                    {drawerDetail.includedServices?.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Dịch vụ bao gồm</p>
                        <div className="flex flex-wrap gap-2">
                          {drawerDetail.includedServices.map((s) => (
                            <span key={s} className="px-2.5 py-1 bg-stone-100 text-stone-700 text-xs rounded-lg">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!drawerLoading && drawerDetail && (
                <div className="shrink-0 border-t border-stone-100 p-4 flex gap-3">
                  <button
                    onClick={() => { setSelectedInstanceId(null); setDrawerDetail(null); }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => router.push(role === "tour-operator" ? `/tour-operator/custom-tour-requests/${drawerDetail.id}` : `/manager/dashboard/custom-tour-requests/${drawerDetail.id}`)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    Xem đầy đủ
                    <Icon icon="heroicons:arrow-top-right-on-square" className="size-4" />
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

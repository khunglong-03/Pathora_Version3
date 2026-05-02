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
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};



/* (TourStatusBadge imported from @/components/ui) */

const AUTH_FAILURE_STATUSES = new Set([401, 403]);

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
        setCurrentPage(1);
        const result = await tourInstanceService.getAllInstances(
          debouncedSearchText || undefined,
          statusFilter,
          1,
          pageSize,
          excludePast,
          true // wantsCustomization
        );
        if (!active) return;
        if (result) {
          const allInstances = result.data ?? [];
          // Force visibility to private since this is custom tour requests
          const filteredInstances = allInstances.filter(
            (inst) => inst.instanceType?.toLowerCase() === "private"
          );

          setInstances(filteredInstances);
          setTotalItems(filteredInstances.length);
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
    pageSize,
    reloadToken,
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
      <main id="main-content" className="p-6 space-y-8 max-w-[87.5rem] mx-auto">
        {/* ── Page Header ────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">
              Custom Tour Requests
            </h1>
            <p className="text-sm text-stone-500">
              Manage draft instances that have customer customization requests.
            </p>
          </div>
        </motion.div>



        {/* ── Search & Filter ────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          layout
          className="bg-white border border-stone-200/50 rounded-[2rem] p-3 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          <div className="relative flex-1 w-full min-w-[300px]">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={safeT(
                "placeholder.searchByTitleLocationCountry",
                "Search scheduled instances...",
              )}
              className="w-full pl-12 pr-10 py-3 rounded-2xl border-none bg-stone-50/50 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all duration-300"
            />
            <AnimatePresence>
              {searchText && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-stone-200 text-stone-500 hover:bg-stone-300 hover:text-stone-700 rounded-full transition-colors">
                  <Icon icon="heroicons:x-mark" className="size-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-stone-100 pt-3 md:pt-0 md:pl-4">
            <div className="relative flex-1 md:flex-none min-w-[140px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-4 py-3 pl-10 rounded-2xl border-none bg-stone-50/50 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all duration-300 cursor-pointer">
                <option value="all">Tất cả</option>
                <option value="draft">Bản nháp (Draft)</option>
                <option value="pendingmanagerreview">Chờ Quản lý duyệt</option>
                <option value="pendingcustomerapproval">Chờ Khách hàng chốt</option>
                <option value="pendingadjustment">Cần điều chỉnh</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã huỷ</option>
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


            
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 cursor-pointer min-w-max ml-2">
              <input 
                type="checkbox" 
                checked={excludePast} 
                onChange={(e) => setExcludePast(e.target.checked)} 
                className="size-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500/20 transition-colors"
               />
              {safeT("tourInstance.filter.excludePast", "Ẩn tour đã qua")}
            </label>
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
              className="space-y-4">
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
                        className="bg-white border border-stone-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer group">
                        
                        <div className="flex items-start md:items-center gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden border border-stone-200/50 bg-amber-50">
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
                              <h3 className="text-lg font-bold text-stone-900 truncate">
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

                        <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 border-t md:border-t-0 border-stone-100 pt-3 md:pt-0">
                          <div className="flex items-center gap-1.5 text-sm font-medium text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200/50">
                            <Icon icon="heroicons:user-group" className="w-4 h-4 text-stone-400" />
                            {inst.maxParticipation} khách
                          </div>
                          
                          <div className="text-sm font-semibold text-amber-600 flex items-center gap-1 group-hover:text-amber-700 transition-colors">
                            {safeT("common.viewDetails", "Details")}
                            <Icon
                              icon="heroicons:arrow-right"
                              className="size-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                            />
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
          <div className="flex items-center justify-between bg-white border border-stone-200/50 rounded-[2.5rem] p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <span className="text-sm text-stone-600">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="px-4 py-1.5 rounded-xl text-sm text-stone-600 disabled:opacity-50 hover:bg-stone-100 active:scale-[0.98] transition-all">
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                className="px-4 py-1.5 rounded-xl text-sm text-stone-600 disabled:opacity-50 hover:bg-stone-100 active:scale-[0.98] transition-all">
                Next
              </button>
            </div>
          </div>
        )}
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

                    {/* Final price */}
                    {drawerDetail.finalSellPrice != null && (
                      <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                        <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-1">Giá chốt (co-design)</p>
                        <p className="text-lg font-bold text-green-700">{new Intl.NumberFormat("vi-VN").format(drawerDetail.finalSellPrice)} ₫</p>
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

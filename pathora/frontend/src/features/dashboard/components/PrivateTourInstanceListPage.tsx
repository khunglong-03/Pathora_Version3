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
import { NormalizedTourInstanceVm } from "@/types/tour";
import { getCookie } from "@/utils/cookie";

/* ── Animation Variants ───────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 120, damping: 20 },
  },
};

const AUTH_FAILURE_STATUSES = new Set([401, 403]);

/* ── Transport Approval helpers ───────────────────────────── */
function getTransportApprovalInfo(status?: number) {
  switch (status) {
    case 2:
      return { label: "Đã duyệt", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "heroicons:check-circle" };
    case 3:
      return { label: "Từ chối", color: "bg-red-50 text-red-700 border-red-200", icon: "heroicons:x-circle" };
    default:
      return { label: "Chờ duyệt", color: "bg-orange-50 text-orange-700 border-orange-200", icon: "heroicons:clock" };
  }
}

/* ══════════════════════════════════════════════════════════════
   PrivateTourInstanceListPage
   Focused on approval workflow — no stat cards, no price,
   no participant progress bars. Clean and compact.
   ══════════════════════════════════════════════════════════════ */
type DataState = "loading" | "ready" | "empty" | "error";

export function PrivateTourInstanceListPage() {
  const basePath = "/tour-operator/tour-instances/private";
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
  const [dataState, setDataState] = useState<DataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [excludePast, setExcludePast] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [reloadToken, setReloadToken] = useState(0);

  /* ── Fetch instances ─────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    const doFetch = async () => {
      const hasToken = getCookie("access_token") || getCookie("refresh_token");
      if (!hasToken) {
        setInstances([]);
        setDataState("error");
        setErrorMessage(
          safeT(
            "tourInstance.form.error.authFailure",
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
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
          false,
        );
        if (!active) return;
        if (result) {
          const allInstances = result.data ?? [];
          // Only private instances that have been deposited/paid (exclude draft/pendingadjustment)
          const filtered = allInstances.filter(
            (inst) => {
              const st = inst.status?.toLowerCase() || "";
              return inst.instanceType?.toLowerCase() === "private" && 
                     st !== "draft" && 
                     st !== "pendingadjustment";
            }
          );
          setInstances(filtered);
          setTotalItems(filtered.length);
          setDataState(filtered.length === 0 ? "empty" : "ready");
        }
      } catch (error: unknown) {
        if (!active) return;
        const status = getTourInstanceRequestStatus(error);
        const handledError = handleApiError(error);
        const isAuthError = AUTH_FAILURE_STATUSES.has(status ?? 0);
        if (!isAuthError) {
          console.error("Failed to fetch private tour instances:", handledError.message);
        }
        setInstances([]);
        setDataState("error");
        setErrorMessage(
          isAuthError
            ? safeT("tourInstance.form.error.authFailure", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
            : handledError.message,
        );
      }
    };
    void doFetch();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText, statusFilter, excludePast, pageSize, reloadToken]);

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <main id="main-content" className="p-6 space-y-6 max-w-[87.5rem] mx-auto">
      {/* ── Page Header ────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">
          {safeT("tourInstance.privateTitle", "Tour Riêng Tư")}
        </h1>
        <p className="text-sm text-stone-500">
          {safeT("tourInstance.privateApprovalDesc", "Quản lý duyệt xe & dịch vụ cho các tour riêng tư")}
        </p>
      </motion.div>

      {/* ── Search & Filter ────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="bg-white border border-stone-200/50 rounded-2xl p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 w-full min-w-[240px]">
          <Icon
            icon="heroicons:magnifying-glass"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-stone-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder={safeT("placeholder.searchPrivateTours", "Tìm kiếm tour...")}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border-none bg-stone-50/50 text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all duration-200"
          />
          <AnimatePresence>
            {searchText && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchText("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-stone-200 text-stone-500 hover:bg-stone-300 rounded-full transition-colors"
              >
                <Icon icon="heroicons:x-mark" className="size-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-stone-100 pt-3 md:pt-0 md:pl-3">
          <div className="relative flex-1 md:flex-none min-w-[130px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none px-3.5 py-2.5 pl-9 rounded-xl border-none bg-stone-50/50 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pendingapproval">Chờ duyệt</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="available">Sẵn sàng</option>
              <option value="inprogress">Đang diễn ra</option>
              <option value="cancelled">Đã huỷ</option>
              <option value="completed">Hoàn thành</option>
            </select>
            <Icon
              icon="heroicons:funnel"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none"
            />
            <Icon
              icon="heroicons:chevron-down"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-stone-400 pointer-events-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-stone-600 cursor-pointer min-w-max">
            <input
              type="checkbox"
              checked={excludePast}
              onChange={(e) => setExcludePast(e.target.checked)}
              className="size-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500/20 transition-colors"
            />
            Ẩn tour đã qua
          </label>
        </div>
      </motion.div>

      {/* ── Error State ────────────────────────────────── */}
      {dataState === "error" && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="p-6 bg-red-50/50 border border-red-200 border-dashed rounded-2xl"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-red-800">
                Không thể tải dữ liệu
              </h2>
              <p className="text-sm text-red-600 mt-1 max-w-[65ch]">
                {errorMessage ?? "Đã xảy ra lỗi khi tải danh sách tour. Vui lòng thử lại."}
              </p>
            </div>
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all"
            >
              Thử lại
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Loading State ──────────────────────────────── */}
      {dataState === "loading" && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white/60 border border-stone-200/50 rounded-2xl p-5 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-stone-200/50 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-1/3 h-5 bg-stone-200/50 animate-pulse rounded-md" />
                <div className="w-2/3 h-4 bg-stone-200/50 animate-pulse rounded-md" />
              </div>
              <div className="w-20 h-8 bg-stone-200/50 animate-pulse rounded-xl shrink-0" />
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Empty state ────────────────────────────────── */}
      {dataState === "empty" && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="p-14 text-center border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50/50 flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white border border-stone-200/50 shadow-sm flex items-center justify-center mb-5">
            <Icon icon="heroicons:inbox" className="size-7 text-stone-300" />
          </div>
          <h2 className="text-lg font-bold text-stone-800 tracking-tight">
            Không có tour riêng tư
          </h2>
          <p className="text-sm text-stone-500 mt-2 max-w-[40ch] mx-auto leading-relaxed">
            Không tìm thấy tour riêng tư nào phù hợp với bộ lọc hiện tại.
          </p>
        </motion.div>
      )}

      {/* ── Instance List ──────────────────────────────── */}
      {dataState === "ready" && instances.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence>
            {instances.map((inst) => {
              const transportInfo = getTransportApprovalInfo(inst.transportApprovalStatus);
              const isPendingApproval = inst.status === "pendingapproval";

              return (
                <motion.div
                  variants={itemVariants}
                  layout
                  layoutId={`private-${inst.id}`}
                  key={inst.id}
                  onClick={() => router.push(`${basePath}/${inst.id}`)}
                  className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group ${
                    isPendingApproval
                      ? "border-orange-200/70 bg-orange-50/20"
                      : "border-stone-200/50"
                  }`}
                >
                  {/* Left: thumbnail + core info */}
                  <div className="flex items-start md:items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden border border-stone-200/50 bg-stone-100">
                      {inst.thumbnail?.publicURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={inst.thumbnail.publicURL}
                          alt={inst.title || inst.tourName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <Icon icon="heroicons:photo" className="size-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <h3 className="text-base font-bold text-stone-900 truncate">
                          {inst.title || inst.tourName}
                        </h3>
                        <TourStatusBadge status={inst.status} />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
                        <span className="font-medium text-stone-600">
                          {inst.tourInstanceCode}
                        </span>
                        <span className="hidden sm:inline text-stone-300">•</span>
                        <span className="flex items-center gap-1">
                          <Icon icon="heroicons:calendar" className="size-3.5" />
                          {formatDate(inst.startDate)}
                        </span>
                        <span className="hidden sm:inline text-stone-300">•</span>
                        <span className="flex items-center gap-1">
                          <Icon icon="heroicons:clock" className="size-3.5" />
                          {inst.durationDays} ngày
                        </span>
                        <span className="hidden sm:inline text-stone-300">•</span>
                        <span className="flex items-center gap-1">
                          <Icon icon="heroicons:user-group" className="size-3.5" />
                          {inst.maxParticipation} khách
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: approval status + action */}
                  <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 border-stone-100 pt-3 md:pt-0">
                    {/* Transport approval badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${transportInfo.color}`}
                    >
                      <Icon icon={transportInfo.icon} className="size-3.5" />
                      VT: {transportInfo.label}
                    </span>

                    {/* Action link */}
                    <div className="text-sm font-semibold text-amber-600 flex items-center gap-1 group-hover:text-amber-700 transition-colors whitespace-nowrap">
                      {isPendingApproval
                        ? safeT("common.review", "Duyệt")
                        : safeT("common.viewDetails", "Chi tiết")}
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

      {/* ── Pagination ─────────────────────────────────── */}
      {(dataState === "ready" || dataState === "empty") && totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-stone-200/50 rounded-2xl p-4 shadow-sm">
          <span className="text-sm text-stone-600">
            Trang {currentPage} / {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              className="px-4 py-1.5 rounded-xl text-sm text-stone-600 disabled:opacity-50 hover:bg-stone-100 active:scale-[0.98] transition-all"
            >
              Trước
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              className="px-4 py-1.5 rounded-xl text-sm text-stone-600 disabled:opacity-50 hover:bg-stone-100 active:scale-[0.98] transition-all"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

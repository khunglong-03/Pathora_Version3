"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { PlusIcon, MagnifyingGlassIcon, MapTrifoldIcon, CaretRightIcon, WarningCircleIcon, ImageSquareIcon } from "@phosphor-icons/react";
import { motion, AnimatePresence, Variants } from "framer-motion";

import { useDebounce } from "@/hooks/useDebounce";
import { useTourOperatorTourList } from "../hooks/useTourOperatorTourList";
import { TourStatusMap } from "@/types/tour";
import { canTourOperatorEditTour } from "./editableTourStatus";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "3", label: "Pending" },
  { key: "1", label: "Active" },
  { key: "4", label: "Rejected" },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; ring: string }> = {
  "1": { bg: "bg-emerald-500/10", text: "text-emerald-700", ring: "ring-emerald-500/20" },
  "2": { bg: "bg-slate-500/10", text: "text-slate-700", ring: "ring-slate-500/20" },
  "3": { bg: "bg-amber-500/10", text: "text-amber-700", ring: "ring-amber-500/20" },
  "4": { bg: "bg-rose-500/10", text: "text-rose-700", ring: "ring-rose-500/20" },
};

// --- FRAGMENT ANIMATIONS ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
};

const GridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-200/60 shadow-sm">
        <div className="aspect-[16/9] bg-slate-100 animate-pulse" />
        <div className="p-5 flex flex-col gap-3">
          <div className="h-5 bg-slate-100 animate-pulse rounded-md w-3/4" />
          <div className="h-4 bg-slate-100 animate-pulse rounded-md w-1/4" />
          <div className="h-10 bg-slate-100 animate-pulse rounded-xl w-full mt-2" />
        </div>
      </div>
    ))}
  </div>
);

export function TourOperatorTourListPage() {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tourScope, setTourScope] = useState("all");
  const [continent, setContinent] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [mounted, setMounted] = useState(false);
  const debouncedSearch = useDebounce(searchText, 400);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { tours, total, state, errorMessage } = useTourOperatorTourList({
    searchText: debouncedSearch,
    statusFilter,
    tourScope,
    continent,
    pageNumber: currentPage,
    pageSize: 12, // Increased page size for grid layout
  });

  const reload = () => setReloadToken((v) => v + 1);

  if (!mounted) return null;

  return (
    <div className="max-w-[1400px] w-full mx-auto p-6 lg:p-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-950 tracking-tighter">
            {t("tourOperator.myTours", "Tours")}
          </h1>
          <p className="text-base text-zinc-500 max-w-[65ch] leading-relaxed">
            {total > 0
              ? `${total} ${t("tourOperator.tourCount", "tour(s)")} trong danh sách của bạn.`
              : t("tourOperator.manageTours", "Quản lý và cập nhật những bản thiết kế chuyến đi của bạn.")}
          </p>
        </div>
        <Link
          href="/tour-operator/tours/create"
          className="flex items-center gap-2 px-6 py-3 bg-zinc-950 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors shadow-sm active:scale-[0.98]"
        >
          <PlusIcon size={18} weight="bold" />
          {t("tourOperator.actions.create", "Tạo Tour")}
        </Link>
      </div>

      {/* Control Bar (Search & Tabs) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        {/* Segmented Status Tabs */}
        <div className="flex bg-zinc-100/80 p-1.5 rounded-2xl w-fit">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setCurrentPage(1);
                }}
                className={`relative px-5 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-zinc-950 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-950"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 bg-white rounded-xl"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <span className="relative z-10">{t(`tourOperator.tabs.${tab.key}`, tab.label)}</span>
              </button>
            );
          })}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <select
            value={tourScope}
            onChange={(e) => {
              setTourScope(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-3 bg-white text-sm border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none transition-all shadow-sm"
          >
            <option value="all">{t("tourOperator.scopes.all", "Tất cả vùng")}</option>
            <option value="1">{t("tourOperator.scopes.domestic", "Trong nước")}</option>
            <option value="2">{t("tourOperator.scopes.international", "Quốc tế")}</option>
          </select>

          <select
            value={continent}
            onChange={(e) => {
              setContinent(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-3 bg-white text-sm border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none transition-all shadow-sm"
          >
            <option value="all">{t("tourOperator.continents.all", "Tất cả châu lục")}</option>
            <option value="1">{t("tourOperator.continents.asia", "Châu Á")}</option>
            <option value="2">{t("tourOperator.continents.europe", "Châu Âu")}</option>
            <option value="3">{t("tourOperator.continents.africa", "Châu Phi")}</option>
            <option value="4">{t("tourOperator.continents.americas", "Châu Mỹ")}</option>
            <option value="5">{t("tourOperator.continents.oceania", "Châu Đại Dương")}</option>
            <option value="6">{t("tourOperator.continents.antarctica", "Châu Nam Cực")}</option>
          </select>

          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder={t("tourOperator.searchPlaceholder", "Tìm kiếm theo tên hoặc mã...")}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-white text-sm border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-zinc-950 focus:border-transparent outline-none transition-all placeholder:text-zinc-400 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Content States */}
      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GridSkeleton />
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-rose-50/50">
              <WarningCircleIcon size={32} weight="duotone" className="text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-950 tracking-tight mb-2">
              {t("tourOperator.messages.errorLoadingTitle", "Không thể tải dữ liệu")}
            </h3>
            <p className="text-sm text-zinc-500 mb-6 max-w-md">
              {errorMessage ?? t("tourOperator.messages.errorLoading", "Đã xảy ra lỗi khi kết nối với máy chủ. Vui lòng thử lại sau.")}
            </p>
            <button
              onClick={() => void reload()}
              className="px-6 py-2.5 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-full hover:bg-rose-100 transition-colors active:scale-95"
            >
              {t("tourOperator.actions.retry", "Thử lại")}
            </button>
          </motion.div>
        )}

        {state === "empty" && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-200 rounded-[2.5rem] bg-zinc-50/50"
          >
            <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mb-6 ring-1 ring-zinc-200/50">
              <MapTrifoldIcon size={40} weight="thin" className="text-zinc-300" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-950 tracking-tight mb-3">
              {t("tourOperator.empty.title", "Chưa có Tour nào")}
            </h3>
            <p className="text-base text-zinc-500 mb-8 max-w-sm leading-relaxed">
              {searchText 
                ? t("tourOperator.empty.search", "Không tìm thấy Tour nào khớp với tìm kiếm của bạn.") 
                : t("tourOperator.empty.description", "Hãy bắt đầu dự án đầu tiên của bạn để thiết kế những trải nghiệm du lịch tuyệt vời.")}
            </p>
            {!searchText && (
              <Link
                href="/tour-operator/tours/create"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-950 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors shadow-lg active:scale-95"
              >
                <PlusIcon size={18} weight="bold" />
                {t("tourOperator.actions.createFirst", "Bắt đầu thiết kế")}
              </Link>
            )}
          </motion.div>
        )}

        {state === "ready" && (
          <motion.div
            key="ready-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8"
          >
            {tours.map((tour) => {
              const badgeStyle = STATUS_BADGE[tour.status] ?? STATUS_BADGE["2"];
              const statusName = TourStatusMap[Number(tour.status)] ?? tour.status;

              return (
                <motion.div
                  key={tour.id}
                  variants={itemVariants}
                  className="group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-zinc-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  {/* Aspect Image Container */}
                  <div className="relative aspect-[16/9] w-full bg-zinc-100 overflow-hidden">
                    {/* Status Badge (Liquid Glass) */}
                    <div className={`absolute top-4 left-4 z-10 font-sans tracking-tight px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-md ring-1 ring-inset ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.ring}`}>
                      {statusName}
                    </div>

                    {tour.thumbnail?.publicURL ? (
                      <img
                        src={tour.thumbnail.publicURL}
                        alt={tour.tourName}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                    <div className="w-full h-full bg-stone-100 flex flex-col justify-center items-center">
                      <ImageSquareIcon className="size-8 text-stone-300 mb-2 drop-shadow-sm" weight="duotone" />
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                        {t("common.noImage", "NO IMAGE")}
                      </span>
                    </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-col flex-1 p-6">
                    <div className="flex-1">
                      <div className="text-xs font-mono font-medium tracking-wider text-zinc-400 mb-2 uppercase">
                        {tour.tourCode}
                      </div>
                      <h3 className="text-lg font-bold text-zinc-950 tracking-tight leading-snug line-clamp-2 mb-2">
                        {tour.tourName}
                      </h3>
                      {tour.shortDescription && (
                        <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                          {tour.shortDescription}
                        </p>
                      )}
                    </div>
                    
                    {/* Action Footer */}
                    <div className="mt-6 pt-5 flex items-center justify-between border-t border-zinc-100">
                      <span className="text-xs font-medium text-zinc-400">
                        {new Date(tour.createdOnUtc).toLocaleDateString("vi-VN")}
                      </span>
                      <div className="flex space-x-2">
                        <Link
                          href={`/tour-operator/tours/${tour.id}`}
                          className="p-2 text-zinc-500 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-950 rounded-xl transition-colors active:scale-90"
                          aria-label="View Details"
                        >
                          <CaretRightIcon size={20} weight="bold" />
                        </Link>
                        {canTourOperatorEditTour(tour.status) && (
                          <Link
                            href={`/tour-operator/tours/${tour.id}/edit`}
                            className="px-4 py-2 text-sm font-semibold text-zinc-950 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors active:scale-95 border border-zinc-200/50"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {state === "ready" && total > 0 && (
        <div className="mt-12 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-6 py-2.5 text-sm font-medium bg-white border border-zinc-200 rounded-full disabled:opacity-40 hover:bg-zinc-50 hover:text-zinc-950 transition-colors shadow-sm active:scale-95"
          >
            {t("tourOperator.prev", "Quay lại")}
          </button>
          <span className="text-sm font-medium tracking-tight text-zinc-500">
            {currentPage} / {Math.max(1, Math.ceil(total / 12))}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= Math.ceil(total / 12)}
            className="px-6 py-2.5 text-sm font-medium bg-white border border-zinc-200 rounded-full disabled:opacity-40 hover:bg-zinc-50 hover:text-zinc-950 transition-colors shadow-sm active:scale-95"
          >
            {t("tourOperator.next", "Tiếp theo")}
          </button>
        </div>
      )}
    </div>
  );
}

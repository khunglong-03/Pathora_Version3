"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, TourStatusBadge } from "@/components/ui";

import { tourInstanceService } from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate } from "@/utils/format";
import {
  NormalizedTourInstanceVm,
  TourInstanceStats,
} from "@/types/tour";
import { AdminSidebar, TopBar } from "./AdminSidebar";

/* ── Animation Variants ───────────────────────────────────── */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

/* ══════════════════════════════════════════════════════════════
   Stat Card
   ══════════════════════════════════════════════════════════════ */
interface StatCardProps {
  label: string;
  value: number;
  accent: "stone" | "green" | "amber" | "red";
  icon: string;
}

function StatCard({ label, value, accent, icon }: StatCardProps) {
  const configs = {
    stone: { bg: "bg-stone-100", text: "text-stone-600", border: "border-stone-300" },
    green: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-400" },
    amber: { bg: "bg-amber-50", text: "text-amber-500", border: "border-amber-400" },
    red: { bg: "bg-red-50", text: "text-red-500", border: "border-red-400" },
  };
  const c = configs[accent];

  return (
    <motion.div
      variants={itemVariants}
      className={`relative overflow-hidden bg-white rounded-[2.5rem] border border-stone-200/50 p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 shadow-[inset_0_1px_0_rgba(255,255,255,1)] group`}>
      <div className={`absolute -inset-1 blur-2xl opacity-10 transition-opacity duration-500 group-hover:opacity-30 ${c.bg} mix-blend-multiply`} />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-stone-400">{label}</p>
          <p className="text-4xl font-bold tracking-tight text-stone-900 mt-2 data-value">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${c.bg} border border-white/50 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon icon={icon} className={`size-6 ${c.text}`} />
        </div>
      </div>
    </motion.div>
  );
}

/* (TourStatusBadge imported from @/components/ui) */

/* ══════════════════════════════════════════════════════════════
   Participants Cell
   ══════════════════════════════════════════════════════════════ */
function ParticipantsCell({
  registered,
  max,
}: {
  registered: number;
  max: number;
}) {
  const pct = max > 0 ? (registered / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon icon="heroicons:user-group" className="size-4 text-stone-400" />
        <span className="text-sm font-semibold text-stone-700 tracking-tight">
          {registered}/{max}
        </span>
      </div>
      <div className="w-24 h-1.5 bg-stone-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TourInstanceListPage - Main Export
   ══════════════════════════════════════════════════════════════ */
type InstanceListDataState = "loading" | "ready" | "empty" | "error";

export function TourInstanceListPage() {
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
  const [instances, setInstances] = useState<NormalizedTourInstanceVm[]>([]);
  const [dataState, setDataState] = useState<InstanceListDataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<TourInstanceStats>({
    totalInstances: 0,
    available: 0,
    confirmed: 0,
    soldOut: 0,
  });
  const pageSize = 10;
  const [reloadToken, setReloadToken] = useState(0);

  /* ── Fetch instances ─────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    const doFetchInstances = async () => {
      try {
        setDataState("loading");
        setErrorMessage(null);
        setCurrentPage(1);
        const result = await tourInstanceService.getAllInstances(
          debouncedSearchText || undefined,
          statusFilter,
          1,
          pageSize,
        );
        if (!active) return;
        if (result) {
          const allInstances = result.data ?? [];
          const filteredInstances = visibilityFilter === "all"
            ? allInstances
            : allInstances.filter((inst) => inst.instanceType?.toLowerCase() === visibilityFilter);

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
        const handledError = handleApiError(error);
        console.error("Failed to fetch tour instances:", handledError.message);
        setInstances([]);
        setDataState("error");
        setErrorMessage(handledError.message);
      }
    };
    void doFetchInstances();
    return () => { active = false; };
  }, [debouncedSearchText, statusFilter, visibilityFilter, pageSize, reloadToken]);

  /* ── Fetch stats ──────────────────────────────────────────── */
  useEffect(() => {
    let statsActive = true;
    const doFetchStats = async () => {
      try {
        const result = await tourInstanceService.getStats();
        if (!statsActive) return;
        if (result) setStats(result);
      } catch { /* Fallback */ }
    };
    void doFetchStats();
    return () => { statsActive = false; };
  }, [reloadToken]);

  /* ── Pagination ───────────────────────────────────────────── */
  const totalPages = Math.ceil(totalItems / pageSize);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN").format(amount) + " VND";

  return (
    <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <main id="main-content" className="p-6 space-y-8 max-w-[87.5rem] mx-auto">
        {/* ── Page Header ────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">
              {safeT("tourInstance.title", "Tour Instances")}
            </h1>
            <p className="text-sm text-stone-500">
              {safeT("tourInstance.description", "Manage scheduled tour instances and track departures")}
            </p>
          </div>
          <button
            onClick={() => router.push("/manager/tour-instances/create")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-sm font-semibold rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 shrink-0">
            <Icon icon="heroicons:plus" className="size-4" />
            {safeT("tourInstance.createInstance", "Create Instance")}
          </button>
        </motion.div>

        {/* ── Stat Cards ─────────────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={safeT("tourInstance.totalInstances", "Total Instances")}
            value={stats.totalInstances}
            accent="stone"
            icon="heroicons:calendar-days"
          />
          <StatCard
            label={safeT("tourInstance.available", "Available")}
            value={stats.available}
            accent="green"
            icon="heroicons:check-circle"
          />
          <StatCard
            label={safeT("tourInstance.confirmed", "Confirmed")}
            value={stats.confirmed}
            accent="amber"
            icon="heroicons:clipboard-document-check"
          />
          <StatCard
            label={safeT("tourInstance.soldOut", "Sold Out")}
            value={stats.soldOut}
            accent="red"
            icon="heroicons:x-circle"
          />
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
              placeholder={safeT("placeholder.searchByTitleLocationCountry", "Search scheduled instances...")}
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
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="pendingapproval">Pending Approval</option>
                <option value="confirmed">Confirmed</option>
                <option value="soldout">Sold Out</option>
                <option value="inprogress">In Progress</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <Icon icon="heroicons:chevron-down" className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
              <Icon icon="heroicons:funnel" className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            </div>
            
            <div className="relative flex-1 md:flex-none min-w-[140px]">
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="w-full appearance-none px-4 py-3 pl-10 rounded-2xl border-none bg-stone-50/50 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all duration-300 cursor-pointer">
                <option value="all">All Visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
              <Icon icon="heroicons:chevron-down" className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
              <Icon icon="heroicons:eye" className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* ── Lists ──────────────────────────────────────── */}
        <div className="mt-8 space-y-4 relative z-0">
          {/* Error State */}
          {dataState === "error" && (
            <motion.div variants={itemVariants} initial="hidden" animate="show" className="p-8 bg-red-50/50 border border-red-200 border-dashed rounded-[2.5rem]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-red-800">
                    {safeT("tourInstance.form.error.title", "Could not load tour instances")}
                  </h2>
                  <p className="text-sm text-red-600 mt-1 max-w-[65ch]">
                    {errorMessage ?? safeT("tourInstance.form.error.fallback", "Unable to load tour instance data. Please try again.")}
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
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <motion.div key={i} variants={itemVariants} className="bg-white/60 border border-stone-200/50 rounded-[2.5rem] p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
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
            <motion.div variants={itemVariants} initial="hidden" animate="show" layout className="p-16 text-center border-2 border-dashed border-stone-200 rounded-[2.5rem] bg-stone-50/50 flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-[2rem] bg-white border border-stone-200/50 shadow-sm flex items-center justify-center mb-6">
                <Icon icon="heroicons:calendar-days" className="size-8 text-stone-300" />
              </div>
              <h2 className="text-xl font-bold text-stone-800 tracking-tight">
                {safeT("tourInstance.form.empty.title", "No scheduled instances")}
              </h2>
              <p className="text-sm text-stone-500 mt-2 max-w-[50ch] mx-auto leading-relaxed">
                {safeT("tourInstance.form.empty.description", "You haven't scheduled any tour departures matching this filter. Clear filters or create a new instance to get started.")}
              </p>
            </motion.div>
          )}

          {/* Intelligent List Mode */}
          {dataState === "ready" && instances.length > 0 && (
            <motion.div variants={containerVariants} initial="hidden" animate="show" layout className="space-y-4">
              <AnimatePresence>
                {instances.map((inst) => {
                  const isPublic = inst.instanceType?.toLowerCase() === "public";
                  return (
                    <motion.div
                      variants={itemVariants}
                      layout
                      layoutId={`instance-${inst.id}`}
                      key={inst.id}
                      className="bg-white border border-stone-200/50 rounded-[2.5rem] p-4 sm:p-5 shadow-[0_12px_24px_-10px_rgba(0,0,0,0.03)] hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col lg:flex-row gap-6 lg:items-center relative group filter-none">
                      
                      {/* 1. Media Zone */}
                      <div className="relative w-full lg:w-32 h-44 lg:h-32 rounded-[1.5rem] overflow-hidden bg-stone-100 border border-stone-200/80 shrink-0">
                        {inst.thumbnail?.publicURL ? (
                          <img
                            src={inst.thumbnail.publicURL}
                            alt={inst.title || inst.tourName}
                            className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Icon icon="heroicons:photo" className="size-8 text-stone-300" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <TourStatusBadge status={inst.status} />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold shadow-sm backdrop-blur-md ${isPublic ? "bg-emerald-500/90 text-white" : "bg-stone-800/90 text-stone-100"}`}>
                            {isPublic ? safeT("tourInstance.public", "Public") : safeT("tourInstance.private", "Private")}
                          </span>
                        </div>
                      </div>

                      {/* 2. Primary Info Node */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center space-y-3">
                        <div>
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">{inst.tourInstanceCode}</p>
                          <h3 className="text-lg md:text-xl font-bold text-stone-900 tracking-tight leading-tight line-clamp-2">
                            {inst.title || inst.tourName}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-stone-600">
                           <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/60">
                             <Icon icon="heroicons:map-pin" className="size-4 text-stone-400" />
                             <span className="font-medium tracking-tight truncate max-w-[200px]">{inst.location || "N/A"}</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                             <Icon icon="heroicons:swatch" className="size-4 text-stone-400" />
                             <span className="truncate max-w-[150px]">{inst.tourName}</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                             <Icon icon="heroicons:tag" className="size-4 text-stone-400" />
                             <span className="truncate max-w-[120px]">{inst.classificationName}</span>
                           </div>
                        </div>

                        {/* Provider Approval Badges */}
                        {inst.status === "pendingapproval" && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                              inst.hotelApprovalStatus === 2
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : inst.hotelApprovalStatus === 3
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-orange-50 text-orange-700 border border-orange-200"
                            }`}>
                              <Icon icon="heroicons:building-office" className="size-3" />
                              KS: {inst.hotelApprovalStatus === 2 ? "Đã duyệt" : inst.hotelApprovalStatus === 3 ? "Từ chối" : "Chờ duyệt"}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                              inst.transportApprovalStatus === 2
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : inst.transportApprovalStatus === 3
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-orange-50 text-orange-700 border border-orange-200"
                            }`}>
                              <Icon icon="heroicons:truck" className="size-3" />
                              VT: {inst.transportApprovalStatus === 2 ? "Đã duyệt" : inst.transportApprovalStatus === 3 ? "Từ chối" : "Chờ duyệt"}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 3. Timeline / Meta Stack */}
                      <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 shrink-0 lg:w-48 xl:w-56 justify-between lg:justify-center border-t lg:border-t-0 lg:border-l border-stone-100 pt-4 lg:pt-0 lg:pl-6">
                        <div className="flex flex-col gap-1.5">
                           <div className="flex justify-between items-center text-xs text-stone-500">
                             <span className="flex items-center gap-1.5">
                                <Icon icon="heroicons:calendar" className="size-3.5" />
                                {safeT("tourInstance.departure", "Departure")}
                             </span>
                             <span className="font-semibold text-stone-800 tracking-tight">{formatDate(inst.startDate)}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs text-stone-500">
                             <span className="flex items-center gap-1.5">
                                <Icon icon="heroicons:calendar-days" className="size-3.5" />
                                {safeT("tourInstance.endDate", "End Date")}
                             </span>
                             <span className="font-semibold text-stone-800 tracking-tight">{formatDate(inst.endDate)}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs text-stone-500">
                             <span className="flex items-center gap-1.5">
                                <Icon icon="heroicons:clock" className="size-3.5" />
                                {safeT("tourInstance.duration", "Duration")}
                             </span>
                             <span className="font-medium text-stone-700">{inst.durationDays} {safeT("tourInstance.daysUnit", "ngày")}</span>
                           </div>
                        </div>
                        
                        <div className="mt-2 w-full">
                           <ParticipantsCell registered={inst.currentParticipation} max={inst.maxParticipation} />
                        </div>
                      </div>

                      {/* 4. Financial & CTA */}
                      <div className="flex items-center justify-between lg:flex-col lg:items-end gap-4 shrink-0 lg:w-36 justify-center border-t lg:border-t-0 pt-4 lg:pt-0">
                         <div className="text-left lg:text-right">
                           <p className="text-xl md:text-2xl font-black text-amber-500 tracking-tighter leading-none mb-1">
                             {formatCurrency(inst.basePrice)}
                           </p>
                           <p className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase">
                             {safeT("tourInstance.perPerson", "per person")}
                           </p>
                         </div>
                         <button
                           onClick={() => router.push(`/manager/tour-instances/${inst.id}`)}
                           className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-stone-200/80 shadow-sm text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:text-amber-600 hover:border-amber-200/50 transition-all duration-200 active:-translate-y-[1px] group/btn focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                           {safeT("common.viewDetails", "Details")}
                           <Icon icon="heroicons:arrow-right" className="size-4 text-stone-400 group-hover/btn:text-amber-500 transition-colors" />
                         </button>
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
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="px-4 py-1.5 rounded-xl text-sm text-stone-600 disabled:opacity-50 hover:bg-stone-100 active:scale-[0.98] transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </AdminSidebar>
  );
}

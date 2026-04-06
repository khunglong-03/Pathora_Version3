"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Icon, TourStatusBadge } from "@/components/ui";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
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
      className={`relative overflow-hidden bg-white rounded-[2.5rem] border border-stone-200/50 p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-200 hover:shadow-[0_16px_36px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 group`}>
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-40 transition-opacity duration-300 group-hover:opacity-60 ${c.bg}`} />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-stone-900 mt-1 data-value">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${c.bg} border-l-2 ${c.border}`}>
          <Icon icon={icon} className={`size-5 ${c.text}`} />
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
  }, [debouncedSearchText, statusFilter, pageSize, reloadToken]);

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
            onClick={() => router.push("/tour-instances/create")}
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
          className="bg-white border border-stone-200/50 rounded-[2.5rem] p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3 flex-col lg:flex-row">
            <div className="relative flex-1 w-full">
              <Icon
                icon="heroicons:magnifying-glass"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={safeT("placeholder.searchByTitleLocationCountry", "Search by title, location, or country...")}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200/80 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                  <Icon icon="heroicons:x-mark" className="size-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Icon icon="heroicons:funnel" className="size-4 text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl border border-stone-200/80 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer">
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="confirmed">Confirmed</option>
                <option value="soldout">Sold Out</option>
                <option value="inprogress">In Progress</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                className="px-4 py-2.5 rounded-2xl border border-stone-200/80 bg-white text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 cursor-pointer">
                <option value="all">All Visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* ── Table ──────────────────────────────────────── */}
        <div className="bg-white border border-stone-200/50 rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          {/* Error State */}
          {dataState === "error" && (
            <div className="m-6 p-6 bg-white border border-red-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-red-800">
                    {safeT("tourInstance.form.error.title", "Could not load tour instances")}
                  </h2>
                  <p className="text-sm text-red-700 mt-1">
                    {errorMessage ?? safeT("tourInstance.form.error.fallback", "Unable to load tour instance data. Please try again.")}
                  </p>
                </div>
                <button
                  onClick={() => setReloadToken((v) => v + 1)}
                  className="px-3 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-colors">
                  {safeT("common.retry", "Retry")}
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {dataState === "loading" && (
            <div className="p-6">
              <SkeletonTable rows={5} columns={11} />
            </div>
          )}

          {/* Empty state */}
          {dataState === "empty" && instances.length === 0 && (
            <div className="m-6 p-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="heroicons:calendar" className="size-7 text-stone-300" />
              </div>
              <h2 className="text-lg font-bold text-stone-800">
                {safeT("tourInstance.form.empty.title", "No tour instances found")}
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                {safeT("tourInstance.form.empty.description", "There are no scheduled tour instances yet. Create your first instance to get started.")}
              </p>
            </div>
          )}

          {/* Table */}
          {dataState === "ready" && instances.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left px-8 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.thumbnail", "Thumbnail")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.title", "Title")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.tour", "Tour")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.code", "Code")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.location", "Location")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.departure", "Departure")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.duration", "Duration")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.participants", "Participants")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.price", "Price")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.status", "Status")}
                    </th>
                    <th className="text-left px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.instanceType", "Tour Instance Type")}
                    </th>
                    <th className="text-center px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      {safeT("tourInstance.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-stone-100">
                  <AnimatePresence>
                    {instances.map((inst) => (
                      <motion.tr
                        variants={itemVariants}
                        layout
                        key={inst.id}
                        className="hover:bg-amber-50/30 transition-colors duration-150 group">
                        {/* Thumbnail */}
                        <td className="px-8 py-5">
                          <div className="w-14 h-16 rounded-xl border border-stone-200/80 bg-stone-100 flex items-center justify-center shrink-0 overflow-hidden group-hover:border-amber-300 transition-colors duration-200">
                            {inst.thumbnail?.publicURL ? (
                              <img
                                src={inst.thumbnail.publicURL}
                                alt={inst.title || inst.tourName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon icon="heroicons:photo" className="size-5 text-stone-400" />
                            )}
                          </div>
                        </td>

                        {/* Title */}
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-stone-900 max-w-[12.5rem] truncate tracking-tight">
                            {inst.title || inst.tourName}
                          </p>
                        </td>

                        {/* Tour Name */}
                        <td className="px-6 py-5">
                          <p className="text-sm text-stone-700 max-w-[12.5rem] truncate">
                            {inst.tourName}
                          </p>
                        </td>

                        {/* Code */}
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-stone-700 tracking-tight">
                            {inst.tourInstanceCode}
                          </p>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5 text-sm text-stone-600">
                            <Icon icon="heroicons:map-pin" className="size-3.5 text-stone-400 shrink-0" />
                            <span className="max-w-[8.75rem] truncate">{inst.location || "-"}</span>
                          </div>
                        </td>

                        {/* Departure */}
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Icon icon="heroicons:paper-airplane" className="size-3.5 text-amber-500" aria-hidden="true" />
                              <span className="text-sm font-medium text-amber-600 tracking-tight">
                                {formatDate(inst.startDate) || "—"}
                              </span>
                            </div>
                            {inst.startDate !== inst.endDate && (
                              <p className="text-[11px] text-stone-400 ml-5">
                                {safeT("tourInstance.return", "Return")}: {formatDate(inst.endDate) || "—"}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Duration */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-1.5">
                            <Icon icon="heroicons:clock" className="size-4 text-stone-400" />
                            <span className="text-sm text-stone-700 tracking-tight">
                              {inst.durationDays} days
                            </span>
                          </div>
                        </td>

                        {/* Participants */}
                        <td className="px-6 py-5">
                          <ParticipantsCell
                            registered={inst.currentParticipation}
                            max={inst.maxParticipation}
                          />
                        </td>

                        {/* Price */}
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-stone-900 tracking-tight">
                            {formatCurrency(inst.basePrice)}
                          </p>
                          <p className="text-[11px] text-stone-400">{safeT("tourInstance.perPerson", "per person")}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-5">
                          <TourStatusBadge status={inst.status} />
                        </td>

                        {/* Instance Type */}
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${inst.instanceType?.toLowerCase() === "public" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>
                            <span className={`w-2 h-2 rounded-full ${inst.instanceType?.toLowerCase() === "public" ? "bg-emerald-500" : "bg-stone-400"}`} />
                            {inst.instanceType?.toLowerCase() === "public"
                              ? safeT("tourInstance.public", "Public")
                              : safeT("tourInstance.private", "Private")}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => router.push(`/tour-instances/${inst.id}`)}
                              className="p-2.5 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset"
                              title="View Details">
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

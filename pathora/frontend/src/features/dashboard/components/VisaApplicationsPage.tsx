"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { Icon, VisaStatusBadge } from "@/components/ui";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { VisaApplicationDetailModal } from "./VisaApplicationDetailModal";
import { adminService } from "@/api/services/adminService";
import { managerService } from "@/api/services/managerService";
import type { AdminOverview, AdminVisaApplication } from "@/types/admin";
import { buildVisaRowKeys } from "./visaPageLogic";

const FILTER_ICONS: Record<string, string> = {
  all: "heroicons:squares-2x2",
  pending: "heroicons:clock",
  under_review: "heroicons:arrow-path",
  approved: "heroicons:check-circle",
  rejected: "heroicons:x-circle",
};

/* (VisaStatusBadge imported from @/components/ui) */

type VisaDataState = "loading" | "ready" | "empty" | "error";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, type: "spring" as const, stiffness: 100, damping: 20 },
  }),
};

const getBookingVisaStats = (visas: AdminVisaApplication[]) => {
  let approved = 0;
  let pending = 0;
  let rejected = 0;
  let awaitingPayment = 0;

  visas.forEach((v) => {
    const s = v.status ? v.status.toLowerCase() : "";
    if (s === "approved") {
      approved++;
    } else if (s === "rejected") {
      rejected++;
    } else if (s === "awaiting_payment") {
      awaitingPayment++;
    } else {
      pending++;
    }
  });

  return { approved, pending, rejected, awaitingPayment };
};

export function VisaApplicationsPage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isManager = pathname?.startsWith("/manager");
  const [statusFilter, setStatusFilter] = useState("all");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [dataState, setDataState] = useState<VisaDataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setDataState("loading");
      setErrorMessage(null);

      try {
        const result = isManager
          ? await managerService.getOverview()
          : await adminService.getOverview();
        if (!active) return;
        if (!result) {
          setOverview(null);
          setDataState("empty");
        } else {
          setOverview(result);
          const hasVisa =
            result.visaApplications && result.visaApplications.length > 0;
          setDataState(hasVisa ? "ready" : "empty");
        }
      } catch (err) {
        if (!active) return;
        setOverview(null);
        setDataState("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : t("common.visaApplications.error.fallback"),
        );
      }
    };

    void loadOverview();

    return () => {
      active = false;
    };
  }, [reloadToken, t]);

  const visaApplications = overview?.visaApplications ?? [];

  const filteredVisas =
    statusFilter === "all"
      ? visaApplications
      : visaApplications.filter((v) => v.status === statusFilter);
  const visaRowKeys = useMemo(() => {
    return buildVisaRowKeys(filteredVisas);
  }, [filteredVisas]);
  const approvedCount = visaApplications.filter((v) => v.status === "approved").length;
  const pendingCount = visaApplications.filter((v) => v.status === "pending" || v.status === "under_review").length;
  const decidedCount = visaApplications.filter(
    (v) => v.status !== "pending" && v.status !== "under_review",
  ).length;
  const approvalRate = decidedCount > 0 ? Math.round((approvedCount / decidedCount) * 100) : 0;

  const groupedBookings = useMemo(() => {
    const groups: Record<string, AdminVisaApplication[]> = {};
    visaApplications.forEach((visa) => {
      const key = visa.booking || "No Order";
      if (!groups[key]) groups[key] = [];
      groups[key].push(visa);
    });

    if (statusFilter === "all") return groups;

    const filteredGroups: Record<string, AdminVisaApplication[]> = {};
    Object.entries(groups).forEach(([bookingId, visas]) => {
      const hasMatchingVisa = visas.some((v) => {
        const s = v.status ? v.status.toLowerCase() : "";
        if (statusFilter === "pending") {
          return s === "pending" || s === "under_review";
        }
        return s === statusFilter;
      });
      if (hasMatchingVisa) {
        filteredGroups[bookingId] = visas;
      }
    });

    return filteredGroups;
  }, [visaApplications, statusFilter]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const openDetailModal = (id: string) => {
    setSelectedBookingId(id);
    setIsDetailModalOpen(true);
  };

  const filters = [
    { key: "all", label: t("common.visaApplications.filterAll", "All") },
    { key: "pending", label: t("common.visaApplications.filterPending", "Pending") },
    { key: "awaiting_payment", label: t("visa.statusAwaitingPayment", "Awaiting Payment") },
    { key: "under_review", label: t("visa.statusUnderReview", "Under Review") },
    { key: "approved", label: t("common.visaApplications.filterApproved", "Approved") },
    { key: "rejected", label: t("common.visaApplications.filterRejected", "Rejected") },
  ];

  return (
      <main id="main-content" className="px-6 pb-10">
        {/* Page Header */}
        <motion.div
          className="pt-8 pb-6"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-stone-900 leading-none">
              {t("common.visaApplications.pageTitle")}
            </h1>
            <p className="text-sm text-stone-500 mt-2 leading-relaxed">
              {t("common.visaApplications.pageSubtitle")}
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <motion.div variants={itemVariants} initial="hidden" animate="show">
            <SkeletonTable rows={4} columns={8} />
          </motion.div>
        ) : null}

        {isError ? (
          <motion.div
            className="rounded-[2.5rem] bg-white border border-red-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6"
            variants={itemVariants}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon icon="heroicons:exclamation-circle" className="size-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-red-800">
                    {t("common.visaApplications.error.title")}
                  </h2>
                  <p className="text-sm text-red-700/80 mt-0.5">
                    {errorMessage ?? t("common.visaApplications.error.fallback")}
                  </p>
                </div>
              </div>
              <button
                onClick={retryLoading}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all duration-200 shrink-0"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          </motion.div>
        ) : null}

        {canShowData ? (
          <>
            {/* Stats — asymmetric 2x2 grid */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5"
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              <motion.div variants={itemVariants}>
                <Card className="rounded-[2.5rem] border border-stone-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] !p-0" bodyClass="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
                        {t("common.visaApplications.stat.total", "Total")}
                      </p>
                      <p className="text-3xl font-bold text-stone-900 mt-2 tracking-tight data-value">
                        {visaApplications.length}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                      <Icon icon="heroicons:document-text" className="size-5 text-stone-400" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="rounded-[2.5rem] border border-emerald-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] !p-0" bodyClass="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
                        {t("common.visaApplications.stat.approved", "Approved")}
                      </p>
                      <p className="text-3xl font-bold text-emerald-700 mt-2 tracking-tight data-value">
                        {approvedCount}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Icon icon="heroicons:check-circle" className="size-5 text-emerald-500" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="rounded-[2.5rem] border border-amber-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] !p-0" bodyClass="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
                        {t("common.visaApplications.stat.pending", "Pending")}
                      </p>
                      <p className="text-3xl font-bold text-amber-600 mt-2 tracking-tight data-value">
                        {pendingCount}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Icon icon="heroicons:clock" className="size-5 text-amber-500" />
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="rounded-[2.5rem] border border-sky-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] !p-0" bodyClass="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
                        {t("common.visaApplications.stat.rate", "Approval Rate")}
                      </p>
                      <p className="text-3xl font-bold text-sky-600 mt-2 tracking-tight data-value">
                        {approvalRate}%
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                      <Icon icon="heroicons:chart-bar" className="size-5 text-sky-500" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Filter Tabs — pill group */}
            <motion.div
              className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1"
              variants={itemVariants}
              initial="hidden"
              animate="show"
            >
              {filters.map((filter) => {
                const isActive = statusFilter === filter.key;
                return (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 ${
                      isActive
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
                        : "bg-white text-stone-500 border border-stone-200/70 hover:bg-stone-50 hover:border-stone-300"
                    }`}
                  >
                    <Icon icon={FILTER_ICONS[filter.key]} className="size-4" />
                    {filter.label}
                  </button>
                );
              })}
            </motion.div>

            {isEmpty ? (
              <motion.div
                className="rounded-[2.5rem] bg-white border border-stone-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-16 text-center"
                variants={itemVariants}
                initial="hidden"
                animate="show"
              >
                <div className="w-16 h-16 rounded-[1.5rem] bg-stone-100 flex items-center justify-center mx-auto mb-4">
                  <Icon
                    icon="heroicons:document-text"
                    className="size-7 text-stone-300"
                  />
                </div>
                <h2 className="text-lg font-semibold text-stone-700">
                  {t("common.visaApplications.empty.title")}
                </h2>
                <p className="text-sm text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  {t("common.visaApplications.empty.description")}
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {Object.entries(groupedBookings).map(([bookingId, visas]) => {
                  const stats = getBookingVisaStats(visas);
                  const totalPax = visas.length;
                  const tourType = visas[0]?.type || "Unknown";
                  const displayBookingId = bookingId === "No Order" ? t("visa.noOrder", "Không có đơn hàng") : bookingId;

                  return (
                    <motion.div
                      key={bookingId}
                      variants={itemVariants}
                      className="bg-white rounded-[2rem] border border-stone-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                              <Icon icon="heroicons:folder" className="size-4 text-stone-500" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-stone-900 tracking-tight font-mono">
                                {displayBookingId}
                              </h3>
                              <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider mt-0.5">
                                {t("visa.bookingId", "Booking ID")}
                              </p>
                            </div>
                          </div>
                          {tourType && tourType !== "Unknown" && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              tourType === "Private Tour"
                                ? "bg-purple-50 text-purple-700 border border-purple-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>
                              {tourType}
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="space-y-4 my-2">
                          <div className="flex justify-between items-center text-xs font-semibold text-stone-500">
                            <span>{t("visa.totalPax", "Tổng số hành khách")}:</span>
                            <span className="text-sm font-bold text-stone-950">{totalPax}</span>
                          </div>

                          {/* Stats breakdown */}
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-stone-100/70">
                            <div className="flex items-center gap-2 bg-emerald-50/30 border border-emerald-100/50 p-2 rounded-xl">
                              <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
                              <div className="v-stack">
                                <span className="text-[10px] text-emerald-800 font-bold">{t("common.visaApplications.filterApproved", "Approved")}</span>
                                <span className="text-xs font-extrabold text-emerald-950">{stats.approved}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 bg-amber-50/30 border border-amber-100/50 p-2 rounded-xl">
                              <div className="size-2 rounded-full bg-amber-500 shrink-0" />
                              <div className="v-stack">
                                <span className="text-[10px] text-amber-800 font-bold">{t("common.visaApplications.filterPending", "Pending")}</span>
                                <span className="text-xs font-extrabold text-amber-950">{stats.pending}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 bg-red-50/30 border border-red-100/50 p-2 rounded-xl">
                              <div className="size-2 rounded-full bg-red-500 shrink-0" />
                              <div className="v-stack">
                                <span className="text-[10px] text-red-800 font-bold">{t("common.visaApplications.filterRejected", "Rejected")}</span>
                                <span className="text-xs font-extrabold text-red-950">{stats.rejected}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 bg-purple-50/30 border border-purple-100/50 p-2 rounded-xl">
                              <div className="size-2 rounded-full bg-purple-500 shrink-0" />
                              <div className="v-stack">
                                <span className="text-[10px] text-purple-800 font-bold">{t("visa.statusAwaitingPayment", "Awaiting Payment")}</span>
                                <span className="text-xs font-extrabold text-purple-950">{stats.awaitingPayment}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Button */}
                      {isManager ? (
                        <button
                          onClick={() => openDetailModal(bookingId)}
                          className="w-full mt-5 py-2.5 bg-stone-950 hover:bg-stone-850 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 hover:shadow-md cursor-pointer"
                        >
                          <Icon icon="heroicons:pencil-square" className="size-4" />
                          {t("visa.action.review", "Review Visa")}
                        </button>
                      ) : (
                        <button
                          onClick={() => openDetailModal(bookingId)}
                          className="w-full mt-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Icon icon="heroicons:eye" className="size-4" />
                          {t("visa.action.view", "View Details")}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        ) : null}
        {/* Detail Modal */}
        <VisaApplicationDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          bookingId={selectedBookingId}
          visas={selectedBookingId ? (groupedBookings[selectedBookingId] || []) : []}
          onSuccess={retryLoading}
        />
      </main>
  );
}

export default VisaApplicationsPage;

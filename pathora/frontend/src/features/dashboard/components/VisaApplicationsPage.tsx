"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon, VisaStatusBadge } from "@/components/ui";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { adminService } from "@/api/services/adminService";
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

export function VisaApplicationsPage() {
  const { t } = useTranslation();
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
        const result = await adminService.getOverview();
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

  const VISA_APPLICATIONS: AdminVisaApplication[] = [
    { id: "VISA-001", booking: "Japan Sakura Tour", applicant: "Nguyen Van A", passport: "P1234567", country: "Japan", type: "Tourist", status: "approved", submittedDate: "Feb 15, 2026", decisionDate: "Mar 1, 2026" },
    { id: "VISA-002", booking: "Korea Autumn Adventure", applicant: "Tran Thi B", passport: "P7654321", country: "South Korea", type: "Tourist", status: "pending", submittedDate: "Mar 5, 2026", decisionDate: "-" },
    { id: "VISA-003", booking: "Europe Grand Tour", applicant: "Le Van C", passport: "P9876543", country: "Schengen", type: "Tourist", status: "under_review", submittedDate: "Feb 28, 2026", decisionDate: "-" },
    { id: "VISA-004", booking: "Thailand Beach Paradise", applicant: "Pham Thi D", passport: "P4567890", country: "Thailand", type: "Tourist", status: "approved", submittedDate: "Mar 1, 2026", decisionDate: "Mar 8, 2026" },
    { id: "VISA-005", booking: "Singapore Urban Experience", applicant: "Hoang Van E", passport: "P1122334", country: "Singapore", type: "Tourist", status: "rejected", submittedDate: "Feb 10, 2026", decisionDate: "Feb 20, 2026" },
    { id: "VISA-006", booking: "Vietnam Heritage Tour", applicant: "Nguyen Thi F", passport: "P9988776", country: "Vietnam", type: "E-visa", status: "approved", submittedDate: "Mar 2, 2026", decisionDate: "Mar 5, 2026" },
    { id: "VISA-007", booking: "Japan Cherry Blossom", applicant: "Tran Van G", passport: "P5566778", country: "Japan", type: "Tourist", status: "pending", submittedDate: "Mar 8, 2026", decisionDate: "-" },
    { id: "VISA-008", booking: "Bali Eco Retreat", applicant: "Le Thi H", passport: "P4433221", country: "Indonesia", type: "Tourist", status: "under_review", submittedDate: "Mar 6, 2026", decisionDate: "-" },
  ];

  const visaApplications =
    overview?.visaApplications && overview.visaApplications.length > 0
      ? overview.visaApplications
      : VISA_APPLICATIONS;

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

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  const filters = [
    { key: "all", label: t("common.visaApplications.filterAll", "All") },
    { key: "pending", label: t("common.visaApplications.filterPending", "Pending") },
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
                variants={itemVariants}
                initial="hidden"
                animate="show"
              >
                <div className="rounded-[2.5rem] bg-white border border-stone-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                  {/* Section label */}
                  <div className="px-6 pt-5 pb-3 border-b border-stone-100 flex items-center justify-between">
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
                      {t("visa.applications", "Visa Applications")} &middot; {filteredVisas.length}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-stone-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {t("visa.liveData", "Live data")}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-stone-100">
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            {t("common.visaApplications.column.applicationId", "ID")}
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            {t("common.visaApplications.column.applicant", "Applicant")}
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            {t("common.visaApplications.column.passport", "Passport")}
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            {t("common.visaApplications.column.destination", "Destination")}
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            {t("common.visaApplications.column.visaType", "Type")}
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            {t("common.visaApplications.column.status", "Status")}
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            {t("common.visaApplications.column.submitted", "Submitted")}
                          </th>
                          <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                            {t("common.visaApplications.column.decision", "Decision")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {filteredVisas.map((visa, index) => (
                          <motion.tr
                            key={visaRowKeys[index]}
                            custom={index}
                            variants={rowVariants}
                            initial="hidden"
                            animate="show"
                            className="group hover:bg-stone-50/50 transition-colors duration-150"
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs text-stone-500 tracking-tight">{visa.id}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-stone-800">{visa.applicant}</p>
                              <p className="text-xs text-stone-400 mt-0.5">{visa.booking}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs text-stone-500 tracking-tight">{visa.passport}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm text-stone-800">{visa.country}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-stone-600">{visa.type}</span>
                            </td>
                            <td className="px-6 py-4">
                              <VisaStatusBadge status={visa.status} />
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-stone-500">{visa.submittedDate}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-sm ${visa.decisionDate === "-" ? "text-stone-400" : "text-stone-600"}`}>
                                {visa.decisionDate}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        ) : null}
      </main>
  );
}

export default VisaApplicationsPage;

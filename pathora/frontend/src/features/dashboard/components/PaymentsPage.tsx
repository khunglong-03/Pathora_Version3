"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { Icon, PaymentStatusBadge } from "@/components/ui";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { adminService } from "@/api/services/adminService";
import { managerService } from "@/api/services/managerService";
import type { AdminOverview } from "@/types/admin";
import { buildPaymentRowKeys } from "./paymentsPageLogic";

type PaymentsDataState = "loading" | "ready" | "empty" | "error";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: string;
  iconBg: string;
  iconColor: string;
  accentBorder?: string;
}

function StatCard({ label, value, change, changeType, icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="group rounded-[2rem] bg-white/55 p-1.5 ring-1 ring-black/[0.045] shadow-[0_28px_80px_-48px_rgba(28,25,23,0.55)]">
      <Card
        className="rounded-[calc(2rem-0.375rem)] !p-0 overflow-hidden border-0 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1 group-hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_20px_60px_-42px_rgba(28,25,23,0.6)]"
        bodyClass="p-6"
      >
        <div className="flex items-start justify-between mb-5">
          <p className="rounded-full bg-stone-950/[0.035] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">{label}</p>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ring-1 ring-black/[0.04] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] ${iconBg}`}>
            <Icon icon={icon} className={`size-5 ${iconColor}`} />
          </div>
        </div>
        <p className="text-3xl font-bold tracking-[-0.045em] text-stone-950 data-value">{value}</p>
        {change && (
          <p className={`mt-3 text-xs font-medium ${changeType === "positive" ? "text-emerald-600" : changeType === "negative" ? "text-rose-600" : "text-stone-500"}`}>
            {change}
          </p>
        )}
      </Card>
    </div>
  );
}

/* (PaymentStatusBadge imported from @/components/ui) */

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 56, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: [0.32, 0.72, 0, 1] as const } },
};

export function PaymentsPage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isManager = pathname?.startsWith("/manager");
  const pageSize = 10;

  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [dataState, setDataState] = useState<PaymentsDataState>("loading");
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
        if (!result || !result.payments || result.payments.length === 0) {
          setOverview(result ?? null);
          setDataState("empty");
        } else {
          setOverview(result);
          setDataState("ready");
        }
      } catch (err) {
        if (!active) return;
        setOverview(null);
        setDataState("error");
        setErrorMessage(
          err instanceof Error ? err.message : t("payments.error.loadFailed", "Failed to load payments"),
        );
      }
    };

    void loadOverview();

    return () => {
      active = false;
    };
  }, [isManager, reloadToken, t]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const payments = overview?.payments ?? [];

  const filteredPayments =
    statusFilter === "all"
      ? payments
      : payments.filter((payment) => payment.status === statusFilter);
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const paymentRowKeys = useMemo(() => {
    return buildPaymentRowKeys(paginatedPayments);
  }, [paginatedPayments]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const completedCount = payments.filter((p) => p.status === "completed").length;
  const refundedCount = payments.filter((p) => p.status === "refunded").length;
  const paymentStats = overview?.paymentStats;
  const displayTotalRevenue = paymentStats?.totalRevenue ?? totalRevenue;
  const displayPendingAmount = paymentStats?.pendingAmount ?? pendingAmount;
  const displayCompletedCount = paymentStats?.completedCount ?? completedCount;
  const displayPendingCount = paymentStats?.pendingCount ?? payments.filter((p) => p.status === "pending").length;
  const displayRefundedCount = paymentStats?.refundedCount ?? refundedCount;

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  return (
    <>
      <main id="main-content" className="relative min-h-[100dvh] overflow-hidden px-4 py-10 md:px-8 md:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_18%_20%,rgba(251,191,36,0.18),transparent_30%),radial-gradient(circle_at_82%_10%,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#fafaf9_0%,#f5f5f4_100%)]" />
        <div className="mx-auto max-w-[87.5rem] space-y-10">
        <motion.div
          className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <div className="max-w-3xl">
            <span className="mb-4 inline-flex rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500 ring-1 ring-black/[0.05]">
              {t("payments.eyebrow", "Finance ledger")}
            </span>
            <h1 className="text-5xl font-bold tracking-[-0.06em] text-stone-950 md:text-7xl">
              {t("payments.pageTitle", "Payment Management")}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-500">
              {t("payments.pageSubtitle", "Track all payment transactions")}
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <SkeletonTable rows={4} columns={7} />
        ) : null}

        {isError ? (
          <motion.div
            className="bg-white border border-red-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6"
            variants={itemVariants}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-red-800">
                  {t("payments.error.title", "Could not load payments")}
                </h2>
                <p className="text-sm text-red-700 mt-1">
                  {errorMessage ?? t("payments.error.fallback", "Unable to load payment data. Please try again.")}
                </p>
              </div>
              <button
                onClick={retryLoading}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-colors"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          </motion.div>
        ) : null}

        {canShowData ? (
          <motion.div
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-12"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Total Revenue — featured, wide 5 cols */}
            <motion.div variants={itemVariants} className="lg:col-span-6">
              <StatCard
                label={t("payments.stat.totalRevenue", "Total Revenue")}
                value={`${displayTotalRevenue.toLocaleString()} ₫`}
                change={t("payments.stat.syncedFromBackend", "Synced from backend")}
                changeType="neutral"
                icon="heroicons:banknotes"
                iconBg="bg-green-50"
                iconColor="text-green-600"
                accentBorder="border-green-300"
              />
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <StatCard
                label={t("payments.stat.pendingPayments", "Pending Payments")}
                value={`${displayPendingAmount.toLocaleString()} ₫`}
                change={`${displayPendingCount} ${t("payments.stat.transactions", "transactions")}`}
                changeType="neutral"
                icon="heroicons:clock"
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                accentBorder="border-amber-300"
              />
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <StatCard
                label={t("payments.stat.completed", "Completed")}
                value={displayCompletedCount.toString()}
                change={t("payments.stat.syncedFromBackend", "Synced from backend")}
                changeType="positive"
                icon="heroicons:check-circle"
                iconBg="bg-green-50/60"
                iconColor="text-green-600"
                accentBorder="border-green-300"
              />
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-4 lg:col-start-9">
              <StatCard
                label={t("payments.stat.refunded", "Refunded")}
                value={displayRefundedCount.toString()}
                change={t("payments.stat.syncedFromBackend", "Synced from backend")}
                changeType="negative"
                icon="heroicons:arrow-uturn-left"
                iconBg="bg-red-50"
                iconColor="text-red-600"
                accentBorder="border-red-300"
              />
            </motion.div>
          </motion.div>
        ) : null}

        {canShowData ? (
          <motion.div
            className="flex flex-wrap items-center gap-3 rounded-[2rem] bg-white/50 p-2 ring-1 ring-black/[0.045] shadow-[0_24px_70px_-52px_rgba(28,25,23,0.65)]"
            variants={itemVariants}
            initial="hidden"
            animate="show"
          >
            {["all", "completed", "pending", "refunded"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:ring-offset-2 ${statusFilter === status ? "bg-stone-950 text-white shadow-[0_14px_40px_-24px_rgba(28,25,23,0.8)]" : "bg-white/70 text-stone-600 ring-1 ring-black/[0.04] hover:-translate-y-0.5 hover:bg-white"}`}
              >
                {status === "all" ? t("payments.filter.all", "All") : t(`payments.filter.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
              </button>
            ))}
          </motion.div>
        ) : null}

        {canShowData ? (
          isEmpty ? (
            <motion.div
              className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-12 text-center"
              variants={itemVariants}
              initial="hidden"
              animate="show"
            >
              <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
                <Icon
                  icon="heroicons:credit-card"
                  className="size-8 text-stone-400"
                />
              </div>
              <h2 className="text-lg font-semibold text-stone-800 mt-4">
                {t("payments.empty.title", "No payment transactions yet")}
              </h2>
              <p className="text-sm text-stone-500 mt-1.5 max-w-sm mx-auto">
                {t("payments.empty.description", "There are no payment records to display.")}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="show"
            >
              <div className="rounded-[2.25rem] bg-white/55 p-1.5 ring-1 ring-black/[0.045] shadow-[0_34px_90px_-58px_rgba(28,25,23,0.68)]">
              <Card className="rounded-[calc(2.25rem-0.375rem)] border-0 bg-white !p-0 overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]" bodyClass="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50/80">
                      <tr className="shadow-[inset_0_-1px_0_rgba(28,25,23,0.06)]">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("payments.column.paymentId", "Payment ID")}
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("payments.column.booking", "Booking")}
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("payments.column.customer", "Customer")}
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("payments.column.method", "Method")}
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("payments.column.amount", "Amount")}
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("payments.column.status", "Status")}
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                          {t("payments.column.date", "Date")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100/80 bg-white">
                      {paginatedPayments.map((payment, index) => (
                        <tr key={paymentRowKeys[index]} className="transition-colors duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-amber-50/35">
                          <td className="px-6 py-3"><span className="font-mono text-sm text-stone-600">{payment.id}</span></td>
                          <td className="px-6 py-3"><span className="text-sm text-stone-900">{payment.booking}</span></td>
                          <td className="px-6 py-3"><span className="text-sm text-stone-600">{payment.customer}</span></td>
                          <td className="px-6 py-3">
                            <span className="inline-flex items-center gap-1.5 text-sm text-stone-600">
                              <Icon
                                icon={
                                  payment.method.toLowerCase().includes("bank")
                                    ? "heroicons:building-library"
                                    : payment.method.toLowerCase().includes("cash")
                                      ? "heroicons:banknotes"
                                      : "heroicons:qr-code"
                                }
                                className="size-4 text-stone-400"
                              />
                              {payment.method}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right"><span className="font-semibold text-stone-900 data-value">{payment.amount.toLocaleString()} ₫</span></td>
                          <td className="px-6 py-3 text-center"><PaymentStatusBadge status={payment.status} /></td>
                          <td className="px-6 py-3"><span className="text-sm text-stone-500">{payment.date}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 bg-white px-6 py-4 shadow-[inset_0_1px_0_rgba(28,25,23,0.06)] sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-stone-500">
                    {t("payments.pagination.summary", "Showing {{start}}-{{end}} of {{total}} payments", {
                      start: filteredPayments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1,
                      end: Math.min(currentPage * pageSize, filteredPayments.length),
                      total: filteredPayments.length,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-600 ring-1 ring-black/[0.06] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                    >
                      {t("common.previous", "Previous")}
                    </button>
                    <span className="text-sm font-medium text-stone-600 min-w-20 text-center">
                      {currentPage}/{totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                      className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.98]"
                    >
                      {t("common.next", "Next")}
                    </button>
                  </div>
                </div>
              </Card>
              </div>
            </motion.div>
          )
        ) : null}
        </div>
      </main>
    </>
  );
}

export default PaymentsPage;

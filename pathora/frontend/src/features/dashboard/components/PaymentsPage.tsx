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

function StatCard({ label, value, change, changeType, icon, iconBg, iconColor, accentBorder }: StatCardProps) {
  return (
    <Card
      className={`rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 ${accentBorder ? `border-l-4 ${accentBorder}` : ""} !p-0`}
      bodyClass="p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-stone-500">{label}</p>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon icon={icon} className={`size-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900 tracking-tight data-value">{value}</p>
      {change && (
        <p className={`text-xs mt-1 ${changeType === "positive" ? "text-green-600" : changeType === "negative" ? "text-red-600" : "text-stone-400"}`}>
          {change}
        </p>
      )}
    </Card>
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
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

export function PaymentsPage() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isManager = pathname?.startsWith("/manager");

  const [statusFilter, setStatusFilter] = useState("all");
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
  }, [reloadToken, t]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const payments = overview?.payments ?? [];

  const filteredPayments =
    statusFilter === "all"
      ? payments
      : payments.filter((payment) => payment.status === statusFilter);
  const paymentRowKeys = useMemo(() => {
    return buildPaymentRowKeys(filteredPayments);
  }, [filteredPayments]);

  const totalRevenue = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const completedCount = payments.filter((p) => p.status === "completed").length;
  const refundedCount = payments.filter((p) => p.status === "refunded").length;

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  return (
    <>
      <main id="main-content" className="p-6 lg:p-8 max-w-[87.5rem] mx-auto space-y-6">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <div className="pl-px">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">
              {t("payments.pageTitle", "Payment Management")}
            </h1>
            <p className="text-sm text-stone-500 mt-1.5">
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Total Revenue — featured, wide 5 cols */}
            <motion.div variants={itemVariants} className="lg:col-span-5">
              <StatCard
                label={t("payments.stat.totalRevenue", "Total Revenue")}
                value={`$${totalRevenue.toLocaleString()}`}
                change={`+12.5% ${t("payments.stat.fromLastMonth", "from last month")}`}
                changeType="positive"
                icon="heroicons:banknotes"
                iconBg="bg-green-50"
                iconColor="text-green-600"
                accentBorder="border-green-300"
              />
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-3">
              <StatCard
                label={t("payments.stat.pendingPayments", "Pending Payments")}
                value={`$${pendingAmount.toLocaleString()}`}
                change={`${payments.filter((p) => p.status === "pending").length} ${t("payments.stat.transactions", "transactions")}`}
                changeType="neutral"
                icon="heroicons:clock"
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                accentBorder="border-amber-300"
              />
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <StatCard
                label={t("payments.stat.completed", "Completed")}
                value={completedCount.toString()}
                change={t("payments.stat.syncedFromBackend", "Synced from backend")}
                changeType="positive"
                icon="heroicons:check-circle"
                iconBg="bg-green-50/60"
                iconColor="text-green-600"
                accentBorder="border-green-300"
              />
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <StatCard
                label={t("payments.stat.refunded", "Refunded")}
                value={refundedCount.toString()}
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
            className="flex items-center gap-3"
            variants={itemVariants}
            initial="hidden"
            animate="show"
          >
            {["all", "completed", "pending", "refunded"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${statusFilter === status ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"}`}
              >
                {status === "all" ? t("payments.filter.all", "All") : status.charAt(0).toUpperCase() + status.slice(1)}
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
              <Card className="rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 !p-0 overflow-hidden" bodyClass="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-stone-50">
                      <tr className="border-b border-stone-200">
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
                    <tbody className="divide-y divide-stone-100 bg-white">
                      {filteredPayments.map((payment, index) => (
                        <tr key={paymentRowKeys[index]} className="hover:bg-stone-50 transition-colors">
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
                          <td className="px-6 py-3 text-right"><span className="font-semibold text-stone-900 data-value">${payment.amount.toLocaleString()}</span></td>
                          <td className="px-6 py-3 text-center"><PaymentStatusBadge status={payment.status} /></td>
                          <td className="px-6 py-3"><span className="text-sm text-stone-500">{payment.date}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )
        ) : null}
      </main>
    </>
  );
}

export default PaymentsPage;

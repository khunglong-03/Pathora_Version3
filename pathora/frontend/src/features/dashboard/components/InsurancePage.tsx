"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon, InsuranceStatusBadge } from "@/components/ui";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { adminService } from "@/api/services/adminService";
import type { AdminInsurance, AdminOverview } from "@/types/admin";
import { AdminSidebar, TopBar } from "./AdminSidebar";

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

function StatCard({
  label,
  value,
  change,
  changeType,
  icon,
  iconBg,
  iconColor,
  accentBorder,
}: StatCardProps) {
  return (
    <Card
      className={`rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.08)] ${accentBorder ? `border-l-4 ${accentBorder}` : ""} !p-0`}
      bodyClass="p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-stone-500">{label}</p>
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <Icon icon={icon} className={`size-5 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900 tracking-tight data-value">{value}</p>
      {change && (
        <p
          className={`text-xs mt-1 ${changeType === "positive" ? "text-green-600" : changeType === "negative" ? "text-red-600" : "text-stone-400"}`}
        >
          {change}
        </p>
      )}
    </Card>
  );
}

const INSURANCE_PLANS = [
  {
    id: "INS-001",
    booking: "Japan Sakura Tour",
    customer: "Nguyen Van A",
    type: "Basic Travel",
    coverage: "$10,000",
    premium: 50,
    status: "active",
    startDate: "Mar 1, 2026",
    endDate: "Mar 15, 2026",
  },
  {
    id: "INS-002",
    booking: "Korea Autumn Adventure",
    customer: "Tran Thi B",
    type: "Premium Travel",
    coverage: "$25,000",
    premium: 120,
    status: "active",
    startDate: "Mar 5, 2026",
    endDate: "Mar 20, 2026",
  },
  {
    id: "INS-003",
    booking: "Thailand Beach Paradise",
    customer: "Le Van C",
    type: "Basic Travel",
    coverage: "$10,000",
    premium: 45,
    status: "expired",
    startDate: "Feb 1, 2026",
    endDate: "Feb 15, 2026",
  },
  {
    id: "INS-004",
    booking: "Europe Grand Tour",
    customer: "Pham Thi D",
    type: "Comprehensive",
    coverage: "$50,000",
    premium: 250,
    status: "active",
    startDate: "Apr 1, 2026",
    endDate: "Apr 25, 2026",
  },
  {
    id: "INS-005",
    booking: "Bali Eco Retreat",
    customer: "Hoang Van E",
    type: "Basic Travel",
    coverage: "$10,000",
    premium: 40,
    status: "claimed",
    startDate: "Jan 15, 2026",
    endDate: "Jan 25, 2026",
  },
  {
    id: "INS-006",
    booking: "Singapore Urban Experience",
    customer: "Nguyen Thi F",
    type: "Premium Travel",
    coverage: "$25,000",
    premium: 110,
    status: "active",
    startDate: "Mar 10, 2026",
    endDate: "Mar 18, 2026",
  },
  {
    id: "INS-007",
    booking: "Vietnam Heritage Tour",
    customer: "Tran Van G",
    type: "Basic Travel",
    coverage: "$10,000",
    premium: 35,
    status: "active",
    startDate: "Mar 8, 2026",
    endDate: "Mar 12, 2026",
  },
  {
    id: "INS-008",
    booking: "Japan Cherry Blossom",
    customer: "Le Thi H",
    type: "Comprehensive",
    coverage: "$50,000",
    premium: 280,
    status: "active",
    startDate: "Mar 20, 2026",
    endDate: "Apr 5, 2026",
  },
];

/* (InsuranceStatusBadge imported from @/components/ui) */

interface InsuranceTableRow {
  insurance: AdminInsurance;
  rowKey: string;
}

type InsuranceDataState = "loading" | "ready" | "empty" | "error";

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

export function InsurancePage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [dataState, setDataState] = useState<InsuranceDataState>("loading");
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
          const hasInsurance =
            result.insurances && result.insurances.length > 0;
          setDataState(hasInsurance ? "ready" : "empty");
        }
      } catch (err) {
        if (!active) return;
        setOverview(null);
        setDataState("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : t("common.insurance.error.fallback"),
        );
      }
    };

    void loadOverview();

    return () => {
      active = false;
    };
  }, [reloadToken, t]);

  const insurancePlans =
    overview?.insurances && overview.insurances.length > 0
      ? overview.insurances
      : INSURANCE_PLANS;

  const filteredInsurances =
    statusFilter === "all"
      ? insurancePlans
      : insurancePlans.filter((i) => i.status === statusFilter);

  const insuranceRows = useMemo<InsuranceTableRow[]>(() => {
    const idOccurrences = new Map<string, number>();

    return filteredInsurances.map((insurance, index) => {
      const normalizedId = insurance.id || `INS-UNKNOWN-${index + 1}`;
      const occurrence = (idOccurrences.get(normalizedId) ?? 0) + 1;
      idOccurrences.set(normalizedId, occurrence);

      return {
        insurance,
        rowKey:
          occurrence === 1 ? normalizedId : `${normalizedId}__${occurrence}`,
      };
    });
  }, [filteredInsurances]);

  const activePolicies = insurancePlans.filter(
    (i) => i.status === "active",
  ).length;
  const totalPremium = insurancePlans
    .filter((i) => i.status === "active")
    .reduce((sum, i) => sum + i.premium, 0);
  const claimsCount = insurancePlans.filter(
    (i) => i.status === "claimed",
  ).length;

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  return (
    <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
      <TopBar onMenuClick={() => setSidebarOpen(true)} />
      <main id="main-content" className="p-6 space-y-6">
        <motion.div
          className="flex items-center justify-between"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              {t("common.insurance.pageTitle")}
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {t("common.insurance.pageSubtitle")}
            </p>
          </div>
        </motion.div>

        {isLoading ? (
          <SkeletonTable rows={4} columns={8} />
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
                  {t("common.insurance.error.title")}
                </h2>
                <p className="text-sm text-red-700 mt-1">
                  {errorMessage ?? t("common.insurance.error.fallback")}
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <StatCard
                label={t("common.insurance.stat.active")}
                value={activePolicies.toString()}
                change="+5 this month"
                changeType="positive"
                icon="heroicons:shield-check"
                iconBg="bg-green-100"
                iconColor="text-green-600"
                accentBorder="border-emerald-400"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label={t("common.insurance.stat.premiums")}
                value={`$${totalPremium.toLocaleString()}`}
                change="+18% from last month"
                changeType="positive"
                icon="heroicons:currency-dollar"
                iconBg="bg-amber-100/60"
                iconColor="text-amber-600"
                accentBorder="border-amber-400"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label={t("common.insurance.stat.claims")}
                value={claimsCount.toString()}
                change="Synced from backend"
                changeType="neutral"
                icon="heroicons:document-text"
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                accentBorder="border-amber-400"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <StatCard
                label={t("common.insurance.stat.avgPremium")}
                value={`$${activePolicies > 0 ? Math.round(totalPremium / activePolicies) : 0}`}
                change="per policy"
                changeType="neutral"
                icon="heroicons:calculator"
                iconBg="bg-stone-100"
                iconColor="text-stone-600"
                accentBorder="border-orange-400"
              />
            </motion.div>
          </motion.div>
        ) : null}

        {canShowData ? (
          <>
            <motion.div
              className="flex items-center gap-3"
              variants={itemVariants}
              initial="hidden"
              animate="show"
            >
              {["all", "active", "expired", "claimed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${statusFilter === status ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"}`}
                >
                  {status === "all"
                    ? t("common.insurance.filterAll")
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </motion.div>

            {isEmpty ? (
              <motion.div
                className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-10 text-center"
                variants={itemVariants}
                initial="hidden"
                animate="show"
              >
                <Icon
                  icon="heroicons:shield-check"
                  className="size-8 text-stone-300 mx-auto"
                />
                <h2 className="text-lg font-semibold text-stone-800 mt-3">
                  {t("common.insurance.empty.title")}
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                  {t("common.insurance.empty.description")}
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="show"
              >
                <div className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200">
                          <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                            {t("common.insurance.column.policyId")}
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                            {t("common.insurance.column.booking")}
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                            {t("common.insurance.column.customer")}
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                            {t("common.insurance.column.planType")}
                          </th>
                          <th className="text-right px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                            {t("common.insurance.column.coverage")}
                          </th>
                          <th className="text-right px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                            {t("common.insurance.column.premium")}
                          </th>
                          <th className="text-center px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                            {t("common.insurance.column.status")}
                          </th>
                          <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wide">
                            {t("common.insurance.column.period")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {insuranceRows.map(({ insurance, rowKey }) => (
                          <tr
                            key={rowKey}
                            className="hover:bg-stone-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm text-stone-600">
                                {insurance.id}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-stone-900">
                                {insurance.booking}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-stone-600">
                                {insurance.customer}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-stone-600">
                                {insurance.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-medium text-stone-900">
                                {insurance.coverage}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-semibold text-green-600">
                                ${insurance.premium}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <InsuranceStatusBadge status={insurance.status} />
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-stone-500">
                                {insurance.startDate} - {insurance.endDate}
                              </span>
                            </td>
                          </tr>
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
    </AdminSidebar>
  );
}

export default InsurancePage;

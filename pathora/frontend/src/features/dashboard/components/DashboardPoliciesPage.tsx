"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ArrowClockwise, FileText, MagnifyingGlass, Funnel, X } from "@phosphor-icons/react";

import { Icon } from "@/components/ui";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { useDebounce } from "@/hooks/useDebounce";
import type {
  DashboardPolicyListItem,
  DashboardPolicyStatusFilter,
  DashboardPoliciesDataState,
} from "@/types/dashboardPolicy";

import {
  calculateDashboardPolicyMetrics,
  filterDashboardPolicies,
  getStatusVariant,
  loadDashboardPoliciesData,
} from "./dashboardPoliciesPageLogic";

const STATUS_FILTERS: DashboardPolicyStatusFilter[] = ["all", "active", "inactive"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

const formatUpdatedDate = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export function DashboardPoliciesPage() {
  const { t } = useTranslation();
  const [dataState, setDataState] = useState<DashboardPoliciesDataState>("loading");
  const [policies, setPolicies] = useState<DashboardPolicyListItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DashboardPolicyStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const loadPolicies = useCallback(async () => {
    setDataState("loading");
    setErrorMessage(null);
    const result = await loadDashboardPoliciesData();
    setPolicies(result.policies);
    setDataState(result.state);
    setErrorMessage(result.errorMessage);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPolicies();
  }, [loadPolicies]);

  const filteredPolicies = useMemo(() => {
    return filterDashboardPolicies(policies, {
      searchQuery: debouncedSearchQuery,
      statusFilter,
    });
  }, [debouncedSearchQuery, policies, statusFilter]);

  const metrics = useMemo(() => {
    return calculateDashboardPolicyMetrics(policies);
  }, [policies]);

  const hasActiveFilters =
    statusFilter !== "all" || debouncedSearchQuery.trim().length > 0;
  const isFilteredEmpty =
    dataState === "ready" && filteredPolicies.length === 0 && hasActiveFilters;

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 px-4 py-6 lg:px-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="pr-4">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">
            {t("dashboard.policies.title", "Policies")}
          </h1>
          <p className="mt-2 text-sm text-stone-500 max-w-[55ch]">
            {t(
              "dashboard.policies.description",
              "Review and manage pricing, deposit, cancellation, and visa policy rules.",
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => { void loadPolicies(); }}
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200/70 px-3.5 py-2 text-sm font-medium text-stone-600 transition-all duration-200 hover:bg-stone-100 hover:text-stone-800 active:scale-[0.98]"
          >
            <ArrowClockwise className="size-4" weight="bold" />
            <span className="hidden sm:inline">{t("dashboard.policies.actions.refresh", "Refresh")}</span>
          </button>
          <Link
            href="/dashboard/site-content"
            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200/70 px-3.5 py-2 text-sm font-medium text-stone-600 transition-all duration-200 hover:bg-stone-100 hover:text-stone-800 active:scale-[0.98]"
          >
            <FileText className="size-4" weight="bold" />
            <span className="hidden sm:inline">{t("dashboard.siteContent.title", "Site Content")}</span>
          </Link>
        </div>
      </motion.div>

      {/* Metrics Row — asymmetric grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {/* Total — stone base */}
          <div className="rounded-[1.5rem] border border-stone-200/50 bg-white p-5 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-tight text-stone-500">
              {t("dashboard.policies.metrics.total", "Total")}
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">{metrics.totalPolicies}</p>
          </div>
          {/* Active — amber accent */}
          <div className="rounded-[1.5rem] border border-amber-200/60 bg-linear-to-br from-amber-50 to-white p-5 shadow-[0_12px_24px_-12px_rgba(245,158,11,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-tight text-amber-700">
              {t("dashboard.policies.metrics.active", "Active")}
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-amber-700">{metrics.activePolicies}</p>
          </div>
          {/* Inactive — cool stone */}
          <div className="rounded-[1.5rem] border border-stone-200/50 bg-stone-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-tight text-stone-500">
              {t("dashboard.policies.metrics.inactive", "Inactive")}
            </p>
            <p className="mt-3 text-3xl font-bold tracking-tight text-stone-700">{metrics.inactivePolicies}</p>
          </div>
          {/* Categories breakdown */}
          <div className="rounded-[1.5rem] border border-stone-200/50 bg-white p-5 col-span-2 lg:col-span-1 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-tight text-stone-500">
              {t("dashboard.policies.metrics.categories", "Categories")}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
                <span className="size-1.5 rounded-full bg-amber-400" />
                {t("dashboard.policies.types.pricing", "Pricing")} {metrics.typeCounts.pricing}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {t("dashboard.policies.types.deposit", "Deposit")} {metrics.typeCounts.deposit}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
                <span className="size-1.5 rounded-full bg-red-400" />
                {t("dashboard.policies.types.cancellation", "Cancel")} {metrics.typeCounts.cancellation}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-600">
                <span className="size-1.5 rounded-full bg-blue-400" />
                {t("dashboard.policies.types.visa", "Visa")} {metrics.typeCounts.visa}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter bar */}
      <motion.div
        variants={itemVariants}
        className="overflow-hidden rounded-[1.5rem] border border-stone-200/50 bg-white p-4 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.04)]"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" weight="bold" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t(
                "dashboard.policies.searchPlaceholder",
                "Search by policy name, type, or scope",
              )}
              className="w-full rounded-2xl border border-stone-200/70 bg-stone-50/50 py-2.5 pl-10 pr-3 text-sm text-stone-700 outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-500/15"
            />
          </div>

          <div className="flex items-center gap-2">
            <Funnel className="size-4 text-stone-400" weight="bold" />
            {STATUS_FILTERS.map((filter) => {
              const isActive = statusFilter === filter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-2xl px-3.5 py-2 text-xs font-semibold tracking-tight transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? "bg-amber-500 text-white shadow-[0_4px_10px_-4px_rgba(245,158,11,0.4)]"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {t(
                    `dashboard.policies.filters.${filter}`,
                    filter.charAt(0).toUpperCase() + filter.slice(1),
                  )}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-stone-200/70 px-3 py-2 text-xs font-medium text-stone-600 transition-all duration-200 hover:bg-stone-100 active:scale-[0.98]"
              >
                <X className="size-3" weight="bold" />
                {t("dashboard.policies.actions.reset", "Reset")}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Loading skeleton — desktop */}
      {dataState === "loading" && (
        <div className="hidden lg:block">
          <SkeletonTable rows={8} columns={6} />
        </div>
      )}

      {/* Loading skeleton — mobile */}
      {dataState === "loading" && (
        <div className="grid grid-cols-1 gap-3 lg:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring" as const, stiffness: 100, damping: 20 }}
              className="rounded-2xl border border-stone-200/50 bg-white p-4 shadow-[0_8px_16px_-8px_rgba(0,0,0,0.04)]"
            >
              <div className="skeleton mb-2 h-5 w-2/3 rounded" />
              <div className="skeleton mb-3 h-3 w-1/2 rounded" />
              <div className="skeleton mb-2 h-3 w-full rounded" />
              <div className="skeleton h-8 w-full rounded" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Error state */}
      {dataState === "error" && (
        <motion.div
          variants={itemVariants}
          className="rounded-[1.5rem] border border-red-200/50 bg-red-50/80 p-5 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.04)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Icon icon="heroicons:exclamation-circle" className="size-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {errorMessage || t("dashboard.policies.errors.loadFailed", "Unable to load policies.")}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { void loadPolicies(); }}
              className="shrink-0 rounded-2xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-red-700 active:scale-[0.98]"
            >
              {t("dashboard.policies.actions.retry", "Retry")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {dataState === "empty" && (
        <motion.div
          variants={itemVariants}
          className="rounded-[2.5rem] border border-stone-200/50 bg-white p-10 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
        >
          <div className="mx-auto size-16 rounded-full bg-stone-100 flex items-center justify-center">
            <FileText className="size-7 text-stone-400" weight="duotone" />
          </div>
          <p className="mt-5 text-lg font-bold tracking-tight text-stone-800">
            {t("dashboard.policies.states.emptyTitle", "No policies found")}
          </p>
          <p className="mt-2 text-sm text-stone-500 max-w-[40ch] mx-auto">
            {t(
              "dashboard.policies.states.emptyDescription",
              "No policies found matching your criteria.",
            )}
          </p>
        </motion.div>
      )}

      {/* Filtered empty state */}
      {isFilteredEmpty && (
        <motion.div
          variants={itemVariants}
          className="rounded-[2.5rem] border border-stone-200/50 bg-white p-10 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
        >
          <div className="mx-auto size-16 rounded-full bg-stone-100 flex items-center justify-center">
            <MagnifyingGlass className="size-7 text-stone-400" weight="duotone" />
          </div>
          <p className="mt-5 text-lg font-bold tracking-tight text-stone-800">
            {t("dashboard.policies.states.filteredEmptyTitle", "No matching policies")}
          </p>
          <p className="mt-2 text-sm text-stone-500 max-w-[40ch] mx-auto">
            {t(
              "dashboard.policies.states.filteredEmptyDescription",
              "Try another keyword or reset filters to see all policies.",
            )}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-stone-200/70 px-4 py-2 text-sm font-medium text-stone-600 transition-all duration-200 hover:bg-stone-100 active:scale-[0.98]"
          >
            <X className="size-3.5" weight="bold" />
            {t("dashboard.policies.actions.reset", "Reset filters")}
          </button>
        </motion.div>
      )}

      {/* Data table — desktop */}
      {dataState === "ready" && filteredPolicies.length > 0 && (
        <>
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
            className="hidden overflow-hidden rounded-[2rem] border border-stone-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] lg:block"
          >
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-tight text-stone-500">
                    {t("dashboard.policies.table.policy", "Policy")}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-tight text-stone-500">
                    {t("dashboard.policies.table.type", "Type")}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-tight text-stone-500">
                    {t("dashboard.policies.table.scope", "Scope")}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-tight text-stone-500">
                    {t("dashboard.policies.table.status", "Status")}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-tight text-stone-500">
                    {t("dashboard.policies.table.updated", "Last updated")}
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-tight text-stone-500">
                    {t("dashboard.policies.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filteredPolicies.map((policy) => (
                  <tr key={policy.rowKey} className="group hover:bg-amber-50/20 transition-colors duration-150">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-stone-900 tracking-tight">{policy.title}</p>
                      <p className="mt-0.5 text-xs text-stone-500">{policy.subtitle}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-600 tracking-tight">{policy.typeLabel}</td>
                    <td className="px-5 py-3.5 text-sm text-stone-600 tracking-tight">{policy.scope}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-tight ${getStatusVariant(policy.status)}`}
                      >
                        <span className={`size-1.5 rounded-full ${policy.status === "active" ? "bg-emerald-500" : "bg-stone-400"}`} />
                        {policy.statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-stone-500 tracking-tight">
                      {formatUpdatedDate(policy.updatedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={policy.editHref}
                          className="rounded-xl border border-stone-200/70 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all duration-200 hover:bg-stone-100 hover:text-stone-800 active:scale-[0.98]"
                        >
                          {t("dashboard.policies.actions.edit", "Edit")}
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Data cards — mobile */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {filteredPolicies.map((policy, i) => (
              <motion.div
                key={policy.rowKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: "spring" as const, stiffness: 100, damping: 20 }}
                className="rounded-2xl border border-stone-200/50 bg-white p-4 shadow-[0_8px_16px_-8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-900 tracking-tight">{policy.title}</p>
                    <p className="mt-0.5 text-xs text-stone-500">{policy.subtitle}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight ${getStatusVariant(policy.status)}`}
                  >
                    <span className={`size-1.5 rounded-full ${policy.status === "active" ? "bg-emerald-500" : "bg-stone-400"}`} />
                    {policy.statusLabel}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-stone-600">
                  <div>
                    <dt className="text-stone-400 font-medium">{t("dashboard.policies.table.type", "Type")}</dt>
                    <dd className="font-semibold text-stone-700 tracking-tight">{policy.typeLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-400 font-medium">{t("dashboard.policies.table.scope", "Scope")}</dt>
                    <dd className="font-semibold text-stone-700 tracking-tight">{policy.scope}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-stone-400 font-medium">{t("dashboard.policies.table.updated", "Last updated")}</dt>
                    <dd className="font-semibold text-stone-700 tracking-tight">{formatUpdatedDate(policy.updatedAt)}</dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Link
                    href={policy.editHref}
                    className="rounded-xl border border-stone-200/70 px-3 py-1.5 text-xs font-medium text-stone-600 transition-all duration-200 hover:bg-stone-100 active:scale-[0.98]"
                  >
                    {t("dashboard.policies.actions.edit", "Edit")}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon, CustomerStatusBadge } from "@/components/ui";
import Card from "@/components/ui/Card";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { useDebounce } from "@/hooks/useDebounce";
import type { AdminCustomer } from "@/types/admin";


import {
  calculateCustomerMetrics,
  filterCustomers,
  loadCustomersFromAdminService,
  type CustomerStatusFilter,
  type CustomersDataState,
} from "./customersPageLogic";




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
      className={`rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/50 ${accentBorder ? `border-l-4 ${accentBorder}` : ""} !p-0`}
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

const STATUS_FILTERS: CustomerStatusFilter[] = ["all", "active", "inactive"];

/* (CustomerStatusBadge imported from @/components/ui) */

const NATIONALITY_FLAGS: Record<string, { abbr: string; region: string }> = {
  Vietnam: { abbr: "VN", region: "Asia" },
  Korea: { abbr: "KR", region: "Asia" },
  USA: { abbr: "US", region: "North America" },
  Japan: { abbr: "JP", region: "Asia" },
  Spain: { abbr: "ES", region: "Europe" },
  "United Kingdom": { abbr: "GB", region: "Europe" },
  Australia: { abbr: "AU", region: "Oceania" },
};

interface CustomerTableRow {
  customer: AdminCustomer;
  rowKey: string;
}

const buildCustomerTableRows = (
  customers: AdminCustomer[],
): CustomerTableRow[] => {
  const idOccurrences = new Map<string, number>();

  return customers.map((customer, index) => {
    const normalizedId = customer.id || `UNKNOWN-${index + 1}`;
    const occurrence = (idOccurrences.get(normalizedId) ?? 0) + 1;
    idOccurrences.set(normalizedId, occurrence);

    return {
      customer,
      rowKey:
        occurrence === 1 ? normalizedId : `${normalizedId}__${occurrence}`,
    };
  });
};

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

export function CustomersPage() {
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [dataState, setDataState] = useState<CustomersDataState>("loading");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  useEffect(() => {
    let active = true;

    const loadCustomers = async () => {
      setDataState("loading");
      setErrorMessage(null);

      const result = await loadCustomersFromAdminService();

      if (!active) {
        return;
      }

      setCustomers(result.customers);
      setDataState(result.state);
      setErrorMessage(result.errorMessage);
    };

    void loadCustomers();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const filteredCustomers = useMemo(() => {
    return filterCustomers(customers, statusFilter, debouncedSearchQuery);
  }, [customers, statusFilter, debouncedSearchQuery]);

  const customerRows = useMemo(() => {
    return buildCustomerTableRows(filteredCustomers);
  }, [filteredCustomers]);

  const metrics = useMemo(() => {
    return calculateCustomerMetrics(customers);
  }, [customers]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  return (
    <>
      <main id="main-content" className="p-6 lg:p-8 max-w-[87.5rem] mx-auto space-y-6">
        {/* Page header with left-offset asymmetric placement */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <div className="pl-px">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">
              {t("common.customers.pageTitle")}
            </h1>
            <p className="text-sm text-stone-500 mt-1.5">
              {t("common.customers.pageSubtitle")}
            </p>
          </div>
          
          {/* Action Area: Search Input */}
          <div className="relative w-full sm:w-80">
            <Icon
              icon="heroicons:magnifying-glass"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400"
            />
            <label htmlFor="customers-search" className="sr-only">
              {t("common.search", "Search")}
            </label>
            <input
              id="customers-search"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              disabled={!canShowData}
              placeholder={t("common.customers.searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
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
                  {t("common.customers.error.title")}
                </h2>
                <p className="text-sm text-red-700 mt-1">
                  {errorMessage ??
                    t("common.customers.error.fallback")}
                </p>
              </div>
              <button
                onClick={retryLoading}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all duration-200"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          </motion.div>
        ) : null}

        {canShowData ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {/* Asymmetric stat grid — 3-equal + 1 offset */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
              <motion.div variants={itemVariants} className="lg:col-span-5">
                <StatCard
                  label={t("common.customers.stat.total")}
                  value={metrics.totalCustomers.toString()}
                  change="Synced from backend"
                  changeType="positive"
                  icon="heroicons:users"
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                  accentBorder="border-amber-300"
                />
              </motion.div>
              <motion.div variants={itemVariants} className="lg:col-span-3">
                <StatCard
                  label={t("common.customers.stat.active")}
                  value={metrics.activeCustomers.toString()}
                  change={`${metrics.activePercentage}% of total`}
                  changeType="positive"
                  icon="heroicons:user-group"
                  iconBg="bg-green-50"
                  iconColor="text-green-600"
                  accentBorder="border-green-300"
                />
              </motion.div>
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <StatCard
                  label={t("common.customers.stat.avgSpending")}
                  value={`$${Math.round(metrics.averageSpent).toLocaleString()}`}
                  change="Calculated from loaded data"
                  changeType="positive"
                  icon="heroicons:currency-dollar"
                  iconBg="bg-stone-50"
                  iconColor="text-stone-600"
                  accentBorder="border-stone-300"
                />
              </motion.div>
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <StatCard
                  label={t("common.customers.stat.vipMembers")}
                  value={metrics.vipCustomers.toString()}
                  change="Spending >= $5,000"
                  changeType="positive"
                  icon="heroicons:star"
                  iconBg="bg-amber-50"
                  iconColor="text-amber-600"
                  accentBorder="border-amber-300"
                />
              </motion.div>
            </div>

            <motion.div
              className="flex items-center gap-3 mt-2"
              variants={itemVariants}
            >
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${statusFilter === status ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:border-stone-300"}`}
                >
                  {status === "all"
                    ? t("common.customers.filterAll")
                    : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </motion.div>

            {isEmpty ? (
              <motion.div
                className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-12 text-center"
                variants={itemVariants}
              >
                <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
                  <Icon
                    icon="heroicons:user-group"
                    className="size-8 text-stone-400"
                  />
                </div>
                <h2 className="text-lg font-semibold text-stone-800 mt-4">
                  {t("common.customers.empty.title")}
                </h2>
                <p className="text-sm text-stone-500 mt-1.5 max-w-sm mx-auto">
                  {t("common.customers.empty.description")}
                </p>
              </motion.div>
            ) : (
              <motion.div
                className="bg-white border border-stone-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
                variants={itemVariants}
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-stone-50/80 border-b border-stone-200">
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                          {t("common.customers.column.customer")}
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                          {t("common.customers.column.contact")}
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                          {t("common.customers.column.nationality")}
                        </th>
                        <th className="text-center px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                          {t("common.customers.column.bookings")}
                        </th>
                        <th className="text-right px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                          {t("common.customers.column.totalSpent")}
                        </th>
                        <th className="text-center px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                          {t("common.customers.column.status")}
                        </th>
                        <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                          {t("common.customers.column.lastBooking")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {customerRows.length > 0 ? (
                        customerRows.map(({ customer, rowKey }) => {
                          const initials = customer.name
                            .split(" ")
                            .map((word) => word[0])
                            .join("");
                          const nationalityInfo =
                            NATIONALITY_FLAGS[customer.nationality] ?? { abbr: "--", region: customer.nationality };

                          return (
                            <tr
                              key={rowKey}
                              className="hover:bg-stone-50/80 transition-colors duration-200"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-linear-to-br from-amber-100 to-amber-50 rounded-full flex items-center justify-center text-sm font-bold text-amber-700 border border-amber-200/50">
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-stone-900">
                                      {customer.name}
                                    </p>
                                    <p className="text-xs text-stone-400 font-mono">
                                      {customer.id}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-stone-600">
                                  {customer.email}
                                </p>
                                <p className="text-xs text-stone-400">
                                  {customer.phone}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-stone-600">
                                  {nationalityInfo.abbr} {customer.nationality}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className="text-sm text-stone-900 font-medium data-value">
                                  {customer.totalBookings}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className="text-sm font-semibold text-stone-900 data-value">
                                  ${customer.totalSpent.toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <CustomerStatusBadge status={customer.status} />
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-stone-500">
                                  {customer.lastBooking}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-10 text-center text-sm text-stone-500"
                          >
                            {t("common.customers.noMatch")}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </main>
    </>
  );
}

export default CustomersPage;

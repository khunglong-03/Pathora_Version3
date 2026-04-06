"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { depositPolicyService } from "@/api/services/depositPolicyService";
import type { DepositPolicy } from "@/types/depositPolicy";
import { TourScopeMap, DepositTypeMap } from "@/types/depositPolicy";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { Icon } from "@/components/ui";

interface DepositPolicyListProps {
  onEdit: (policy: DepositPolicy) => void;
  onDelete: (id: string) => void;
  onToggleActive: (policy: DepositPolicy) => void;
  refreshKey?: number;
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, type: "spring" as const, stiffness: 100, damping: 20 },
  }),
};

export function DepositPolicyList({ onEdit, onDelete, onToggleActive, refreshKey: _refreshKey }: DepositPolicyListProps) {
  const { t } = useTranslation();
  const [policies, setPolicies] = useState<DepositPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    loadPolicies();
  }, [_refreshKey, retryToken]);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await depositPolicyService.getAll();
      if (response.success && response.data) {
        setPolicies(response.data);
      } else {
        setError(response.error?.[0]?.message || t("depositPolicy.error.fallback", "Failed to load deposit policies"));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("depositPolicy.error.fallback", "An error occurred while loading deposit policies"),
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50/80 border border-red-200/60 rounded-[2rem] p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon icon="heroicons:exclamation-circle" className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {t("depositPolicy.error.title", "Could not load deposit policies")}
                </p>
                <p className="text-sm text-red-700 mt-0.5">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setRetryToken((v) => v + 1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              {t("depositPolicy.common.retry", "Retry")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="w-16 h-16 rounded-[1.5rem] bg-stone-100 flex items-center justify-center mb-4"
        >
          <Icon icon="heroicons:banknotes" className="w-8 h-8 text-stone-400" />
        </motion.div>
        <p className="text-stone-600 text-sm font-semibold tracking-tight">
          {t("depositPolicy.empty.title", "No deposit policies yet")}
        </p>
        <p className="text-stone-400 text-xs mt-1 max-w-xs text-center">
          {t("depositPolicy.empty.description", "Create your first deposit policy to set payment requirements for your tours.")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-stone-200/80">
            <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 tracking-tight uppercase">
              {t("depositPolicy.column.tourScope", "Tour Scope")}
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 tracking-tight uppercase">
              {t("depositPolicy.column.depositType", "Deposit Type")}
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 tracking-tight uppercase">
              {t("depositPolicy.column.depositValue", "Deposit Value")}
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 tracking-tight uppercase">
              {t("depositPolicy.column.minDays", "Min Days")}
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-stone-500 tracking-tight uppercase">
              {t("depositPolicy.column.status", "Status")}
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-stone-500 tracking-tight uppercase">
              {t("depositPolicy.column.actions", "Actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {policies.map((policy, i) => (
            <motion.tr
              key={policy.id}
              custom={i}
              variants={rowVariants}
              initial="hidden"
              animate="visible"
              className="group hover:bg-amber-50/20 transition-colors duration-150"
            >
              <td className="px-6 py-4 text-sm font-semibold text-stone-900 tracking-tight">
                {TourScopeMap[policy.tourScope] || policy.tourScopeName}
              </td>
              <td className="px-6 py-4 text-sm text-stone-500">
                {DepositTypeMap[policy.depositType] || policy.depositTypeName}
              </td>
              <td className="px-6 py-4 text-sm text-stone-500 font-medium">
                {policy.depositType === 1 ? `${policy.depositValue}%` : `$${policy.depositValue}`}
              </td>
              <td className="px-6 py-4 text-sm text-stone-500">
                <span className="inline-flex items-center gap-1">
                  {policy.minDaysBeforeDeparture}
                  <span className="text-stone-400 text-xs">{t("depositPolicy.days", "days")}</span>
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleActive(policy)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:ring-offset-2 active:scale-[0.98] ${
                      policy.isActive ? "bg-emerald-500" : "bg-stone-200"
                    }`}
                  >
                    <motion.span
                      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0"
                      layout
                      transition={{ type: "spring", stiffness: 100, damping: 20 }}
                      animate={{ x: policy.isActive ? 20 : 0 }}
                    />
                  </button>
                  <span className={`text-xs font-semibold ${policy.isActive ? "text-emerald-600" : "text-stone-400"}`}>
                    {policy.isActive ? t("common.on", "On") : t("common.off", "Off")}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(policy)}
                    className="p-2 rounded-xl text-stone-400 hover:text-amber-600 hover:bg-amber-50 active:scale-[0.98] transition-all duration-200"
                    title={t("depositPolicy.common.edit", "Edit")}
                  >
                    <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(policy.id)}
                    className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.98] transition-all duration-200"
                    title={t("depositPolicy.common.delete", "Delete")}
                  >
                    <Icon icon="heroicons:trash" className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

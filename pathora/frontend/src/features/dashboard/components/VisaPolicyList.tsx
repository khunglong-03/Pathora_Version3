"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { visaPolicyService } from "@/api/services/visaPolicyService";
import type { VisaPolicy } from "@/types/visaPolicy";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { Icon } from "@/components/ui/Icon";

interface VisaPolicyListProps {
  onEdit: (policy: VisaPolicy) => void;
  onDelete: (id: string) => void;
  onToggleActive: (policy: VisaPolicy) => void;
  refreshKey?: number;
}

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, type: "spring" as const, stiffness: 100, damping: 20 },
  }),
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

export function VisaPolicyList({ onEdit, onDelete, onToggleActive, refreshKey = 0 }: VisaPolicyListProps) {
  const { t } = useTranslation();
  const [policies, setPolicies] = useState<VisaPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const loadPolicies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await visaPolicyService.getAll();
      if (response.success && response.data) {
        setPolicies(response.data);
      } else {
        setError(response.error?.[0]?.message || t("visaPolicy.error.fallback"));
      }
    } catch {
      setError(t("visaPolicy.error.fallback"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadPolicies();
  }, [loadPolicies, refreshKey, reloadToken]);

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  if (loading) {
    return (
      <div className="p-4">
        <SkeletonTable rows={5} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <motion.div
          className="rounded-[2rem] bg-white border border-danger-border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-5"
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon icon="heroicons:exclamation-circle" className="size-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-red-800">
                  {t("visaPolicy.error.title")}
                </h2>
                <p className="text-sm text-red-700/80 mt-0.5">
                  {error ?? t("visaPolicy.error.fallback")}
                </p>
              </div>
            </div>
            <button
              onClick={retryLoading}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-all duration-200 shrink-0"
            >
              {t("common.retry")}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="p-8 text-center">
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
        >
          <div className="w-14 h-14 rounded-[1.25rem] bg-stone-100 flex items-center justify-center mx-auto mb-3">
            <Icon
              icon="heroicons:clipboard-document"
              className="size-6 text-stone-300"
            />
          </div>
          <h2 className="text-base font-semibold text-stone-700">
            {t("visaPolicy.empty.title")}
          </h2>
          <p className="text-sm text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
            {t("visaPolicy.empty.description")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Table section label */}
      <div className="px-6 pt-5 pb-3 border-b border-stone-100">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          {t("visaPolicy.tableLabel", "Visa policies")} &middot; {policies.length}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {t("visaPolicy.column.region")}
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {t("visaPolicy.column.processingDays")}
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {t("visaPolicy.column.bufferDays")}
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {t("visaPolicy.column.fullPayment")}
              </th>
              <th className="text-left px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {t("visaPolicy.column.status")}
              </th>
              <th className="text-right px-6 py-3.5 text-xs font-semibold text-stone-400 uppercase tracking-widest">
                {t("visaPolicy.column.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {policies.map((policy, i) => (
              <motion.tr
                key={policy.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="show"
                className="group hover:bg-stone-50/50 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                      <Icon icon="heroicons:map-pin" className="size-3.5 text-stone-400" />
                    </div>
                    <span className="text-sm font-medium text-stone-800">
                      {policy.region}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-stone-600">
                    {policy.processingDays} {t("visaPolicy.days")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-stone-600">
                    {policy.bufferDays} {t("visaPolicy.days")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      policy.fullPaymentRequired
                        ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${policy.fullPaymentRequired ? "bg-amber-500" : "bg-emerald-500"}`} />
                    {policy.fullPaymentRequired ? t("common.yes") : t("common.no")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleActive(policy)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 focus-visible:ring-offset-2 active:scale-[0.98] ${
                        policy.isActive ? "bg-emerald-500" : "bg-stone-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          policy.isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-semibold ${policy.isActive ? "text-emerald-600" : "text-stone-400"}`}>
                      {policy.isActive ? t("common.on", "On") : t("common.off", "Off")}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(policy)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-500 hover:text-amber-600 hover:bg-amber-50 active:scale-[0.98] transition-all duration-150"
                    >
                      <Icon icon="heroicons:pencil-square" className="size-3.5" />
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => onDelete(policy.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-red-600 hover:bg-red-50 active:scale-[0.98] transition-all duration-150"
                    >
                      <Icon icon="heroicons:trash" className="size-3.5" />
                      {t("common.delete")}
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

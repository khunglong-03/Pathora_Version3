"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { taxConfigService } from "@/api/services/taxConfigService";
import type { TaxConfig } from "@/types/taxConfig";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { Icon } from "@/components/ui/Icon";
import { PencilSimple, TrashIcon } from "@phosphor-icons/react";

interface TaxConfigListProps {
  onEdit: (config: TaxConfig) => void;
  onDelete: (id: string) => void;
  refreshKey?: number;
}

const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: "spring" as const, stiffness: 100, damping: 20 },
  }),
};

type DataState = "loading" | "ready" | "empty" | "error";

export function TaxConfigList({ onEdit, onDelete, refreshKey: _refreshKey }: TaxConfigListProps) {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<TaxConfig[]>([]);
  const [dataState, setDataState] = useState<DataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadConfigs = async () => {
      setDataState("loading");
      setErrorMessage(null);

      try {
        const response = await taxConfigService.getAll();
        if (!active) return;

        if (response.success && response.data) {
          if (response.data.length === 0) {
            setConfigs([]);
            setDataState("empty");
          } else {
            setConfigs(response.data);
            setDataState("ready");
          }
        } else {
          setConfigs([]);
          setDataState("error");
          setErrorMessage(response.error?.[0]?.message || t("taxConfig.error.fallback"));
        }
      } catch (err) {
        if (!active) return;
        setConfigs([]);
        setDataState("error");
        setErrorMessage(
          err instanceof Error ? err.message : t("taxConfig.error.fallback"),
        );
      }
    };

    void loadConfigs();

    return () => {
      active = false;
    };
  }, [_refreshKey, t]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";

  const retryLoading = () => {
    setDataState("loading");
    setErrorMessage(null);
    void taxConfigService.getAll().then((response) => {
      if (response.success && response.data) {
        setConfigs(response.data);
        setDataState(response.data.length === 0 ? "empty" : "ready");
      } else {
        setConfigs([]);
        setDataState("error");
        setErrorMessage(response.error?.[0]?.message || t("taxConfig.error.fallback"));
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <SkeletonTable rows={5} columns={7} />
      </div>
    );
  }

  if (isError) {
    return (
      <motion.div
        className="mx-6 my-6 bg-white border border-danger-border rounded-[2.5rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
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
              <h2 className="text-sm font-semibold text-red-800">
                {t("taxConfig.error.title")}
              </h2>
              <p className="mt-0.5 text-sm text-red-700">
                {errorMessage ?? t("taxConfig.error.fallback")}
              </p>
            </div>
          </div>
          <button
            onClick={retryLoading}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all duration-200"
          >
            {t("common.retry")}
          </button>
        </div>
      </motion.div>
    );
  }

  if (isEmpty) {
    return (
      <motion.div
        className="mx-6 my-6 bg-white border border-border rounded-[2.5rem] p-10 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
      >
        <div className="mx-auto size-14 rounded-full bg-stone-100 flex items-center justify-center">
          <Icon
            icon="heroicons:calculator"
            className="size-6 text-stone-400"
          />
        </div>
        <h2 className="mt-4 text-lg font-bold tracking-tight text-stone-800">
          {t("taxConfig.empty.title")}
        </h2>
        <p className="mt-1.5 text-sm text-stone-500 max-w-[40ch] mx-auto">
          {t("taxConfig.empty.description")}
        </p>
      </motion.div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-stone-100">
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-stone-500 tracking-tight uppercase">
              {t("taxConfig.column.taxName")}
            </th>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-stone-500 tracking-tight uppercase">
              {t("taxConfig.column.taxCode")}
            </th>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-stone-500 tracking-tight uppercase">
              {t("taxConfig.column.taxRate")}
            </th>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-stone-500 tracking-tight uppercase">
              {t("taxConfig.column.effectiveDate")}
            </th>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-stone-500 tracking-tight uppercase">
              {t("taxConfig.column.description")}
            </th>
            <th className="px-6 py-3.5 text-left text-[11px] font-semibold text-stone-500 tracking-tight uppercase">
              {t("taxConfig.column.status")}
            </th>
            <th className="px-6 py-3.5 text-right text-[11px] font-semibold text-stone-500 tracking-tight uppercase">
              {t("taxConfig.column.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {configs.map((config, i) => (
              <motion.tr
                key={config.id}
                custom={i}
                variants={rowVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                layout
                className="group border-b border-stone-50 hover:bg-amber-50/30 transition-colors duration-150"
              >
                <td className="px-6 py-4 text-sm font-semibold text-stone-900 tracking-tight">
                  {config.taxName}
                </td>
                <td className="px-6 py-4 text-sm text-stone-500 font-mono tracking-tight">
                  {config.taxCode || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 tracking-tight">
                    <span className="font-mono">{config.taxRate}</span>
                    <span className="text-xs text-amber-500">%</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-stone-500 tracking-tight">
                  {config.effectiveDate ? new Date(config.effectiveDate).toLocaleDateString() : "-"}
                </td>
                <td className="px-6 py-4 text-sm text-stone-500 max-w-[12.5rem]">
                  <span className="line-clamp-2">{config.description || "-"}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-tight ${
                      config.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                        : "bg-stone-100 text-stone-600 border border-stone-200/50"
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${config.isActive ? "bg-emerald-500" : "bg-stone-400"}`} />
                    {config.isActive ? t("taxConfig.status.active") : t("taxConfig.status.inactive")}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(config)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:text-amber-600 hover:bg-amber-50 active:scale-[0.98] transition-all duration-200"
                    >
                      <PencilSimple className="size-3.5" weight="bold" />
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => onDelete(config.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600 hover:text-red-600 hover:bg-red-50 active:scale-[0.98] transition-all duration-200"
                    >
                      <TrashIcon className="size-3.5" weight="bold" />
                      {t("common.delete")}
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

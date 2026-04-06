"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { taxConfigService } from "@/api/services/taxConfigService";
import type { TaxConfig, CreateTaxConfigRequest, UpdateTaxConfigRequest } from "@/types/taxConfig";

interface TaxConfigFormProps {
  config?: TaxConfig | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormValues {
  taxName: string;
  taxRate: number;
  description: string;
  effectiveDate: string;
  isActive: boolean;
}

const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, type: "spring" as const, stiffness: 100, damping: 20 },
  }),
};

export function TaxConfigForm({ config, onSuccess, onCancel }: TaxConfigFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    defaultValues: {
      taxName: config?.taxName || "",
      taxRate: config?.taxRate || 10,
      description: config?.description || "",
      effectiveDate: config?.effectiveDate ? config.effectiveDate.split('T')[0] : new Date().toISOString().split('T')[0],
      isActive: config?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (config) {
      reset({
        taxName: config.taxName,
        taxRate: config.taxRate,
        description: config.description || "",
        effectiveDate: config.effectiveDate ? config.effectiveDate.split('T')[0] : "",
        isActive: config.isActive ?? true,
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setSaveError(null);
    try {
      let response;
      if (config) {
        const payload: UpdateTaxConfigRequest = {
          id: config.id,
          taxName: data.taxName,
          taxRate: data.taxRate,
          description: data.description || undefined,
          effectiveDate: new Date(data.effectiveDate + "T00:00:00Z").toISOString(),
          isActive: data.isActive,
        };
        response = await taxConfigService.update(payload);
      } else {
        const payload: CreateTaxConfigRequest = {
          taxName: data.taxName,
          taxRate: data.taxRate,
          description: data.description || undefined,
          effectiveDate: new Date(data.effectiveDate + "T00:00:00Z").toISOString(),
        };
        response = await taxConfigService.create(payload);
      }

      if (response.success) {
        onSuccess();
      } else {
        setSaveError(response.error?.[0]?.message || t("taxConfig.form.validation.saveFailed"));
      }
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : t("taxConfig.form.validation.saveFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {saveError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-red-50 border border-red-200/50 rounded-2xl p-4"
        >
          <div className="mt-0.5 shrink-0 size-5 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="size-3 text-red-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
          <p className="text-sm text-red-700">{saveError}</p>
        </motion.div>
      )}

      <motion.div custom={0} variants={fieldVariants} className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-tight">
          {t("taxConfig.form.taxName")}
        </label>
        <input
          type="text"
          {...register("taxName", { required: t("taxConfig.form.validation.taxNameRequired") })}
          placeholder={t("taxConfig.form.taxNamePlaceholder")}
          className="block w-full px-4 py-3 rounded-2xl border border-stone-200/70 bg-stone-50/50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 text-sm text-stone-700 placeholder:text-stone-400 transition-all duration-200 outline-none"
        />
        {errors.taxName && (
          <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
            <span className="size-1 rounded-full bg-red-500" />
            {errors.taxName.message}
          </p>
        )}
      </motion.div>

      <motion.div custom={1} variants={fieldVariants} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-tight">
            {t("taxConfig.form.taxRate")}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              {...register("taxRate", {
                required: t("taxConfig.form.validation.taxRateRequired"),
                min: { value: 0, message: t("taxConfig.form.validation.taxRateNegative") },
                max: { value: 100, message: t("taxConfig.form.validation.taxRateExceed") },
                valueAsNumber: true,
              })}
              className="block w-full px-4 py-3 pr-10 rounded-2xl border border-stone-200/70 bg-stone-50/50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 text-sm text-stone-700 transition-all duration-200 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-amber-500">%</span>
          </div>
          {errors.taxRate && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="size-1 rounded-full bg-red-500" />
              {errors.taxRate.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-tight">
            {t("taxConfig.form.effectiveDate")}
          </label>
          <input
            type="date"
            {...register("effectiveDate", { required: t("taxConfig.form.validation.effectiveDateRequired") })}
            className="block w-full px-4 py-3 rounded-2xl border border-stone-200/70 bg-stone-50/50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 text-sm text-stone-700 transition-all duration-200 outline-none"
          />
          {errors.effectiveDate && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="size-1 rounded-full bg-red-500" />
              {errors.effectiveDate.message}
            </p>
          )}
        </div>
      </motion.div>

      <motion.div custom={2} variants={fieldVariants} className="space-y-1.5">
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-tight">
          {t("taxConfig.form.description")}
          <span className="ml-1 font-normal text-stone-400 normal-case">(optional)</span>
        </label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder={t("taxConfig.form.descriptionPlaceholder")}
          className="block w-full px-4 py-3 rounded-2xl border border-stone-200/70 bg-stone-50/50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-500/15 text-sm text-stone-700 placeholder:text-stone-400 transition-all duration-200 outline-none resize-none"
        />
      </motion.div>

      <motion.div custom={3} variants={fieldVariants}>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              id="isActive"
              {...register("isActive")}
              className="sr-only peer"
            />
            <div className="w-10 h-6 rounded-full bg-stone-200 peer-checked:bg-amber-500 transition-colors duration-200" />
            <div className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
          </div>
          <span className="text-sm font-medium text-stone-700 group-hover:text-stone-900 transition-colors">
            {t("taxConfig.form.isActive")}
          </span>
        </label>
      </motion.div>

      <motion.div
        custom={4}
        variants={fieldVariants}
        className="flex items-center justify-end gap-3 pt-2 border-t border-stone-100"
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2.5 border border-stone-200/70 rounded-2xl text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-300 active:scale-[0.98] disabled:opacity-50 transition-all duration-200"
        >
          {t("taxConfig.form.cancel")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 border border-transparent rounded-2xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/30 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 shadow-[0_4px_14px_-4px_rgba(245,158,11,0.35)]"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t("taxConfig.form.saving")}
            </span>
          ) : config ? (
            t("taxConfig.form.update")
          ) : (
            t("taxConfig.form.create")
          )}
        </button>
      </motion.div>
    </motion.form>
  );
}

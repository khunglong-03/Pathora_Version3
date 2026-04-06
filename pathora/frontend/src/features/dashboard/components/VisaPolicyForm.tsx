"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { visaPolicyService } from "@/api/services/visaPolicyService";
import type { VisaPolicy, CreateVisaPolicyRequest, UpdateVisaPolicyRequest, VisaPolicyTranslations } from "@/types/visaPolicy";
import { TranslationTabForm, TranslationField } from "./TranslationTabForm";
import { Icon } from "@/components/ui";

interface VisaPolicyFormProps {
  policy?: VisaPolicy | null;
  onSuccess: () => void;
  onCancel: () => void;
}

/** Fields cho VisaPolicy translation — khớp với backend VisaPolicyTranslationData (region, note) */
const visaPolicyTranslationFields: TranslationField[] = [
  {
    key: "region",
    label: "Region",
    placeholder: {
      vi: "Nhập tên khu vực/vùng",
      en: "Enter region name",
    },
    type: "text",
  },
  {
    key: "note",
    label: "Note",
    placeholder: {
      vi: "Nhập ghi chú về chính sách visa",
      en: "Enter visa policy notes",
    },
    type: "textarea",
  },
];

const formFieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, type: "spring" as const, stiffness: 100, damping: 20 },
  }),
};

export function VisaPolicyForm({ policy, onSuccess, onCancel }: VisaPolicyFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<VisaPolicyTranslations>(
    policy?.translations || { vi: { region: "", note: "" }, en: { region: "", note: "" } }
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{
    region: string;
    processingDays: number;
    bufferDays: number;
    fullPaymentRequired: boolean;
    isActive: boolean;
  }>({
    defaultValues: {
      region: policy?.region || "",
      processingDays: policy?.processingDays || 30,
      bufferDays: policy?.bufferDays || 7,
      fullPaymentRequired: policy?.fullPaymentRequired || false,
      isActive: policy?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (policy) {
      reset({
        region: policy.region,
        processingDays: policy.processingDays,
        bufferDays: policy.bufferDays,
        fullPaymentRequired: policy.fullPaymentRequired,
        isActive: policy.isActive,
      });
      const existingTranslations = policy.translations || {};
      setTranslations({
        vi: { region: "", note: "", ...existingTranslations.vi },
        en: { region: "", note: "", ...existingTranslations.en },
      });
    }
  }, [policy, reset]);

  const onSubmit = async (data: { region: string; processingDays: number; bufferDays: number; fullPaymentRequired: boolean; isActive: boolean }) => {
    setLoading(true);
    setSaveError(null);
    try {
      let response;
      if (policy) {
        const payload: UpdateVisaPolicyRequest = {
          id: policy.id,
          region: data.region,
          processingDays: data.processingDays,
          bufferDays: data.bufferDays,
          fullPaymentRequired: data.fullPaymentRequired,
          isActive: data.isActive,
          translations,
        };
        response = await visaPolicyService.update(payload);
      } else {
        const payload: CreateVisaPolicyRequest = {
          region: data.region,
          processingDays: data.processingDays,
          bufferDays: data.bufferDays,
          fullPaymentRequired: data.fullPaymentRequired,
          translations,
        };
        response = await visaPolicyService.create(payload);
      }

      if (response.success) {
        onSuccess();
      } else {
        setSaveError(response.error?.[0]?.message || t("visaPolicy.updateFailed"));
      }
    } catch {
      setSaveError(t("visaPolicy.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="max-w-2xl"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">
          {policy ? t("visaPolicy.edit", "Edit Visa Policy") : t("visaPolicy.create", "Create Visa Policy")}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {policy
            ? t("visaPolicy.form.subtitleEdit", "Update the visa requirements for a specific region.")
            : t("visaPolicy.form.subtitleCreate", "Define visa processing rules and buffer days for your tours.")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {saveError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50 border border-red-200/60 rounded-2xl p-4 flex items-start gap-3"
          >
            <Icon icon="heroicons:exclamation-circle" className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{saveError}</p>
          </motion.div>
        )}

        <motion.div
          custom={0}
          variants={formFieldVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
          <label htmlFor="visa-region" className="block text-sm font-semibold text-stone-700">
            {t("visaPolicy.form.region")}
          </label>
          <input
            type="text"
            id="visa-region"
            {...register("region", { required: t("common.required", "This field is required") })}
            placeholder={t("visaPolicy.form.regionPlaceholder")}
            className="w-full rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200 hover:border-stone-300"
          />
          {errors.region && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <Icon icon="heroicons:exclamation-circle" className="w-3.5 h-3.5" />
              {errors.region.message}
            </p>
          )}
        </motion.div>

        <motion.div
          custom={1}
          variants={formFieldVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="visa-processing" className="block text-sm font-semibold text-stone-700">
              {t("visaPolicy.form.processingDays")}
            </label>
            <div className="relative">
              <input
                type="number"
                id="visa-processing"
                {...register("processingDays", {
                  required: t("common.required", "This field is required"),
                  min: { value: 1, message: t("common.minValue", "Must be at least {{min}}", { min: 1 }) },
                  valueAsNumber: true
                })}
                className="w-full rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200 hover:border-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                days
              </span>
            </div>
            {errors.processingDays && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <Icon icon="heroicons:exclamation-circle" className="w-3.5 h-3.5" />
                {errors.processingDays.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="visa-buffer" className="block text-sm font-semibold text-stone-700">
              {t("visaPolicy.form.bufferDays")}
            </label>
            <div className="relative">
              <input
                type="number"
                id="visa-buffer"
                {...register("bufferDays", {
                  required: t("common.required", "This field is required"),
                  min: { value: 0, message: t("common.minValue", "Cannot be negative") },
                  valueAsNumber: true
                })}
                className="w-full rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200 hover:border-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                days
              </span>
            </div>
            {errors.bufferDays && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <Icon icon="heroicons:exclamation-circle" className="w-3.5 h-3.5" />
                {errors.bufferDays.message}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          custom={2}
          variants={formFieldVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-3 rounded-2xl border border-stone-200/50 bg-stone-50/50 p-4"
        >
          <input
            type="checkbox"
            id="visa-full-payment"
            {...register("fullPaymentRequired")}
            className="h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
          />
          <label htmlFor="visa-full-payment" className="text-sm text-stone-700 cursor-pointer">
            {t("visaPolicy.form.fullPaymentRequired")}
          </label>
        </motion.div>

        {policy && (
          <motion.div
            custom={3}
            variants={formFieldVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-3 rounded-2xl border border-stone-200/50 bg-stone-50/50 p-4"
          >
            <input
              type="checkbox"
              id="visa-is-active"
              {...register("isActive")}
              className="h-4 w-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
            />
            <label htmlFor="visa-is-active" className="text-sm text-stone-700 cursor-pointer">
              {t("visaPolicy.form.active")}
            </label>
          </motion.div>
        )}

        <motion.div
          custom={4}
          variants={formFieldVariants}
          initial="hidden"
          animate="visible"
          className="border-t border-stone-200/60 pt-6"
        >
          <h3 className="text-base font-semibold text-stone-900 mb-4 tracking-tight flex items-center gap-2">
            <Icon icon="heroicons:globe-alt" className="w-4 h-4 text-amber-500" />
            {t("visaPolicy.form.translations")}
          </h3>
          <div className="rounded-2xl border border-stone-200/50 bg-stone-50/30 p-5">
            <TranslationTabForm
              translations={translations}
              onChange={setTranslations}
              fields={visaPolicyTranslationFields}
            />
          </div>
        </motion.div>

        <motion.div
          custom={5}
          variants={formFieldVariants}
          initial="hidden"
          animate="visible"
          className="flex justify-end gap-3 pt-2"
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-stone-200 rounded-2xl text-sm font-semibold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition-all duration-200"
          >
            {t("visaPolicy.form.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-amber-500/20"
          >
            {loading ? t("visaPolicy.form.saving") : policy ? t("visaPolicy.form.update") : t("visaPolicy.form.create")}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { depositPolicyService } from "@/api/services/depositPolicyService";
import type { DepositPolicy, CreateDepositPolicyRequest, UpdateDepositPolicyRequest, DepositPolicyTranslations } from "@/types/depositPolicy";
import { TourScopeMap, DepositTypeMap } from "@/types/depositPolicy";
import { TranslationTabForm, TranslationField } from "./TranslationTabForm";
import { Icon } from "@/components/ui";

interface DepositPolicyFormProps {
  policy?: DepositPolicy | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const depositPolicyTranslationFields: TranslationField[] = [
  {
    key: "description",
    label: "Description",
    placeholder: {
      vi: "Nhập mô tả chính sách đặt cọc",
      en: "Enter deposit policy description",
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

export function DepositPolicyForm({ policy, onSuccess, onCancel }: DepositPolicyFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<DepositPolicyTranslations>(
    policy?.translations || { vi: { description: "" }, en: { description: "" } },
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{
    tourScope: number;
    depositType: number;
    depositValue: number;
    minDaysBeforeDeparture: number;
  }>({
    defaultValues: {
      tourScope: policy?.tourScope || 1,
      depositType: policy?.depositType || 1,
      depositValue: policy?.depositValue || 10,
      minDaysBeforeDeparture: policy?.minDaysBeforeDeparture || 7,
    },
  });

  useEffect(() => {
    if (policy) {
      reset({
        tourScope: policy.tourScope,
        depositType: policy.depositType,
        depositValue: policy.depositValue,
        minDaysBeforeDeparture: policy.minDaysBeforeDeparture,
      });
      setTranslations(policy.translations || {});
    }
  }, [policy, reset]);

  const onSubmit = async (data: { tourScope: number; depositType: number; depositValue: number; minDaysBeforeDeparture: number }) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (policy) {
        const payload: UpdateDepositPolicyRequest = {
          id: policy.id,
          ...data,
          isActive: policy.isActive,
          translations,
        };
        response = await depositPolicyService.update(payload);
      } else {
        const payload: CreateDepositPolicyRequest = {
          ...data,
          translations,
        };
        response = await depositPolicyService.create(payload);
      }

      if (response.success) {
        onSuccess();
      } else {
        setError(response.error?.[0]?.message || t("depositPolicy.updateFailed", "Failed to save deposit policy"));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("depositPolicy.updateFailed", "An error occurred while saving the deposit policy"),
      );
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
          {policy ? t("depositPolicy.edit", "Edit Deposit Policy") : t("depositPolicy.create", "Create Deposit Policy")}
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          {policy
            ? t("depositPolicy.form.subtitleEdit", "Update the deposit requirements for this policy.")
            : t("depositPolicy.form.subtitleCreate", "Set up deposit rules based on tour scope and payment type.")}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-50/80 border border-red-200/60 rounded-2xl p-4 flex items-start gap-3"
          >
            <Icon icon="heroicons:exclamation-circle" className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        <motion.div
          custom={0}
          variants={formFieldVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-stone-700">
              {t("depositPolicy.form.tourScope", "Tour Scope")}
            </label>
            <div className="relative">
              <select
                {...register("tourScope", { required: true, valueAsNumber: true })}
                className="w-full rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200 hover:border-stone-300 cursor-pointer appearance-none"
              >
                {Object.entries(TourScopeMap).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <Icon
                icon="heroicons:chevron-down"
                className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-stone-700">
              {t("depositPolicy.form.depositType", "Deposit Type")}
            </label>
            <div className="relative">
              <select
                {...register("depositType", { required: true, valueAsNumber: true })}
                className="w-full rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200 hover:border-stone-300 cursor-pointer appearance-none"
              >
                {Object.entries(DepositTypeMap).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
              <Icon
                icon="heroicons:chevron-down"
                className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          custom={1}
          variants={formFieldVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-stone-700">
              {t("depositPolicy.form.depositValue", "Deposit Value")}
            </label>
            <input
              type="number"
              step="0.01"
              {...register("depositValue", {
                required: t("depositPolicy.form.depositValue", "Deposit value is required"),
                min: { value: 0.01, message: t("common.depositValueMin", "Must be greater than 0") },
                valueAsNumber: true,
              })}
              className="w-full rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200 hover:border-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {errors.depositValue && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <Icon icon="heroicons:exclamation-circle" className="w-3.5 h-3.5" />
                {errors.depositValue.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-stone-700">
              {t("depositPolicy.form.minDaysBeforeDeparture", "Min Days Before Departure")}
            </label>
            <div className="relative">
              <input
                type="number"
                {...register("minDaysBeforeDeparture", {
                  required: t("common.minDaysRequired", "Min days is required"),
                  min: { value: 0, message: t("common.minDaysNegative", "Cannot be negative") },
                  valueAsNumber: true,
                })}
                className="w-full rounded-2xl border border-stone-200/80 bg-white px-4 py-3 text-sm text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/15 transition-all duration-200 hover:border-stone-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-stone-400 font-medium pointer-events-none">
                days
              </span>
            </div>
            {errors.minDaysBeforeDeparture && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <Icon icon="heroicons:exclamation-circle" className="w-3.5 h-3.5" />
                {errors.minDaysBeforeDeparture.message}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          custom={2}
          variants={formFieldVariants}
          initial="hidden"
          animate="visible"
          className="border-t border-stone-200/60 pt-6"
        >
          <h3 className="text-base font-semibold text-stone-900 mb-4 tracking-tight flex items-center gap-2">
            <Icon icon="heroicons:globe-alt" className="w-4 h-4 text-amber-500" />
            {t("depositPolicy.form.translations", "Translations")}
          </h3>
          <div className="rounded-2xl border border-stone-200/50 bg-stone-50/30 p-5">
            <TranslationTabForm
              translations={translations}
              onChange={setTranslations}
              fields={depositPolicyTranslationFields}
            />
          </div>
        </motion.div>

        <motion.div
          custom={3}
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
            {t("depositPolicy.common.cancel", "Cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-amber-500/20"
          >
            {loading
              ? t("depositPolicy.common.saving", "Saving...")
              : policy
                ? t("depositPolicy.common.update", "Update")
                : t("depositPolicy.common.create", "Create")}
          </button>
        </motion.div>
      </form>
    </motion.div>
  );
}

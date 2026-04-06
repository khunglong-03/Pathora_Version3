"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cancellationPolicyService } from "@/api/services/cancellationPolicyService";
import type {
  CancellationPolicy,
  CreateCancellationPolicyRequest,
  UpdateCancellationPolicyRequest,
  CancellationPolicyTranslations,
  CancellationPolicyTier,
} from "@/types/cancellationPolicy";
import { TourScopeMap } from "@/types/cancellationPolicy";
import { TranslationTabForm, TranslationField } from "./TranslationTabForm";
import { Icon } from "@/components/ui/Icon";

interface CancellationPolicyFormProps {
  policy?: CancellationPolicy | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const cancellationPolicyTranslationFields: TranslationField[] = [
  {
    key: "description",
    label: "Description",
    placeholder: {
      vi: "Nhập mô tả chính sách hủy tour",
      en: "Enter cancellation policy description",
    },
    type: "textarea",
  },
];

const defaultTier: CancellationPolicyTier = {
  minDaysBeforeDeparture: 0,
  maxDaysBeforeDeparture: 7,
  penaltyPercentage: 10,
};

export function CancellationPolicyForm({
  policy,
  onSuccess,
  onCancel,
}: CancellationPolicyFormProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<CancellationPolicyTranslations>(
    policy?.translations || { vi: { description: "" }, en: { description: "" } },
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<{
    tourScope: number;
    tiers: CancellationPolicyTier[];
  }>({
    defaultValues: {
      tourScope: policy?.tourScope || 1,
      tiers: policy?.tiers || [{ ...defaultTier }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tiers",
  });

  useEffect(() => {
    if (policy) {
      reset({
        tourScope: policy.tourScope,
        tiers:
          policy.tiers && policy.tiers.length > 0
            ? policy.tiers.map((t) => ({ ...t }))
            : [{ ...defaultTier }],
      });
      setTranslations(policy.translations || {});
    }
  }, [policy, reset]);

  const onSubmit = async (data: {
    tourScope: number;
    tiers: CancellationPolicyTier[];
  }) => {
    for (const tier of data.tiers) {
      if (tier.minDaysBeforeDeparture > tier.maxDaysBeforeDeparture) {
        alert(
          t(
            "cancellationPolicy.validation.minDaysGreaterThanMax",
            "Min days cannot be greater than Max days",
          ),
        );
        return;
      }
    }

    // Backend requires: last tier maxDays = int.MaxValue, tiers sorted by minDays, no overlaps
    const sortedTiers = [...data.tiers].sort((a, b) => a.minDaysBeforeDeparture - b.minDaysBeforeDeparture);
    sortedTiers[sortedTiers.length - 1].maxDaysBeforeDeparture = 2147483647;

    setSaving(true);
    setSubmitError(null);
    try {
      if (policy) {
        const payload: UpdateCancellationPolicyRequest = {
          id: policy.id,
          tourScope: data.tourScope,
          tiers: sortedTiers,
          translations,
        };
        const response = await cancellationPolicyService.update(payload);
        if (response.success) {
          onSuccess();
        } else {
          setSubmitError(
            response.error?.[0]?.message ||
              t("cancellationPolicy.error.saveFailed", "Failed to save cancellation policy"),
          );
        }
      } else {
        const payload: CreateCancellationPolicyRequest = {
          tourScope: data.tourScope,
          tiers: sortedTiers,
          translations,
        };
        const response = await cancellationPolicyService.create(payload);
        if (response.success) {
          onSuccess();
        } else {
          setSubmitError(
            response.error?.[0]?.message ||
              t("cancellationPolicy.error.saveFailed", "Failed to save cancellation policy"),
          );
        }
      }
    } catch {
      setSubmitError(
        t(
          "cancellationPolicy.error.saveFailed",
          "An error occurred while saving the cancellation policy",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {submitError && (
        <motion.div
          className="bg-red-50 border border-red-200/50 rounded-2xl p-4 flex items-start gap-3"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
        >
          <Icon
            icon="heroicons:exclamation-circle"
            className="size-5 text-red-500 mt-0.5 flex-shrink-0"
          />
          <p className="text-sm text-red-700">{submitError}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-1">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            {t("cancellationPolicy.form.tourScope", "Tour Scope")}
          </label>
          <select
            {...register("tourScope", { required: true, valueAsNumber: true })}
            className="block w-full px-3.5 py-2.5 border border-stone-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-sm text-stone-700 hover:border-stone-300 transition-colors"
          >
            {Object.entries(TourScopeMap).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tiers Section */}
      <div className="border-t border-stone-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-800 tracking-tight flex items-center gap-2">
            <Icon icon="heroicons:scale" className="size-4 text-amber-500" />
            {t("cancellationPolicy.form.tiers", "Cancellation Tiers")}
          </h3>
          <button
            type="button"
            onClick={() => append({ ...defaultTier })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 active:scale-[0.98] transition-all duration-200"
          >
            <Icon icon="heroicons:plus" className="size-3.5" />
            {t("cancellationPolicy.action.addTier", "Add Tier")}
          </button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <motion.div
              key={field.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring" as const, stiffness: 200, damping: 25 }}
              className="bg-stone-50 rounded-2xl p-5 border border-stone-200/70"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {t("cancellationPolicy.tier.label", "Tier")} {index + 1}
                </span>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 active:scale-[0.98] transition-all duration-150"
                  >
                    <Icon icon="heroicons:trash" className="size-3.5" />
                    {t("common.delete")}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    {t("cancellationPolicy.form.minDays", "Min Days Before Departure")}
                  </label>
                  <input
                    type="number"
                    {...register(`tiers.${index}.minDaysBeforeDeparture`, {
                      required: true,
                      min: { value: 0, message: t("cancellationPolicy.validation.cannotBeNegative", "Cannot be negative") },
                      valueAsNumber: true,
                    })}
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-sm text-stone-700 hover:border-stone-300 transition-colors"
                  />
                  {errors.tiers?.[index]?.minDaysBeforeDeparture && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <Icon icon="heroicons:exclamation-circle" className="size-3" />
                      {errors.tiers[index].minDaysBeforeDeparture.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    {t("cancellationPolicy.form.maxDays", "Max Days Before Departure")}
                    {index === fields.length - 1 && (
                      <span className="ml-1 text-amber-600 font-medium text-[10px]">
                        (∞ no limit)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    {...register(`tiers.${index}.maxDaysBeforeDeparture`, {
                      required: true,
                      min: { value: 0, message: t("cancellationPolicy.validation.cannotBeNegative", "Cannot be negative") },
                      valueAsNumber: true,
                    })}
                    placeholder={index === fields.length - 1 ? "∞ (no limit)" : undefined}
                    className="block w-full px-3 py-2 border border-stone-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-sm text-stone-700 hover:border-stone-300 transition-colors"
                  />
                  {errors.tiers?.[index]?.maxDaysBeforeDeparture && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <Icon icon="heroicons:exclamation-circle" className="size-3" />
                      {errors.tiers[index].maxDaysBeforeDeparture.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    {t("cancellationPolicy.form.penaltyPercentage", "Penalty %")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      {...register(`tiers.${index}.penaltyPercentage`, {
                        required: true,
                        min: { value: 0, message: t("cancellationPolicy.validation.cannotBeNegative", "Cannot be negative") },
                        max: { value: 100, message: t("cancellationPolicy.validation.cannotExceed100", "Cannot exceed 100%") },
                        valueAsNumber: true,
                      })}
                      className="block w-full px-3 py-2 pr-8 border border-stone-200 rounded-xl bg-white shadow-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 text-sm text-stone-700 hover:border-stone-300 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-400 pointer-events-none">
                      %
                    </span>
                  </div>
                  {errors.tiers?.[index]?.penaltyPercentage && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <Icon icon="heroicons:exclamation-circle" className="size-3" />
                      {errors.tiers[index].penaltyPercentage.message}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="border-t border-stone-200 pt-6">
        <h3 className="text-sm font-bold text-stone-800 tracking-tight mb-4 flex items-center gap-2">
          <Icon icon="heroicons:language" className="size-4 text-amber-500" />
          {t("cancellationPolicy.form.translations", "Translations")}
        </h3>
        <TranslationTabForm
          translations={translations}
          onChange={setTranslations}
          fields={cancellationPolicyTranslationFields}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-700 hover:bg-stone-50 hover:border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 active:scale-[0.98] transition-all duration-200"
        >
          {t("cancellationPolicy.action.cancel", "Cancel")}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-2 focus:ring-amber-500/30 focus:ring-offset-2 disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
        >
          {saving ? (
            <>
              <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
              {t("cancellationPolicy.action.saving", "Saving...")}
            </>
          ) : (
            <>
              <Icon icon="heroicons:check" className="size-4" />
              {policy
                ? t("cancellationPolicy.action.update", "Update")
                : t("cancellationPolicy.action.create", "Create")}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

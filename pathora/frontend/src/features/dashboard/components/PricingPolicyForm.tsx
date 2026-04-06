"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { pricingPolicyService } from "@/api/services/pricingPolicyService";
import type { PricingPolicy, PricingPolicyTier, CreatePricingPolicyRequest, UpdatePricingPolicyRequest, PricingPolicyTranslations } from "@/types/pricingPolicy";
import { PricingTierInput } from "./PricingTierInput";
import { TranslationTabForm, TranslationField } from "./TranslationTabForm";
import { PencilSimple, Tag } from "@phosphor-icons/react";

interface PricingPolicyFormProps {
  policy?: PricingPolicy | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const pricingPolicyTranslationFields: TranslationField[] = [
  {
    key: "name",
    label: "Name",
    placeholder: {
      vi: "Nhập tên chính sách giá",
      en: "Enter pricing policy name",
    },
    type: "text",
  },
  {
    key: "description",
    label: "Description",
    placeholder: {
      vi: "Nhập mô tả chính sách giá",
      en: "Enter pricing policy description",
    },
    type: "textarea",
  },
];

export function PricingPolicyForm({ policy, onSuccess, onCancel }: PricingPolicyFormProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tiers, setTiers] = useState<PricingPolicyTier[]>(policy?.tiers || []);
  const [translations, setTranslations] = useState<PricingPolicyTranslations>(
    policy?.translations || { vi: { name: "", description: "" }, en: { name: "", description: "" } }
  );
  const { register, handleSubmit, formState: { errors }, reset } = useForm<{
    name: string;
    tourType: number;
    isDefault: boolean;
  }>({
    defaultValues: {
      name: policy?.name || "",
      tourType: policy?.tourType || 2,
      isDefault: policy?.isDefault || false,
    },
  });

  useEffect(() => {
    if (policy) {
      reset({
        name: policy.name,
        tourType: policy.tourType,
        isDefault: policy.isDefault,
      });
      setTiers(policy.tiers);
      const existingTranslations = policy.translations || {};
      setTranslations({
        vi: { name: "", description: "", ...existingTranslations.vi },
        en: { name: "", description: "", ...existingTranslations.en },
      });
    }
  }, [policy, reset]);

  const onSubmit = async (data: { name: string; tourType: number; isDefault: boolean }) => {
    if (tiers.length === 0) {
      setErrorMessage(t("pricingPolicy.form.minOneTier", "Please add at least one pricing tier"));
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      let response;
      if (policy) {
        const payload: UpdatePricingPolicyRequest = {
          id: policy.id,
          name: data.name,
          tourType: Number(data.tourType),
          tiers,
          translations,
        };
        response = await pricingPolicyService.update(payload);
      } else {
        const payload: CreatePricingPolicyRequest = {
          name: data.name,
          tourType: Number(data.tourType),
          tiers,
          isDefault: data.isDefault,
          translations,
        };
        response = await pricingPolicyService.create(payload);
      }

      if (response.success) {
        onSuccess();
      } else {
        setErrorMessage(response.error?.[0]?.message || t("pricingPolicy.form.saveFailed", "Failed to save pricing policy"));
      }
    } catch {
      setErrorMessage(t("pricingPolicy.form.saveFailed", "An error occurred while saving the pricing policy"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
    >
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-red-200/60 bg-red-50/50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 w-6 h-6 rounded-xl bg-red-100 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 3.75V6.75M6 9H6.01M10.5 6A4.5 4.5 0 1 1 1.5 6a4.5 4.5 0 0 1 9 0Z" stroke="#dc2626" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Policy Name */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            {t("pricingPolicy.form.policyName", "Policy Name")}
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <Tag className="w-4 h-4 text-stone-400" weight="regular" />
            </div>
            <input
              type="text"
              {...register("name", { required: t("pricingPolicy.validation.policyNameRequired", "Policy name is required") })}
              placeholder={t("pricingPolicy.form.policyNamePlaceholder", "e.g., Standard Age Pricing")}
              className="block w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-2xl text-sm text-stone-700 placeholder-stone-400 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200"
            />
          </div>
          {errors.name && (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Tour Type */}
        <div className="lg:col-span-1">
          <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
            {t("pricingPolicy.form.tourType", "Tour Type")}
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <PencilSimple className="w-4 h-4 text-stone-400" weight="regular" />
            </div>
            <select
              {...register("tourType", { required: true })}
              className="block w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-2xl text-sm text-stone-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 appearance-none bg-white cursor-pointer"
            >
              <option value={1}>{t("pricingPolicy.private", "Private")}</option>
              <option value={2}>{t("pricingPolicy.public", "Public")}</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-stone-400">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Default checkbox */}
      {!policy && (
        <div className="mb-8">
          <label className="group inline-flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                {...register("isDefault")}
                className="sr-only"
              />
              <div className="w-5 h-5 rounded-lg border-2 border-stone-300 group-hover:border-amber-400 transition-colors duration-150 flex items-center justify-center bg-white peer-checked:bg-amber-500 peer-checked:border-amber-500">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="hidden peer-checked:block">
                  <path d="M2 5.5L4 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <span className="text-sm text-stone-600 group-hover:text-stone-800 transition-colors duration-150">
              {t("pricingPolicy.form.setAsDefault", "Set as default policy")}
            </span>
          </label>
        </div>
      )}

      {/* Pricing Tiers */}
      <div className="mb-8">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-stone-800 tracking-tight">
            {t("pricingPolicy.form.pricingTiers", "Pricing Tiers")}
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {t("pricingPolicy.form.tiersHelp", "Define age ranges and price percentages relative to the adult base price")}
          </p>
        </div>
        <PricingTierInput tiers={tiers} onChange={setTiers} />
      </div>

      {/* Translations */}
      <div className="border-t border-stone-100 pt-8 mb-8">
        <div className="mb-5">
          <h3 className="text-sm font-bold text-stone-800 tracking-tight">
            {t("pricingPolicy.form.translations", "Translations")}
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">
            {t("pricingPolicy.form.translationsHelp", "Provide translated content for supported languages")}
          </p>
        </div>
        <TranslationTabForm
          translations={translations}
          onChange={setTranslations}
          fields={pricingPolicyTranslationFields}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="px-5 py-2.5 border border-stone-200 rounded-2xl text-sm font-semibold text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500/20"
        >
          {t("pricingPolicy.form.cancel", "Cancel")}
        </motion.button>
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl shadow-[0_4px_16px_-4px_rgba(245,158,11,0.4)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30 flex items-center gap-2"
        >
          {loading && (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {loading
            ? t("pricingPolicy.form.saving", "Saving...")
            : policy
              ? t("pricingPolicy.form.update", "Update Policy")
              : t("pricingPolicy.form.create", "Create Policy")}
        </motion.button>
      </div>
    </motion.form>
  );
}

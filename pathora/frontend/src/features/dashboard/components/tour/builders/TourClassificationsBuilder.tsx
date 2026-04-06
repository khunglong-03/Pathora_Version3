"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";

/* ── Types ──────────────────────────────────────────────────── */
interface ClassificationForm {
  id?: string;
  name: string;
  enName: string;
  description: string;
  enDescription: string;
  basePrice: string;
  durationDays: string;
}

/* ── Constants ──────────────────────────────────────────────── */
const PACKAGE_TYPE_OPTIONS = [
  { key: "standard", vi: "Tiêu chuẩn", en: "Standard" },
  { key: "premium", vi: "Cao cấp", en: "Premium" },
  { key: "luxury", vi: "Sang trọng", en: "Luxury" },
  { key: "budget", vi: "Tiết kiệm", en: "Budget" },
  { key: "vip", vi: "VIP", en: "VIP" },
];

const findPackageTypeOption = (value: string) => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return PACKAGE_TYPE_OPTIONS.find(
    (option) =>
      option.key === normalized
      || option.vi.toLowerCase() === normalized
      || option.en.toLowerCase() === normalized,
  );
};

/* ── Props ──────────────────────────────────────────────────── */
interface TourClassificationsBuilderProps {
  classifications: ClassificationForm[];
  errors: Record<string, string>;
  isEditMode: boolean;
  onAddClassification: () => void;
  onRemoveClassification: (index: number) => void;
  onUpdateClassification: (index: number, field: keyof ClassificationForm, value: string) => void;
  onUpdateClassificationPackageTypeVi: (index: number, value: string) => void;
  onUpdateClassificationPackageTypeEn: (index: number, value: string) => void;
  setConfirmDelete: React.Dispatch<React.SetStateAction<{
    type: "classification" | "dayPlan" | "activity";
    index1: number;
    index2?: number;
    index3?: number;
  } | null>>;
  validateField: (field: string, value: string) => void;
  validateFieldPositiveNumber: (field: string, value: string) => void;
}

export function TourClassificationsBuilder({
  classifications,
  errors,
  isEditMode,
  onAddClassification,
  onRemoveClassification,
  onUpdateClassification,
  onUpdateClassificationPackageTypeVi,
  onUpdateClassificationPackageTypeEn,
  setConfirmDelete,
  validateField,
  validateFieldPositiveNumber,
}: TourClassificationsBuilderProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {t("tourAdmin.packages.sectionTitle")}
        </h2>
        <button
          type="button"
          onClick={onAddClassification}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
          <Icon icon="heroicons:plus" className="size-4" />
          {t("tourAdmin.buttons.addPackage")}
        </button>
      </div>
      <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
        <Icon
          icon="heroicons:information-circle"
          className="size-4 text-blue-500 shrink-0"
        />
        <p className="text-xs text-blue-700 dark:text-blue-400">
          {t("tourAdmin.packages.infoBanner")}
        </p>
      </div>

      <div className="space-y-4">
        {classifications.map((cls, clsI) => (
          <div
            key={clsI}
            className="border border-stone-200 dark:border-stone-700 rounded-2xl p-5 relative overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                  {clsI + 1}
                </div>
                <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">
                  {cls.name || cls.enName
                    ? `${cls.name || ""}${cls.name && cls.enName ? " / " : ""}${cls.enName || ""}`
                    : t("tourAdmin.review.untitled")}
                </h3>
              </div>
              {classifications.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    isEditMode
                      ? setConfirmDelete({ type: "classification", index1: clsI })
                      : onRemoveClassification(clsI)
                  }
                  aria-label={t("tourAdmin.packages.removePackage")}
                  className="text-stone-400 hover:text-red-500 transition-colors">
                  <Icon icon="heroicons:trash" className="size-4" />
                </button>
              )}
            </div>

            {/* Duration & Base Price — shared fields */}
            <div className="mb-5 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  {t("tourAdmin.packages.durationDays")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={cls.durationDays}
                  onChange={(e) =>
                    onUpdateClassification(clsI, "durationDays", e.target.value)
                  }
                  placeholder={t("tourAdmin.packages.placeholderDuration")}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
                {errors[`cls_${clsI}_duration`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`cls_${clsI}_duration`]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
                  {t("tourAdmin.packages.basePrice")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={cls.basePrice}
                    onChange={(e) =>
                      onUpdateClassification(clsI, "basePrice", e.target.value)
                    }
                    onBlur={(e) =>
                      validateFieldPositiveNumber(`cls_${clsI}_basePrice`, e.target.value)
                    }
                    placeholder={t("tourAdmin.packages.placeholderBasePrice")}
                    className={`w-full px-3 py-2 pr-8 text-sm rounded-xl border bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                      errors[`cls_${clsI}_basePrice`]
                        ? "border-red-400 dark:border-red-500"
                        : "border-stone-300 dark:border-stone-600"
                    }`}
                  />
                  {errors[`cls_${clsI}_basePrice`] && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                      <Icon icon="heroicons:x-circle" className="size-4" />
                    </span>
                  )}
                </div>
                {errors[`cls_${clsI}_basePrice`] && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                    {errors[`cls_${clsI}_basePrice`]}
                  </p>
                )}
              </div>
            </div>

            {/* VI / EN parallel columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ── VI Column ── */}
              <div className="space-y-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🇻🇳</span>
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
                    Tiếng Việt
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    {t("tourAdmin.packages.packageType")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={findPackageTypeOption(cls.name)?.key ?? ""}
                      onChange={(e) => onUpdateClassificationPackageTypeVi(clsI, e.target.value)}
                      onBlur={() => validateField(`cls_${clsI}_name`, cls.name)}
                      className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition cursor-pointer ${
                        errors[`cls_${clsI}_name`]
                          ? "border-red-400 dark:border-red-500"
                          : "border-stone-300 dark:border-stone-600"
                      }`}>
                      <option value="">{t("tourAdmin.packages.placeholderPackageType")}</option>
                      {PACKAGE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>{opt.vi}</option>
                      ))}
                    </select>
                    {errors[`cls_${clsI}_name`] && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        <Icon icon="heroicons:x-circle" className="size-4" />
                      </span>
                    )}
                  </div>
                  {errors[`cls_${clsI}_name`] && (
                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                      <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                      {errors[`cls_${clsI}_name`]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    {t("tourAdmin.packages.description")}
                  </label>
                  <textarea
                    value={cls.description}
                    onChange={(e) => onUpdateClassification(clsI, "description", e.target.value)}
                    rows={3}
                    placeholder={t("tourAdmin.packages.placeholderDescription")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                  />
                  {errors[`cls_${clsI}_description`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`cls_${clsI}_description`]}</p>
                  )}
                </div>
              </div>

              {/* ── EN Column ── */}
              <div className="space-y-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">🇬🇧</span>
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wide">
                    English
                  </span>
                  <span className="text-[10px] font-normal text-stone-400 dark:text-stone-500">
                    (Tùy chọn)
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    {t("tourAdmin.packages.packageType")} / Type
                  </label>
                  <select
                    value={findPackageTypeOption(cls.enName)?.key ?? ""}
                    onChange={(e) => onUpdateClassificationPackageTypeEn(clsI, e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition cursor-pointer">
                    <option value="">Select type...</option>
                    {PACKAGE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>{opt.en}</option>
                    ))}
                  </select>
                  {errors[`cls_${clsI}_enName`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`cls_${clsI}_enName`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">
                    {t("tourAdmin.packages.description")} / Description
                  </label>
                  <textarea
                    value={cls.enDescription}
                    onChange={(e) => onUpdateClassification(clsI, "enDescription", e.target.value)}
                    rows={3}
                    placeholder="Describe what this package includes..."
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                  />
                  {errors[`cls_${clsI}_enDescription`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`cls_${clsI}_enDescription`]}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";
import type { TourFormValues } from "@/schemas/tour-form";
import { formatCurrency } from "@/utils/format";

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

interface InsuranceForm {
  insuranceName: string;
  enInsuranceName: string;
  insuranceType: string;
  insuranceProvider: string;
  coverageDescription: string;
  enCoverageDescription: string;
  coverageAmount: string;
  coverageFee: string;
  isOptional: boolean;
  note: string;
  enNote: string;
}

/* ── Constants ──────────────────────────────────────────────── */
const INSURANCE_TYPE_OPTIONS = [
  { value: "0" },
  { value: "1" },
  { value: "2" },
  { value: "3" },
  { value: "4" },
  { value: "5" },
  { value: "6" },
];

/* ── Props ──────────────────────────────────────────────────── */
interface InsuranceSectionProps {
  classifications: ClassificationForm[];
  insurances: InsuranceForm[][];
  activeLang: "vi" | "en";
  insuranceTypes: string[];
  onAddInsurance: (clsIndex: number) => void;
  onRemoveInsurance: (clsIndex: number, insIndex: number) => void;
  onUpdateInsurance: (
    clsIndex: number,
    insIndex: number,
    field: keyof InsuranceForm,
    value: string | boolean,
  ) => void;
}

export function InsuranceSection({
  classifications,
  insurances,
  activeLang,
  insuranceTypes,
  onAddInsurance,
  onRemoveInsurance,
  onUpdateInsurance,
}: InsuranceSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon
          icon="heroicons:shield-check"
          className="size-5 text-orange-500"
        />
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {t("tourAdmin.insurance.sectionTitle")}
        </h2>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {t("tourAdmin.insurance.sectionSubtitle")}
      </p>

      <div className="space-y-5">
        {classifications.map((cls, clsI) => (
          <div key={clsI}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {activeLang === "vi" ? (cls.name || t("tourAdmin.packages.packageNumber", { number: clsI + 1 })) : (cls.enName || cls.name || t("tourAdmin.packages.packageNumber", { number: clsI + 1 }))}
              </h3>
              <button
                type="button"
                onClick={() => onAddInsurance(clsI)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors">
                <Icon icon="heroicons:plus" className="size-4" />
                {t("tourAdmin.buttons.addInsurance")}
              </button>
            </div>

            {(insurances[clsI] ?? []).length === 0 ? (
              <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg py-6 text-center">
                <p className="text-sm text-slate-400">
                  {t("tourAdmin.insurance.noInsuranceYet")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(insurances[clsI] ?? []).map((ins, ii) => (
                  <div
                    key={ii}
                    className="flex items-start justify-between border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {activeLang === "vi" ? (ins.insuranceName || t("tourAdmin.review.untitled")) : (ins.enInsuranceName || ins.insuranceName || t("tourAdmin.review.untitled"))}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
                          {insuranceTypes[Number(ins.insuranceType)] || insuranceTypes[1]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("tourAdmin.insurance.coverage")}: {formatCurrency(Number(ins.coverageAmount || 0))} &bull;
                        {t("tourAdmin.insurance.durationOfTour")}
                        {ins.coverageFee
                          ? ` • ${t("tourAdmin.insurance.fee")}: ${formatCurrency(Number(ins.coverageFee))}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-sm font-semibold text-orange-500 whitespace-nowrap">
                        {formatCurrency(Number(ins.coverageFee || 0))}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemoveInsurance(clsI, ii)}
                        aria-label={t("tourAdmin.buttons.addInsurance")}
                        className="text-red-400 hover:text-red-600 transition-colors">
                        <Icon
                          icon="heroicons:trash"
                          className="size-4"
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Editing panel for selected insurance */}
      {classifications.map((cls, clsI) =>
        (insurances[clsI] ?? []).map((ins, ii) => (
          <div
            key={`edit-${clsI}-${ii}`}
            className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">
              {t("tourAdmin.insurance.editInsurance", {
                insuranceName: activeLang === "vi" ? (ins.insuranceName || t("tourAdmin.review.untitled")) : (ins.enInsuranceName || ins.insuranceName || t("tourAdmin.review.untitled")),
                packageName: activeLang === "vi" ? (cls.name || t("tourAdmin.packages.packageNumber", { number: clsI + 1 })) : (cls.enName || cls.name || t("tourAdmin.packages.packageNumber", { number: clsI + 1 })),
              })}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("tourAdmin.insurance.insuranceName")}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                      <span>VN</span>
                      <span className="font-medium text-stone-500">Name (VI)</span>
                    </div>
                    <input
                      type="text"
                      value={ins.insuranceName}
                      onChange={(e) =>
                        onUpdateInsurance(
                          clsI,
                          ii,
                          "insuranceName",
                          e.target.value,
                        )
                      }
                      placeholder={t("tourAdmin.insurance.insuranceName")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                      <span>EN</span>
                      <span className="font-medium text-stone-500">Name (EN)</span>
                    </div>
                    <input
                      type="text"
                      value={ins.enInsuranceName}
                      onChange={(e) =>
                        onUpdateInsurance(
                          clsI,
                          ii,
                          "enInsuranceName",
                          e.target.value,
                        )
                      }
                      placeholder={t("tourAdmin.insurance.insuranceName")}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("tourAdmin.insurance.insuranceType")}
                </label>
                <select
                  value={ins.insuranceType}
                  onChange={(e) =>
                    onUpdateInsurance(
                      clsI,
                      ii,
                      "insuranceType",
                      e.target.value,
                    )
                  }
                  aria-label={t("tourAdmin.insurance.insuranceType")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition">
                  {INSURANCE_TYPE_OPTIONS.map((opt, idx) => (
                    <option key={opt.value} value={opt.value}>
                      {insuranceTypes[idx]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("tourAdmin.insurance.provider")}
                </label>
                <input
                  type="text"
                  value={ins.insuranceProvider}
                  onChange={(e) =>
                    onUpdateInsurance(
                      clsI,
                      ii,
                      "insuranceProvider",
                      e.target.value,
                    )
                  }
                  placeholder={t("tourAdmin.insurance.provider")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                {t("tourAdmin.insurance.coverageDescription")}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs">
                    <span>VN</span>
                    <span className="font-medium text-stone-500">Coverage (VI)</span>
                  </div>
                  <textarea
                    value={ins.coverageDescription}
                    onChange={(e) =>
                      onUpdateInsurance(
                        clsI,
                        ii,
                        "coverageDescription",
                        e.target.value,
                      )
                    }
                    rows={2}
                    placeholder={t("tourAdmin.insurance.coverageDescription")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs">
                    <span>EN</span>
                    <span className="font-medium text-stone-500">Coverage (EN)</span>
                  </div>
                  <textarea
                    value={ins.enCoverageDescription}
                    onChange={(e) =>
                      onUpdateInsurance(
                        clsI,
                        ii,
                        "enCoverageDescription",
                        e.target.value,
                      )
                    }
                    rows={2}
                    placeholder={t("tourAdmin.insurance.coverageDescription")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-stone-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("tourAdmin.insurance.coverageAmount")}
                </label>
                <input
                  type="number"
                  value={ins.coverageAmount}
                  onChange={(e) =>
                    onUpdateInsurance(
                      clsI,
                      ii,
                      "coverageAmount",
                      e.target.value,
                    )
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  {t("tourAdmin.insurance.coverageFee")}
                </label>
                <input
                  type="number"
                  value={ins.coverageFee}
                  onChange={(e) =>
                    onUpdateInsurance(
                      clsI,
                      ii,
                      "coverageFee",
                      e.target.value,
                    )
                  }
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 self-end pb-2">
                <input
                  type="checkbox"
                  checked={ins.isOptional}
                  onChange={(e) =>
                    onUpdateInsurance(
                      clsI,
                      ii,
                      "isOptional",
                      e.target.checked,
                    )
                  }
                  className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                {t("tourAdmin.insurance.optional")}
              </label>
            </div>
          </div>
        )),
      )}

      {/* Info banner */}
      {classifications.every(
        (_, i) => (insurances[i] ?? []).length === 0,
      ) && (
        <div className="mt-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-4 py-3">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {t("tourAdmin.insurance.noInsuranceSelected")}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";
import SearchableSelect from "@/components/ui/SearchableSelect";
import TourImageUpload from "@/components/ui/TourImageUpload";
import LanguageTabs from "@/components/ui/LanguageTabs";
import type { SupportedLanguage } from "@/components/ui/LanguageTabs";
import type { ImageDto } from "@/types/tour";
import { TourStatusMap } from "@/types/tour";
import type { PricingPolicy } from "@/types/pricingPolicy";
import type { DepositPolicy } from "@/types/depositPolicy";
import type { CancellationPolicy } from "@/types/cancellationPolicy";
import type { VisaPolicy } from "@/types/visaPolicy";

/* ── Types ──────────────────────────────────────────────────── */
interface BasicInfoForm {
  tourName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
  status: string;
  tourScope: string;
  continent: string;
  customerSegment: string;
}

interface TranslationFields {
  tourName: string;
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
}

/* ── Props ──────────────────────────────────────────────────── */
interface BasicInfoSectionProps {
  basicInfo: BasicInfoForm;
  enTranslation: TranslationFields;
  thumbnail: File | null;
  existingThumbnail: ImageDto | null;
  images: File[];
  existingImages: ImageDto[];
  errors: Record<string, string>;
  thumbnailError: string | undefined;
  imagesError: string | undefined;
  pricingPolicies: PricingPolicy[];
  depositPolicies: DepositPolicy[];
  cancellationPolicies: CancellationPolicy[];
  selectedPricingPolicyId: string;
  selectedDepositPolicyId: string;
  selectedCancellationPolicyId: string;
  selectedVisaPolicyId: string;
  activeLang: SupportedLanguage;
  isEditMode: boolean;
  setBasicInfo: React.Dispatch<React.SetStateAction<BasicInfoForm>>;
  setEnTranslation: React.Dispatch<React.SetStateAction<TranslationFields>>;
  setThumbnail: React.Dispatch<React.SetStateAction<File | null>>;
  setExistingThumbnail: React.Dispatch<React.SetStateAction<ImageDto | null>>;
  setImages: React.Dispatch<React.SetStateAction<File[]>>;
  setExistingImages: React.Dispatch<React.SetStateAction<ImageDto[]>>;
  setSelectedPricingPolicyId: (v: string) => void;
  setSelectedDepositPolicyId: (v: string) => void;
  setSelectedCancellationPolicyId: (v: string) => void;
  setSelectedVisaPolicyId: (v: string) => void;
  setActiveLang: (v: SupportedLanguage) => void;
  setThumbnailError: (v: string | undefined) => void;
  setImagesError: (v: string | undefined) => void;
  validateField: (field: string, value: string) => void;
  validateFieldPositiveNumber: (field: string, value: string) => void;
  onRemoveExistingImage: (img: ImageDto) => void;
  onRemoveExistingThumbnail: () => void;
}

export function BasicInfoSection({
  basicInfo,
  enTranslation,
  thumbnail,
  existingThumbnail,
  images,
  existingImages,
  errors,
  thumbnailError,
  imagesError,
  pricingPolicies,
  depositPolicies,
  cancellationPolicies,
  selectedPricingPolicyId,
  selectedDepositPolicyId,
  selectedCancellationPolicyId,
  selectedVisaPolicyId,
  activeLang,
  isEditMode,
  setBasicInfo,
  setEnTranslation,
  setThumbnail,
  setExistingThumbnail,
  setImages,
  setExistingImages,
  setSelectedPricingPolicyId,
  setSelectedDepositPolicyId,
  setSelectedCancellationPolicyId,
  setSelectedVisaPolicyId,
  setActiveLang,
  setThumbnailError,
  setImagesError,
  validateField,
  onRemoveExistingImage,
  onRemoveExistingThumbnail,
}: BasicInfoSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
        {t("tourAdmin.basicInfo.sectionTitle")}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {t("tourAdmin.basicInfo.sectionSubtitle")}
      </p>

      {/* Language Tabs */}
      <div className="mb-5">
        <LanguageTabs
          activeLanguage={activeLang}
          onChange={setActiveLang}
        />
        <p className="text-xs text-slate-400 mt-2">
          {t("tourAdmin.langTabs.translationHint")}
        </p>
      </div>

      {/* Tour Scope + Customer Segment — shared (not translatable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t("tourAdmin.tourScope.label")}
          </label>
          <select
            value={basicInfo.tourScope}
            onChange={(e) =>
              setBasicInfo((prev) => ({
                ...prev,
                tourScope: e.target.value,
                continent: e.target.value === "1" ? "" : prev.continent,
              }))
            }
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
          >
            <option value="1">{t("tourAdmin.tourScope.domestic")}</option>
            <option value="2">{t("tourAdmin.tourScope.international")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t("tourAdmin.customerSegment.label")}
          </label>
          <select
            value={basicInfo.customerSegment}
            onChange={(e) =>
              setBasicInfo((prev) => ({ ...prev, customerSegment: e.target.value }))
            }
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
          >
            <option value="1">{t("tourAdmin.customerSegment.individual")}</option>
            <option value="2">{t("tourAdmin.customerSegment.group")}</option>
            <option value="3">{t("tourAdmin.customerSegment.family")}</option>
            <option value="4">{t("tourAdmin.customerSegment.corporate")}</option>
          </select>
        </div>
      </div>

      {/* Continent — only visible when International */}
      {basicInfo.tourScope === "2" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {t("tourAdmin.continent.label")}
          </label>
          <select
            value={basicInfo.continent}
            onChange={(e) =>
              setBasicInfo((prev) => ({ ...prev, continent: e.target.value }))
            }
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
          >
            <option value="">{t("tourAdmin.continent.placeholder", "-- Chọn châu lục --")}</option>
            <option value="1">{t("tourAdmin.continent.asia")}</option>
            <option value="2">{t("tourAdmin.continent.europe")}</option>
            <option value="3">{t("tourAdmin.continent.africa")}</option>
            <option value="4">{t("tourAdmin.continent.americas")}</option>
            <option value="5">{t("tourAdmin.continent.oceania")}</option>
            <option value="6">{t("tourAdmin.continent.antarctica")}</option>
          </select>
        </div>
      )}

      {/* Tour Status */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {t("tourAdmin.status.label", "Status")}
        </label>
        <div className="flex items-center gap-3">
          <select
            value={basicInfo.status}
            onChange={(e) =>
              setBasicInfo((prev) => ({ ...prev, status: e.target.value }))
            }
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
          >
            <option value="1">{TourStatusMap[1]}</option>
            <option value="2">{TourStatusMap[2]}</option>
            <option value="3">{TourStatusMap[3]}</option>
            <option value="4">{TourStatusMap[4]}</option>
          </select>
          {isEditMode && (
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {t("tourAdmin.status.currently", "Currently:")}{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {TourStatusMap[Number(basicInfo.status)] ?? basicInfo.status}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* ── Vietnamese Content ── */}
      {activeLang === "vi" && (
        <div className="space-y-5">
          {/* Tour Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.tourName")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={basicInfo.tourName}
                onChange={(e) =>
                  setBasicInfo((prev) => ({
                    ...prev,
                    tourName: e.target.value,
                  }))
                }
                onBlur={(e) => validateField("tourName", e.target.value)}
                placeholder={t("placeholder.enterTourName")}
                className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition ${
                  errors.tourName
                    ? "border-red-400 dark:border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {errors.tourName && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                  <Icon icon="heroicons:x-circle" className="size-4" />
                </span>
              )}
            </div>
            {errors.tourName && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                {errors.tourName}
              </p>
            )}
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.shortDescription")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <textarea
                value={basicInfo.shortDescription}
                onChange={(e) =>
                  setBasicInfo((prev) => ({
                    ...prev,
                    shortDescription: e.target.value,
                  }))
                }
                onBlur={(e) => validateField("shortDescription", e.target.value)}
                rows={2}
                placeholder={t("placeholder.briefTourDescription")}
                className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none ${
                  errors.shortDescription
                    ? "border-red-400 dark:border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {errors.shortDescription && (
                <span className="absolute right-3 top-3 text-red-500">
                  <Icon icon="heroicons:x-circle" className="size-4" />
                </span>
              )}
            </div>
            {errors.shortDescription && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                {errors.shortDescription}
              </p>
            )}
          </div>

          {/* Long Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.longDescription")}
            </label>
            <div className="relative">
              <textarea
                value={basicInfo.longDescription}
                onChange={(e) =>
                  setBasicInfo((prev) => ({
                    ...prev,
                    longDescription: e.target.value,
                  }))
                }
                onBlur={(e) => validateField("longDescription", e.target.value)}
                rows={4}
                placeholder={t("placeholder.detailedTourDescription")}
                className={`w-full px-3 py-2 pr-8 text-sm rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none ${
                  errors.longDescription
                    ? "border-red-400 dark:border-red-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {errors.longDescription && (
                <span className="absolute right-3 top-3 text-red-500">
                  <Icon icon="heroicons:x-circle" className="size-4" />
                </span>
              )}
            </div>
            {errors.longDescription && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <Icon icon="heroicons:exclamation-triangle" className="size-3" />
                {errors.longDescription}
              </p>
            )}
          </div>

          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.seoTitle")}
            </label>
            <input
              type="text"
              value={basicInfo.seoTitle}
              onChange={(e) =>
                setBasicInfo((prev) => ({
                  ...prev,
                  seoTitle: e.target.value,
                }))
              }
              placeholder={t("placeholder.seoOptimizedTitle")}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* SEO Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.seoDescription")}
            </label>
            <textarea
              value={basicInfo.seoDescription}
              onChange={(e) =>
                setBasicInfo((prev) => ({
                  ...prev,
                  seoDescription: e.target.value,
                }))
              }
              rows={2}
              placeholder={t("placeholder.seoOptimizedDescription")}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Image Upload (shared — always visible regardless of language tab) ── */}
      <TourImageUpload
        thumbnail={thumbnail}
        setThumbnail={setThumbnail}
        images={images}
        setImages={setImages}
        t={t}
        thumbnailError={thumbnailError}
        imagesError={imagesError}
        onThumbnailError={setThumbnailError}
        onImagesError={setImagesError}
        existingImages={existingImages}
        onRemoveExistingImage={onRemoveExistingImage}
        existingThumbnail={existingThumbnail}
        onRemoveExistingThumbnail={onRemoveExistingThumbnail}
      />

      {/* ── English Content ── */}
      {activeLang === "en" && (
        <div className="space-y-5">
          {/* Tour Name EN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.tourName")} (EN)
            </label>
            <input
              type="text"
              value={enTranslation.tourName}
              onChange={(e) =>
                setEnTranslation((prev) => ({
                  ...prev,
                  tourName: e.target.value,
                }))
              }
              placeholder={t("placeholder.enterTourNameEn")}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* Short Description EN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.shortDescription")} (EN)
            </label>
            <textarea
              value={enTranslation.shortDescription}
              onChange={(e) =>
                setEnTranslation((prev) => ({
                  ...prev,
                  shortDescription: e.target.value,
                }))
              }
              rows={2}
              placeholder={t("placeholder.briefDescEn")}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {/* Long Description EN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.longDescription")} (EN)
            </label>
            <textarea
              value={enTranslation.longDescription}
              onChange={(e) =>
                setEnTranslation((prev) => ({
                  ...prev,
                  longDescription: e.target.value,
                }))
              }
              rows={4}
              placeholder={t("placeholder.detailedDescEn")}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {/* SEO Title EN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.seoTitle")} (EN)
            </label>
            <input
              type="text"
              value={enTranslation.seoTitle}
              onChange={(e) =>
                setEnTranslation((prev) => ({
                  ...prev,
                  seoTitle: e.target.value,
                }))
              }
              placeholder={t("placeholder.seoOptimizedTitle")}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* SEO Description EN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t("tourAdmin.basicInfo.seoDescription")} (EN)
            </label>
            <textarea
              value={enTranslation.seoDescription}
              onChange={(e) =>
                setEnTranslation((prev) => ({
                  ...prev,
                  seoDescription: e.target.value,
                }))
              }
              rows={2}
              placeholder={t("placeholder.seoOptimizedDescription")}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>
        </div>
      )}

      {/* ── Policy Selectors ──────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 mt-6">
        {/* Pricing Policy */}
        <SearchableSelect
          label={t("tourAdmin.basicInfo.pricingPolicy")}
          placeholder={t("tourAdmin.basicInfo.searchPricingPolicy")}
          value={selectedPricingPolicyId}
          onChange={setSelectedPricingPolicyId}
          options={pricingPolicies.map((p) => ({
            value: p.id,
            label: p.name,
          }))}
        />

        {/* Deposit Policy */}
        <SearchableSelect
          label={t("tourAdmin.basicInfo.depositPolicy")}
          placeholder={t("tourAdmin.basicInfo.searchDepositPolicy")}
          value={selectedDepositPolicyId}
          onChange={setSelectedDepositPolicyId}
          options={depositPolicies.map((p) => ({
            value: p.id,
            label: `${p.tourScopeName} - ${p.depositTypeName} ${p.depositValue}${p.depositType === 2 ? "%" : ""}`,
          }))}
        />

        {/* Cancellation Policy */}
        <SearchableSelect
          label={t("tourAdmin.basicInfo.cancellationPolicy")}
          placeholder={t("tourAdmin.basicInfo.searchCancellationPolicy")}
          value={selectedCancellationPolicyId}
          onChange={setSelectedCancellationPolicyId}
          options={cancellationPolicies.map((p) => ({
            value: p.id,
            label: `${p.policyCode} (${p.tourScopeName}, ${p.tiers.length} tier${p.tiers.length !== 1 ? "s" : ""})`,
          }))}
        />
      </div>
    </div>
  );
}

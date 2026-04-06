"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";

interface ServiceForm {
  serviceName: string;
  enServiceName: string;
  pricingType: string;
  price: string;
  salePrice: string;
  email: string;
  contactNumber: string;
}

interface ServicesSectionProps {
  services: ServiceForm[];
  errors: Record<string, string>;
  onAddService: () => void;
  onRemoveService: (index: number) => void;
  onUpdateService: (index: number, field: keyof ServiceForm, value: string) => void;
}

const PRICING_TYPE_OPTIONS = [
  { value: "0", label: "Per Person" },
  { value: "1", label: "Per Room" },
  { value: "2", label: "Per Group" },
  { value: "3", label: "Per Ride" },
  { value: "4", label: "Fixed Price" },
];

export function ServicesSection({
  services,
  errors,
  onAddService,
  onRemoveService,
  onUpdateService,
}: ServicesSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Icon
            icon="heroicons:wrench-screwdriver"
            className="size-5 text-orange-500"
          />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("tourAdmin.services.sectionTitle")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onAddService}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
          <Icon icon="heroicons:plus" className="size-4" />
          {t("tourAdmin.buttons.addService")}
        </button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {t("tourAdmin.services.infoBanner")}
      </p>

      <div className="space-y-4">
        {services.map((svc, svcI) => (
          <div
            key={svcI}
            className="border border-slate-200 dark:border-slate-700 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {svcI + 1}
                </div>
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {t("tourAdmin.services.serviceNumber", { number: svcI + 1 })}
                </h3>
              </div>
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveService(svcI)}
                  aria-label={t("tourAdmin.services.removeService")}
                  className="text-red-400 hover:text-red-600 transition-colors">
                  <Icon icon="heroicons:trash" className="size-4" />
                </button>
              )}
            </div>
            <div className="space-y-4">
              {/* Service Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("tourAdmin.services.serviceName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={svc.serviceName}
                  onChange={(e) => onUpdateService(svcI, "serviceName", e.target.value)}
                  placeholder={t("tourAdmin.services.placeholderServiceName")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
                {errors[`svc_${svcI}_name`] && (
                  <p className="text-red-500 text-xs mt-1">{errors[`svc_${svcI}_name`]}</p>
                )}
              </div>
              {/* English Service Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t("tourAdmin.services.serviceName")} (English)
                </label>
                <input
                  type="text"
                  value={svc.enServiceName}
                  onChange={(e) => onUpdateService(svcI, "enServiceName", e.target.value)}
                  placeholder={t("tourAdmin.services.placeholderServiceNameEn", "Enter English service name")}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                />
              </div>
              {/* Pricing Type + Price + Sale Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("tourAdmin.services.pricingType")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={svc.pricingType}
                    onChange={(e) => onUpdateService(svcI, "pricingType", e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition cursor-pointer">
                    <option value="">{t("tourAdmin.services.placeholderPricingType")}</option>
                    {PRICING_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {errors[`svc_${svcI}_pricingType`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`svc_${svcI}_pricingType`]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("tourAdmin.services.price")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={svc.price}
                    onChange={(e) => onUpdateService(svcI, "price", e.target.value)}
                    placeholder={t("tourAdmin.services.placeholderPrice")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("tourAdmin.services.salePrice")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={svc.salePrice}
                    onChange={(e) => onUpdateService(svcI, "salePrice", e.target.value)}
                    placeholder={t("tourAdmin.services.placeholderSalePrice")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
              {/* Email + Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("tourAdmin.services.email")}
                  </label>
                  <input
                    type="email"
                    value={svc.email}
                    onChange={(e) => onUpdateService(svcI, "email", e.target.value)}
                    placeholder={t("tourAdmin.services.placeholderEmail")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    {t("tourAdmin.services.contactNumber")}
                  </label>
                  <input
                    type="text"
                    value={svc.contactNumber}
                    onChange={(e) => onUpdateService(svcI, "contactNumber", e.target.value)}
                    placeholder={t("tourAdmin.services.placeholderContactNumber")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

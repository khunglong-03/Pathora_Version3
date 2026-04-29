"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import {
  PricingPolicyDto,
  CancellationPolicyDto,
  DepositPolicyDto,
} from "@/types/tour";

interface TourPoliciesCardProps {
  pricingPolicy?: PricingPolicyDto | null;
  cancellationPolicy?: CancellationPolicyDto | null;
  depositPolicy?: DepositPolicyDto | null;
  className?: string;
}

export function TourPoliciesCard({
  pricingPolicy,
  cancellationPolicy,
  depositPolicy,
  className = "",
}: TourPoliciesCardProps) {
  const { t, i18n } = useTranslation();

  if (!pricingPolicy && !cancellationPolicy && !depositPolicy) {
    return null;
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Icon icon="heroicons:shield-check" className="size-5 text-orange-500" />
          {t("tours.policies.title", "Booking Policies")}
        </h3>

        <div className="space-y-6">
          {/* Deposit Policy */}
          {depositPolicy && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Icon icon="heroicons:credit-card" className="size-4 text-gray-500" />
                {t("tours.policies.deposit.title", "Deposit Policy")}
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p>
                  {t("tours.policies.deposit.amount", "A deposit of {{amount}} is required to secure your booking.", {
                    amount:
                      String(depositPolicy.depositType).toLowerCase() === "percentage" || depositPolicy.depositType === 2
                        ? `${depositPolicy.depositValue}%`
                        : `${new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-GB", { style: "currency", currency: "VND" }).format(depositPolicy.depositValue).replace("VND", "VND").trim()}`,
                  })}
                </p>
                <p className="mt-1 text-gray-500 text-xs">
                  {t(
                    "tours.policies.deposit.deadline",
                    "Full payment must be completed at least {{days}} days before departure.",
                    { days: depositPolicy.minDaysBeforeDeparture }
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Cancellation Policy */}
          {cancellationPolicy && cancellationPolicy.tiers && cancellationPolicy.tiers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Icon icon="heroicons:x-circle" className="size-4 text-gray-500" />
                {t("tours.policies.cancellation.title", "Cancellation Policy")}
              </h4>
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-100 text-xs text-gray-700 uppercase">
                    <tr>
                      <th className="px-4 py-2 font-medium">{t("tours.policies.cancellation.timeframe", "Timeframe")}</th>
                      <th className="px-4 py-2 font-medium">{t("tours.policies.cancellation.penalty", "Penalty")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cancellationPolicy.tiers.map((tier, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2">
                          {tier.maxDaysBeforeDeparture === 9999
                            ? t("tours.policies.cancellation.moreThan", "More than {{days}} days before departure", { days: tier.minDaysBeforeDeparture })
                            : t("tours.policies.cancellation.between", "{{min}} to {{max}} days before departure", { min: tier.minDaysBeforeDeparture, max: tier.maxDaysBeforeDeparture })}
                        </td>
                        <td className="px-4 py-2 font-medium text-orange-600">
                          {tier.penaltyPercentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pricing Policy */}
          {pricingPolicy && pricingPolicy.tiers && pricingPolicy.tiers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Icon icon="heroicons:users" className="size-4 text-gray-500" />
                {t("tours.policies.pricing.title", "Age-Based Pricing")}
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                <p className="mb-2">
                  {t("tours.policies.pricing.description", "Tour price varies based on the age of participants.")}
                </p>
                <ul className="space-y-1">
                  {pricingPolicy.tiers.map((tier, idx) => (
                    <li key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">
                        {tier.label ? tier.label + " (" : ""}
                        {!tier.ageTo
                          ? t("tours.policies.pricing.moreThan", "{{min}}+ years old", { min: tier.ageFrom })
                          : t("tours.policies.pricing.between", "{{min}} - {{max}} years old", { min: tier.ageFrom, max: tier.ageTo })}
                        {tier.label ? ")" : ""}
                      </span>
                      <span className="font-bold text-gray-700">
                        {tier.pricePercentage === 100
                          ? t("tours.policies.pricing.baseRate", "100% (Base Price)")
                          : `${tier.pricePercentage}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

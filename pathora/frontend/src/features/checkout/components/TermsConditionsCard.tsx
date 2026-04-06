"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import Checkbox from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui";
import { CANCELLATION_KEYS, PAYMENT_TERM_KEYS, IMPORTANT_INFO_KEYS } from "./checkoutHelpers";

interface TermsConditionsCardProps {
  agreeTerms: boolean;
  setAgreeTerms: (v: boolean) => void;
  acknowledgeInfo: boolean;
  setAcknowledgeInfo: (v: boolean) => void;
}

function PolicySection({
  icon,
  iconBg,
  iconColor,
  title,
  items,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className={`size-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon icon={icon} className={`size-4 ${iconColor}`} />
        </div>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
      </div>
      <ul className="flex flex-col gap-1.5 pl-10">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 leading-4">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TermsConditionsCard({
  agreeTerms,
  setAgreeTerms,
  acknowledgeInfo,
  setAcknowledgeInfo,
}: TermsConditionsCardProps) {
  const { t } = useTranslation();

  const cancellationItems = CANCELLATION_KEYS.map((k) => t(k));
  const paymentTermItems = PAYMENT_TERM_KEYS.map((k) => t(k));
  const importantInfoItems = IMPORTANT_INFO_KEYS.map((k) => t(k));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-linear-to-b from-orange-500 to-orange-600 h-1 w-full rounded-t-2xl" />
      <div className="p-5">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          {t("landing.checkout.termsConditions")}
        </h3>
        <div className="flex flex-col gap-5">
          <PolicySection
            icon="heroicons:shield-check"
            iconBg="bg-green-50"
            iconColor="text-green-500"
            title={t("landing.checkout.cancellationPolicy")}
            items={cancellationItems}
          />
          <PolicySection
            icon="heroicons:credit-card"
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            title={t("landing.checkout.paymentTerms")}
            items={paymentTermItems}
          />
          <PolicySection
            icon="heroicons:exclamation-circle"
            iconBg="bg-red-50"
            iconColor="text-red-500"
            title={t("landing.checkout.importantInfo")}
            items={importantInfoItems}
          />
        </div>

        <div className="border-t border-gray-200 mt-5 pt-4 flex flex-col gap-3">
          <Checkbox
            value={agreeTerms}
            onChange={() => setAgreeTerms(!agreeTerms)}
            activeClass="!bg-orange-500 !ring-orange-500 !border-orange-500"
            label={
              <span className="text-xs text-gray-600 font-medium leading-4">
                {t("landing.checkout.agreeTermsPrefix")}{" "}
                <span className="font-semibold text-orange-500">{t("landing.checkout.cancellationPolicyLink")}</span>{" "}
                {t("landing.checkout.and")}{" "}
                <span className="font-semibold text-orange-500">{t("landing.checkout.paymentTermsLink")}</span>
              </span>
            }
          />
          <Checkbox
            value={acknowledgeInfo}
            onChange={() => setAcknowledgeInfo(!acknowledgeInfo)}
            activeClass="!bg-orange-500 !ring-orange-500 !border-orange-500"
            label={
              <span className="text-xs text-gray-600 font-medium leading-4">
                {t("landing.checkout.acknowledgePrefix")}{" "}
                <span className="font-semibold text-orange-500">{t("landing.checkout.importantInfoLink")}</span>{" "}
                {t("landing.checkout.acknowledgeSuffix")}
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}

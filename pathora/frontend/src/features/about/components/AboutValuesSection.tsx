"use client";
import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { VALUES } from "./AboutUsPageData";

const ValuesSection = ({ values = VALUES }: { values?: typeof VALUES }) => {
  const { t } = useTranslation();
  return (
    <section className="bg-[#f9fafb] py-16">
      <div className="max-w-[72rem] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[1.2px] text-[#fa8b02] mb-2">
            {t("landing.aboutUs.whyChooseUs")}
          </p>
          <h2 className="text-4xl font-bold text-[#05073c]">
            {t("landing.aboutUs.valuesTitle")}
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v) => (
            <div
              key={v.titleKey}
              className="bg-white rounded-2xl border border-[#f3f4f6] shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-[14px] bg-[#fff7ed] flex items-center justify-center mb-5">
                <Icon icon={v.icon} className="w-6 h-6 text-[#fa8b02]" />
              </div>
              <h3 className="text-sm font-bold text-[#05073c] mb-2">
                {t(`landing.aboutUs.values.${v.titleKey}`)}
              </h3>
              <p className="text-xs leading-[1.21875rem] text-[#6a7282]">
                {t(`landing.aboutUs.values.${v.descKey}`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { ValuesSection };

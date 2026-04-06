"use client";
import { Button, Card, Icon } from "@/components/ui";
import { SectionContainer } from "@/features/shared/components/shared";
import { useTranslation } from "react-i18next";

const FEATURES = [
  {
    icon: "heroicons:shield-check",
    titleKey: "landing.whyChoose.features.0.title",
    descKey: "landing.whyChoose.features.0.desc",
  },
  {
    icon: "heroicons:currency-dollar",
    titleKey: "landing.whyChoose.features.1.title",
    descKey: "landing.whyChoose.features.1.desc",
  },
  {
    icon: "heroicons:globe-alt",
    titleKey: "landing.whyChoose.features.2.title",
    descKey: "landing.whyChoose.features.2.desc",
  },
  {
    icon: "heroicons:sparkles",
    titleKey: "landing.whyChoose.features.3.title",
    descKey: "landing.whyChoose.features.3.desc",
  },
];

const BRANDS = [
  "Pathora Air",
  "Viet Travel",
  "Blue Ocean",
  "Skyline Tours",
  "Asia Routes",
  "City Explorer",
];

export const CTASection = () => {
  const { t } = useTranslation();
  return (
    <section className="relative w-full h-112.5 overflow-hidden bg-linear-to-r from-slate-900 via-indigo-900 to-slate-900">
      <div className="absolute inset-0 bg-landing-heading/60" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white text-center px-6">
        <h2
          suppressHydrationWarning
          className="text-3xl md:text-[44px] font-bold mb-4 leading-tight"
        >
          {t("landing.cta.title")}
        </h2>
        <p
          suppressHydrationWarning
          className="text-base md:text-lg text-white/80 max-w-xl mb-8 leading-relaxed"
        >
          {t("landing.cta.description")}
        </p>
        <Button
          link="/tours"
          text={t("landing.cta.exploreNow")}
          icon="heroicons-outline:chevron-right"
          iconPosition="right"
          iconClass="text-[16px]"
          className="inline-flex items-center gap-2 bg-landing-accent text-white font-semibold px-8 py-3.5 rounded-full hover:bg-landing-accent-hover transition-colors text-base"
          suppressHydrationWarning
        />
      </div>
    </section>
  );
};

export const WhyChooseSection = () => {
  const { t } = useTranslation();
  return (
    <section className="w-full bg-[#f9fafb] py-16 md:py-20">
      <SectionContainer>
        <div className="text-center mb-14">
          <h2
            suppressHydrationWarning
            className="text-2xl md:text-[30px] font-bold text-landing-heading"
          >
            {t("landing.whyChoose.title")}
          </h2>
          <p
            suppressHydrationWarning
            className="text-landing-body text-base mt-2"
          >
            {t("landing.whyChoose.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {FEATURES.map((feat, idx) => (
            <Card
              key={idx}
              className="bg-transparent! shadow-none! border-none flex flex-col items-center text-center"
              bodyClass="p-0 flex flex-col items-center text-center gap-4"
            >
              <div className="w-17.5 h-17.5 bg-landing-accent/10 rounded-full flex items-center justify-center">
                <Icon
                  icon={feat.icon}
                  className="w-8 h-8 text-landing-accent"
                />
              </div>
              <h3
                suppressHydrationWarning
                className="font-semibold text-landing-heading text-base leading-snug"
              >
                {t(feat.titleKey)}
              </h3>
              <p
                suppressHydrationWarning
                className="text-landing-body text-sm leading-relaxed max-w-62.5"
              >
                {t(feat.descKey)}
              </p>
            </Card>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

export const TrustedBrandsSection = () => {
  const { t } = useTranslation();
  return (
    <section className="w-full bg-white py-12 border-t border-landing-border">
      <SectionContainer>
        <p
          suppressHydrationWarning
          className="text-center text-landing-body font-medium text-sm uppercase tracking-widest mb-8"
        >
          {t("landing.trustedBrands.title")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          {BRANDS.map((brand, idx) => (
            <span
              key={idx}
              aria-label={`${t("landing.trustedBrands.brandAlt")} ${idx + 1}`}
              className="px-4 py-2 rounded-full border border-landing-border text-sm font-medium text-landing-body bg-white"
            >
              {brand}
            </span>
          ))}
        </div>
      </SectionContainer>
    </section>
  );
};

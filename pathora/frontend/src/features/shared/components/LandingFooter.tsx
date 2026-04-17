"use client";
import React, { FormEvent, useId } from "react";
import Link from "next/link";
import Image from "./LandingImage";
import { Button, Icon, TextInput } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { SOCIAL_MEDIA, APP_STORES } from "@/configs/urls";

const FOOTER_BG = "/tour-placeholder.svg";

const companyLinks = [
  { labelKey: "landing.footer.links.company.aboutUs", href: "/#about-us" },
  { labelKey: "landing.footer.links.company.reviews", href: "/#reviews" },
  { labelKey: "landing.footer.links.company.contactUs", href: "/#contact" },
  {
    labelKey: "landing.footer.links.company.travelGuides",
    href: "/#travel-guides",
  },
  {
    labelKey: "landing.footer.links.company.dataPolicy",
    href: "/policies#data-policy",
  },
  {
    labelKey: "landing.footer.links.company.cookiePolicy",
    href: "/policies#cookie-policy",
  },
  { labelKey: "landing.footer.links.company.legal", href: "/policies#legal" },
  { labelKey: "landing.footer.links.company.sitemap", href: "/sitemap.xml" },
];
const supportLinks = [
  { labelKey: "landing.footer.links.support.getInTouch", href: "/#contact" },
  {
    labelKey: "landing.footer.links.support.helpCenter",
    href: "/#help-center",
  },
  { labelKey: "landing.footer.links.support.liveChat", href: "/#live-chat" },
  {
    labelKey: "landing.footer.links.support.howItWorks",
    href: "/#how-it-works",
  },
];

const socialLinks = [
  {
    name: "facebook",
    icon: "mdi:facebook",
    href: SOCIAL_MEDIA.facebook,
    label: "Facebook",
  },
  {
    name: "twitter",
    icon: "mdi:twitter",
    href: SOCIAL_MEDIA.twitter,
    label: "Twitter",
  },
  {
    name: "instagram",
    icon: "mdi:instagram",
    href: SOCIAL_MEDIA.instagram,
    label: "Instagram",
  },
  {
    name: "youtube",
    icon: "mdi:youtube",
    href: SOCIAL_MEDIA.youtube,
    label: "YouTube",
  },
];

export const LandingFooter = () => {
  const { t } = useTranslation();
  const newsletterInputId = useId();

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <footer className="relative border-t border-slate-200 bg-slate-50 text-slate-900">
      <div className="relative z-10 max-w-360 mx-auto px-4 md:px-18.75 py-16">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-200 pb-8 mb-10 gap-4">
          <p className="text-[#fa8b02] font-medium" suppressHydrationWarning>
            <span suppressHydrationWarning>{t("landing.footer.speakToExpert")} </span>
            <a
              href="tel:+18004536744"
              className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
            >
              1-800-453-6744
            </a>
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500">
              {t("landing.footer.followUs")}
            </span>
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                className="w-11 h-11 rounded-full border border-slate-200 flex items-center justify-center hover:bg-[#fa8b02] hover:border-[#fa8b02] transition-colors text-slate-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02]"
              >
                <Icon icon={s.icon} className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Contact */}
          <div>
            <h4 className="text-slate-900 font-semibold text-xl mb-5">
              {t("landing.footer.contactNested.title")}
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t("landing.footer.contactNested.address")}
            </p>
            <p className="text-slate-600 text-sm mt-3">
              <a
                href="mailto:hi@pathora.com"
                className="hover:text-[#fa8b02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
              >
                hi@pathora.com
              </a>
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-slate-900 font-semibold text-xl mb-5">
              {t("landing.footer.company.title")}
            </h4>
            <ul className="flex flex-col gap-2">
              {companyLinks.map((link) => (
                <li key={link.labelKey}>
                  <Link
                    href={link.href}
                    className="text-slate-500 text-sm hover:text-[#fa8b02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-slate-900 font-semibold text-xl mb-5">
              {t("landing.footer.support.title")}
            </h4>
            <ul className="flex flex-col gap-2">
              {supportLinks.map((link) => (
                <li key={link.labelKey}>
                  <Link
                    href={link.href}
                    className="text-slate-500 text-sm hover:text-[#fa8b02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-slate-900 font-semibold text-xl mb-5">
              {t("landing.footer.newsletterNested.title")}
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed mb-5">
              {t("landing.footer.newsletterNested.description")}
            </p>
            <form className="flex gap-2" onSubmit={handleSubscribe} noValidate>
              <TextInput
                id={newsletterInputId}
                name="newsletterEmail"
                type="email"
                autocomplete="email"
                label={t("landing.footer.newsletterNested.title")}
                classLabel="sr-only"
                placeholder={t("landing.footer.newsletterNested.placeholder")}
                className="flex-1 bg-white! border-slate-200! rounded-xl! min-h-11! px-4! py-3! text-slate-900! text-sm! placeholder:text-slate-400! shadow-sm focus:border-[#fa8b02] focus:ring-1 focus:ring-[#fa8b02]"
              />
              <Button
                type="submit"
                text={t("landing.footer.newsletterNested.send")}
                className="bg-[#fa8b02] text-white min-h-11 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#e67a00] transition-colors shrink-0"
              />
            </form>

            <h4 className="text-slate-900 font-semibold text-lg mt-8 mb-3">
              {t("landing.footer.mobileApps.title")}
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href={APP_STORES.apple}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-500 text-sm hover:text-[#fa8b02] transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
              >
                <Icon icon="mdi:apple" className="w-4 h-4" />{" "}
                {t("landing.footer.mobileApps.ios")}
              </a>
              <a
                href={APP_STORES.google}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-500 text-sm hover:text-[#fa8b02] transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
              >
                <Icon icon="mdi:android" className="w-4 h-4" />{" "}
                {t("landing.footer.mobileApps.android")}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 mt-10 pt-6 text-center text-slate-500 text-sm">
          {t("landing.footer.copyright", {
            year: new Date().getFullYear(),
          })}
        </div>
      </div>
    </footer>
  );
};

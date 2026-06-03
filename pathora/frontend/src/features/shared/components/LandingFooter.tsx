"use client";
import React, { FormEvent, useId } from "react";
import Link from "next/link";
import { Button, Icon, TextInput } from "@/components/ui";
import { useTranslation } from "react-i18next";
import { APP_STORES } from "@/configs/urls";

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
    icon: "FacebookLogo",
    href: "https://www.facebook.com/the.hieu.5074",
    label: "Facebook",
  },
  {
    name: "twitter",
    icon: "TwitterLogo",
    href: "https://www.facebook.com/the.hieu.5074",
    label: "Twitter",
  },
  {
    name: "instagram",
    icon: "InstagramLogo",
    href: "https://www.facebook.com/the.hieu.5074",
    label: "Instagram",
  },
  {
    name: "youtube",
    icon: "YoutubeLogo",
    href: "https://www.facebook.com/the.hieu.5074",
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
    <footer className="relative border-t border-slate-900 bg-slate-950 text-slate-100 overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#fa8b02]/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative z-10 max-w-360 mx-auto px-4 md:px-18.75 py-16">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-900 pb-8 mb-10 gap-4">
          <p className="text-[#fa8b02] font-medium text-lg" suppressHydrationWarning>
            <span suppressHydrationWarning>{t("landing.footer.speakToExpert")} </span>
            <a
              href="tel:0926268500"
              className="font-bold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm transition-all"
            >
              0926268500
            </a>
          </p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">
              {t("landing.footer.followUs")}
            </span>
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={s.label}
                className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center hover:bg-[#fa8b02] hover:border-[#fa8b02] transition-all text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02]"
              >
                <Icon icon={s.icon} className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg tracking-tight uppercase text-xs text-[#fa8b02]">
              {t("landing.footer.contactNested.title")}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[250px]">
              {t("landing.footer.contactNested.address")}
            </p>
            <p className="text-slate-400 text-sm">
              <a
                href="mailto:hieunthe171211@gmail.com"
                className="font-semibold text-slate-200 hover:text-[#fa8b02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
              >
                hieunthe171211@gmail.com
              </a>
            </p>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg tracking-tight uppercase text-xs text-[#fa8b02]">
              {t("landing.footer.company.title")}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link.labelKey}>
                  <Link
                    href={link.href}
                    className="text-slate-400 text-sm hover:text-[#fa8b02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg tracking-tight uppercase text-xs text-[#fa8b02]">
              {t("landing.footer.support.title")}
            </h4>
            <ul className="flex flex-col gap-2.5">
              {supportLinks.map((link) => (
                <li key={link.labelKey}>
                  <Link
                    href={link.href}
                    className="text-slate-400 text-sm hover:text-[#fa8b02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="text-white font-bold text-lg tracking-tight uppercase text-xs text-[#fa8b02]">
              {t("landing.footer.newsletterNested.title")}
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed">
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
                className="flex-1 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 rounded-xl min-h-11 px-4 py-3 text-sm shadow-sm focus:border-[#fa8b02] focus:ring-1 focus:ring-[#fa8b02]"
              />
              <Button
                type="submit"
                text={t("landing.footer.newsletterNested.send")}
                className="bg-[#fa8b02] text-white min-h-11 px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#e67a00] transition-colors shrink-0"
              />
            </form>

            <h4 className="text-white font-semibold text-sm pt-4">
              {t("landing.footer.mobileApps.title")}
            </h4>
            <div className="flex flex-col gap-2">
              <a
                href={APP_STORES.apple}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-400 text-sm hover:text-[#fa8b02] transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
              >
                <Icon icon="mdi:apple" className="w-4 h-4" />{" "}
                {t("landing.footer.mobileApps.ios")}
              </a>
              <a
                href={APP_STORES.google}
                target="_blank"
                rel="noreferrer noopener"
                className="text-slate-400 text-sm hover:text-[#fa8b02] transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fa8b02] rounded-sm"
              >
                <Icon icon="mdi:android" className="w-4 h-4" />{" "}
                {t("landing.footer.mobileApps.android")}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-900 mt-10 pt-6 text-center text-slate-500 text-xs">
          {t("landing.footer.copyright", {
            year: new Date().getFullYear(),
          })}
        </div>
      </div>
    </footer>
  );
};

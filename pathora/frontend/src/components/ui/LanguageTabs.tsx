"use client";
import React from "react";
import { useTranslation } from "react-i18next";

export type SupportedLanguage = "vi" | "en";

interface LanguageTabsProps {
  activeLanguage: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  className?: string;
}

const LANGUAGE_OPTIONS: {
  code: SupportedLanguage;
  flag: string;
  labelKey: string;
  fallback: string;
}[] = [
  {
    code: "vi",
    flag: "🇻🇳",
    labelKey: "tourAdmin.langTabs.vi",
    fallback: "Tiếng Việt",
  },
  {
    code: "en",
    flag: "🇬🇧",
    labelKey: "tourAdmin.langTabs.en",
    fallback: "English",
  },
];

export default function LanguageTabs({
  activeLanguage,
  onChange,
  className = "",
}: LanguageTabsProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800 ${className}`}>
      {LANGUAGE_OPTIONS.map(({ code, flag, labelKey, fallback }) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 active:scale-95 ${
            activeLanguage === code
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
              : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white"
          }`}>
          <span className="text-base">{flag}</span>
          <span>{t(labelKey, fallback)}</span>
          {code === "vi" && (
            <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {t("tourAdmin.langTabs.required", "Required")}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

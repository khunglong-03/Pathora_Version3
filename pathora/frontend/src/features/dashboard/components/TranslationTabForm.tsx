"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export type Language = "vi" | "en";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslationRecord = Record<string, any>;

export interface TranslationField {
  /** Tên field gửi lên API (phải khớp với backend DTO) */
  key: string;
  /** Label for the field */
  label: string;
  /** Placeholder values per language */
  placeholder: Record<Language, string>;
  /** Loại input: text hoặc textarea */
  type?: "text" | "textarea";
}

export interface translationTabFormProps {
  translations?: TranslationRecord;
  onChange?: (translations: TranslationRecord) => void;
  /** Danh sách fields cần hiển thị. Mỗi field config riêng cho từng policy. */
  fields?: TranslationField[];
}

const defaultFields: TranslationField[] = [
  {
    key: "name",
    label: "translation.field.name",
    placeholder: {
      vi: "translation.field.namePlaceholderVi",
      en: "translation.field.namePlaceholderEn",
    },
    type: "text",
  },
  {
    key: "description",
    label: "translation.field.description",
    placeholder: {
      vi: "translation.field.descriptionPlaceholderVi",
      en: "translation.field.descriptionPlaceholderEn",
    },
    type: "textarea",
  },
];

const LANG_TABS: { id: Language; label: string; flag: string }[] = [
  { id: "vi", label: "Tiếng Việt", flag: "VI" },
  { id: "en", label: "English", flag: "EN" },
];

export function TranslationTabForm({
  translations = {},
  onChange,
  fields = defaultFields,
}: translationTabFormProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Language>("vi");

  const handleChange = (field: string, value: string) => {
    const currentTranslations = { ...translations };
    if (!currentTranslations[activeTab]) {
      currentTranslations[activeTab] = {};
    }
    currentTranslations[activeTab] = {
      ...currentTranslations[activeTab],
      [field]: value,
    };
    onChange?.(currentTranslations);
  };

  const currentFields = translations[activeTab] || {};

  return (
    <div className="space-y-5">
      {/* Language selector — asymmetric pill tabs */}
      <div className="flex items-center gap-1 rounded-2xl bg-stone-100 p-1">
        {LANG_TABS.map((langTab) => {
          const isActive = activeTab === langTab.id;
          return (
            <button
              key={langTab.id}
              type="button"
              onClick={() => setActiveTab(langTab.id)}
              className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="lang-active-pill"
                  className="absolute inset-0 rounded-xl bg-white shadow-sm"
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold ${
                    isActive ? "bg-amber-100 text-amber-600" : "bg-stone-200 text-stone-500"
                  }`}
                >
                  {langTab.flag}
                </span>
                {langTab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {fields.map((field, index) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: index * 0.06,
            }}
            className="space-y-2"
          >
            <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
              <span className="text-amber-500">*</span>
              {field.label}
              <span className="ml-1 inline-flex items-center rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                {activeTab}
              </span>
            </label>
            {field.type === "textarea" ? (
              <textarea
                value={currentFields[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder[activeTab]}
                rows={4}
                className="w-full resize-none rounded-2xl border border-stone-200/80 bg-stone-50/60 px-4 py-3 text-sm text-stone-700 placeholder:text-stone-400 transition-all duration-200 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/15"
              />
            ) : (
              <input
                type="text"
                value={currentFields[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder[activeTab]}
                className="w-full rounded-2xl border border-stone-200/80 bg-stone-50/60 px-4 py-3 text-sm text-stone-700 placeholder:text-stone-400 transition-all duration-200 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/15"
              />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

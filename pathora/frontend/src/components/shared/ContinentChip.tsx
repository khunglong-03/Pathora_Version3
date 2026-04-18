"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { CONTINENT_TRANSLATION_KEYS, type SupportedContinentCode } from "@/constants/continents";

export interface ContinentInfo {
  code: ContinentCode;
  label: string;
  translationKey?: string;
  color: string;
  bgColor: string;
}

export type ContinentCode =
  | SupportedContinentCode
  | "NorthAmerica"
  | "SouthAmerica";

export const CONTINENT_MAP: Record<string, ContinentInfo> = {
  Asia: {
    code: "Asia",
    label: "Asia",
    translationKey: CONTINENT_TRANSLATION_KEYS.Asia,
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  Europe: {
    code: "Europe",
    label: "Europe",
    translationKey: CONTINENT_TRANSLATION_KEYS.Europe,
    color: "#2563EB",
    bgColor: "#DBEAFE",
  },
  Africa: {
    code: "Africa",
    label: "Africa",
    translationKey: CONTINENT_TRANSLATION_KEYS.Africa,
    color: "#D97706",
    bgColor: "#FEF3C7",
  },
  Americas: {
    code: "Americas",
    label: "Americas",
    translationKey: CONTINENT_TRANSLATION_KEYS.Americas,
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  NorthAmerica: {
    code: "NorthAmerica",
    label: "North America",
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  SouthAmerica: {
    code: "SouthAmerica",
    label: "South America",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
  },
  Oceania: {
    code: "Oceania",
    label: "Oceania",
    translationKey: CONTINENT_TRANSLATION_KEYS.Oceania,
    color: "#0891B2",
    bgColor: "#CFFAFE",
  },
  Antarctica: {
    code: "Antarctica",
    label: "Antarctica",
    translationKey: CONTINENT_TRANSLATION_KEYS.Antarctica,
    color: "#6B7280",
    bgColor: "#F3F4F6",
  },
};

interface ContinentChipProps {
  continent: string;
  size?: "sm" | "md";
  className?: string;
}

export function ContinentChip({
  continent,
  size = "md",
  className = "",
}: ContinentChipProps) {
  const { t } = useTranslation();
  const info = CONTINENT_MAP[continent] ?? {
    code: continent as ContinentCode,
    label: continent,
    color: "#6B7280",
    bgColor: "#F3F4F6",
  };
  const label = info.translationKey ? t(info.translationKey) : info.label;

  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${className}`}
      style={{
        color: info.color,
        backgroundColor: info.bgColor,
      }}
    >
      {label}
    </span>
  );
}

interface ContinentChipsProps {
  continents: string[];
  size?: "sm" | "md";
  className?: string;
}

export function ContinentChips({
  continents,
  size = "md",
  className = "",
}: ContinentChipsProps) {
  if (!continents || continents.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {continents.map((continent) => (
        <ContinentChip key={continent} continent={continent} size={size} />
      ))}
    </div>
  );
}

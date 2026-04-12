"use client";

import React from "react";

export interface ContinentInfo {
  code: ContinentCode;
  label: string;
  color: string;
  bgColor: string;
}

export type ContinentCode =
  | "Asia"
  | "Europe"
  | "Africa"
  | "NorthAmerica"
  | "SouthAmerica"
  | "Oceania"
  | "Antarctica";

export const CONTINENT_MAP: Record<string, ContinentInfo> = {
  Asia: {
    code: "Asia",
    label: "Châu Á",
    color: "#DC2626",
    bgColor: "#FEE2E2",
  },
  Europe: {
    code: "Europe",
    label: "Châu Âu",
    color: "#2563EB",
    bgColor: "#DBEAFE",
  },
  Africa: {
    code: "Africa",
    label: "Châu Phi",
    color: "#D97706",
    bgColor: "#FEF3C7",
  },
  NorthAmerica: {
    code: "NorthAmerica",
    label: "Bắc Mỹ",
    color: "#059669",
    bgColor: "#D1FAE5",
  },
  SouthAmerica: {
    code: "SouthAmerica",
    label: "Nam Mỹ",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
  },
  Oceania: {
    code: "Oceania",
    label: "Châu Đại Dương",
    color: "#0891B2",
    bgColor: "#CFFAFE",
  },
  Antarctica: {
    code: "Antarctica",
    label: "Châu Nam Cực",
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
  const info = CONTINENT_MAP[continent] ?? {
    code: continent as ContinentCode,
    label: continent,
    color: "#6B7280",
    bgColor: "#F3F4F6",
  };

  const sizeClass = size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${className}`}
      style={{
        color: info.color,
        backgroundColor: info.bgColor,
      }}
    >
      {info.label}
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

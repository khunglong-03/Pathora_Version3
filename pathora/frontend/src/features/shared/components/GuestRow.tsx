"use client";

import React from "react";
import { HiOutlineMinus, HiOutlinePlus } from "react-icons/hi2";

interface GuestRowProps {
  label: string;
  subtitle?: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  showBorder?: boolean;
  variant?: "public" | "public-alt";
}

export function GuestRow({
  label,
  subtitle,
  value,
  onDecrement,
  onIncrement,
  showBorder = true,
  variant = "public",
}: GuestRowProps) {
  const isAlt = variant === "public-alt";

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 transition-colors ${showBorder ? "border-b" : ""}`}
      style={{
        borderColor: "var(--tour-divider)",
        background: "var(--tour-surface-raised)",
      }}>
      <div className="flex flex-col">
        <span className="text-xs font-semibold" style={{ color: "var(--tour-heading)" }}>{label}</span>
        {subtitle && (
          <span className="text-[10px] leading-[0.9375rem]" style={{ color: "var(--tour-caption)" }}>
            {subtitle}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDecrement}
          className="rounded-full w-8 h-8 flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all duration-200"
          style={{
            background: "var(--tour-surface)",
            border: "1px solid var(--tour-divider)",
            color: "var(--tour-body)",
            boxShadow: "var(--shadow-warm-sm)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = isAlt ? "var(--landing-accent)" : "#fa8b02";
            (e.currentTarget as HTMLButtonElement).style.color = isAlt ? "var(--landing-accent)" : "#fa8b02";
            (e.currentTarget as HTMLButtonElement).style.background = isAlt ? "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" : "#fef3e4";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--tour-divider)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--tour-body)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--tour-surface)";
          }}>
          <HiOutlineMinus className="w-4 h-4" strokeWidth={2} />
        </button>
        <span className="text-sm font-bold w-8 text-center tabular-nums" style={{ color: "var(--tour-heading)" }}>
          {value}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          className="rounded-full w-8 h-8 flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-all duration-200"
          style={{
            background: "var(--tour-surface)",
            border: "1px solid var(--tour-divider)",
            color: "var(--tour-body)",
            boxShadow: "var(--shadow-warm-sm)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = isAlt ? "var(--landing-accent)" : "#fa8b02";
            (e.currentTarget as HTMLButtonElement).style.color = isAlt ? "var(--landing-accent)" : "#fa8b02";
            (e.currentTarget as HTMLButtonElement).style.background = isAlt ? "rgba(var(--landing-accent-rgb, 250,139,2), 0.1)" : "#fef3e4";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--tour-divider)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--tour-body)";
            (e.currentTarget as HTMLButtonElement).style.background = "var(--tour-surface)";
          }}>
          <HiOutlinePlus className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

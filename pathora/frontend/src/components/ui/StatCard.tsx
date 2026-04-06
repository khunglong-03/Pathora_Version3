"use client";

import Icon from "@/components/ui/Icon";

export interface StatCardProps {
  labelKey: string;
  value: string;
  icon: string;
  accent: string;
  eyebrow?: string;
  subtext?: string;
  delay?: number;
}

export function StatCard({
  labelKey,
  value,
  icon,
  accent,
  eyebrow,
  subtext,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="fade-in-card bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[130px] flex flex-col justify-between transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      style={{ animationDelay: `${delay * 50}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          {eyebrow && (
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3"
              style={{
                color: accent,
                backgroundColor: `${accent}10`,
                border: `1px solid ${accent}18`,
              }}
            >
              {eyebrow}
            </span>
          )}
          <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
            {labelKey}
          </span>
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-3"
          style={{ backgroundColor: `${accent}12` }}
        >
          <Icon icon={icon} className="size-5" style={{ color: accent }} />
        </div>
      </div>

      <div className="flex flex-col">
        <span
          className="text-[2.25rem] font-bold tracking-tight leading-none"
          style={{ color: "#111827", letterSpacing: "-0.03em" }}
        >
          {value}
        </span>
        {subtext && (
          <span className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatCard;

"use client";

interface ChartCardProps {
  title: string;
  eyebrow?: string;
  period?: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const ACCENT = "#F97316";
const TEXT_MUTED = "#9CA3AF";

export default function ChartCard({
  title,
  eyebrow,
  period,
  children,
  delay = 0,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-[#E5E7EB] p-6 min-h-[300px] fade-in-card transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] ${className}`}
      style={{ animationDelay: `${delay * 50}ms` }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {eyebrow && (
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
              style={{
                color: ACCENT,
                backgroundColor: `${ACCENT}10`,
                border: `1px solid ${ACCENT}18`,
              }}
            >
              {eyebrow}
            </span>
          )}
          <span className="text-sm font-semibold tracking-tight" style={{ color: "#111827" }}>
            {title}
          </span>
        </div>
        {period && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ml-3"
            style={{ color: TEXT_MUTED, backgroundColor: "#F3F4F6" }}
          >
            {period}
          </span>
        )}
      </div>
      <div className="flex-1 mt-4">{children}</div>
    </div>
  );
}

export type { ChartCardProps };

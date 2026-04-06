"use client";

import type { AdminDashboardVisaStatus } from "@/types/admin";

interface VisaStatusBadgeProps {
  status: AdminDashboardVisaStatus;
}

const STATUS_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  approved: {
    bg: "#D1FAE5",
    border: "#A7F3D0",
    text: "#10B981",
  },
  rejected: {
    bg: "#FEE2E2",
    border: "#FECACA",
    text: "#EF4444",
  },
  "under review": {
    bg: "#DBEAFE",
    border: "#BFDBFE",
    text: "#3B82F6",
  },
};

export function VisaStatusBadge({ status }: VisaStatusBadgeProps) {
  const key = status.label.toLowerCase();
  const style = STATUS_STYLES[key] ?? { bg: "#FEF3C7", border: "#FDE68A", text: "#F59E0B" };

  return (
    <div
      className="rounded-xl p-4 text-center border transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
      style={{ backgroundColor: style.bg, borderColor: style.border }}
    >
      <div
        className="text-2xl font-bold tracking-tight tabular-nums leading-none"
        style={{ color: "#111827" }}
      >
        {status.count}
      </div>
      <div
        className="mt-2 text-[10px] font-semibold uppercase tracking-wider inline-block px-2 py-0.5 rounded-full"
        style={{ color: style.text, backgroundColor: "rgba(255,255,255,0.55)" }}
      >
        {status.label}
      </div>
    </div>
  );
}

import React from "react";
import Card from "@/components/ui/Card";
import { Icon } from "@/components/ui";
import type { AdminBooking } from "@/api/services/adminService";
import { CSS } from "../BookingsPageData";
import { Reveal, SpringCard, CardShell, Eyebrow, BreathingDot } from "./BookingsShell";

interface StatCardConfig {
  label: string;
  value: string;
  accent: string;
  accentMuted: string;
  accentBorder: string;
  icon: string;
  delay: number;
  liveIndicator?: boolean;
  subIndicator?: React.ReactNode;
}

function StatCard({ label, value, accent, accentMuted, accentBorder, icon, delay, liveIndicator, subIndicator }: StatCardConfig) {
  return (
    <Reveal delay={delay}>
      <SpringCard className="h-full">
        <CardShell className="p-[1px] h-full">
          <Card bodyClass="p-7 h-full border-0 shadow-none" className="border-0 shadow-none">
            <div className="flex items-start justify-between mb-3">
              <Eyebrow>{label}</Eyebrow>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: accentMuted }}
              >
                <Icon icon={icon} className="size-5" style={{ color: accent }} />
              </div>
            </div>
            <p
              className="text-[2rem] font-bold tracking-tight data-value leading-none"
              style={{ color: CSS.textPrimary, letterSpacing: "-0.03em" }}
            >
              {value}
            </p>
            {subIndicator && <div className="mt-3">{subIndicator}</div>}
            {liveIndicator && (
              <div className="mt-3 flex items-center gap-1.5">
                <BreathingDot color={accent} />
                <span className="text-xs" style={{ color: CSS.textMuted }}>Live data</span>
              </div>
            )}
          </Card>
        </CardShell>
      </SpringCard>
    </Reveal>
  );
}

export function buildStatCards(
  t: (key: string) => string,
  isEmpty: boolean,
  bookings: AdminBooking[],
  confirmedCount: number,
  confirmedPercent: number,
  totalRevenue: number,
): StatCardConfig[] {
  return [
    {
      label: t("bookings.stat.totalBookings"),
      value: isEmpty ? "0" : String(bookings.length),
      accent: CSS.textMuted,
      accentMuted: CSS.surfaceRaise,
      accentBorder: CSS.border,
      icon: "heroicons:ticket",
      delay: 0,
      subIndicator: (
        <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: CSS.surfaceRaise }}>
          <div className="h-full rounded-full" style={{ width: "40%", backgroundColor: CSS.textMuted }} />
        </div>
      ),
    },
    {
      label: t("bookings.stat.confirmed"),
      value: String(confirmedCount),
      accent: CSS.success,
      accentMuted: CSS.successMuted,
      accentBorder: "var(--success-border)",
      icon: "heroicons:check-badge",
      delay: 1,
      subIndicator: (
        <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: CSS.surfaceRaise }}>
          <div className="h-full rounded-full" style={{ width: `${confirmedPercent}%`, backgroundColor: CSS.success }} />
        </div>
      ),
    },
    {
      label: t("bookings.stat.totalRevenue"),
      value: `$${totalRevenue.toLocaleString()}`,
      accent: CSS.accent,
      accentMuted: "var(--accent-muted)",
      accentBorder: "var(--warning-border)",
      icon: "heroicons:currency-dollar",
      delay: 2,
      liveIndicator: true,
    },
  ];
}

export { StatCard };

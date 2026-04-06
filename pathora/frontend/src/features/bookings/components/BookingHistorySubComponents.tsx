import React from "react";
import { Icon } from "@/components/ui";
import { BookingStatus, TourTier, STATUS_CONFIG, TIER_CONFIG } from "./BookingHistoryData";

interface StatusOverlayProps {
  status: BookingStatus;
  label: string;
}

export function StatusOverlay({ status, label }: StatusOverlayProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm ${cfg.bg} ${cfg.text}`}
    >
      <Icon icon={cfg.icon} className={`size-4 ${cfg.iconColor}`} />
      {label}
    </span>
  );
}

interface TierBadgeProps {
  tier: TourTier;
  label: string;
}

export function TierBadge({ tier, label }: TierBadgeProps) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      {label}
    </span>
  );
}

interface InfoItemProps {
  icon: string;
  label: string;
  value: string;
}

export function InfoItem({ icon, label, value }: InfoItemProps) {
  return (
    <div className="flex items-start gap-2">
      <Icon icon={icon} className="size-4 text-gray-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

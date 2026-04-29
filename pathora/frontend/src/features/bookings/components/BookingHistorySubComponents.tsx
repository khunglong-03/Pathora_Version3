import React from "react";
import { BookingStatus, TourTier, STATUS_CONFIG, TIER_CONFIG } from "./BookingHistoryData";
import { CheckCircle, Clock, XCircle } from "@phosphor-icons/react";

interface StatusOverlayProps {
  status: BookingStatus;
  label: string;
}

export function StatusOverlay({ status, label }: StatusOverlayProps) {
  // Normalize status to match config keys (which are lowercase)
  const normalizedStatus = (status || "pending").toString().toLowerCase();
  
  // Provide a safe fallback if status is not explicitly defined in config
  const cfg = STATUS_CONFIG[normalizedStatus as BookingStatus] || {
    bg: "bg-slate-500/90",
    text: "text-white",
    icon: "heroicons:information-circle",
    iconColor: "text-white"
  };
  
  let StatusIcon = CheckCircle;
  if (normalizedStatus.includes("pending")) {
    StatusIcon = Clock;
  } else if (normalizedStatus.includes("cancel") || normalizedStatus.includes("reject")) {
    StatusIcon = XCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] text-[11px] uppercase tracking-wider font-bold backdrop-blur-md shadow-sm ${cfg.bg} ${cfg.text}`}
    >
      <StatusIcon weight="fill" className={`size-3.5 ${cfg.iconColor}`} />
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
      className={`px-2.5 py-1 rounded-[0.5rem] text-[10px] uppercase tracking-widest font-bold border border-current/10 ${cfg.bg} ${cfg.text}`}
    >
      {label}
    </span>
  );
}

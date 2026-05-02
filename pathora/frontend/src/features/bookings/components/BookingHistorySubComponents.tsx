import React from "react";
import { BookingStatus, TourTier, STATUS_CONFIG, TIER_CONFIG } from "./BookingHistoryData";
import { CheckCircle, Clock, XCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

interface StatusOverlayProps {
  status: BookingStatus;
  label: string;
}

export function StatusOverlay({ status, label }: StatusOverlayProps) {
  // Normalize status to match config keys (which are lowercase)
  const normalizedStatus = (status || "pending").toString().toLowerCase();
  
  // Provide a safe fallback if status is not explicitly defined in config
  const cfg = STATUS_CONFIG[normalizedStatus as BookingStatus] || {
    bg: "bg-slate-100",
    text: "text-slate-600",
    icon: "heroicons:information-circle",
    iconColor: "text-slate-600"
  };
  
  let StatusIcon = CheckCircle;
  if (normalizedStatus.includes("pending")) {
    StatusIcon = Clock;
  } else if (normalizedStatus.includes("cancel") || normalizedStatus.includes("reject")) {
    StatusIcon = XCircle;
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider", cfg.bg, cfg.text)}
    >
      <StatusIcon weight="fill" className={cn("size-3.5", cfg.iconColor)} />
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
      className={cn("rounded-full border border-current/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest", cfg.bg, cfg.text)}
    >
      {label}
    </span>
  );
}

import React from "react";
import { BookingStatus, TourTier } from "./BookingHistoryData";
import { CheckCircle, Clock, XCircle, Prohibit, Info } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

interface StatusOverlayProps {
  status: BookingStatus;
  label: string;
}

export function StatusOverlay({ status, label }: StatusOverlayProps) {
  const normalizedStatus = (status || "pending").toString().toLowerCase();
  
  let StatusIcon = CheckCircle;
  let colorClasses = "bg-stone-50 text-stone-600 border-stone-200/50";
  let iconColor = "text-stone-500";

  if (normalizedStatus.includes("confirmed") || normalizedStatus.includes("approved") || normalizedStatus.includes("paid")) {
    StatusIcon = CheckCircle;
    colorClasses = "bg-emerald-50/90 text-emerald-700 border-emerald-500/20 shadow-[0_2px_8px_rgba(16,185,129,0.04)]";
    iconColor = "text-emerald-600";
  } else if (normalizedStatus.includes("completed") || normalizedStatus.includes("deposited")) {
    StatusIcon = CheckCircle;
    colorClasses = "bg-blue-50/90 text-blue-700 border-blue-500/20 shadow-[0_2px_8px_rgba(59,130,246,0.04)]";
    iconColor = "text-blue-600";
  } else if (normalizedStatus.includes("pending")) {
    StatusIcon = Clock;
    colorClasses = "bg-amber-50/90 text-amber-700 border-amber-500/20 shadow-[0_2px_8px_rgba(245,158,11,0.04)]";
    iconColor = "text-amber-600";
  } else if (normalizedStatus.includes("cancel")) {
    StatusIcon = Prohibit;
    colorClasses = "bg-stone-100 text-stone-500 border-stone-200/60";
    iconColor = "text-stone-400";
  } else if (normalizedStatus.includes("reject")) {
    StatusIcon = XCircle;
    colorClasses = "bg-rose-50/90 text-rose-700 border-rose-500/20 shadow-[0_2px_8px_rgba(239,68,68,0.04)]";
    iconColor = "text-rose-600";
  } else {
    StatusIcon = Info;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all backdrop-blur-xs",
        colorClasses
      )}
    >
      <StatusIcon weight="bold" className={cn("size-3.5", iconColor)} />
      <span suppressHydrationWarning>{label}</span>
    </span>
  );
}

interface TierBadgeProps {
  tier: TourTier;
  label: string;
}

export function TierBadge({ tier, label }: TierBadgeProps) {
  let tierClasses = "bg-stone-50 border-stone-200/50 text-stone-600";
  
  if (tier === "luxury") {
    tierClasses = "bg-amber-50/90 border-amber-500/20 text-amber-700 shadow-[0_2px_6px_rgba(245,158,11,0.02)]";
  } else if (tier === "premium") {
    tierClasses = "bg-amber-50/90 border-amber-500/20 text-[#C9873A] shadow-[0_2px_6px_rgba(201,135,58,0.02)]";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] transition-all",
        tierClasses
      )}
    >
      <span suppressHydrationWarning>{label}</span>
    </span>
  );
}

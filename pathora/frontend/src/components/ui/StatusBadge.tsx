"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useSyncExternalStore } from "react";

export interface BadgeTokens {
  bg: string;
  text: string;
  dot?: string;
  label: string;
}

export interface StatusBadgeProps {
  bg: string;
  text: string;
  dot?: string;
  label: string;
}

function useI18nSafe() {
  const { t } = useTranslation();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const safeT = (key: string, fallback: string) =>
    mounted ? t(key, fallback) : fallback;
  return safeT;
}

/**
 * Generic StatusBadge — pass bg/text/dot/label directly.
 * For i18n-aware domain usage, prefer TourStatusBadge, PaymentStatusBadge, etc.
 */
export function StatusBadge({ bg, text, dot, label }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${text}`}>
      {dot && <span className={`size-2 rounded-full ${dot}`} />}
      {label}
    </span>
  );
}

/* ── Domain-specific wrappers ──────────────────────────────── */

/** Tour instance/list status (uses TourInstanceStatusMap from @/types/tour) */
export function TourStatusBadge({ status }: { status: string }) {
  const safeT = useI18nSafe();
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "");
  const fallback: BadgeTokens = { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500", label: status };
  const map: Record<string, BadgeTokens> = {
    available: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", label: "Available" },
    confirmed: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500", label: "Confirmed" },
    soldout: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500", label: "Sold Out" },
    inprogress: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "In Progress" },
    cancelled: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Cancelled" },
    completed: { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500", label: "Completed" },
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Active" },
    inactive: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Inactive" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
    pendingadjustment: { bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500", label: "Cần điều chỉnh" },
    pendingmanagerreview: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500", label: "Chờ Quản lý duyệt" },
    pendingcustomerapproval: { bg: "bg-indigo-100", text: "text-indigo-700", dot: "bg-indigo-500", label: "Chờ Khách chốt" },
    rejected: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "Rejected" },
    draft: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400", label: "Bản nháp" },
  };
  const config = map[normalized] ?? fallback;
  return (
    <StatusBadge
      bg={config.bg}
      text={config.text}
      dot={config.dot}
      label={safeT(`tourInstance.statusLabels.${normalized}`, config.label)}
    />
  );
}

/** Payment status — CSS variable colors, no dot */
export function PaymentStatusBadge({ status }: { status: string }) {
  const lower = status.trim().toLowerCase();
  const map: Record<string, BadgeTokens> = {
    completed: { bg: "var(--success-muted)", text: "var(--success)", label: "Completed" },
    pending: { bg: "var(--warning-muted)", text: "var(--warning)", label: "Pending" },
    refunded: { bg: "var(--danger-muted)", text: "var(--danger)", label: "Refunded" },
    failed: { bg: "var(--danger-muted)", text: "var(--danger)", label: "Failed" },
    paid: { bg: "var(--success-muted)", text: "var(--success)", label: "Paid" },
  };
  const config = map[lower] ?? map.pending;
  return <StatusBadge bg={config.bg} text={config.text} label={status.charAt(0).toUpperCase() + status.slice(1)} />;
}

export interface VisaBadgeTokens extends BadgeTokens {
  border?: string;
}

/** Visa application status — uses border styling to match original */
export function VisaStatusBadge({ status }: { status: string }) {
  const safeT = useI18nSafe();
  const lower = status.trim().toLowerCase().replace(/[\s_]+/g, "");
  const map: Record<string, VisaBadgeTokens> = {
    approved: { bg: "bg-emerald-50/80", text: "text-emerald-700", border: "border-emerald-200/50", dot: "bg-emerald-500", label: "Approved" },
    pending: { bg: "bg-amber-50/80", text: "text-amber-700", border: "border-amber-200/50", dot: "bg-amber-500", label: "Pending" },
    under_review: { bg: "bg-sky-50/80", text: "text-sky-700", border: "border-sky-200/50", dot: "bg-sky-500", label: "Under Review" },
    rejected: { bg: "bg-rose-50/80", text: "text-rose-700", border: "border-rose-200/50", dot: "bg-rose-500", label: "Rejected" },
  };
  const config = map[lower] ?? map.pending;
  const displayLabel = lower === "under_review"
    ? safeT("visa.statusUnderReview", "Under Review")
    : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text} border ${config.border ?? ""}`}>
      {config.dot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {displayLabel}
    </span>
  );
}

/** Booking status */
export function BookingStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "");
  const fallback: BadgeTokens = { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-500", label: status };
  const map: Record<string, BadgeTokens> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved" },
    rejected: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", label: "Rejected" },
    cancelled: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", label: "Cancelled" },
  };
  const config = map[normalized] ?? fallback;
  return <StatusBadge bg={config.bg} text={config.text} dot={config.dot} label={config.label} />;
}

/** Tour request status — uses TOUR_REQUEST_STATUS_MAP */
export function TourRequestStatusBadge({ status }: { status: string }) {
  const safeT = useI18nSafe();
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "");
  const map: Record<string, BadgeTokens> = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
    approved: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved" },
    rejected: { bg: "bg-rose-100", text: "text-rose-700", dot: "bg-rose-500", label: "Rejected" },
  };
  const config = map[normalized] ?? map.pending;
  return (
    <StatusBadge
      bg={config.bg}
      text={config.text}
      dot={config.dot}
      label={safeT(`tourRequest.status.${normalized}`, config.label)}
    />
  );
}

/** Insurance status */
export function InsuranceStatusBadge({ status }: { status: string }) {
  const lower = status.trim().toLowerCase();
  const map: Record<string, BadgeTokens> = {
    active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
    expired: { bg: "bg-stone-100", text: "text-stone-600", label: "Expired" },
    claimed: { bg: "bg-amber-100", text: "text-amber-700", label: "Claimed" },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  };
  const config = map[lower] ?? { bg: "bg-stone-100", text: "text-stone-600", label: status };
  return <StatusBadge bg={config.bg} text={config.text} label={status.charAt(0).toUpperCase() + status.slice(1)} />;
}

/** Customer status */
export function CustomerStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase().replace(/[\s_]+/g, "");
  const map: Record<string, BadgeTokens> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", label: "Active" },
    inactive: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: "Inactive" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", label: "Pending" },
    draft: { bg: "bg-stone-100", text: "text-stone-600", dot: "bg-stone-400", label: "Draft" },
  };
  const config = map[normalized] ?? { bg: "bg-stone-100", text: "text-stone-600", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
      {config.dot && <span className={`size-2 rounded-full ${config.dot}`} />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

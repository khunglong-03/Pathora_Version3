import React from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { NormalizedTourInstanceDto, TourInstanceManagerDto } from "@/types/tour";

/* ─── Provider Status Card ─── */
interface ProviderStatusCardProps {
  icon: string;
  iconColor: string;
  label: string;
  providerName?: string | null;
  approvalStatus: number;
  approvalNote?: string | null;
  emptyMessage: string;
}

export function ProviderStatusCard({
  icon,
  iconColor,
  label,
  providerName,
  approvalStatus,
  approvalNote,
  emptyMessage,
}: ProviderStatusCardProps) {
  const { t } = useTranslation();

  /* 1 = Pending, 2 = Approved, 3 = Rejected */
  const statusConfig: Record<number, { bg: string; text: string; label: string }> = {
    2: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: t("tourInstance.approved", "Approved") },
    3: { bg: "bg-red-50 border-red-200", text: "text-red-700", label: t("tourInstance.rejected", "Rejected") },
  };
  const cfg = statusConfig[approvalStatus] ?? {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    label: t("tourInstance.pending", "Pending"),
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md">
      <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900">
        <Icon icon={icon} className={`size-4 ${iconColor}`} />
        {label}
      </h3>
      {providerName ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-stone-800">{providerName}</span>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.text}`}
            >
              {cfg.label}
            </span>
          </div>
          {approvalNote && (
            <p className="rounded-lg bg-stone-50 p-2 text-xs text-stone-500">
              <span className="font-medium">{t("tourInstance.provider.note", "Note:")} </span>
              {approvalNote}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm italic text-stone-400">{emptyMessage}</p>
      )}
    </div>
  );
}

/* ─── Stats Card ─── */
interface StatCardProps {
  label: string;
  value: React.ReactNode;
  accent?: string;
  children?: React.ReactNode;
}

export function StatCard({ label, value, accent = "text-stone-900", children }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-stone-100 bg-white p-4 transition-shadow hover:shadow-md">
      <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight ${accent}`}>{value}</p>
      {children}
    </div>
  );
}

/* ─── Manager Chip ─── */
export function ManagerChip({
  name,
  avatar,
  role,
}: {
  name: string;
  avatar?: string | null;
  role: string;
}) {
  const isGuide = role === "Guide";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
        isGuide
          ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
      }`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="size-5 rounded-md object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Icon icon="heroicons:user" className="size-3.5" />
      )}
      <span className="max-w-28 truncate">{name}</span>
    </span>
  );
}

/* ─── Team Section ─── */
export function TeamSection({ managers }: { managers: TourInstanceManagerDto[] }) {
  const { t } = useTranslation();
  const guides = managers.filter((m) => m.role === "Guide");
  const mgrs = managers.filter((m) => m.role === "Manager");

  if (guides.length === 0 && mgrs.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        {t("tourInstance.noGuidesOrManagers", "No guides or managers assigned")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {guides.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t("tourInstance.wizard.section.guides", "Guides")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {guides.map((m) => (
              <ManagerChip key={m.id} name={m.userName} avatar={m.userAvatar} role={m.role} />
            ))}
          </div>
        </div>
      )}
      {mgrs.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            {t("tourInstance.wizard.section.managers", "Managers")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {mgrs.map((m) => (
              <ManagerChip key={m.id} name={m.userName} avatar={m.userAvatar} role={m.role} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Info Row ─── */
export function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5">
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className={`text-sm font-medium text-stone-800 ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}

/* ─── Format helpers ─── */
export function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(value)} VND`;
}

export function formatDate(value?: string | null, locale = "vi-VN"): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
}

export function formatTime(value: string, locale = "vi-VN"): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

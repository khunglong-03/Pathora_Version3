"use client";
import TextInput from "@/components/ui/TextInput";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";

/* ── Types ─────────────────────────────────────────────────── */
type VisaStatus = "approved" | "pending" | "under_review" | "rejected";

interface Participant {
  id: string;
  name: string;
  type: "adult" | "child";
  passportNumber: string;
  status: VisaStatus;
}

/* ── Sample Data ───────────────────────────────────────────── */
const SAMPLE_PARTICIPANTS: Participant[] = [
  {
    id: "1",
    name: "John Anderson",
    type: "adult",
    passportNumber: "P1234567",
    status: "approved",
  },
  {
    id: "2",
    name: "Sarah Anderson",
    type: "adult",
    passportNumber: "P7654321",
    status: "approved",
  },
  {
    id: "3",
    name: "Emma Anderson",
    type: "child",
    passportNumber: "P9876543",
    status: "under_review",
  },
];

const BOOKING_REF = "Bali Island Hopping Adventure • PATH-2026-001";

/* ── Status config ─────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  VisaStatus,
  { bg: string; border: string; text: string; icon: string; iconColor: string }
> = {
  approved: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: "heroicons:check-circle",
    iconColor: "text-emerald-600",
  },
  pending: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: "heroicons:clock",
    iconColor: "text-amber-600",
  },
  under_review: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: "heroicons:arrow-path",
    iconColor: "text-blue-600",
  },
  rejected: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: "heroicons:x-circle",
    iconColor: "text-red-600",
  },
};

type FilterKey = "all" | VisaStatus;

/* ── StatusBadge ───────────────────────────────────────────── */
function StatusBadge({ status, label }: { status: VisaStatus; label: string }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <Icon icon={cfg.icon} className={`size-4 ${cfg.iconColor}`} />
      {label}
    </span>
  );
}

/* ── ParticipantCard ───────────────────────────────────────── */
function ParticipantCard({
  participant,
  isSelected,
  onClick,
  typeLabel,
  statusLabel,
}: {
  participant: Participant;
  isSelected: boolean;
  onClick: () => void;
  typeLabel: string;
  statusLabel: string;
}) {
  const initial = participant.name.charAt(0);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-6 border-b border-slate-100 last:border-b-0 transition-all hover:bg-slate-50 ${
        isSelected ? "bg-orange-50/30" : ""
      }`}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
          <span className="text-lg font-bold text-slate-600">{initial}</span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">
                {participant.name}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {typeLabel}
              </span>
            </div>
            <StatusBadge status={participant.status} label={statusLabel} />
          </div>
          <div className="flex items-center gap-2">
            <Icon icon="heroicons:identification" className="size-4 text-slate-400" />
            <span className="text-sm text-slate-500 font-mono tracking-tight">
              {participant.passportNumber}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   ██  VisaApplicationPage
   ══════════════════════════════════════════════════════════════ */
export function VisaApplicationPage() {
  const { t } = useTranslation();

  /* ── State ──────────────────────────────────────────── */
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /* ── Filter definitions ──────────────────────────────── */
  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("landing.visa.filterAll") },
    { key: "approved", label: t("landing.visa.statusApproved") },
    { key: "pending", label: t("landing.visa.statusPending") },
    { key: "under_review", label: t("landing.visa.statusUnderReview") },
    { key: "rejected", label: t("landing.visa.statusRejected") },
  ];

  /* ── Filtered participants ───────────────────────────── */
  const filtered = useMemo(() => {
    let list = SAMPLE_PARTICIPANTS;
    if (activeFilter !== "all") {
      list = list.filter((p) => p.status === activeFilter);
    }
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.passportNumber.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeFilter, debouncedSearchQuery]);

  /* ── Stat counts ─────────────────────────────────────── */
  const approvedCount = SAMPLE_PARTICIPANTS.filter(
    (p) => p.status === "approved",
  ).length;
  const pendingCount = SAMPLE_PARTICIPANTS.filter(
    (p) => p.status === "pending" || p.status === "under_review",
  ).length;

  /* ── Status label helper ─────────────────────────────── */
  const getStatusLabel = (s: VisaStatus) => {
    switch (s) {
      case "approved":
        return t("landing.visa.statusApproved");
      case "pending":
        return t("landing.visa.statusPending");
      case "under_review":
        return t("landing.visa.statusUnderReview");
      case "rejected":
        return t("landing.visa.statusRejected");
    }
  };

  const getTypeLabel = (type: "adult" | "child") =>
    type === "adult"
      ? t("landing.visa.typeAdult")
      : t("landing.visa.typeChild");

  /* ── Info items ──────────────────────────────────────── */
  const processingInfoItems = [
    t("landing.visa.infoItem1"),
    t("landing.visa.infoItem2"),
    t("landing.visa.infoItem3"),
    t("landing.visa.infoItem4"),
  ];

  return (
    <main className="bg-[#f9fafb] min-h-[100dvh]">
      {/* ── Hero Banner ───────────────────────────────── */}
      <div className="bg-white border-b border-slate-200/50 pt-24 pb-12">
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-8">
            <Icon icon="heroicons:arrow-left" className="size-4" />
            {t("landing.visa.backToBooking")}
          </Link>

          {/* Title row */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <Icon
                    icon="heroicons:document-text"
                    className="size-6 text-slate-600"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">{BOOKING_REF}</p>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tighter leading-tight">
                {t("landing.visa.title")}
              </h1>
            </div>

            {/* Stat badges */}
            <div className="flex items-center gap-4">
              <div className="bg-white border border-slate-200/50 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.05)] rounded-[1.5rem] px-6 py-4 text-center min-w-[100px]">
                <p className="text-3xl font-bold tracking-tighter text-emerald-600">
                  {approvedCount}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {t("landing.visa.statusApproved")}
                </p>
              </div>
              <div className="bg-white border border-slate-200/50 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.05)] rounded-[1.5rem] px-6 py-4 text-center min-w-[100px]">
                <p className="text-3xl font-bold tracking-tighter text-amber-600">
                  {pendingCount}
                </p>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">
                  {t("landing.visa.statusPending")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10">
        {/* ── Search & Filter Bar ──────────────────────── */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 mr-2">
                <Icon
                  icon="heroicons:funnel"
                  className="size-4 text-slate-400"
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {t("landing.visa.filter")}:
                </span>
              </div>
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setActiveFilter(f.key)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02] ${
                    activeFilter === f.key
                      ? "bg-slate-900 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative w-full md:w-80">
              <Icon
                icon="heroicons:magnifying-glass"
                className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400"
              />
              <TextInput
                type="text"
                placeholder={t("landing.visa.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="!pl-11 !pr-4 !py-2.5 !rounded-full !border-slate-200/80 !text-sm !font-medium placeholder:!text-slate-400 focus:!ring-[#fa8b02]/20 focus:!border-[#fa8b02] !bg-slate-50 focus:!bg-white"
              />
            </div>
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Participants */}
          <div className="flex-1 flex flex-col gap-8">
            {/* Participants Card */}
            <div className="bg-white rounded-[1.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-200/50 flex items-center justify-between px-6 py-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {t("landing.visa.participants")} <span className="text-slate-400 font-normal">({filtered.length})</span>
                </h2>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors bg-white border border-slate-200/50 shadow-sm rounded-full px-3 py-1.5">
                  <Icon icon="heroicons:arrow-path" className="size-4" />
                  {t("landing.visa.refresh")}
                </button>
              </div>

              {/* Participant list */}
              <div>
                {filtered.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <Icon icon="heroicons:magnifying-glass" className="size-6 text-slate-300" />
                    </div>
                    <p className="text-base font-semibold text-slate-900 mb-1">{t("landing.visa.noResults")}</p>
                    <p className="text-sm text-slate-500 max-w-[30ch]">Try adjusting your search or filters to find what you&apos;re looking for.</p>
                  </div>
                ) : (
                  filtered.map((p) => (
                    <ParticipantCard
                      key={p.id}
                      participant={p}
                      isSelected={selectedId === p.id}
                      onClick={() => setSelectedId(p.id)}
                      typeLabel={getTypeLabel(p.type)}
                      statusLabel={getStatusLabel(p.status)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Visa Processing Information */}
            <div className="bg-white border border-slate-200/50 rounded-[1.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
              <div className="p-6 md:p-8 flex items-start gap-5">
                <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                  <Icon
                    icon="heroicons:information-circle"
                    className="size-6 text-blue-600"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-3">
                    {t("landing.visa.processingInfo")}
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {processingInfoItems.map((item, i) => (
                      <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Detail Panel */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white rounded-[1.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] min-h-[300px] flex flex-col xl:sticky xl:top-8 overflow-hidden">
              {selectedId ? (
                (() => {
                  const p = SAMPLE_PARTICIPANTS.find(
                    (x) => x.id === selectedId,
                  );
                  if (!p) return null;
                  return (
                    <div className="flex flex-col h-full">
                      <div className="p-8 border-b border-slate-100 flex flex-col items-center text-center">
                        <div className="size-20 rounded-full bg-slate-100 border-2 border-white shadow-md flex items-center justify-center mb-4">
                          <span className="text-3xl font-bold text-slate-700">
                            {p.name.charAt(0)}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                          {p.name}
                        </h3>
                        <p className="text-sm text-slate-500 font-mono tracking-tight mt-1 mb-4">
                          {p.passportNumber}
                        </p>
                        <StatusBadge
                          status={p.status}
                          label={getStatusLabel(p.status)}
                        />
                      </div>
                      
                      <div className="p-6 md:p-8 flex-1 bg-slate-50/50">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-4">Required Documents</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/50 shadow-sm">
                            <div className="size-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <Icon icon="heroicons:check" className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">Passport Copy</p>
                              <p className="text-xs text-slate-500">Uploaded 2 days ago</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/50 shadow-sm">
                            <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                              <Icon icon="heroicons:clock" className="size-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">Portrait Photo</p>
                              <p className="text-xs text-slate-500">Pending review</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-slate-200/50">
                           <button className="w-full bg-[#fa8b02] text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-orange-500/20 hover:bg-[#e07d02] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa8b02]">
                             Upload Additional Documents
                           </button>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-12 h-full my-auto">
                  <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                    <Icon
                      icon="heroicons:user"
                      className="size-8 text-slate-300"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">No Participant Selected</h3>
                  <p className="text-sm text-slate-500 max-w-[25ch]">
                    {t("landing.visa.selectParticipant")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

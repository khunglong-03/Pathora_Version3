"use client";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui";
import { LandingHeader } from "@/features/shared/components/LandingHeader";
import { LandingFooter } from "@/features/shared/components/LandingFooter";
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
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-600",
    icon: "heroicons:check-circle",
    iconColor: "text-green-500",
  },
  pending: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-600",
    icon: "heroicons:clock",
    iconColor: "text-amber-500",
  },
  under_review: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-600",
    icon: "heroicons:arrow-path",
    iconColor: "text-blue-500",
  },
  rejected: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    icon: "heroicons:x-circle",
    iconColor: "text-red-500",
  },
};

type FilterKey = "all" | VisaStatus;

/* ── StatusBadge ───────────────────────────────────────────── */
function StatusBadge({ status, label }: { status: VisaStatus; label: string }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
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
    <Button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-5 py-5 border-b border-gray-900/10 last:border-b-0 transition-colors hover:bg-gray-50 ${
        isSelected ? "bg-orange-50/50" : ""
      }`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="size-12 rounded-full bg-linear-to-b from-orange-500 to-orange-600 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-white">{initial}</span>
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-slate-900">
              {participant.name}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
              {typeLabel}
            </span>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {participant.passportNumber}
          </span>
          <StatusBadge status={participant.status} label={statusLabel} />
        </div>
      </div>
    </Button>
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
    <>
      <LandingHeader />

      <main className="bg-gray-50 min-h-screen">
        {/* ── Hero Banner ───────────────────────────────── */}
        <div className="bg-linear-to-r from-[#05073c] to-[#05073c]/90 pt-24 pb-16 md:pb-10">
          <div className="max-w-330 mx-auto px-4 md:px-3.75">
            {/* Back link */}
            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 hover:text-white transition-colors mb-6">
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t("landing.visa.backToBooking")}
            </Link>

            {/* Title row */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Icon
                    icon="heroicons:document-text"
                    className="size-6 text-white"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {t("landing.visa.title")}
                  </h1>
                  <p className="text-sm text-white/70">{BOOKING_REF}</p>
                </div>
              </div>

              {/* Stat badges */}
              <div className="flex items-center gap-3">
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center min-w-[76px]">
                  <p className="text-2xl font-bold text-green-400">
                    {approvedCount}
                  </p>
                  <p className="text-xs text-white/60">
                    {t("landing.visa.statusApproved")}
                  </p>
                </div>
                <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center min-w-[76px]">
                  <p className="text-2xl font-bold text-orange-400">
                    {pendingCount}
                  </p>
                  <p className="text-xs text-white/60">
                    {t("landing.visa.statusPending")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-330 mx-auto px-4 md:px-3.75 -mt-6">
          {/* ── Search & Filter Bar ──────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              {/* Search input */}
              <div className="relative flex-1 md:max-w-md">
                <Icon
                  icon="heroicons:magnifying-glass"
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400"
                />
                <TextInput
                  type="text"
                  placeholder={t("landing.visa.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="!pl-10 !pr-4 !py-2.5 !rounded-xl !border-gray-200 !text-sm placeholder:!text-gray-400 focus:!ring-orange-500/20 focus:!border-orange-500"
                />
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 mr-1">
                  <Icon
                    icon="heroicons:funnel"
                    className="size-4 text-gray-400"
                  />
                  <span className="text-xs font-semibold text-gray-400">
                    {t("landing.visa.filter")}:
                  </span>
                </div>
                {filters.map((f) => (
                  <Button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveFilter(f.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      activeFilter === f.key
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}>
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Main Content ─────────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-8 pb-10">
            {/* Left: Participants + Info */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Participants Card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Dark header */}
                <div className="bg-linear-to-r from-[#05073c] to-[#05073c]/90 flex items-center justify-between px-6 h-15">
                  <h2 className="text-lg font-bold text-white">
                    {t("landing.visa.participants")} ({filtered.length})
                  </h2>
                  <Button
                    type="button"
                    className="flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors">
                    <Icon icon="heroicons:arrow-path" className="size-3.5" />
                    {t("landing.visa.refresh")}
                  </Button>
                </div>

                {/* Participant list */}
                <div>
                  {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-gray-400">
                      {t("landing.visa.noResults")}
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
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Icon
                    icon="heroicons:information-circle"
                    className="size-5 text-blue-500 shrink-0 mt-0.5"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-2">
                      {t("landing.visa.processingInfo")}
                    </h3>
                    <ul className="flex flex-col gap-1.5">
                      {processingInfoItems.map((item, i) => (
                        <li key={i} className="text-xs text-gray-600 leading-4">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Detail Panel */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm h-[198px] flex flex-col items-center justify-center sticky top-24">
                {selectedId ? (
                  (() => {
                    const p = SAMPLE_PARTICIPANTS.find(
                      (x) => x.id === selectedId,
                    );
                    if (!p) return null;
                    return (
                      <div className="flex flex-col items-center gap-3 px-6 py-6 text-center">
                        <div className="size-16 rounded-full bg-linear-to-b from-orange-500 to-orange-600 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {p.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">
                            {p.name}
                          </h3>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            {p.passportNumber}
                          </p>
                        </div>
                        <StatusBadge
                          status={p.status}
                          label={getStatusLabel(p.status)}
                        />
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Icon
                      icon="heroicons:user"
                      className="size-16 text-gray-200"
                    />
                    <p className="text-sm text-gray-500">
                      {t("landing.visa.selectParticipant")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </>
  );
}

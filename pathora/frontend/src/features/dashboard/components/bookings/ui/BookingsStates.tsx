import React from "react";
import Card from "@/components/ui/Card";
import { Icon } from "@/components/ui";
import { CSS } from "../BookingsPageData";
import { Reveal, CardShell } from "./BookingsShell";

export function BookingsErrorState({
  message,
  onRetry,
  t,
}: {
  message: string | null;
  onRetry: () => void;
  t: (key: string) => string;
}) {
  return (
    <Reveal delay={1}>
      <CardShell className="p-1.5 rounded-[2rem]">
        <Card bodyClass="p-6 border-0 shadow-none" className="rounded-[calc(2rem-0.375rem)] border-0 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-red-900/5"
                style={{ backgroundColor: CSS.dangerMuted }}
              >
                <Icon icon="heroicons:exclamation-circle" className="size-5" style={{ color: CSS.danger }} />
              </div>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: CSS.danger }}>
                  {t("bookings.error.title")}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: CSS.textSecondary }}>
                  {message ?? t("bookings.error.fallback")}
                </p>
              </div>
            </div>
            <button
              onClick={onRetry}
              className="px-4 py-2 rounded-full text-sm font-semibold shrink-0 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 active:scale-[0.98]"
              style={{ backgroundColor: CSS.danger, color: "#fff" }}
            >
              {t("common.retry")}
            </button>
          </div>
        </Card>
      </CardShell>
    </Reveal>
  );
}

export function BookingsEmptyState({ t }: { t: (key: string) => string }) {
  return (
    <Reveal delay={2}>
      <CardShell className="p-1.5 rounded-[2.5rem]">
        <Card bodyClass="p-12 text-center border-0 shadow-none md:p-16" className="rounded-[calc(2.5rem-0.375rem)] border-0 bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <div
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-5 ring-1 ring-stone-950/[0.04] shadow-[0_20px_55px_-42px_rgba(68,64,60,0.8)]"
            style={{ backgroundColor: CSS.surfaceRaise }}
          >
            <Icon icon="heroicons:clipboard-document" className="size-7" style={{ color: CSS.textMuted }} />
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em]" style={{ color: CSS.textPrimary }}>
            {t("bookings.empty.title")}
          </h2>
          <p className="text-sm mt-2 max-w-sm mx-auto leading-6 text-pretty" style={{ color: CSS.textMuted }}>
            {t("bookings.empty.description")}
          </p>
        </Card>
      </CardShell>
    </Reveal>
  );
}

export function BookingsLoadingState() {
  return (
    <Reveal delay={1}>
      <CardShell className="p-1.5 rounded-[2.5rem]">
        <div className="rounded-[calc(2.5rem-0.375rem)] bg-white p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
          <div className="mb-5 flex items-center justify-between">
            <div className="h-3 w-32 animate-pulse rounded-full bg-stone-200" />
            <div className="h-8 w-24 animate-pulse rounded-full bg-stone-200" />
          </div>
          <div className="space-y-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="grid grid-cols-12 gap-4 rounded-2xl bg-stone-50 p-4">
                <div className="col-span-3 h-4 animate-pulse rounded-full bg-stone-200" />
                <div className="col-span-4 h-4 animate-pulse rounded-full bg-stone-200" />
                <div className="col-span-2 h-4 animate-pulse rounded-full bg-stone-200" />
                <div className="col-span-3 h-4 animate-pulse rounded-full bg-stone-200" />
              </div>
            ))}
          </div>
        </div>
      </CardShell>
    </Reveal>
  );
}

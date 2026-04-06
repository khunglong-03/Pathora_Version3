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
      <CardShell className="p-[1px]">
        <Card bodyClass="p-6 border-0 shadow-none" className="border-0 shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
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
              className="px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all duration-200 active:scale-[0.98]"
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
      <CardShell className="p-[1px]">
        <Card bodyClass="p-16 text-center border-0 shadow-none" className="border-0 shadow-none">
          <div
            className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: CSS.surfaceRaise }}
          >
            <Icon icon="heroicons:clipboard-document" className="size-7" style={{ color: CSS.textMuted }} />
          </div>
          <h2 className="text-lg font-semibold" style={{ color: CSS.textPrimary }}>
            {t("bookings.empty.title")}
          </h2>
          <p className="text-sm mt-1 max-w-xs mx-auto leading-relaxed" style={{ color: CSS.textMuted }}>
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
      <CardShell className="p-[1px]">
        <div className="h-32 animate-pulse rounded-2xl" style={{ backgroundColor: CSS.surfaceRaise }} />
      </CardShell>
    </Reveal>
  );
}

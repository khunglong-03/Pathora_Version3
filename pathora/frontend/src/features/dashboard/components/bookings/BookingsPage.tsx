"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { AdminSidebar, TopBar } from "../AdminSidebar";
import { useBookingsData } from "./BookingsPageHooks";
import { buildStatCards } from "./ui/BookingsStatCards";
import { BookingsTable } from "./ui/BookingsTable";
import { BookingsErrorState, BookingsEmptyState, BookingsLoadingState } from "./ui/BookingsStates";
import { Reveal, CardShell } from "./ui/BookingsShell";
import { CSS } from "./BookingsPageData";

export default function BookingsPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    isLoading,
    isError,
    isEmpty,
    canShowData,
    bookings,
    errorMessage,
    totalRevenue,
    confirmedCount,
    confirmedPercent,
    retryLoading,
  } = useBookingsData(t);

  const statCards = buildStatCards(
    t,
    isEmpty,
    bookings,
    confirmedCount,
    confirmedPercent,
    totalRevenue,
  );

  return (
    <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <main id="main-content" className="px-6 pb-16 max-w-[87.5rem] mx-auto w-full">

        {/* Page Header */}
        <Reveal delay={0}>
          <div className="pt-8 pb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="max-w-xl">
              <span
                className="inline-block text-[9px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3"
                style={{ color: CSS.accent, backgroundColor: `${CSS.accent}10`, border: `1px solid ${CSS.accent}18` }}
              >
                Booking Management
              </span>
              <h1 className="text-3xl font-bold tracking-tight leading-none" style={{ color: CSS.textPrimary, letterSpacing: "-0.03em" }}>
                {t("bookings.pageTitle", "Bookings")}
              </h1>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: CSS.textMuted }}>
                {t("bookings.pageSubtitle", "Track and manage all booking orders")}
              </p>
            </div>
            <Link
              href="/bookings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 group shrink-0"
              style={{ borderColor: CSS.border, color: CSS.textSecondary, backgroundColor: CSS.surface }}
            >
              <Icon icon="heroicons:arrow-top-right-on-square" className="size-4 transition-colors" style={{ color: CSS.textMuted }} />
              <span className="group-hover:text-amber-600 transition-colors">
                {t("bookings.openCustomerPage", "Customer view")}
              </span>
            </Link>
          </div>
        </Reveal>

        {/* Loading */}
        {isLoading && <BookingsLoadingState />}

        {/* Error */}
        {isError && (
          <BookingsErrorState message={errorMessage} onRetry={retryLoading} t={t} />
        )}

        {/* Data Content */}
        {canShowData && (
          <>
            {/* Stats — 3-col bento grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {statCards.map((stat) => (
                <div key={stat.label} className="h-full">
                  {/* Inline StatCard to avoid circular import */}
                  <Reveal delay={stat.delay}>
                    <div className="h-full">
                      <div
                        className="relative rounded-[1.5rem] p-[1px] h-full"
                        style={{
                          background: "linear-gradient(145deg, rgba(0,0,0,0.025) 0%, rgba(0,0,0,0.008) 100%)",
                          boxShadow: "0 20px 50px -12px rgba(0,0,0,0.055), 0 4px 12px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div className="absolute inset-0 rounded-[1.5rem] pointer-events-none" style={{ border: "1px solid rgba(0,0,0,0.04)" }} />
                        <div className="relative rounded-[1.25rem] h-full overflow-hidden p-7" style={{ backgroundColor: CSS.surface }}>
                          <div className="flex items-start justify-between mb-3">
                            <span
                              className="inline-block text-[9px] font-semibold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full mb-3"
                              style={{ color: stat.accent, backgroundColor: `${stat.accent}10`, border: `1px solid ${stat.accent}18` }}
                            >
                              {stat.label}
                            </span>
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: stat.accentMuted }}
                            >
                              <Icon icon={stat.icon} className="size-5" style={{ color: stat.accent }} />
                            </div>
                          </div>
                          <p className="text-[2rem] font-bold tracking-tight data-value leading-none" style={{ color: CSS.textPrimary, letterSpacing: "-0.03em" }}>
                            {stat.value}
                          </p>
                          {stat.subIndicator && <div className="mt-3">{stat.subIndicator}</div>}
                          {stat.liveIndicator && (
                            <div className="mt-3 flex items-center gap-1.5">
                              <span className="relative inline-flex shrink-0">
                                <span
                                  className="absolute inset-0 rounded-full animate-ping"
                                  style={{ backgroundColor: stat.accent, opacity: 0.4 }}
                                />
                                <span className="relative w-2 h-2 rounded-full block" style={{ backgroundColor: stat.accent }} />
                              </span>
                              <span className="text-xs" style={{ color: CSS.textMuted }}>Live data</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                </div>
              ))}
            </div>

            {/* Table or Empty */}
            {isEmpty ? (
              <BookingsEmptyState t={t} />
            ) : (
              <Reveal delay={2}>
                <CardShell className="p-[1px]">
                  <BookingsTable bookings={bookings} t={t} />
                </CardShell>
              </Reveal>
            )}
          </>
        )}
      </main>
    </AdminSidebar>
  );
}

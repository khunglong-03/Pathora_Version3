"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { useBookingsData } from "./BookingsPageHooks";
import { useBookingStatusListener } from "@/hooks/useBookingStatusListener";
import { buildStatCards } from "./ui/BookingsStatCards";
import { BookingsTable } from "./ui/BookingsTable";
import { BookingsErrorState, BookingsEmptyState, BookingsLoadingState } from "./ui/BookingsStates";
import { Reveal, CardShell } from "./ui/BookingsShell";
import { CSS } from "./BookingsPageData";

export default function BookingsPage() {
  const { t } = useTranslation();

  useBookingStatusListener();

  const {
    isLoading,
    isError,
    isEmpty,
    canShowData,
    bookings,
    totalCount,
    currentPage,
    totalPages,
    errorMessage,
    totalRevenue,
    confirmedCount,
    confirmedPercent,
    retryLoading,
    goToPreviousPage,
    goToNextPage,
  } = useBookingsData(t);

  const statCards = buildStatCards(
    t,
    isEmpty,
    bookings,
    totalCount,
    confirmedCount,
    confirmedPercent,
    totalRevenue
  );

  return (
    <>

      <main id="main-content" className="relative min-h-[100dvh] overflow-hidden bg-stone-100 px-4 py-10 text-stone-950 md:px-8 md:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_12%_14%,rgba(180,83,9,0.16),transparent_32%),radial-gradient(circle_at_86%_8%,rgba(68,64,60,0.12),transparent_30%),linear-gradient(180deg,#fff7ed_0%,#f5f5f4_64%,#f5f5f4_100%)]" />
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.28] [background-image:radial-gradient(rgba(68,64,60,0.18)_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
        <div className="mx-auto w-full max-w-[87.5rem]">

        {/* Page Header */}
        <Reveal delay={0}>
          <section className="grid gap-6 pb-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div className="max-w-3xl">
              <span
                className="mb-5 inline-flex rounded-full bg-white/75 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-stone-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.86)] ring-1 ring-stone-950/[0.06]"
              >
                {t("bookings.eyebrow", "Booking Management")}
              </span>
              <h1 className="max-w-[11ch] text-balance text-6xl font-semibold leading-[0.86] tracking-[-0.075em] text-stone-950 md:text-8xl">
                {t("bookings.pageTitle", "Bookings")}
              </h1>
              <p className="mt-6 max-w-[58ch] text-pretty text-base font-medium leading-7 text-stone-500 md:text-lg">
                {t("bookings.pageSubtitle", "Track and manage all booking orders")}
              </p>
            </div>
            <aside className="rounded-[2rem] bg-stone-950/95 p-1.5 text-white shadow-[0_34px_90px_-52px_rgba(68,64,60,0.7)]">
              <div className="rounded-[calc(2rem-0.375rem)] border border-white/10 bg-[radial-gradient(circle_at_16%_12%,rgba(251,191,36,0.18),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.02))] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-300">
                    {t("bookings.liveData", "Live data")}
                  </span>
                  <span className="flex size-9 items-center justify-center rounded-2xl bg-white/10 text-amber-200 ring-1 ring-white/10">
                    <Icon icon="heroicons:signal" className="size-4" />
                  </span>
                </div>
                <p className="mt-5 text-4xl font-semibold leading-none tracking-[-0.06em] tabular-nums">
                  {totalCount}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-300">
                  {t("bookings.stat.totalBookings", "Total bookings")}
                </p>
                <Link
                  href="/bookings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-6 inline-flex w-full items-center justify-between rounded-full bg-white py-2 pl-5 pr-2 text-sm font-semibold text-stone-950 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 active:scale-[0.98]"
                >
                  <span>{t("bookings.openCustomerPage", "Customer view")}</span>
                  <span className="flex size-8 items-center justify-center rounded-full bg-stone-950 text-white transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                    <Icon icon="heroicons:arrow-top-right-on-square" className="size-4" />
                  </span>
                </Link>
              </div>
            </aside>
          </section>
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
            <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12">
              {statCards.map((stat) => (
                <div key={stat.label} className={`h-full ${stat.delay === 2 ? "lg:col-span-6" : "lg:col-span-3"}`}>
                  {/* Inline StatCard to avoid circular import */}
                  <Reveal delay={stat.delay}>
                    <article className="group h-full">
                      <div
                        className="relative h-full rounded-[2rem] bg-white/60 p-1.5 ring-1 ring-stone-950/[0.045] shadow-[0_28px_80px_-48px_rgba(68,64,60,0.62)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-1"
                      >
                        <div className="relative h-full overflow-hidden rounded-[calc(2rem-0.375rem)] bg-white p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.92)]">
                          <div className="pointer-events-none absolute -right-14 -top-14 size-32 rounded-full opacity-20 blur-2xl" style={{ backgroundColor: stat.accent }} />
                          <div className="relative flex items-start justify-between mb-5">
                            <span
                              className="inline-block rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em]"
                              style={{ color: stat.accent, backgroundColor: `${stat.accent}10`, border: `1px solid ${stat.accent}18` }}
                            >
                              {stat.label}
                            </span>
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-black/[0.035] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px]"
                              style={{ backgroundColor: stat.accentMuted }}
                            >
                              <Icon icon={stat.icon} className="size-5" style={{ color: stat.accent }} />
                            </div>
                          </div>
                          <p className="relative text-[2.35rem] font-semibold tracking-[-0.055em] data-value leading-none tabular-nums" style={{ color: CSS.textPrimary }}>
                            {stat.value}
                          </p>
                          {stat.subIndicator && <div className="mt-3">{stat.subIndicator}</div>}
                          {stat.liveIndicator && (
                            <div className="mt-4 flex items-center gap-1.5">
                              <span className="relative inline-flex shrink-0">
                                <span
                                  className="absolute inset-0 rounded-full animate-ping"
                                  style={{ backgroundColor: stat.accent, opacity: 0.4 }}
                                />
                                <span className="relative w-2 h-2 rounded-full block" style={{ backgroundColor: stat.accent }} />
                              </span>
                              <span className="text-xs" style={{ color: CSS.textMuted }}>{t("bookings.liveData", "Live data")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  </Reveal>
                </div>
              ))}
            </section>

            {/* Table or Empty */}
            {isEmpty ? (
              <BookingsEmptyState t={t} />
            ) : (
              <Reveal delay={2}>
                <CardShell className="p-[1px]">
                  <BookingsTable
                    bookings={bookings}
                    t={t}
                    totalCount={totalCount}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPreviousPage={goToPreviousPage}
                    onNextPage={goToNextPage}
                  />
                </CardShell>
              </Reveal>
            )}
          </>
        )}
        </div>
      </main>
    </>
  );
}

"use client";
import React, { useState, useMemo } from "react";
import Button from "@/components/ui/Button";
import { Icon } from "@/components/ui";


import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { SOCIAL_MEDIA } from "@/configs/urls";
import { SAMPLE_BOOKINGS, FilterKey } from "./BookingHistoryData";
import {
  formatCurrency,
  getStatusLabel,
  getTierLabel,
  getPaymentStatusLabel,
  getPaymentMethodLabel,
  getActiveBookingsCount,
} from "./BookingHistoryHelpers";
import { BookingHistoryHero } from "./BookingHistoryHero";
import { BookingSearchFilter } from "./BookingSearchFilter";
import { BookingCard } from "./BookingCard";

/* ══════════════════════════════════════════════════════════════
   ██  BookingHistoryPage
   ══════════════════════════════════════════════════════════════ */
export function BookingHistoryPage() {
  const { t } = useTranslation();

  /* ── State ──────────────────────────────────────────── */
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

  /* ── Filter definitions ──────────────────────────────── */
  const filters: { key: FilterKey; label: string }[] = [
    { key: "all", label: t("landing.bookings.filterAll") },
    { key: "confirmed", label: t("landing.bookings.statusConfirmed") },
    { key: "pending", label: t("landing.bookings.statusPending") },
    {
      key: "pending_approval",
      label: t("landing.bookings.statusPendingApproval"),
    },
    { key: "approved", label: t("landing.bookings.statusApproved") },
    { key: "completed", label: t("landing.bookings.statusCompleted") },
    { key: "cancelled", label: t("landing.bookings.statusCancelled") },
    { key: "rejected", label: t("landing.bookings.statusRejected") },
  ];

  /* ── Filtered bookings ───────────────────────────────── */
  const filtered = useMemo(() => {
    let list = SAMPLE_BOOKINGS;
    if (activeFilter !== "all") {
      list = list.filter((b) => b.status === activeFilter);
    }
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.tourName.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeFilter, debouncedSearchQuery]);

  /* ── Stat counts ─────────────────────────────────────── */
  const totalCount = SAMPLE_BOOKINGS.length;
  const activeCount = getActiveBookingsCount(SAMPLE_BOOKINGS);

  /* ── Label helpers ───────────────────────────────────── */
  const getStatusLabel_ = (s: Parameters<typeof getStatusLabel>[1]) =>
    getStatusLabel((key) => key, s);
  const getTierLabel_ = (tier: Parameters<typeof getTierLabel>[1]) =>
    getTierLabel((key) => key, tier);
  const getPaymentStatusLabel_ = (s: Parameters<typeof getPaymentStatusLabel>[1]) =>
    getPaymentStatusLabel((key) => key, s);
  const getPaymentMethodLabel_ = (m: Parameters<typeof getPaymentMethodLabel>[1]) =>
    getPaymentMethodLabel((key) => key, m);

  return (
    <>
      

      <main className="bg-gray-50 min-h-screen">
        <BookingHistoryHero
          totalCount={totalCount}
          activeCount={activeCount}
          backLabel={t("landing.bookings.backToHome")}
          titleLabel={t("landing.bookings.title")}
          subtitleLabel={t("landing.bookings.subtitle")}
          totalBookingsLabel={t("landing.bookings.totalBookings")}
          activeLabel={t("landing.bookings.active")}
        />

        <div className="max-w-330 mx-auto px-4 md:px-6 py-8">
          <BookingSearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            filters={filters}
            searchPlaceholder={t("landing.bookings.searchPlaceholder")}
            filterLabel={t("landing.bookings.filter")}
          />

          {/* Booking Cards */}
          <div className="flex flex-col gap-6">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
                <Icon
                  icon="heroicons:ticket"
                  className="size-12 text-gray-200 mx-auto mb-3"
                />
                <p className="text-sm text-gray-400">
                  {t("landing.bookings.noResults")}
                </p>
              </div>
            ) : (
              filtered.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  statusLabel={getStatusLabel_(booking.status)}
                  tierLabel={getTierLabel_(booking.tier)}
                  paymentStatusLabel={getPaymentStatusLabel_(
                    booking.paymentStatus,
                  )}
                  paymentMethodLabel={getPaymentMethodLabel_(
                    booking.paymentMethod,
                  )}
                  formatCurrency={formatCurrency}
                  t={t}
                />
              ))
            )}
          </div>
        </div>
      </main>

      

      {/* Floating Social Buttons */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col gap-3">
        <a
          href={SOCIAL_MEDIA.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="size-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Icon icon="mdi:facebook" className="size-5 text-blue-600" />
        </a>
        <Button
          type="button"
          aria-label="Chat with us"
          className="size-11 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <Icon
            icon="heroicons:chat-bubble-oval-left-ellipsis"
            className="size-5 text-gray-600"
          />
        </Button>
      </div>
    </>
  );
}

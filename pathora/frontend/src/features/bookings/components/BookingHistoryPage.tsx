"use client";
import React, { useState, useMemo } from "react";
import { FacebookLogo, ChatTeardropDots, Ticket } from "@phosphor-icons/react";
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
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function BookingHistoryPage() {
  const { t } = useTranslation();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 250);

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

  const totalCount = SAMPLE_BOOKINGS.length;
  const activeCount = getActiveBookingsCount(SAMPLE_BOOKINGS);

  const getStatusLabel_ = (s: Parameters<typeof getStatusLabel>[1]) => getStatusLabel(t, s);
  const getTierLabel_ = (tier: Parameters<typeof getTierLabel>[1]) => getTierLabel(t, tier);
  const getPaymentStatusLabel_ = (s: Parameters<typeof getPaymentStatusLabel>[1]) => getPaymentStatusLabel(t, s);
  const getPaymentMethodLabel_ = (m: Parameters<typeof getPaymentMethodLabel>[1]) => getPaymentMethodLabel(t, m);

  return (
    <>
      <main className="bg-[#f9fafb] min-h-[100dvh]">
        <BookingHistoryHero
          totalCount={totalCount}
          activeCount={activeCount}
          backLabel={t("landing.bookings.backToHome")}
          titleLabel={t("landing.bookings.title")}
          subtitleLabel={t("landing.bookings.subtitle")}
          totalBookingsLabel={t("landing.bookings.totalBookings")}
          activeLabel={t("landing.bookings.active")}
        />

        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-24">
          <BookingSearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            filters={filters}
            searchPlaceholder={t("landing.bookings.searchPlaceholder")}
            filterLabel={t("landing.bookings.filter")}
          />

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] py-24 text-center flex flex-col items-center justify-center"
                >
                  <div className="size-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                    <Ticket weight="bold" className="size-8 text-slate-300" />
                  </div>
                  <p className="text-xl font-bold tracking-tight text-slate-900 mb-2">
                    {t("landing.bookings.noResults")}
                  </p>
                  <p className="text-sm text-slate-500 max-w-sm">
                    We couldn't find any bookings matching your current filter or search criteria.
                  </p>
                </motion.div>
              ) : (
                filtered.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    statusLabel={getStatusLabel_(booking.status)}
                    tierLabel={getTierLabel_(booking.tier)}
                    paymentStatusLabel={getPaymentStatusLabel_(booking.paymentStatus)}
                    paymentMethodLabel={getPaymentMethodLabel_(booking.paymentMethod)}
                    formatCurrency={formatCurrency}
                    t={t}
                  />
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>

      <div className="fixed right-6 bottom-6 z-50 hidden md:flex flex-col gap-4">
        <a
          href={SOCIAL_MEDIA.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="size-14 rounded-full bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <FacebookLogo weight="fill" className="size-6 text-blue-600" />
        </a>
        <button
          type="button"
          aria-label="Chat with us"
          className="size-14 rounded-full bg-slate-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] border border-slate-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        >
          <ChatTeardropDots weight="fill" className="size-6 text-white" />
        </button>
      </div>
    </>
  );
}

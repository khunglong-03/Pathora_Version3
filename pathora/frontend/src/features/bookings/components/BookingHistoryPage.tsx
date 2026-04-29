"use client";
import React, { useState, useMemo } from "react";
import { FacebookLogo, ChatTeardropDots, Ticket } from "@phosphor-icons/react";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslation } from "react-i18next";
import { SOCIAL_MEDIA } from "@/configs/urls";
import { FilterKey } from "./BookingHistoryData";
import { useBookings } from "../hooks/useBookings";
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

  const { bookings, totalCount, isLoading, isError } = useBookings(activeFilter, 1, 50); // Fetch first 50 bookings for now

  const filtered = useMemo(() => {
    let list = bookings;
    if (debouncedSearchQuery.trim()) {
      const q = debouncedSearchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.tourName.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q),
      );
    }
    return list;
  }, [bookings, debouncedSearchQuery]);

  const activeCount = getActiveBookingsCount(bookings);

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
              {isLoading ? (
                // Loading Skeleton
                [1, 2].map((i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-sm overflow-hidden"
                  >
                    <div className="flex flex-col p-4 lg:p-6 gap-6">
                      <div className="w-full h-56 sm:h-64 rounded-[1.5rem] bg-slate-100 animate-pulse" />
                      <div className="flex-1 flex flex-col justify-between py-2">
                        <div className="flex justify-between gap-4 mb-6">
                          <div className="space-y-3 w-full">
                            <div className="h-8 bg-slate-100 rounded-lg w-3/4 animate-pulse" />
                            <div className="h-5 bg-slate-100 rounded-md w-1/4 animate-pulse" />
                          </div>
                          <div className="h-16 bg-slate-50 rounded-2xl w-32 shrink-0 animate-pulse" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          {[1, 2, 3, 4].map(j => (
                            <div key={j} className="flex gap-3">
                              <div className="size-8 rounded-lg bg-slate-100 animate-pulse shrink-0" />
                              <div className="space-y-2 w-full">
                                <div className="h-3 bg-slate-100 rounded w-12 animate-pulse" />
                                <div className="h-4 bg-slate-100 rounded w-24 animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-end pt-6 border-t border-slate-100">
                          <div className="space-y-2">
                            <div className="h-3 bg-slate-100 rounded w-16 animate-pulse" />
                            <div className="h-8 bg-slate-100 rounded w-32 animate-pulse" />
                          </div>
                          <div className="h-10 bg-slate-100 rounded-xl w-10 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : filtered.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] py-24 text-center flex flex-col items-center justify-center col-span-1 xl:col-span-2"
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

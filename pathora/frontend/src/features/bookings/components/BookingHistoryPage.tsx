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
import { cn } from "@/lib/cn";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function BookingHistoryPage() {
  const { t } = useTranslation();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

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


  if (!mounted) return null;

  return (
    <>
      <main className={cn("v-stack min-h-[100dvh] bg-slate-50")}>
        <BookingHistoryHero
          totalCount={totalCount}
          activeCount={activeCount}
          backLabel={t("landing.bookings.backToHome")}
          titleLabel={t("landing.bookings.title")}
          subtitleLabel={t("landing.bookings.subtitle")}
          totalBookingsLabel={t("landing.bookings.totalBookings")}
          activeLabel={t("landing.bookings.active")}
        />

        <div className={cn("mx-auto w-full max-w-[1400px] px-4 pb-24 md:px-8")}>
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
            className={cn("grid grid-cols-1 gap-8 xl:grid-cols-2")}
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
                    className={cn("overflow-hidden rounded-[2.5rem] border border-slate-200/50 bg-white shadow-sm")}
                  >
                    <div className={cn("v-stack gap-6 p-4 lg:p-6")}>
                      <div className={cn("h-56 w-full animate-pulse rounded-[1.5rem] bg-slate-100 sm:h-64")} />
                      <div className={cn("v-stack spacer justify-between py-2")}>
                        <div className={cn("h-stack mb-6 justify-between gap-4")}>
                          <div className={cn("v-stack w-full gap-3")}>
                            <div className="h-8 bg-slate-100 rounded-lg w-3/4 animate-pulse" />
                            <div className="h-5 bg-slate-100 rounded-md w-1/4 animate-pulse" />
                          </div>
                          <div className="h-16 bg-slate-50 rounded-2xl w-32 shrink-0 animate-pulse" />
                        </div>
                        <div className={cn("mb-8 grid grid-cols-2 gap-4")}>
                          {[1, 2, 3, 4].map(j => (
                            <div key={j} className={cn("h-stack gap-3")}>
                              <div className={cn("size-8 shrink-0 animate-pulse rounded-lg bg-slate-100")} />
                              <div className={cn("v-stack w-full gap-2")}>
                                <div className="h-3 bg-slate-100 rounded w-12 animate-pulse" />
                                <div className="h-4 bg-slate-100 rounded w-24 animate-pulse" />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className={cn("h-stack items-end justify-between border-t border-slate-100 pt-6")}>
                          <div className={cn("v-stack gap-2")}>
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
                  className={cn("center col-span-1 flex-col rounded-[2.5rem] border border-slate-200/50 bg-white py-24 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] xl:col-span-2")}
                >
                  <div className={cn("center mb-6 size-20 rounded-full border border-slate-100 bg-slate-50")}>
                    <Ticket weight="bold" className={cn("size-8 text-slate-300")} />
                  </div>
                  <p suppressHydrationWarning className={cn("mb-2 text-xl font-bold tracking-tight text-slate-900")}>
                    {t("landing.bookings.noResults")}
                  </p>
                  <p className={cn("max-w-sm text-sm text-slate-500")}>
                    We couldn&apos;t find any bookings matching your current filter or search criteria.
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

      <div className={cn("v-stack fixed right-6 bottom-6 z-50 hidden gap-4 md:flex")}>
        <a
          href={SOCIAL_MEDIA.facebook}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className={cn("center size-14 rounded-full border border-slate-100 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] transition-transform hover:scale-110 active:scale-95")}
        >
          <FacebookLogo weight="fill" className={cn("size-6 text-blue-600")} />
        </a>
        <button
          type="button"
          aria-label="Chat with us"
          className={cn("center size-14 rounded-full border border-slate-800 bg-slate-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.2)] transition-transform hover:scale-110 active:scale-95")}
        >
          <ChatTeardropDots weight="fill" className={cn("size-6 text-white")} />
        </button>
      </div>
    </>
  );
}

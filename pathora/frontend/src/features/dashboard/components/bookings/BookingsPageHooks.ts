import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import type { AdminBooking } from "@/api/services/adminService";
import { adminService } from "@/api/services/adminService";
import type { BookingsDataState } from "./BookingsPageData";

export function useBookingsData(t: TFunction) {
  const [dataState, setDataState] = useState<BookingsDataState>("loading");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    let active = true;

    const loadBookings = async () => {
      setDataState("loading");
      setErrorMessage(null);
      try {
        const result = await adminService.getBookingsPage({ page: currentPage, pageSize });
        if (!active) return;
        setTotalCount(result.totalCount);
        if (!result.items || result.items.length === 0) {
          setBookings([]);
          setDataState("empty");
        } else {
          setBookings(result.items);
          setDataState("ready");
        }
      } catch (err) {
        if (!active) return;
        setBookings([]);
        setTotalCount(0);
        setDataState("error");
        setErrorMessage(
          err instanceof Error ? err.message : t("bookings.error.loadFailed"),
        );
      }
    };

    void loadBookings();
    return () => { active = false; };
  }, [currentPage, pageSize, reloadToken, t]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const totalRevenue = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.totalAmount ?? b.amount ?? 0), 0),
    [bookings],
  );

  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === "confirmed").length,
    [bookings],
  );

  const retryLoading = () => setReloadToken((v) => v + 1);

  const confirmedPercent = bookings.length > 0 ? Math.round((confirmedCount / bookings.length) * 100) : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const goToPreviousPage = () => setCurrentPage((page) => Math.max(1, page - 1));
  const goToNextPage = () => setCurrentPage((page) => Math.min(totalPages, page + 1));

  return {
    dataState,
    bookings,
    totalCount,
    currentPage,
    pageSize,
    totalPages,
    errorMessage,
    isLoading,
    isError,
    isEmpty,
    canShowData,
    totalRevenue,
    confirmedCount,
    confirmedPercent,
    retryLoading,
    goToPreviousPage,
    goToNextPage,
  };
}

import { useEffect, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import type { AdminBooking } from "@/api/services/adminService";
import { adminService } from "@/api/services/adminService";
import type { BookingsDataState } from "./BookingsPageData";

export function useBookingsData(t: TFunction) {
  const [dataState, setDataState] = useState<BookingsDataState>("loading");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    const loadBookings = async () => {
      setDataState("loading");
      setErrorMessage(null);
      try {
        const result = await adminService.getBookings();
        if (!active) return;
        if (!result || result.length === 0) {
          setBookings([]);
          setDataState("empty");
        } else {
          setBookings(result);
          setDataState("ready");
        }
      } catch (err) {
        if (!active) return;
        setBookings([]);
        setDataState("error");
        setErrorMessage(
          err instanceof Error ? err.message : t("bookings.error.loadFailed"),
        );
      }
    };

    void loadBookings();
    return () => { active = false; };
  }, [reloadToken, t]);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  const totalRevenue = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.amount ?? 0), 0),
    [bookings],
  );

  const confirmedCount = useMemo(
    () => bookings.filter((b) => b.status === "confirmed").length,
    [bookings],
  );

  const retryLoading = () => setReloadToken((v) => v + 1);

  const confirmedPercent = bookings.length > 0 ? Math.round((confirmedCount / bookings.length) * 100) : 0;

  return {
    dataState,
    bookings,
    errorMessage,
    isLoading,
    isError,
    isEmpty,
    canShowData,
    totalRevenue,
    confirmedCount,
    confirmedPercent,
    retryLoading,
  };
}

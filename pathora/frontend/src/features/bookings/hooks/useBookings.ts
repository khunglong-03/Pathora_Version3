import { useState, useMemo } from "react";
import { useGetMyBookingsQuery } from "@/store/api/bookingApi";
import { Booking, BookingStatus, FilterKey, PaymentMethod, PaymentStatus, TourTier } from "../components/BookingHistoryData";
import { format } from "date-fns";

export function useBookings(statusFilter: FilterKey, page: number = 1, pageSize: number = 10) {
  const queryStatus = statusFilter === "all" ? undefined : statusFilter;
  
  const { data, isLoading, isError, isFetching } = useGetMyBookingsQuery({
    page,
    pageSize,
    status: queryStatus,
  });

  const bookings: Booking[] = useMemo(() => {
    if (!data?.items) return [];

    const now = new Date();

    return data.items
      .filter((b) => {
        const paymentStatus = b.paymentStatus?.toLowerCase() || "unpaid";
        const bookingStatus = b.status?.toLowerCase() || "pending";
        const isPaid = paymentStatus === "paid" || bookingStatus === "completed";

        const targetDateStr = b.endDate || b.startDate;
        if (!targetDateStr || targetDateStr.startsWith("0001-01-01")) return true;

        const hasTimePassed = new Date(targetDateStr) < now;

        if (isPaid && hasTimePassed) {
          return false;
        }
        return true;
      })
      .map((b) => ({
      id: b.id,
      tourName: b.tourName || "Unknown Tour",
      reference: b.reference || "N/A",
      // Mapping from backend DTO to frontend types
      tier: "standard" as TourTier, // Backend doesn't explicitly send tier yet, default to standard
      status: (b.tourStatus === "PendingCustomerApproval" ? "pending_approval" : (b.status?.toLowerCase() || "pending")) as BookingStatus,
      paymentStatus: (b.paymentStatus?.toLowerCase() || "unpaid") as PaymentStatus,
      paymentMethod: "bank_transfer" as PaymentMethod, // We can enhance this later if needed
      location: b.location || "Multiple locations",
      duration: b.startDate && b.endDate 
        ? `${Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)))} Days`
        : "N/A",
      departure: b.startDate ? format(new Date(b.startDate), "MMM d, yyyy") : "TBD",
      guests: (b.adults || 0) + (b.children || 0) + (b.infants || 0),
      totalAmount: b.totalAmount || b.totalPrice || 0,
      remainingAmount: ((b.totalAmount ?? b.totalPrice ?? 0) - (b.paidAmount || 0)) > 0
        ? (b.totalAmount ?? b.totalPrice ?? 0) - (b.paidAmount || 0)
        : undefined,
      image: b.thumbnailUrl || "/assets/images/tours/bali.png", // fallback image
      adults: b.adults || 0,
      children: b.children || 0,
      infants: b.infants || 0,
    }));
  }, [data]);

  return {
    bookings,
    totalCount: data?.totalCount || 0, // Handle different pagination envelope keys
    isLoading: isLoading || isFetching,
    isError,
  };
}

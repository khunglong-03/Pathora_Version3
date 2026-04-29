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

    return data.items.map((b) => ({
      id: b.id,
      tourName: b.tourName || "Unknown Tour",
      reference: b.reference || "N/A",
      // Mapping from backend DTO to frontend types
      tier: "standard" as TourTier, // Backend doesn't explicitly send tier yet, default to standard
      status: (b.status?.toLowerCase() || "pending") as BookingStatus,
      paymentStatus: (b.paymentStatus?.toLowerCase() || "unpaid") as PaymentStatus,
      paymentMethod: "bank_transfer" as PaymentMethod, // We can enhance this later if needed
      location: b.location || "Multiple locations",
      duration: b.startDate && b.endDate 
        ? `${Math.max(1, Math.ceil((new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) / (1000 * 60 * 60 * 24)))} Days`
        : "N/A",
      departure: b.startDate ? format(new Date(b.startDate), "MMM d, yyyy") : "TBD",
      guests: (b.adults || 0) + (b.children || 0) + (b.infants || 0),
      totalAmount: b.totalPrice || 0,
      remainingAmount: (b.totalPrice || 0) - (b.paidAmount || 0) > 0 ? (b.totalPrice || 0) - (b.paidAmount || 0) : undefined,
      image: b.thumbnailUrl || "/assets/images/tours/bali.png", // fallback image
    }));
  }, [data]);

  return {
    bookings,
    totalCount: data?.totalCount || 0, // Handle different pagination envelope keys
    isLoading: isLoading || isFetching,
    isError,
  };
}

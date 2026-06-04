import { useMemo } from "react";
import { useGetMyBookingsQuery } from "@/store/api/bookingApi";
import { Booking, BookingStatus, FilterKey, PaymentMethod, PaymentStatus, TourTier } from "../components/BookingHistoryData";
import { format } from "date-fns";

/**
 * Map backend BookingStatus enum string → frontend BookingStatus.
 * Backend trả PascalCase (e.g. "Pending", "Confirmed"), frontend dùng lowercase.
 * Trường hợp đặc biệt: TourInstanceStatus "PendingCustomerApproval" → "pending_approval".
 */
function mapStatus(status: string, tourStatus: string): BookingStatus {
  // TourInstanceStatus override takes precedence
  if (tourStatus === "PendingCustomerApproval") {
    return "pending_approval";
  }

  switch (status.toLowerCase()) {
    case "confirmed":       return "confirmed";
    case "completed":       return "completed";
    case "cancelled":       return "cancelled";
    case "rejected":        return "rejected";
    case "approved":        return "approved";
    case "paid":            return "paid";
    case "deposited":       return "deposited";
    case "pending":
    default:                return "pending";
  }
}

function mapPaymentStatus(paymentStatus: string): PaymentStatus {
  switch (paymentStatus.toLowerCase()) {
    case "paid":    return "paid";
    case "partial": return "partial";
    default:        return "unpaid";
  }
}

function safeDuration(startDate: string, endDate: string): string {
  // Backend trả DateTimeOffset.MinValue dưới dạng "0001-01-01T..."
  if (
    !startDate || startDate.startsWith("0001-01-01") ||
    !endDate   || endDate.startsWith("0001-01-01")
  ) {
    return "N/A";
  }
  const days = Math.max(
    1,
    Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );
  return `${days} Days`;
}

function safeDeparture(startDate: string): string {
  if (!startDate || startDate.startsWith("0001-01-01")) return "TBD";
  try {
    return format(new Date(startDate), "MMM d, yyyy");
  } catch {
    return "TBD";
  }
}

export function useBookings(statusFilter: FilterKey, page: number = 1, pageSize: number = 10) {
  // "all" → không gửi status param lên server
  const queryStatus = statusFilter === "all" ? undefined : statusFilter;

  const { data, isLoading, isError, isFetching } = useGetMyBookingsQuery({
    page,
    pageSize,
    status: queryStatus,
  });

  const bookings: Booking[] = useMemo(() => {
    if (!data?.items) return [];

    return data.items.map((b) => {
      const mappedStatus = mapStatus(b.status ?? "", b.tourStatus ?? "");

      // Ưu tiên totalAmount (từ breakdown tính thuế), fallback về totalPrice
      const total = b.totalAmount ?? b.totalPrice ?? 0;
      const paid  = b.paidAmount ?? 0;
      const remaining = b.remainingBalance ?? (total - paid > 0 ? total - paid : undefined);

      return {
        id: b.id,
        tourName: b.tourName || "Unknown Tour",
        reference: b.reference || "N/A",
        tourStatus: b.tourStatus,
        tier: "standard" as TourTier,
        status: mappedStatus,
        paymentStatus: mapPaymentStatus(b.paymentStatus ?? ""),
        paymentMethod: "bank_transfer" as PaymentMethod,
        location: b.location || "Multiple locations",
        duration: safeDuration(b.startDate, b.endDate),
        departure: safeDeparture(b.startDate),
        guests: (b.adults ?? 0) + (b.children ?? 0) + (b.infants ?? 0),
        totalAmount: total,
        remainingAmount: remaining && remaining > 0 ? remaining : undefined,
        image: b.thumbnailUrl ?? "/assets/images/tours/bali.png",
        adults: b.adults ?? 0,
        children: b.children ?? 0,
        infants: b.infants ?? 0,
      } satisfies Booking;
    });
  }, [data]);

  return {
    bookings,
    totalCount: data?.totalCount ?? 0,
    isLoading: isLoading || isFetching,
    isError,
  };
}

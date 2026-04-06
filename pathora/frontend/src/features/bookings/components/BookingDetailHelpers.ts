import {
  BookingStatus,
  TourTier,
  PaymentStatus,
  PaymentMethod,
  BookingDetail,
} from "./BookingDetailData";

export const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

export const getStatusLabel = (t: (key: string) => string, s: BookingStatus) => {
  const map: Record<BookingStatus, string> = {
    confirmed: t("landing.bookingDetail.statusConfirmed"),
    completed: t("landing.bookingDetail.statusCompleted"),
    pending: t("landing.bookingDetail.statusPending"),
    pending_approval: t("landing.bookingDetail.statusPendingApproval"),
    approved: t("landing.bookingDetail.statusApproved"),
    cancelled: t("landing.bookingDetail.statusCancelled"),
    rejected: t("landing.bookingDetail.statusRejected"),
  };
  return map[s];
};

export const getPaymentStatusLabel = (t: (key: string) => string, s: PaymentStatus) => {
  const map: Record<PaymentStatus, string> = {
    paid: t("landing.bookingDetail.paymentPaid"),
    partial: t("landing.bookingDetail.paymentPartiallyPaid"),
    unpaid: t("landing.bookingDetail.paymentUnpaid"),
  };
  return map[s];
};

export const getPaymentMethodLabel = (t: (key: string) => string, m: PaymentMethod) => {
  const map: Record<PaymentMethod, string> = {
    qr_code: t("landing.bookingDetail.methodQRCode"),
    cash: t("landing.bookingDetail.methodCash"),
    bank_transfer: t("landing.bookingDetail.methodBankTransfer"),
  };
  return map[m];
};

export const getTierLabel = (t: (key: string) => string, tier: TourTier) => {
  const map: Record<TourTier, string> = {
    standard: t("landing.bookingDetail.tierStandard"),
    luxury: t("landing.bookingDetail.tierLuxury"),
    premium: t("landing.bookingDetail.tierPremium"),
  };
  return map[tier];
};

export const getBookingDerivedState = (booking: BookingDetail) => ({
  totalGuests: booking.adults + booking.children,
  showPayRemaining: booking.paymentStatus === "partial",
  showVisaStatus:
    booking.status !== "completed" &&
    booking.status !== "cancelled" &&
    booking.status !== "rejected",
  showCancelBooking:
    booking.status !== "completed" &&
    booking.status !== "cancelled" &&
    booking.status !== "rejected",
});

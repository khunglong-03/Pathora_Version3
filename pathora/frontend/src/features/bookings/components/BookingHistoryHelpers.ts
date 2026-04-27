import {
  BookingStatus,
  TourTier,
  PaymentStatus,
  PaymentMethod,
} from "./BookingHistoryData";

export const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')} VND`;

export const getStatusLabel = (t: (key: string) => string, s: BookingStatus) => {
  const map: Record<BookingStatus, string> = {
    confirmed: t("landing.bookings.statusConfirmed"),
    completed: t("landing.bookings.statusCompleted"),
    pending: t("landing.bookings.statusPending"),
    pending_approval: t("landing.bookings.statusPendingApproval"),
    approved: t("landing.bookings.statusApproved"),
    cancelled: t("landing.bookings.statusCancelled"),
    rejected: t("landing.bookings.statusRejected"),
  };
  return map[s];
};

export const getTierLabel = (t: (key: string) => string, tier: TourTier) => {
  const map: Record<TourTier, string> = {
    standard: t("landing.bookings.tierStandard"),
    luxury: t("landing.bookings.tierLuxury"),
    premium: t("landing.bookings.tierPremium"),
  };
  return map[tier];
};

export const getPaymentStatusLabel = (t: (key: string) => string, s: PaymentStatus) => {
  const map: Record<PaymentStatus, string> = {
    paid: t("landing.bookings.paymentPaid"),
    partial: t("landing.bookings.paymentPartial"),
    unpaid: t("landing.bookings.paymentUnpaid"),
  };
  return map[s];
};

export const getPaymentMethodLabel = (t: (key: string) => string, m: PaymentMethod) => {
  const map: Record<PaymentMethod, string> = {
    qr_code: t("landing.bookings.methodQRCode"),
    cash: t("landing.bookings.methodCash"),
    bank_transfer: t("landing.bookings.methodBankTransfer"),
  };
  return map[m];
};

export const getActiveBookingsCount = (bookings: { status: BookingStatus }[]) =>
  bookings.filter(
    (b) =>
      b.status === "confirmed" ||
      b.status === "pending" ||
      b.status === "pending_approval" ||
      b.status === "approved",
  ).length;

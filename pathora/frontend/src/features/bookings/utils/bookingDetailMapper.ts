import type { BookingPendingTransaction, BookingDetailResponse } from "@/types/booking";
import type { BookingDetail, PaymentMethod, PaymentStatus } from "../components/BookingDetailData";

function normalizePaymentMethod(raw: string | undefined): PaymentMethod {
  const key = (raw ?? "").toLowerCase().replace(/[_\s-]/g, "");
  if (key === "banktransfer" || key === "sepay" || key === "payos") return "bank_transfer";
  if (key === "cash") return "cash";
  if (key === "card" || key === "momo" || key === "vnpay") return "qr_code";
  return "bank_transfer";
}

function normalizePaymentStatus(raw: string | undefined): PaymentStatus {
  const key = (raw ?? "").toLowerCase();
  if (key === "paid") return "paid";
  if (key === "partial" || key === "deposited") return "partial";
  return "unpaid";
}

function normalizeBookingStatus(raw: string | undefined, tourStatus?: string): BookingDetail["status"] {
  let status = (raw ?? "pending").toLowerCase();
  if (status === "pendingapproval") status = "pending_approval";
  if (status === "pendingcancellation") status = "pending_cancellation";

  if (tourStatus === "PendingCustomerApproval") return "pending_approval";
  return status as BookingDetail["status"];
}

function formatDate(value: unknown): string {
  if (!value) return "";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString("vi-VN");
}

/** Maps customer GET /api/public/bookings/{id} payload to UI BookingDetail shape. */
export function mapBookingDetailResponse(raw: BookingDetailResponse | Record<string, unknown>): BookingDetail {
  const r = raw as Record<string, unknown>;
  const tourStatus = r.tourStatus != null ? String(r.tourStatus) : undefined;

  const pendingTransactions = Array.isArray(r.pendingTransactions)
    ? (r.pendingTransactions as BookingPendingTransaction[])
    : [];

  return {
    id: String(r.id ?? r.bookingId ?? ""),
    tourName: String(r.tourName ?? ""),
    reference: String(r.reference ?? ""),
    tier: "standard",
    status: normalizeBookingStatus(r.status != null ? String(r.status) : undefined, tourStatus),
    paymentStatus: normalizePaymentStatus(r.paymentStatus != null ? String(r.paymentStatus) : undefined),
    paymentMethod: normalizePaymentMethod(r.paymentMethod != null ? String(r.paymentMethod) : undefined),
    location: String(r.location ?? ""),
    duration: String(r.duration ?? ""),
    bookingDate: formatDate(r.bookingDate),
    departureDate: formatDate(r.departureDate),
    returnDate: formatDate(r.returnDate),
    adults: Number(r.adults ?? r.numberAdult ?? 0),
    children: Number(r.children ?? r.numberChild ?? 0),
    infants: Number(r.infants ?? r.numberInfant ?? 0),
    pricePerPerson: Number(r.pricePerPerson ?? 0),
    totalAmount: Number(r.totalAmount ?? r.totalPrice ?? 0),
    paidAmount: Number(r.paidAmount ?? 0),
    remainingBalance: Number(r.remainingBalance ?? 0),
    image: String(r.image ?? "/assets/images/tours/placeholder.png"),
    description: String(r.description ?? r.tourName ?? ""),
    highlights: Array.isArray(r.highlights) ? (r.highlights as string[]) : [],
    importantInfo: Array.isArray(r.importantInfo) ? (r.importantInfo as string[]) : [],
    pendingTransactionCode:
      r.pendingTransactionCode != null ? String(r.pendingTransactionCode) : undefined,
    tourInstanceId: r.tourInstanceId != null ? String(r.tourInstanceId) : undefined,
    isVisaRequired: Boolean(r.isVisaRequired),
    tourStatus,
    visaServiceFeeTotal: Number(r.visaServiceFeeTotal ?? 0),
    cancellationRequest: r.cancellationRequest,
    cancellationRequests: Array.isArray(r.cancellationRequests) ? r.cancellationRequests : [],
    pendingTransactions,
  };
}

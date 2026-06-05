import type { BookingPendingTransaction, BookingDetailResponse, CustomerTicketDto, CustomerRoomAssignmentDto, CustomerDayStatusDto, CustomerTicketImageDto, RefundStatusString } from "@/types/booking";
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
    adultPrice: r.adultPrice !== undefined ? Number(r.adultPrice) : undefined,
    childPrice: r.childPrice !== undefined ? Number(r.childPrice) : undefined,
    infantPrice: r.infantPrice !== undefined ? Number(r.infantPrice) : undefined,
    adultSubtotal: r.adultSubtotal !== undefined ? Number(r.adultSubtotal) : undefined,
    childSubtotal: r.childSubtotal !== undefined ? Number(r.childSubtotal) : undefined,
    infantSubtotal: r.infantSubtotal !== undefined ? Number(r.infantSubtotal) : undefined,
    subtotal: r.subtotal !== undefined ? Number(r.subtotal) : undefined,
    taxRate: r.taxRate !== undefined ? Number(r.taxRate) : undefined,
    taxAmount: r.taxAmount !== undefined ? Number(r.taxAmount) : undefined,
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
    tickets: Array.isArray(r.tickets) ? (r.tickets as CustomerTicketDto[]) : [],
    roomAssignments: Array.isArray(r.roomAssignments) ? (r.roomAssignments as CustomerRoomAssignmentDto[]) : [],
    dayStatuses: Array.isArray(r.dayStatuses) ? (r.dayStatuses as CustomerDayStatusDto[]) : [],
    ticketImages: Array.isArray(r.ticketImages) ? (r.ticketImages as CustomerTicketImageDto[]) : [],
    refundStatus: r.refundStatus != null ? (r.refundStatus as RefundStatusString) : undefined,
    refundOutstandingAmount: r.refundOutstandingAmount != null ? Number(r.refundOutstandingAmount) : undefined,
    refundContactedAt: r.refundContactedAt != null ? String(r.refundContactedAt) : undefined,
    refundCompletedAt: r.refundCompletedAt != null ? String(r.refundCompletedAt) : undefined,
  };
}

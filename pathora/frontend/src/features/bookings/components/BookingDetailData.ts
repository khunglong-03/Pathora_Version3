import { TourTier, CustomerTicketDto, CustomerRoomAssignmentDto, CustomerDayStatusDto, CustomerTicketImageDto, RefundStatusString } from "@/types/booking";
export type { TourTier };

/* ── Types ─────────────────────────────────────────────────── */
export type BookingStatus =
  | "confirmed"
  | "completed"
  | "pending"
  | "pending_approval"
  | "approved"
  | "cancelled"
  | "rejected"
  | "pending_cancellation"
  | "deposited"
  | "pending_adjustment";

export type PaymentStatus = "paid" | "partial" | "unpaid";
export type PaymentMethod = "qr_code" | "cash" | "bank_transfer";

export interface BookingDetail {
  id: string;
  tourName: string;
  reference: string;
  tier: TourTier;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  location: string;
  duration: string;
  bookingDate: string;
  departureDate: string;
  returnDate: string;
  adults: number;
  children: number;
  infants: number;
  pricePerPerson: number;
  adultPrice?: number;
  childPrice?: number;
  infantPrice?: number;
  adultSubtotal?: number;
  childSubtotal?: number;
  infantSubtotal?: number;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalance: number;
  image: string;
  description: string;
  highlights: string[];
  importantInfo: string[];
  pendingTransactionCode?: string;
  tourInstanceId?: string;
  isVisaRequired?: boolean;
  tourStatus?: string;
  bookingType?: string;
  visaServiceFeeTotal?: number;
  cancellationRequest?: any;
  cancellationRequests?: any[];
  pendingTransactions?: import("@/types/booking").BookingPendingTransaction[];
  tickets?: CustomerTicketDto[];
  roomAssignments?: CustomerRoomAssignmentDto[];
  dayStatuses?: CustomerDayStatusDto[];
  ticketImages?: CustomerTicketImageDto[];
  refundStatus?: RefundStatusString;
  refundOutstandingAmount?: number | null;
  refundContactedAt?: string | null;
  refundCompletedAt?: string | null;
}

/* ── Status config ─────────────────────────────────────────── */
export const STATUS_CONFIG: Record<
  BookingStatus,
  { bg: string; text: string }
> = {
  confirmed: { bg: "bg-emerald-500", text: "text-white" },
  completed: { bg: "bg-blue-500", text: "text-white" },
  pending: { bg: "bg-amber-500", text: "text-white" },
  pending_approval: { bg: "bg-orange-500", text: "text-white" },
  approved: { bg: "bg-emerald-500", text: "text-white" },
  cancelled: { bg: "bg-red-500", text: "text-white" },
  rejected: { bg: "bg-red-600", text: "text-white" },
  pending_cancellation: { bg: "bg-orange-500", text: "text-white" },
  deposited: { bg: "bg-emerald-400", text: "text-white" },
  pending_adjustment: { bg: "bg-yellow-500", text: "text-white" },
};

export const TIER_CONFIG: Record<TourTier, { bg: string; text: string }> = {
  standard: { bg: "bg-slate-100", text: "text-slate-700" },
  luxury: { bg: "bg-amber-50", text: "text-amber-700" },
  premium: { bg: "bg-purple-50", text: "text-purple-700" },
};

export const PAYMENT_STATUS_COLOR: Record<PaymentStatus, string> = {
  paid: "text-emerald-600",
  partial: "text-orange-600",
  unpaid: "text-red-600",
};

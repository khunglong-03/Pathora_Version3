export type CancellationStatus = "pending" | "approved" | "rejected" | "refunded";

export interface RefundBreakdown {
  totalPaid: number;
  penaltyPercentage: number;
  penaltyAmount: number;
  refundAmount: number;
}

export interface CancellationTimelineEvent {
  status: CancellationStatus;
  date: string;
  note?: string;
  actor: "customer" | "manager" | "system";
}

export interface CancellationDetail {
  id: string;
  bookingId: string;
  tourName: string;
  customerName: string;
  requestDate: string;
  reason: string;
  status: CancellationStatus;
  refundBreakdown: RefundBreakdown;
  timeline: CancellationTimelineEvent[];
}

export const SAMPLE_CANCELLATIONS: Record<string, CancellationDetail> = {
  "1": {
    id: "CANC-001",
    bookingId: "BKG-2023-001",
    tourName: "Bali Island Adventure",
    customerName: "John Doe",
    requestDate: "2023-11-01T10:00:00Z",
    reason: "Family emergency, cannot travel.",
    status: "pending",
    refundBreakdown: {
      totalPaid: 25000000,
      penaltyPercentage: 10,
      penaltyAmount: 2500000,
      refundAmount: 22500000,
    },
    timeline: [
      {
        status: "pending",
        date: "2023-11-01T10:00:00Z",
        note: "Cancellation requested by customer.",
        actor: "customer",
      },
    ],
  },
  "2": {
    id: "CANC-002",
    bookingId: "BKG-2023-002",
    tourName: "Singapore City Tour",
    customerName: "Jane Smith",
    requestDate: "2023-10-25T14:30:00Z",
    reason: "Flight cancelled by airline.",
    status: "refunded",
    refundBreakdown: {
      totalPaid: 15000000,
      penaltyPercentage: 0,
      penaltyAmount: 0,
      refundAmount: 15000000,
    },
    timeline: [
      {
        status: "pending",
        date: "2023-10-25T14:30:00Z",
        note: "Cancellation requested by customer.",
        actor: "customer",
      },
      {
        status: "approved",
        date: "2023-10-26T09:15:00Z",
        note: "Approved full refund due to airline fault.",
        actor: "manager",
      },
      {
        status: "refunded",
        date: "2023-10-28T11:00:00Z",
        note: "Refund processed to original payment method.",
        actor: "system",
      },
    ],
  },
  "3": {
    id: "CANC-003",
    bookingId: "BKG-2023-003",
    tourName: "Phuket Beach Getaway",
    customerName: "Alice Johnson",
    requestDate: "2023-11-05T08:20:00Z",
    reason: "Changed my mind.",
    status: "rejected",
    refundBreakdown: {
      totalPaid: 12000000,
      penaltyPercentage: 100,
      penaltyAmount: 12000000,
      refundAmount: 0,
    },
    timeline: [
      {
        status: "pending",
        date: "2023-11-05T08:20:00Z",
        note: "Cancellation requested by customer.",
        actor: "customer",
      },
      {
        status: "rejected",
        date: "2023-11-05T16:45:00Z",
        note: "Cancellation policy does not allow refunds within 24h of departure.",
        actor: "manager",
      },
    ],
  },
};

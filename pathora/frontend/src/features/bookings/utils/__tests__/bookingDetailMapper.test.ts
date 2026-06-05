import { describe, expect, it } from "vitest";
import { mapBookingDetailResponse } from "../bookingDetailMapper";

describe("mapBookingDetailResponse", () => {
  it("maps customer booking detail payload with pending transactions", () => {
    const mapped = mapBookingDetailResponse({
      id: "bk-1",
      tourName: "Japan Tour",
      reference: "PATH-2026",
      status: "PendingCancellation",
      tourStatus: "Confirmed",
      paymentStatus: "partial",
      paymentMethod: "BankTransfer",
      totalAmount: 5_500_000,
      paidAmount: 1_500_000,
      remainingBalance: 3_500_000,
      pendingTransactions: [
        {
          transactionCode: "PAY-123",
          amount: 500_000,
          type: "VisaServiceFee",
          purpose: "Visa Service Fee",
          createdAt: "2026-06-01T00:00:00Z",
          expiresAt: null,
        },
      ],
    });

    expect(mapped.id).toBe("bk-1");
    expect(mapped.status).toBe("pending_cancellation");
    expect(mapped.paymentMethod).toBe("bank_transfer");
    expect(mapped.remainingBalance).toBe(3_500_000);
    expect(mapped.pendingTransactions).toHaveLength(1);
  });
});

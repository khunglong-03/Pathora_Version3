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
      adultPrice: 2_000_000,
      childPrice: 1_500_000,
      infantPrice: 500_000,
      adultSubtotal: 2_000_000,
      childSubtotal: 1_500_000,
      infantSubtotal: 500_000,
      subtotal: 4_000_000,
      taxRate: 10,
      taxAmount: 400_000,
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
    expect(mapped.adultPrice).toBe(2_000_000);
    expect(mapped.childPrice).toBe(1_500_000);
    expect(mapped.infantPrice).toBe(500_000);
    expect(mapped.adultSubtotal).toBe(2_000_000);
    expect(mapped.childSubtotal).toBe(1_500_000);
    expect(mapped.infantSubtotal).toBe(500_000);
    expect(mapped.subtotal).toBe(4_000_000);
    expect(mapped.taxRate).toBe(10);
    expect(mapped.taxAmount).toBe(400_000);
    expect(mapped.pendingTransactions).toHaveLength(1);
  });
});

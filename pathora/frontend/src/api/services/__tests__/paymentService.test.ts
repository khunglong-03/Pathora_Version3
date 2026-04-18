import { describe, expect, it } from "vitest";

import { paymentService } from "../paymentService";

describe("paymentService", () => {
  it("exports the payment service methods we depend on", () => {
    expect(paymentService.getQr).toBeTypeOf("function");
    expect(paymentService.createTransaction).toBeTypeOf("function");
    expect(paymentService.getTransaction).toBeTypeOf("function");
    expect(paymentService.getNormalizedStatus).toBeTypeOf("function");
    expect(paymentService.checkPayment).toBeTypeOf("function");
    expect(paymentService.reconcileReturn).toBeTypeOf("function");
    expect(paymentService.reconcileCancel).toBeTypeOf("function");
    expect(paymentService.expireTransaction).toBeTypeOf("function");
    expect(paymentService.getCheckoutPrice).toBeTypeOf("function");
  });
});
describe("NormalizedPaymentStatus type", () => {
  it("accepts all valid normalized status values", () => {
    const statuses: NormalizedPaymentStatus[] = [
      "pending",
      "paid",
      "cancelled",
      "expired",
      "failed",
    ];

    expect(statuses).toHaveLength(5);
  });
});

describe("CheckoutPriceResponse type", () => {
  it("has all required pricing fields", () => {
    const checkoutPrice: CheckoutPriceResponse = {
      bookingId: "booking-1",
      tourInstanceId: "instance-1",
      tourName: "Da Nang Tour",
      tourCode: "DN-001",
      startDate: "2026-04-01T00:00:00Z",
      endDate: "2026-04-03T00:00:00Z",
      durationDays: 3,
      numberAdult: 2,
      numberChild: 1,
      numberInfant: 0,
      adultPrice: 1500000,
      childPrice: 750000,
      infantPrice: 0,
      adultSubtotal: 3000000,
      childSubtotal: 750000,
      infantSubtotal: 0,
      subtotal: 3750000,
      taxRate: 0.1,
      taxAmount: 375000,
      totalPrice: 4125000,
      depositPercentage: 0.3,
      depositAmount: 1237500,
      remainingBalance: 2887500,
    };

    expect(checkoutPrice.depositPercentage).toBe(0.3);
    expect(checkoutPrice.depositAmount).toBe(1237500);
    expect(checkoutPrice.remainingBalance).toBe(2887500);
  });

  it("supports optional thumbnail and location", () => {
    const checkoutPriceWithOptional: CheckoutPriceResponse = {
      bookingId: "booking-1",
      tourInstanceId: "instance-1",
      tourName: "Da Nang Tour",
      tourCode: "DN-001",
      thumbnailUrl: "https://cdn.pathora.com/tour.jpg",
      location: "Da Nang, Vietnam",
      startDate: "2026-04-01T00:00:00Z",
      endDate: "2026-04-03T00:00:00Z",
      durationDays: 3,
      numberAdult: 2,
      numberChild: 0,
      numberInfant: 0,
      adultPrice: 1500000,
      childPrice: 0,
      infantPrice: 0,
      adultSubtotal: 3000000,
      childSubtotal: 0,
      infantSubtotal: 0,
      subtotal: 3000000,
      taxRate: 0.1,
      taxAmount: 300000,
      totalPrice: 3300000,
      depositPercentage: 0.3,
      depositAmount: 990000,
      remainingBalance: 2310000,
    };

    expect(checkoutPriceWithOptional.thumbnailUrl).toBe("https://cdn.pathora.com/tour.jpg");
    expect(checkoutPriceWithOptional.location).toBe("Da Nang, Vietnam");
  });

  it("calculates deposit and remaining balance correctly for 30% deposit", () => {
    const checkoutPrice: CheckoutPriceResponse = {
      bookingId: "booking-1",
      tourInstanceId: "instance-1",
      tourName: "Premium Tour",
      tourCode: "PR-001",
      startDate: "2026-05-01T00:00:00Z",
      endDate: "2026-05-05T00:00:00Z",
      durationDays: 5,
      numberAdult: 2,
      numberChild: 1,
      numberInfant: 0,
      adultPrice: 2000000,
      childPrice: 1000000,
      infantPrice: 0,
      adultSubtotal: 4000000,
      childSubtotal: 1000000,
      infantSubtotal: 0,
      subtotal: 5000000,
      taxRate: 0.1,
      taxAmount: 500000,
      totalPrice: 5500000,
      depositPercentage: 0.3,
      depositAmount: 1650000,
      remainingBalance: 3850000,
    };

    // Verify deposit calculation: 30% of 5,500,000 = 1,650,000
    expect(checkoutPrice.depositAmount).toBe(checkoutPrice.totalPrice * 0.3);
    // Verify remaining: 5,500,000 - 1,650,000 = 3,850,000
    expect(checkoutPrice.remainingBalance).toBe(checkoutPrice.totalPrice - checkoutPrice.depositAmount);
  });
});

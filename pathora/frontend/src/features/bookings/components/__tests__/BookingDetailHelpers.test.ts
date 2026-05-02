import { describe, expect, it } from "vitest";
import { getBookingDerivedState } from "../BookingDetailHelpers";
import { BookingDetail } from "../BookingDetailData";

describe("BookingDetailHelpers", () => {
  describe("getBookingDerivedState", () => {
    const baseBooking: BookingDetail = {
      id: "bk-1",
      code: "BK123",
      tourName: "Tour",
      tourCode: "T123",
      tourTier: "standard",
      tourStatus: "Draft",
      departureDate: "2026-05-01",
      duration: 3,
      isVisaRequired: false,
      adults: 2,
      children: 1,
      totalPrice: 1000,
      amountPaid: 500,
      status: "pending",
      paymentStatus: "partial",
      paymentMethod: "bank_transfer",
      createdAt: "2026-01-01"
    };

    it("showVisaSection is true when isVisaRequired is true", () => {
      const state = getBookingDerivedState({
        ...baseBooking,
        isVisaRequired: true,
        tourStatus: "Confirmed"
      });
      expect(state.showVisaSection).toBe(true);
    });

    it("showVisaSection is true when tourStatus is PendingVisa", () => {
      const state = getBookingDerivedState({
        ...baseBooking,
        isVisaRequired: false,
        tourStatus: "PendingVisa"
      });
      expect(state.showVisaSection).toBe(true);
    });

    it("showVisaSection is false when isVisaRequired is false and tourStatus is not PendingVisa", () => {
      const state = getBookingDerivedState({
        ...baseBooking,
        isVisaRequired: false,
        tourStatus: "Confirmed"
      });
      expect(state.showVisaSection).toBe(false);
    });

    it("calculates totalGuests correctly", () => {
      const state = getBookingDerivedState(baseBooking);
      expect(state.totalGuests).toBe(3); // 2 adults + 1 child
    });
  });
});

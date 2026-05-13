import { describe, expect, it } from "vitest";
import { getBookingDerivedState } from "../BookingDetailHelpers";
import { BookingDetail } from "../BookingDetailData";

describe("BookingDetailHelpers", () => {
  describe("getBookingDerivedState", () => {
    const baseBooking: BookingDetail = {
      id: "bk-1",
      tourName: "Tour",
      reference: "REF123",
      tier: "standard",
      status: "pending",
      paymentStatus: "partial",
      paymentMethod: "bank_transfer",
      location: "Hanoi",
      duration: "3 Days",
      bookingDate: "2026-01-01",
      departureDate: "2026-05-01",
      returnDate: "2026-05-03",
      adults: 2,
      children: 1,
      infants: 0,
      pricePerPerson: 500,
      totalAmount: 1000,
      paidAmount: 500,
      remainingBalance: 500,
      image: "",
      description: "",
      highlights: [],
      importantInfo: [],
      isVisaRequired: false,
      tourStatus: "Draft",
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

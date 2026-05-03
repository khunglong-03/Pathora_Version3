import { describe, it, expect } from "vitest";
import { isQualifiedBooking, calculateBookingPax, getFulfillmentActivities, isActivityExternalTransport, mapInstanceToUpdatePayload } from "./fulfillmentHelpers";

describe("fulfillmentHelpers", () => {
  describe("isQualifiedBooking", () => {
    it("returns true for Deposited, Paid, and Completed statuses", () => {
      expect(isQualifiedBooking({ status: "Deposited" })).toBe(true);
      expect(isQualifiedBooking({ status: "Paid" })).toBe(true);
      expect(isQualifiedBooking({ status: "Completed" })).toBe(true);
      expect(isQualifiedBooking({ status: "deposited" })).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(isQualifiedBooking({ status: "Pending" })).toBe(false);
      expect(isQualifiedBooking({ status: "Cancelled" })).toBe(false);
      expect(isQualifiedBooking(null)).toBe(false);
      expect(isQualifiedBooking({})).toBe(false);
    });
  });

  describe("calculateBookingPax", () => {
    it("calculates total pax correctly", () => {
      expect(calculateBookingPax({ numberAdult: 2, numberChild: 1, numberInfant: 0 })).toBe(3);
      expect(calculateBookingPax({ numberAdult: 2 })).toBe(2);
      expect(calculateBookingPax(null)).toBe(0);
    });
  });

  describe("getFulfillmentActivities", () => {
    it("flattens days into transport and accommodation collections", () => {
      const instance = {
        days: [
          {
            activities: [
              { activityType: 1, title: "Flight" }, // Transport
              { activityType: 2, title: "Hotel" },  // Accommodation
              { activityType: 3, title: "Tour" },   // Other
            ]
          },
          {
            activities: [
              { activityType: "Transportation", title: "Bus" },
            ]
          }
        ]
      };
      
      const { transportActivities, accommodationActivities } = getFulfillmentActivities(instance);
      expect(transportActivities.length).toBe(2);
      expect(accommodationActivities.length).toBe(1);
    });
  });

  describe("isActivityExternalTransport", () => {
    it("identifies external transport types", () => {
      expect(isActivityExternalTransport({ transportationType: "Flight" })).toBe(true);
      expect(isActivityExternalTransport({ transportationType: 2 })).toBe(true); // Train
      expect(isActivityExternalTransport({ transportationType: "Bus" })).toBe(false);
    });
  });

  describe("mapInstanceToUpdatePayload", () => {
    it("safely maps required fields and preserves managers", () => {
      const instance = {
        id: "inst-1",
        tourId: "tour-1",
        startDate: "2025-01-01",
        managers: [
          { userId: "mgr-1", role: "Manager" },
          { userId: "guide-1", role: "Guide" },
        ],
        images: ["img1.jpg"]
      };

      const payload = mapInstanceToUpdatePayload(instance);
      expect(payload.id).toBe("inst-1");
      expect(payload.managerUserIds).toEqual(["mgr-1"]);
      expect(payload.guideUserIds).toEqual(["guide-1"]);
      expect(payload.images).toEqual(["img1.jpg"]);
    });
  });
});

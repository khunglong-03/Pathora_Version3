import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import {
  hotelProviderService,
  type AccommodationItem,
  type GuestArrivalItem,
  type GuestArrivalDetail,
  type RoomAvailability,
  type HotelSupplierInfo,
} from "../hotelProviderService";

vi.mock("@/api/axiosInstance", () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe("hotelProviderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Hotel Accommodations ────────────────────────────────────────────────

  describe("getAccommodations", () => {
    it("returns accommodation list on success", async () => {
      const mockItems: AccommodationItem[] = [
        {
          id: "acc-1",
          supplierId: "sup-1",
          roomType: "Standard",
          totalRooms: 10,
          name: "Hotel Mai",
          address: "123 Street",
          locationArea: null,
          operatingCountries: null,
          imageUrls: null,
          notes: null,
        },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockItems },
      } as never);

      const result = await hotelProviderService.getAccommodations();

      expect(result).toEqual(mockItems);
      expect(api.get).toHaveBeenCalledWith("/hotel-provider/accommodations");
    });

    it("returns empty array when no data", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await hotelProviderService.getAccommodations();

      expect(result).toEqual([]);
    });

    it("throws on 401 Unauthorized", async () => {
      vi.mocked(api.get).mockRejectedValue({
        isAxiosError: true,
        response: { status: 401, data: { errors: [] } },
      } as never);

      await expect(
        hotelProviderService.getAccommodations(),
      ).rejects.toBeDefined();
    });
  });

  describe("createAccommodation", () => {
    it("returns created accommodation on 201", async () => {
      const payload = { roomType: "Deluxe", totalRooms: 5 };
      const created: AccommodationItem = {
        id: "acc-new",
        supplierId: "sup-1",
        roomType: "Deluxe",
        totalRooms: 5,
        name: null,
        address: null,
        locationArea: null,
        operatingCountries: null,
        imageUrls: null,
        notes: null,
      };
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: created },
      } as never);

      const result = await hotelProviderService.createAccommodation(payload);

      expect(result).toEqual(created);
      expect(api.post).toHaveBeenCalledWith(
        "/hotel-provider/accommodations",
        payload,
      );
    });

    it("returns error on validation failure", async () => {
      vi.mocked(api.post).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [
              { code: "VALIDATION_ERROR", errorMessage: "VALIDATION_ERROR", details: "Room type is required" },
            ],
          },
        },
      } as never);

      await expect(
        hotelProviderService.createAccommodation({ roomType: "", totalRooms: 0 }),
      ).rejects.toBeDefined();
    });
  });

  describe("updateAccommodation", () => {
    it("returns updated accommodation on 200", async () => {
      const id = "acc-1";
      const payload = { roomType: "Suite", totalRooms: 3 };
      const updated: AccommodationItem = {
        id,
        supplierId: "sup-1",
        roomType: "Suite",
        totalRooms: 3,
        name: null,
        address: null,
        locationArea: null,
        operatingCountries: null,
        imageUrls: null,
        notes: null,
      };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: updated },
      } as never);

      const result = await hotelProviderService.updateAccommodation(id, payload);

      expect(result).toEqual(updated);
      expect(api.put).toHaveBeenCalledWith(
        `/hotel-provider/accommodations/${id}`,
        payload,
      );
    });

    it("throws on 404", async () => {
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: { errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "" }] },
        },
      } as never);

      await expect(
        hotelProviderService.updateAccommodation("invalid-id", { roomType: "Test" }),
      ).rejects.toBeDefined();
    });
  });

  describe("deleteAccommodation", () => {
    it("resolves on 200", async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: { success: true, data: null } } as never);

      await expect(
        hotelProviderService.deleteAccommodation("acc-1"),
      ).resolves.toBeUndefined();
      expect(api.delete).toHaveBeenCalledWith("/hotel-provider/accommodations/acc-1");
    });

    it("throws on 404", async () => {
      vi.mocked(api.delete).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: { errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "" }] },
        },
      } as never);

      await expect(
        hotelProviderService.deleteAccommodation("invalid-id"),
      ).rejects.toBeDefined();
    });
  });

  // ─── Room Availability ──────────────────────────────────────────────────

  describe("getRoomAvailability", () => {
    it("returns room availability on success", async () => {
      const fromDate = "2026-04-10";
      const toDate = "2026-04-15";
      const mockAvailability: RoomAvailability[] = [
        { date: "2026-04-10", roomType: "Standard", totalRooms: 10, blockedCount: 2, availableRooms: 8 },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockAvailability },
      } as never);

      const result = await hotelProviderService.getRoomAvailability(fromDate, toDate);

      expect(result).toEqual(mockAvailability);
      expect(api.get).toHaveBeenCalledWith("/api/hotel-room-availability", {
        params: { fromDate, toDate },
      });
    });

    it("throws on 401 Unauthorized", async () => {
      vi.mocked(api.get).mockRejectedValue({
        isAxiosError: true,
        response: { status: 401, data: { errors: [] } },
      } as never);

      await expect(
        hotelProviderService.getRoomAvailability("2026-04-10", "2026-04-15"),
      ).rejects.toBeDefined();
    });
  });

  // ─── Guest Arrivals ─────────────────────────────────────────────────────

  describe("getGuestArrivals", () => {
    it("returns guest arrival list on success", async () => {
      const mockArrivals: GuestArrivalItem[] = [
        {
          id: "arr-1",
          bookingAccommodationDetailId: "bad-1",
          accommodationName: "Hotel Mai",
          status: "Pending",
          checkInDate: "2026-04-10",
          checkOutDate: "2026-04-12",
          participantCount: 2,
          submittedAt: null,
          submissionStatus: "Draft",
        },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockArrivals },
      } as never);

      const result = await hotelProviderService.getGuestArrivals({ status: "Pending" });

      expect(result).toEqual(mockArrivals);
      expect(api.get).toHaveBeenCalledWith("/api/guest-arrivals", {
        params: { status: "Pending" },
      });
    });

    it("returns empty array when no data", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: null },
      } as never);

      const result = await hotelProviderService.getGuestArrivals();

      expect(result).toEqual([]);
    });

    it("throws on 401 Unauthorized", async () => {
      vi.mocked(api.get).mockRejectedValue({
        isAxiosError: true,
        response: { status: 401, data: { errors: [] } },
      } as never);

      await expect(
        hotelProviderService.getGuestArrivals(),
      ).rejects.toBeDefined();
    });
  });

  describe("getGuestArrivalDetail", () => {
    it("returns guest arrival detail on success", async () => {
      const accommodationDetailId = "bad-1";
      const mockDetail: GuestArrivalDetail = {
        id: "arr-1",
        bookingAccommodationDetailId: accommodationDetailId,
        accommodationName: "Hotel Mai",
        status: "Pending",
        checkInDate: "2026-04-10",
        checkOutDate: "2026-04-12",
        participantCount: 2,
        submittedAt: null,
        submissionStatus: "Draft",
        participants: [
          { id: "p-1", fullName: "Nguyen Van A", passportNumber: "A123456", status: "Pending" },
        ],
        note: null,
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockDetail },
      } as never);

      const result = await hotelProviderService.getGuestArrivalDetail(accommodationDetailId);

      expect(result).toEqual(mockDetail);
      expect(api.get).toHaveBeenCalledWith(
        `/api/guest-arrivals/accommodation/${accommodationDetailId}`,
      );
    });

    it("throws on 404 when arrival not found", async () => {
      vi.mocked(api.get).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          data: { errors: [{ code: "NOT_FOUND", errorMessage: "NOT_FOUND", details: "" }] },
        },
      } as never);

      await expect(
        hotelProviderService.getGuestArrivalDetail("invalid-id"),
      ).rejects.toBeDefined();
    });
  });

  describe("submitGuestArrival", () => {
    it("returns submitted arrival on 201", async () => {
      const payload = {
        bookingAccommodationDetailId: "bad-1",
        participantIds: ["p-1"],
      };
      const submitted: GuestArrivalItem = {
        id: "arr-new",
        bookingAccommodationDetailId: "bad-1",
        accommodationName: "Hotel Mai",
        status: "Pending",
        checkInDate: "2026-04-10",
        checkOutDate: "2026-04-12",
        participantCount: 1,
        submittedAt: "2026-04-08T12:00:00Z",
        submissionStatus: "Submitted",
      };
      vi.mocked(api.post).mockResolvedValue({
        data: { success: true, data: submitted },
      } as never);

      const result = await hotelProviderService.submitGuestArrival(payload);

      expect(result).toEqual(submitted);
      expect(api.post).toHaveBeenCalledWith("/api/guest-arrivals", payload);
    });

    it("throws on validation error", async () => {
      vi.mocked(api.post).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          data: {
            errors: [{ code: "VALIDATION_ERROR", errorMessage: "VALIDATION_ERROR", details: "Required" }],
          },
        },
      } as never);

      await expect(
        hotelProviderService.submitGuestArrival({ bookingAccommodationDetailId: "", participantIds: [] }),
      ).rejects.toBeDefined();
    });
  });

  describe("updateGuestArrival", () => {
    it("returns updated arrival on 200", async () => {
      const id = "arr-1";
      const payload = { status: "CheckedIn" as const };
      const updated: GuestArrivalItem = {
        id,
        bookingAccommodationDetailId: "bad-1",
        accommodationName: "Hotel Mai",
        status: "CheckedIn",
        checkInDate: "2026-04-10",
        checkOutDate: "2026-04-12",
        participantCount: 2,
        submittedAt: "2026-04-08T12:00:00Z",
        submissionStatus: "Submitted",
      };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: updated },
      } as never);

      const result = await hotelProviderService.updateGuestArrival(id, payload);

      expect(result).toEqual(updated);
      expect(api.put).toHaveBeenCalledWith(`/api/guest-arrivals/${id}`, payload);
    });
  });

  // ─── Supplier Info ─────────────────────────────────────────────────────

  describe("getSupplierInfo", () => {
    it("returns supplier info from first accommodation", async () => {
      const mockAccommodations: AccommodationItem[] = [
        {
          id: "acc-1",
          supplierId: "sup-1",
          roomType: "Standard",
          totalRooms: 10,
          name: "Hotel Mai DT",
          address: "123 Hotel Street",
          locationArea: null,
          operatingCountries: null,
          imageUrls: null,
          notes: "Best hotel",
        },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: mockAccommodations },
      } as never);

      const result = await hotelProviderService.getSupplierInfo();

      expect(result).toEqual({
        id: "sup-1",
        supplierCode: "",
        name: "Hotel Mai DT",
        phone: null,
        email: null,
        address: "123 Hotel Street",
        notes: "Best hotel",
      });
    });

    it("returns null when no accommodations", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { success: true, data: [] },
      } as never);

      const result = await hotelProviderService.getSupplierInfo();

      expect(result).toBeNull();
    });
  });

  describe("updateSupplierInfo", () => {
    it("returns updated supplier info on 200", async () => {
      const payload = {
        name: "Hotel Mai Updated",
        phone: "0123456789",
        email: "mai.dt@hotel.vn",
        address: "456 New Street",
        notes: "Renovated",
      };
      const updated: HotelSupplierInfo = {
        id: "sup-1",
        supplierCode: "HOTEL-MAI",
        name: "Hotel Mai Updated",
        phone: "0123456789",
        email: "mai.dt@hotel.vn",
        address: "456 New Street",
        notes: "Renovated",
      };
      vi.mocked(api.put).mockResolvedValue({
        data: { success: true, data: updated },
      } as never);

      const result = await hotelProviderService.updateSupplierInfo("sup-1", payload);

      expect(result).toEqual(updated);
      expect(api.put).toHaveBeenCalledWith("/api/hotel-supplier/info", payload);
    });

    it("throws on 401 when user is not HotelServiceProvider", async () => {
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 401,
          data: { errors: [{ code: "UNAUTHORIZED", errorMessage: "UNAUTHORIZED", details: "" }] },
        },
      } as never);

      await expect(
        hotelProviderService.updateSupplierInfo("sup-1", { name: "Test" }),
      ).rejects.toBeDefined();
    });

    it("throws on 403 when HotelServiceProvider accesses another hotel's supplier", async () => {
      vi.mocked(api.put).mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 403,
          data: { errors: [{ code: "FORBIDDEN", errorMessage: "FORBIDDEN", details: "" }] },
        },
      } as never);

      await expect(
        hotelProviderService.updateSupplierInfo("sup-other", { name: "Hack" }),
      ).rejects.toBeDefined();
    });
  });
});

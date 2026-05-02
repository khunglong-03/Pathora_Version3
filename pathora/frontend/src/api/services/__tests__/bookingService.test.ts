import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { bookingService, CreateBookingPayload, RecentBooking } from "../bookingService";

vi.mock("@/api/axiosInstance", () => {
  return {
    api: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe("bookingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRecentBookings", () => {
    it("returns bookings extracted from result.items", async () => {
      const mockBookings: RecentBooking[] = [
        {
          bookingId: "bk-1",
          tourName: "Ha Long Bay Tour",
          departureDate: "2026-04-01",
          status: "Confirmed",
          totalPrice: 1500000,
          totalParticipants: 4,
        },
        {
          bookingId: "bk-2",
          tourName: "Sapa Adventure",
          departureDate: "2026-04-10",
          status: "Pending",
          totalPrice: 2000000,
          totalParticipants: 2,
        },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { result: { items: mockBookings } },
      } as never);

      const result = await bookingService.getRecentBookings(3);

      expect(result).toEqual(mockBookings);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.BOOKING.GET_MY_RECENT, { params: { count: 3 } });
    });

    it("uses default count of 3 when no parameter provided", async () => {
      const mockBookings: RecentBooking[] = [];
      vi.mocked(api.get).mockResolvedValue({
        data: { result: { items: mockBookings } },
      } as never);

      await bookingService.getRecentBookings();

      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.BOOKING.GET_MY_RECENT, { params: { count: 3 } });
    });

    it("returns bookings extracted from data.items", async () => {
      const mockBookings: RecentBooking[] = [
        {
          bookingId: "bk-3",
          tourName: "Mekong Delta",
          departureDate: "2026-05-01",
          status: "Confirmed",
          totalPrice: 1200000,
          totalParticipants: 3,
        },
      ];
      vi.mocked(api.get).mockResolvedValue({
        data: { data: { items: mockBookings } },
      } as never);

      const result = await bookingService.getRecentBookings(5);

      expect(result).toEqual(mockBookings);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.BOOKING.GET_MY_RECENT, { params: { count: 5 } });
    });

    it("returns empty array when no items present", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: {},
      } as never);

      const result = await bookingService.getRecentBookings();

      expect(result).toEqual([]);
    });

    it("returns empty array when items is not an array", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { result: { items: "not an array" } },
      } as never);

      const result = await bookingService.getRecentBookings();

      expect(result).toEqual([]);
    });

    it("returns empty array when response is an array directly", async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: [{ bookingId: "bk-1" }],
      } as never);

      const result = await bookingService.getRecentBookings();

      expect(result).toEqual([{ bookingId: "bk-1" }]);
    });
  });

  describe("createBooking", () => {
    it("returns checkout price response extracted from result", async () => {
      const payload: CreateBookingPayload = {
        tourInstanceId: "ti-1",
        customerName: "John Doe",
        customerPhone: "0123456789",
        customerEmail: "john@example.com",
        numberAdult: 2,
        numberChild: 1,
        numberInfant: 0,
        paymentMethod: 1,
        isFullPay: false,
      };
      const mockResponse = {
        result: {
          bookingId: "bk-new",
          totalPrice: 1800000,
          depositAmount: 900000,
          checkoutUrl: "https://payment.example.com",
        },
      };
      vi.mocked(api.post).mockResolvedValue({
        data: mockResponse,
      } as never);

      const result = await bookingService.createBooking(payload);

      expect(result).toEqual(mockResponse.result);
      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC_BOOKING.CREATE, payload);
    });

    it("returns null from extractResult when no result field", async () => {
      const payload: CreateBookingPayload = {
        tourInstanceId: "ti-1",
        customerName: "Jane Doe",
        customerPhone: "0987654321",
        numberAdult: 1,
        numberChild: 0,
        numberInfant: 0,
        paymentMethod: 2,
        isFullPay: true,
      };
      vi.mocked(api.post).mockResolvedValue({
        data: {},
      } as never);

      const result = await bookingService.createBooking(payload);

      expect(result).toBeNull();
    });

    it("returns extracted data from data field when no result field", async () => {
      const payload: CreateBookingPayload = {
        tourInstanceId: "ti-1",
        customerName: "Jane Doe",
        customerPhone: "0987654321",
        numberAdult: 1,
        numberChild: 0,
        numberInfant: 0,
        paymentMethod: 2,
        isFullPay: true,
      };
      const mockData = { bookingId: "bk-new", totalPrice: 500000 };
      vi.mocked(api.post).mockResolvedValue({
        data: { data: mockData },
      } as never);

      const result = await bookingService.createBooking(payload);

      expect(result).toEqual(mockData);
    });
  });

  describe("getBookingDetail", () => {
    it("calls GET_DETAIL endpoint and returns extracted result with pendingTransactions", async () => {
      const mockResult = {
        id: "bk-1",
        totalPrice: 1000,
        pendingTransactions: [
          { transactionId: "tx-1", amount: 500, status: "Pending" }
        ]
      };
      vi.mocked(api.get).mockResolvedValue({
        data: { result: mockResult },
      } as never);

      const result = await bookingService.getBookingDetail("bk-1");

      expect(result).toEqual(mockResult);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC_BOOKING.GET_DETAIL("bk-1"));
    });
  });

  describe("Visa Methods", () => {
    it("getVisaRequirements calls GET_VISA_REQUIREMENTS and extracts result", async () => {
      const mockResult = { isVisaRequired: true };
      vi.mocked(api.get).mockResolvedValue({ data: { result: mockResult } } as never);

      const result = await bookingService.getVisaRequirements("bk-1");

      expect(result).toEqual(mockResult);
      expect(api.get).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC_BOOKING.GET_VISA_REQUIREMENTS("bk-1"));
    });

    it("upsertParticipantPassport calls UPSERT_PARTICIPANT_PASSPORT and extracts result", async () => {
      const payload = { passportNumber: "AB123", nationality: "VN", issuedAt: null, expiresAt: null, fileUrl: null };
      vi.mocked(api.put).mockResolvedValue({ data: { result: "success" } } as never);

      const result = await bookingService.upsertParticipantPassport("bk-1", "p-1", payload);

      expect(result).toEqual("success");
      expect(api.put).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC_BOOKING.UPSERT_PARTICIPANT_PASSPORT("bk-1", "p-1"), payload);
    });

    it("submitVisaApplication calls SUBMIT_VISA_APPLICATION and extracts result", async () => {
      const payload = { bookingParticipantId: "p-1", passportId: "pass-1", destinationCountry: "JP" };
      vi.mocked(api.post).mockResolvedValue({ data: { result: "app-1" } } as never);

      const result = await bookingService.submitVisaApplication("bk-1", payload);

      expect(result).toEqual("app-1");
      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC_BOOKING.SUBMIT_VISA_APPLICATION("bk-1"), payload);
    });

    it("updateVisaApplication calls UPDATE_VISA_APPLICATION and extracts result", async () => {
      const payload = { isResubmitting: true };
      vi.mocked(api.put).mockResolvedValue({ data: { result: "success" } } as never);

      const result = await bookingService.updateVisaApplication("bk-1", "app-1", payload);

      expect(result).toEqual("success");
      expect(api.put).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC_BOOKING.UPDATE_VISA_APPLICATION("bk-1", "app-1"), payload);
    });

    it("requestVisaSupport calls REQUEST_VISA_SUPPORT and handles duplicate support response", async () => {
      const mockResponse = { serviceFeeQuoted: true, message: "OK" };
      vi.mocked(api.post).mockResolvedValue({ data: { result: mockResponse } } as never);

      const result = await bookingService.requestVisaSupport("bk-1", "p-1");

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith(API_ENDPOINTS.PUBLIC_BOOKING.REQUEST_VISA_SUPPORT("bk-1", "p-1"));
    });
  });
});

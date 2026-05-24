import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingDetailPage } from "../BookingDetailPage";
import { bookingService } from "@/api/services";
import { useBookingStatusListener } from "@/hooks/useBookingStatusListener";
import type { BookingStatusChangedEvent } from "@/api/services/signalRService";

let statusChangedHandler: ((event: BookingStatusChangedEvent) => void) | undefined;

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "booking-1" }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock("@/hooks/useBookingStatusListener", () => ({
  useBookingStatusListener: vi.fn((handler?: (event: BookingStatusChangedEvent) => void) => {
    statusChangedHandler = handler;
  }),
}));

vi.mock("@/api/services", () => ({
  bookingService: {
    getBookingDetail: vi.fn(),
  },
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getInstanceDetail: vi.fn(() => Promise.resolve(null)),
  },
}));

vi.mock("../BookingHeroSection", () => ({
  BookingHeroSection: ({ booking }: { booking: { status: string } }) => (
    <div data-testid="booking-status">{booking.status}</div>
  ),
}));

vi.mock("../BookingRefundSection", () => ({
  BookingRefundSection: ({ refundStatus, refundOutstandingAmount }: { refundStatus?: string; refundOutstandingAmount?: number }) => (
    <div data-testid="refund-status">{refundStatus}:{refundOutstandingAmount}</div>
  ),
}));

vi.mock("../BookingInfoCard", () => ({ BookingInfoCard: () => <div /> }));
vi.mock("../GuestDetailsCard", () => ({ GuestDetailsCard: () => <div /> }));
vi.mock("../BookingOverviewTab", () => ({ BookingOverviewTab: () => <div /> }));
vi.mock("../BookingImportantInfo", () => ({ BookingImportantInfo: () => <div /> }));
vi.mock("../BookingPaymentSummary", () => ({ BookingPaymentSummary: () => <div /> }));
vi.mock("../BookingNeedHelp", () => ({ BookingNeedHelp: () => <div /> }));
vi.mock("../BookingFloatingSocial", () => ({ BookingFloatingSocial: () => <div /> }));
vi.mock("../BookingCustomerApprovalAction", () => ({ BookingCustomerApprovalAction: () => <div /> }));
vi.mock("../CancellationRequestTimeline", () => ({ CancellationRequestTimeline: () => <div /> }));
vi.mock("../BookingVisaSection", () => ({ BookingVisaSection: () => <div /> }));

const activeBooking = {
  id: "booking-1",
  bookingId: "booking-1",
  tourName: "Da Nang Tour",
  status: "Paid",
  paymentStatus: "paid",
  paymentMethod: "bank_transfer",
  adults: 2,
  children: 0,
  infants: 0,
  adultPrice: 1_000_000,
  totalAmount: 2_000_000,
  paidAmount: 2_000_000,
  remainingBalance: 0,
  cancellationRequests: [],
};

const cancelledBooking = {
  ...activeBooking,
  status: "Cancelled",
  refundStatus: "Pending",
  refundOutstandingAmount: 1_400_000,
};

describe("BookingDetailPage realtime refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statusChangedHandler = undefined;
  });

  it("refetches and renders cancelled refund data for a matching booking status event", async () => {
    vi.mocked(bookingService.getBookingDetail)
      .mockResolvedValueOnce(activeBooking as any)
      .mockResolvedValueOnce(cancelledBooking as any);

    render(<BookingDetailPage />);

    await screen.findByText("paid");
    expect(useBookingStatusListener).toHaveBeenCalled();

    await act(async () => {
      statusChangedHandler?.({
        bookingId: "booking-1",
        newStatus: "Cancelled",
        paidAmount: 2_000_000,
        remainingBalance: 0,
      });
    });

    await screen.findByText("cancelled");
    expect(screen.getByTestId("refund-status")).toHaveTextContent("Pending:1400000");
    expect(bookingService.getBookingDetail).toHaveBeenCalledTimes(2);
  });

  it("ignores booking status events for other bookings", async () => {
    vi.mocked(bookingService.getBookingDetail).mockResolvedValue(activeBooking as any);

    render(<BookingDetailPage />);

    await screen.findByText("paid");

    await act(async () => {
      statusChangedHandler?.({
        bookingId: "other-booking",
        newStatus: "Cancelled",
        paidAmount: 0,
        remainingBalance: 0,
      });
    });

    await waitFor(() => {
      expect(bookingService.getBookingDetail).toHaveBeenCalledTimes(1);
    });
  });
});

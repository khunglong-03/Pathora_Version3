import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { RefundTrackingPage } from "../RefundTrackingPage";
import { bookingService } from "@/api/services/bookingService";

const { stableT, stableI18n } = vi.hoisted(() => ({
  stableT: (_key: string, fallback?: string) => fallback ?? _key,
  stableI18n: { language: "vi" },
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: stableT, i18n: stableI18n }),
  initReactI18next: { type: "3rdParty", init: vi.fn() },
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@phosphor-icons/react", () => ({
  HandCoins: () => null,
  PhoneCall: () => null,
  Envelope: () => null,
  CheckCircle: () => null,
  Clock: () => null,
  ArrowsClockwise: () => null,
  WarningCircle: () => null,
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    getAllBookings: vi.fn(),
    updateRefundStatus: vi.fn(),
  },
}));

const sampleBooking = {
  id: "b-1",
  bookingCode: "BK-001",
  tourCode: "T-001",
  tourName: "Da Lat Adventure",
  customerName: "Nguyen Van A",
  customerPhone: "+84901234567",
  customerEmail: "a@example.com",
  status: "Cancelled",
  refundStatus: "Pending",
  refundOutstandingAmount: 7_000_000,
  cancelledAt: new Date().toISOString(),
};

describe("RefundTrackingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bookingService.getAllBookings).mockResolvedValue({
      result: { items: [sampleBooking] },
    } as any);
    vi.mocked(bookingService.updateRefundStatus).mockResolvedValue({ success: true } as any);
  });

  it("renders Pending list and triggers Contacted update on action click", async () => {
    render(<RefundTrackingPage />);

    await waitFor(() => {
      expect(bookingService.getAllBookings).toHaveBeenCalledWith(
        expect.objectContaining({ refundStatus: "Pending" }),
      );
    });

    expect(await screen.findByText("Nguyen Van A")).toBeInTheDocument();

    const contactedBtn = await screen.findByRole("button", { name: /Đã liên hệ/i });
    fireEvent.click(contactedBtn);

    await waitFor(() => {
      expect(bookingService.updateRefundStatus).toHaveBeenCalledWith("b-1", "Contacted");
    });
  });

  it("re-fetches on tab switch with new refundStatus filter", async () => {
    render(<RefundTrackingPage />);

    await waitFor(() => {
      expect(bookingService.getAllBookings).toHaveBeenCalledTimes(1);
    });

    const refundedTab = await screen.findByRole("button", { name: /^Refunded$/i });
    fireEvent.click(refundedTab);

    await waitFor(() => {
      const calls = vi.mocked(bookingService.getAllBookings).mock.calls;
      expect(calls.some((c) => (c[0] as any)?.refundStatus === "Refunded")).toBe(true);
    });
  });
});

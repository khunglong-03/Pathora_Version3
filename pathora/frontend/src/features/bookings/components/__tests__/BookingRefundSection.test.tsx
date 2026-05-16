import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { BookingRefundSection } from "../BookingRefundSection";
import { bookingService } from "@/api/services/bookingService";

const { stableT, stableI18n } = vi.hoisted(() => ({
  stableT: (_key: string, fallback?: string) => fallback ?? _key,
  stableI18n: { language: "vi" },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: stableT, i18n: stableI18n }),
}));

vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@phosphor-icons/react", () => ({
  HandCoins: () => null,
  PhoneCall: () => null,
  CheckCircle: () => null,
  Clock: () => null,
}));

vi.mock("@/api/services/bookingService", () => ({
  bookingService: {
    updateRefundStatus: vi.fn(),
  },
}));

const managerAuth = {
  user: { id: "m-1", roles: [{ name: "Manager" }] },
};
const customerAuth = {
  user: { id: "c-1", roles: [{ name: "Customer" }] },
};

let currentAuth: any = managerAuth;
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => currentAuth,
}));

describe("BookingRefundSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bookingService.updateRefundStatus).mockResolvedValue({ success: true } as any);
  });

  it("renders refund section when booking Cancelled with outstanding amount", () => {
    currentAuth = managerAuth;
    render(
      <BookingRefundSection
        bookingId="b-1"
        bookingStatus="cancelled"
        refundStatus="Pending"
        refundOutstandingAmount={7_000_000}
      />,
    );
    expect(screen.getByText(/Trạng thái hoàn tiền/i)).toBeInTheDocument();
    expect(screen.getByText(/7\.000\.000đ/)).toBeInTheDocument();
  });

  it("shows action button only for Manager/Admin role", () => {
    currentAuth = customerAuth;
    render(
      <BookingRefundSection
        bookingId="b-1"
        bookingStatus="cancelled"
        refundStatus="Pending"
        refundOutstandingAmount={7_000_000}
      />,
    );
    expect(screen.queryByRole("button", { name: /Đã liên hệ/i })).not.toBeInTheDocument();
  });

  it("calls updateRefundStatus(Contacted) when Manager clicks the action", async () => {
    currentAuth = managerAuth;
    const onChanged = vi.fn();
    render(
      <BookingRefundSection
        bookingId="b-1"
        bookingStatus="cancelled"
        refundStatus="Pending"
        refundOutstandingAmount={7_000_000}
        onChanged={onChanged}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Đã liên hệ/i }));
    await waitFor(() => {
      expect(bookingService.updateRefundStatus).toHaveBeenCalledWith("b-1", "Contacted");
    });
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled();
    });
  });
});

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { paymentService } from "@/api/services/paymentService";
import { BookingPaymentSummary } from "../BookingPaymentSummary";
import type { BookingDetail } from "../BookingDetailData";

const requestCancellationMock = vi.hoisted(() => vi.fn());
const pushMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "customer@test.com" } }),
}));

vi.mock("@/api/services/paymentService", () => ({
  paymentService: {
    createTransaction: vi.fn(),
  },
}));

vi.mock("@/store/api/bookingCancellationApi", () => ({
  useRequestCancellationMutation: () => [requestCancellationMock, { isLoading: false }],
}));

vi.mock("../../hooks/useCancellationEstimate", () => ({
  useCancellationEstimate: () => ({
    estimate: { paidAmount: 0, feePercent: 0, refundAmount: 0 },
    isLoading: false,
  }),
}));

vi.mock("../CancelBookingModal", () => ({
  CancelBookingModal: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: (reason: string) => void }) =>
    isOpen ? <button type="button" onClick={() => onConfirm("Customer reason")}>confirm-cancel</button> : null,
}));

const booking: BookingDetail = {
  id: "booking-1",
  tourName: "Da Nang Tour",
  reference: "PATH-1",
  tier: "standard",
  status: "confirmed",
  paymentStatus: "unpaid",
  paymentMethod: "bank_transfer",
  location: "Da Nang",
  duration: "3 days",
  bookingDate: "",
  departureDate: "",
  returnDate: "",
  adults: 2,
  children: 0,
  infants: 0,
  pricePerPerson: 1_000_000,
  totalAmount: 2_000_000,
  paidAmount: 0,
  remainingBalance: 2_000_000,
  image: "",
  description: "",
  highlights: [],
  importantInfo: [],
};

describe("BookingPaymentSummary cancellation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestCancellationMock.mockReturnValue({ unwrap: () => Promise.resolve({ type: "DirectCancel" }) });
  });

  it("notifies the parent to refresh booking data after cancellation succeeds", async () => {
    const onCancellationChanged = vi.fn(() => Promise.resolve());

    render(
      <BookingPaymentSummary
        booking={booking}
        totalGuests={2}
        showPayRemaining={false}
        showCancelBooking={true}
        getPaymentStatusLabel={(status) => status}
        onCancellationChanged={onCancellationChanged}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel booking/i }));
    fireEvent.click(screen.getByRole("button", { name: "confirm-cancel" }));

    await waitFor(() => {
      expect(requestCancellationMock).toHaveBeenCalledWith({
        bookingId: "booking-1",
        reason: "Customer reason",
      });
      expect(onCancellationChanged).toHaveBeenCalledTimes(1);
    });
  });

  it("renders 'Request Cancellation' if the booking has a paid amount > 0", () => {
    const paidBooking = { ...booking, paidAmount: 500_000, remainingBalance: 1_500_000 };
    render(
      <BookingPaymentSummary
        booking={paidBooking}
        totalGuests={2}
        showPayRemaining={false}
        showCancelBooking={true}
        getPaymentStatusLabel={(status) => status}
      />,
    );

    expect(screen.getByRole("button", { name: /request cancellation/i })).toBeInTheDocument();
  });

  it("creates pay-remaining transactions with PayRemain type", async () => {
    vi.mocked(paymentService.createTransaction).mockResolvedValue({
      transactionCode: "PAY-001",
    } as never);

    render(
      <BookingPaymentSummary
        booking={{ ...booking, paidAmount: 500_000, remainingBalance: 1_500_000 }}
        totalGuests={2}
        showPayRemaining={true}
        showCancelBooking={false}
        getPaymentStatusLabel={(status) => status}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /pay now|pay remaining balance/i }));

    await waitFor(() => {
      expect(paymentService.createTransaction).toHaveBeenCalledWith({
        bookingId: "booking-1",
        type: "PayRemain",
        amount: 1_500_000,
        paymentMethod: "BankTransfer",
        paymentNote: "Remaining balance for Da Nang Tour",
        createdBy: "customer@test.com",
      });
    });
  });

  it("routes to the pending visa service fee transaction instead of creating PayRemain", async () => {
    render(
      <BookingPaymentSummary
        booking={{
          ...booking,
          paymentStatus: "partial",
          paidAmount: 2_000_000,
          totalAmount: 2_500_000,
          remainingBalance: 500_000,
          pendingTransactions: [
            {
              transactionCode: "PAY-VISA-001",
              amount: 500_000,
              type: "VisaServiceFee",
              purpose: "Visa Service Fee",
              createdAt: "2026-06-01T00:00:00Z",
              expiresAt: null,
            },
          ],
        }}
        totalGuests={2}
        showPayRemaining={true}
        showCancelBooking={false}
        getPaymentStatusLabel={(status) => status}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /pay remaining balance/i }));

    expect(pushMock).toHaveBeenCalledWith("/payment/PAY-VISA-001?bookingId=booking-1");
    expect(paymentService.createTransaction).not.toHaveBeenCalled();
  });
});

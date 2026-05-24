import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CancelBookingModal } from "../components/CancelBookingModal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string, options?: any) => {
      let text = fallback ?? key;
      if (options) {
        Object.keys(options).forEach((k) => {
          text = text.replace(new RegExp(`{{${k}}}`, "g"), options[k]);
        });
      }
      return text;
    },
    i18n: { language: "en" },
  }),
}));


describe("CancelBookingModal", () => {
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with estimate data", () => {
    render(
      <CancelBookingModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={false}
        isRequesting={false}
        estimate={{
          bookingId: "b-123",
          policyId: "p-456",
          tourScope: "Domestic",
          daysBeforeDeparture: 10,
          feePercent: 30,
          paidAmount: 3000000,
          refundAmount: 2100000,
        }}
      />
    );

    expect(screen.getByText("Confirm Cancellation")).toBeInTheDocument();
    expect(screen.getByText(/30%/)).toBeInTheDocument();
    expect(screen.getByText(/2,100,000/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeInTheDocument();
  });

  it("shows loading state when fetching estimate", () => {
    render(
      <CancelBookingModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={true}
        isRequesting={false}
        estimate={undefined}
      />
    );

    expect(screen.getByText("Loading estimate...")).toBeInTheDocument();
  });

  it("disables confirm button while requesting", () => {
    render(
      <CancelBookingModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={false}
        isRequesting={true}
        estimate={{
          bookingId: "b-123",
          policyId: "p-456",
          tourScope: "Domestic",
          daysBeforeDeparture: 10,
          feePercent: 30,
          paidAmount: 3000000,
          refundAmount: 2100000,
        }}
      />
    );

    const confirmBtn = screen.getByRole("button", { name: /requesting/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("calls onConfirm with reason when submitted", () => {
    render(
      <CancelBookingModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={false}
        isRequesting={false}
        estimate={{
          bookingId: "b-123",
          policyId: null,
          tourScope: "Domestic",
          daysBeforeDeparture: 10,
          feePercent: 30,
          paidAmount: 3000000,
          refundAmount: 2100000,
        }}
      />
    );

    const input = screen.getByPlaceholderText(/reason for cancellation/i);
    fireEvent.change(input, { target: { value: "Personal reasons" } });

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmBtn);

    expect(mockOnConfirm).toHaveBeenCalledWith("Personal reasons");
  });

  it("calls onClose when cancel is clicked", () => {
    render(
      <CancelBookingModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={false}
        isRequesting={false}
        estimate={undefined}
      />
    );

    const closeBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders simplified warning for unpaid booking", () => {
    render(
      <CancelBookingModal
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        isLoading={false}
        isRequesting={false}
        estimate={{
          bookingId: "b-123",
          policyId: null,
          tourScope: "Domestic",
          daysBeforeDeparture: 10,
          feePercent: 0,
          paidAmount: 0,
          refundAmount: 0,
        }}
      />
    );

    expect(screen.getByText("Confirm Cancellation")).toBeInTheDocument();
    expect(screen.getByText(/You have not made any payment for this booking/i)).toBeInTheDocument();
    expect(screen.queryByText("Paid Amount:")).not.toBeInTheDocument();
    expect(screen.queryByText(/Estimated Refund:/i)).not.toBeInTheDocument();
  });
});

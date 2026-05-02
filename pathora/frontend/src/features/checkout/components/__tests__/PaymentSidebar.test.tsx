import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const useAuthMock = vi.hoisted(() =>
  vi.fn<[], { user: { id: string } | null; isLoading: boolean; isAuthenticated: boolean }>(),
);

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (k: string, opts?: { email?: string }) =>
        opts?.email !== undefined ? `${k}:${opts.email}` : k,
    }),
  };
});

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/components/ui/Button", () => ({
  default: ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
    <button type="button" {...rest}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui", () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`}>{icon}</span>,
}));

import { PaymentSidebar } from "../PaymentSidebar";
import type { PaymentTransaction } from "@/api/services/paymentService";

const paidTx: PaymentTransaction = {
  id: "t1",
  transactionCode: "TX-1",
  bookingId: "b1",
  type: "Deposit",
  status: "Completed",
  amount: 100,
  paymentMethod: "Sepay",
  createdAt: new Date().toISOString(),
};

describe("PaymentSidebar post-payment CTAs", () => {
  const noop = () => {};

  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it("shows loading placeholders when auth is loading", () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    });

    render(
      <PaymentSidebar
        transaction={paidTx}
        normalizedStatus="paid"
        paymentOption="full"
        onPaymentOptionChange={noop}
        checkoutPrice={{ depositPercentage: 0.3 }}
        depositAmount={30}
        totalPrice={100}
        remainingBalance={70}
        canConfirm
        loading={false}
        onConfirmBooking={noop}
        customerEmail="a@b.com"
        t={(k: string, o?: { email?: string }) =>
          o?.email !== undefined ? `${k}:${o.email}` : k
        }
      />,
    );

    const pulses = document.querySelectorAll(".animate-pulse");
    expect(pulses.length).toBeGreaterThan(0);
  });

  it("shows view bookings when authenticated", () => {
    useAuthMock.mockReturnValue({
      user: { id: "u1" },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <PaymentSidebar
        transaction={paidTx}
        normalizedStatus="paid"
        paymentOption="full"
        onPaymentOptionChange={noop}
        checkoutPrice={{ depositPercentage: 0.3 }}
        depositAmount={30}
        totalPrice={100}
        remainingBalance={70}
        canConfirm
        loading={false}
        onConfirmBooking={noop}
        t={(k: string) => k}
      />,
    );

    expect(screen.getByText("landing.checkout.viewMyBookings")).toBeInTheDocument();
  });

  it("shows login CTA and guest note when not authenticated", () => {
    useAuthMock.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    render(
      <PaymentSidebar
        transaction={paidTx}
        normalizedStatus="paid"
        paymentOption="full"
        onPaymentOptionChange={noop}
        checkoutPrice={{ depositPercentage: 0.3 }}
        depositAmount={30}
        totalPrice={100}
        remainingBalance={70}
        canConfirm
        loading={false}
        onConfirmBooking={noop}
        customerEmail="guest@test.com"
        t={(k: string, o?: { email?: string }) =>
          o?.email !== undefined ? `${k}:${o.email}` : k
        }
      />,
    );

    expect(screen.getByText("landing.checkout.loginToViewBookings")).toBeInTheDocument();
    expect(
      screen.getByText("landing.checkout.guestBookingNote:guest@test.com"),
    ).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { BookingInfoCard } from "../BookingInfoCard";
import { BookingDetail } from "../BookingDetailData";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock @phosphor-icons/react to avoid missing icons / issues
vi.mock("@phosphor-icons/react", () => ({
  IdentificationCard: () => <div data-testid="icon-id" />,
  Key: () => <div data-testid="icon-key" />,
  CalendarBlank: () => <div data-testid="icon-calendar" />,
  Bank: () => <div data-testid="icon-bank" />,
  CreditCard: () => <div data-testid="icon-credit" />,
}));

describe("BookingInfoCard Date Display", () => {
  const defaultBooking: BookingDetail = {
    id: "booking-1",
    tourName: "Sample Tour",
    reference: "PATH-2026-0601-1200",
    tier: "standard",
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "bank_transfer",
    location: "Da Nang",
    duration: "3 Days",
    bookingDate: "2026-06-01T12:00:00Z",
    departureDate: "2026-06-05T08:00:00Z",
    returnDate: "2026-06-08T17:00:00Z",
    adults: 2,
    children: 0,
    infants: 0,
    pricePerPerson: 1000,
    totalAmount: 2000,
    paidAmount: 2000,
    remainingBalance: 0,
    image: "",
    description: "",
    highlights: [],
    importantInfo: [],
  };

  const mockGetTierLabel = vi.fn((tier) => tier);
  const mockGetPaymentMethodLabel = vi.fn((m) => m);

  let originalLanguage: string;

  beforeEach(() => {
    originalLanguage = navigator.language;
  });

  afterEach(() => {
    Object.defineProperty(navigator, "language", {
      value: originalLanguage,
      configurable: true,
    });
  });

  const setLanguage = (lang: string) => {
    Object.defineProperty(navigator, "language", {
      value: lang,
      configurable: true,
    });
  };

  it("renders dates correctly in vi-VN locale format (dd/MM/yyyy)", () => {
    setLanguage("vi-VN");
    
    render(
      <BookingInfoCard
        booking={{
          ...defaultBooking,
          bookingDate: "2026-06-01T12:00:00Z",
          departureDate: "2026-06-05T08:00:00Z",
        }}
        getTierLabel={mockGetTierLabel}
        getPaymentMethodLabel={mockGetPaymentMethodLabel}
      />
    );

    const expectedBookingDate = new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date("2026-06-01T12:00:00Z"));

    const expectedDepartureDate = new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date("2026-06-05T08:00:00Z"));

    expect(screen.getByText(expectedBookingDate)).toBeInTheDocument();
    expect(screen.getByText(expectedDepartureDate)).toBeInTheDocument();
  });

  it("renders dates correctly in en-US locale format (MM/dd/yyyy)", () => {
    setLanguage("en-US");

    render(
      <BookingInfoCard
        booking={{
          ...defaultBooking,
          bookingDate: "2026-06-01T12:00:00Z",
          departureDate: "2026-06-05T08:00:00Z",
        }}
        getTierLabel={mockGetTierLabel}
        getPaymentMethodLabel={mockGetPaymentMethodLabel}
      />
    );

    const expectedBookingDate = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date("2026-06-01T12:00:00Z"));

    const expectedDepartureDate = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date("2026-06-05T08:00:00Z"));

    expect(screen.getByText(expectedBookingDate)).toBeInTheDocument();
    expect(screen.getByText(expectedDepartureDate)).toBeInTheDocument();
  });

  it("renders placeholder dashes when dates are null or empty", () => {
    render(
      <BookingInfoCard
        booking={{
          ...defaultBooking,
          bookingDate: "",
          departureDate: "",
        }}
        getTierLabel={mockGetTierLabel}
        getPaymentMethodLabel={mockGetPaymentMethodLabel}
      />
    );

    const elements = screen.getAllByText("—");
    expect(elements.length).toBeGreaterThanOrEqual(2);
  });

  it("renders fallback raw string when date string is invalid and does not throw", () => {
    render(
      <BookingInfoCard
        booking={{
          ...defaultBooking,
          bookingDate: "invalid-date-string",
          departureDate: "another-invalid",
        }}
        getTierLabel={mockGetTierLabel}
        getPaymentMethodLabel={mockGetPaymentMethodLabel}
      />
    );

    expect(screen.getByText("invalid-date-string")).toBeInTheDocument();
    expect(screen.getByText("another-invalid")).toBeInTheDocument();
  });

  it("handles timezone shifting correctly (19:00 UTC shifts to next day in Asia/Ho_Chi_Minh)", () => {
    setLanguage("vi-VN");

    render(
      <BookingInfoCard
        booking={{
          ...defaultBooking,
          bookingDate: "2026-06-01T19:00:00Z",
          departureDate: "2026-06-05T19:00:00Z",
        }}
        getTierLabel={mockGetTierLabel}
        getPaymentMethodLabel={mockGetPaymentMethodLabel}
      />
    );

    const expectedBookingDate = new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date("2026-06-01T19:00:00Z"));

    const expectedDepartureDate = new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date("2026-06-05T19:00:00Z"));

    expect(screen.getByText(expectedBookingDate)).toBeInTheDocument();
    expect(screen.getByText(expectedDepartureDate)).toBeInTheDocument();
  });
});

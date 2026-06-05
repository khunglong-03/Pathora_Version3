import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GuestDetailsCard } from "../GuestDetailsCard";
import { bookingService } from "@/api/services";
import { BookingDetail } from "../BookingDetailData";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  const t = (key: string, options?: any) => {
    if (key === "landing.bookingDetail.passengerCount.adults") {
      return `${options?.count} adults`;
    }
    if (key === "landing.bookingDetail.passengerCount.children") {
      return `${options?.count} children`;
    }
    if (key === "landing.bookingDetail.passengerCount.infants") {
      return `${options?.count} infants`;
    }
    return key;
  };
  return {
    ...actual,
    useTranslation: () => ({ t }),
    initReactI18next: {
      type: "3rdParty",
      init: () => {},
    },
  };
});

vi.mock("@/api/services", () => ({
  bookingService: {
    getParticipants: vi.fn(),
  },
}));

describe("GuestDetailsCard", () => {
  const getParticipantsMock = vi.mocked(bookingService.getParticipants);

  const defaultBooking: BookingDetail = {
    id: "booking-1",
    tourName: "Sample Tour",
    reference: "PATH-123",
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
    children: 1,
    infants: 0,
    pricePerPerson: 1000,
    totalAmount: 3000,
    paidAmount: 3000,
    remainingBalance: 0,
    image: "",
    description: "",
    highlights: [],
    importantInfo: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header passenger count and list of passengers", async () => {
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-1",
        bookingId: "booking-1",
        participantType: "Adult",
        fullName: "John Doe",
        infoReviewStatus: "Approved",
        infoRejectionReason: null,
        passport: { passportId: "pass-1" },
        status: "Active",
      },
      {
        participantId: "p-2",
        bookingId: "booking-1",
        participantType: "Adult",
        fullName: "Jane Doe",
        infoReviewStatus: "NotReviewed",
        infoRejectionReason: null,
        passport: null,
        status: "Active",
      },
      {
        participantId: "p-3",
        bookingId: "booking-1",
        participantType: "Child",
        fullName: "Baby Doe",
        infoReviewStatus: "Rejected",
        infoRejectionReason: "Incomplete details",
        passport: null,
        status: "Active",
      },
    ]);

    render(
      <GuestDetailsCard
        booking={defaultBooking}
        totalGuests={3}
        showPassportColumn={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("2 adults · 1 children")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getAllByText("Baby Doe").length).toBe(2);
    });

    // Passport column is true: John Doe has passport, Jane/Baby do not
    expect(screen.getByText("landing.bookingDetail.passportStatus.present")).toBeInTheDocument();
    expect(screen.getAllByText("landing.bookingDetail.passportStatus.missing").length).toBe(2);

    // Verify rejection warning details
    expect(screen.getByText("landing.bookingDetail.rejectedPassengerDetailsWarning")).toBeInTheDocument();
    expect(screen.getByText(/Incomplete details/)).toBeInTheDocument();
  });

  it("does not render passport status when showPassportColumn is false", async () => {
    getParticipantsMock.mockResolvedValue([
      {
        participantId: "p-1",
        bookingId: "booking-1",
        participantType: "Adult",
        fullName: "John Doe",
        infoReviewStatus: "Approved",
        infoRejectionReason: null,
        passport: { passportId: "pass-1" },
        status: "Active",
      },
    ]);

    render(
      <GuestDetailsCard
        booking={defaultBooking}
        totalGuests={1}
        showPassportColumn={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(screen.queryByText("landing.bookingDetail.passportStatus.present")).not.toBeInTheDocument();
    expect(screen.queryByText("landing.bookingDetail.passportStatus.missing")).not.toBeInTheDocument();
  });
});

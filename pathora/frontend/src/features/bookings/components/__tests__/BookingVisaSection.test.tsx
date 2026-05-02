import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingVisaSection } from "../BookingVisaSection";
import { bookingService } from "@/api/services";
import { toast } from "react-toastify";

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("react-i18next", () => {
  const t = (_key: string, fallback?: string) => fallback ?? _key;
  return {
    useTranslation: () => ({ t }),
  };
});

vi.mock("@/api/services", () => ({
  bookingService: {
    getVisaRequirements: vi.fn(),
    requestVisaSupport: vi.fn(),
    upsertParticipantPassport: vi.fn(),
    submitVisaApplication: vi.fn(),
    updateVisaApplication: vi.fn(),
  },
}));

vi.mock("../VisaUploadForm", () => ({
  VisaUploadForm: ({ onSubmitPassport, onSubmitVisaApp, isResubmitting }: any) => (
    <div data-testid="visa-upload-form">
      <button data-testid="submit-passport-btn" onClick={() => onSubmitPassport({})}>Submit Passport</button>
      <button data-testid="submit-visa-app-btn" onClick={() => onSubmitVisaApp({})}>Submit Visa</button>
      {isResubmitting && <span data-testid="is-resubmitting">Resubmitting</span>}
    </div>
  ),
}));

describe("BookingVisaSection", () => {
  const getVisaRequirementsMock = vi.mocked(bookingService.getVisaRequirements);
  const requestVisaSupportMock = vi.mocked(bookingService.requestVisaSupport);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    getVisaRequirementsMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(<BookingVisaSection bookingId="bk-1" />);
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("returns null if not visa required", async () => {
    getVisaRequirementsMock.mockResolvedValue({
      isVisaRequired: false,
      participants: [],
    });
    const { container } = render(<BookingVisaSection bookingId="bk-1" />);
    await waitFor(() => {
      expect(container.querySelector(".animate-pulse")).not.toBeInTheDocument();
    });
    expect(container.firstChild).toBeNull();
  });

  it("shows missing DOB state and hides CTA", async () => {
    getVisaRequirementsMock.mockResolvedValue({
      isVisaRequired: true,
      participants: [
        {
          id: "p-1",
          fullName: "John Doe",
          dateOfBirth: null,
          missingDateOfBirth: true,
          passport: null,
          latestVisaApplication: null,
          requiresVisa: true,
          availableActions: ["Submit"],
        },
      ],
    });
    render(<BookingVisaSection bookingId="bk-1" />);

    await waitFor(() => {
      expect(screen.getByText("landing.visa.missingDob")).toBeInTheDocument();
    });
    expect(screen.queryByText("landing.visa.provideDetails")).not.toBeInTheDocument();
  });

  it("shows missing passport state", async () => {
    getVisaRequirementsMock.mockResolvedValue({
      isVisaRequired: true,
      participants: [
        {
          id: "p-1",
          fullName: "John Doe",
          dateOfBirth: "1990-01-01",
          missingDateOfBirth: false,
          passport: null,
          latestVisaApplication: null,
          requiresVisa: true,
          availableActions: ["Submit"],
        },
      ],
    });
    render(<BookingVisaSection bookingId="bk-1" />);

    await waitFor(() => {
      expect(screen.getByText("landing.visa.missingPassport")).toBeInTheDocument();
      expect(screen.getByText("landing.visa.provideDetails")).toBeInTheDocument();
    });
  });

  it("shows rejected state and resubmit CTA", async () => {
    getVisaRequirementsMock.mockResolvedValue({
      isVisaRequired: true,
      participants: [
        {
          id: "p-1",
          fullName: "John Doe",
          dateOfBirth: "1990-01-01",
          missingDateOfBirth: false,
          passport: {
            passportNumber: "123",
            nationality: "US",
            issuedAt: "2020-01-01",
            expiresAt: "2030-01-01",
            fileUrl: "url",
          },
          latestVisaApplication: {
            id: "app-1",
            status: "Rejected",
            refusalReason: "Blurry image",
            destinationCountry: "VN",
            isSystemAssisted: false,
          },
          requiresVisa: true,
          availableActions: ["Submit"],
        },
      ],
    });
    render(<BookingVisaSection bookingId="bk-1" />);

    await waitFor(() => {
      expect(screen.getByText("landing.visa.rejected")).toBeInTheDocument();
      expect(screen.getByText("Blurry image")).toBeInTheDocument();
      expect(screen.getByText("landing.visa.resubmit")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("landing.visa.resubmit"));
    expect(screen.getByTestId("visa-upload-form")).toBeInTheDocument();
    expect(screen.getByTestId("is-resubmitting")).toBeInTheDocument();
  });

  it("shows approved progress", async () => {
    getVisaRequirementsMock.mockResolvedValue({
      isVisaRequired: true,
      participants: [
        {
          id: "p-1",
          fullName: "John Doe",
          dateOfBirth: "1990-01-01",
          missingDateOfBirth: false,
          passport: {
            passportNumber: "123",
            nationality: "US",
            issuedAt: "2020-01-01",
            expiresAt: "2030-01-01",
            fileUrl: "url",
          },
          latestVisaApplication: {
            id: "app-1",
            status: "Approved",
            refusalReason: null,
            destinationCountry: "VN",
            isSystemAssisted: false,
          },
          requiresVisa: true,
          availableActions: [],
        },
      ],
    });
    render(<BookingVisaSection bookingId="bk-1" />);

    await waitFor(() => {
      expect(screen.getByText("landing.visa.approved")).toBeInTheDocument();
    });
    
    // Progress should be "1 / 1" - wait for it
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("/ 1")).toBeInTheDocument();
  });

  it("handles support request", async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    requestVisaSupportMock.mockResolvedValue({
      serviceFeeQuoted: true,
      message: "Support fee quoted successfully.",
      transactionId: "tx-1",
    });
    
    getVisaRequirementsMock.mockResolvedValue({
      isVisaRequired: true,
      participants: [
        {
          id: "p-1",
          fullName: "John Doe",
          dateOfBirth: "1990-01-01",
          missingDateOfBirth: false,
          passport: null,
          latestVisaApplication: null,
          requiresVisa: true,
          availableActions: ["RequestSupport"],
        },
      ],
    });
    render(<BookingVisaSection bookingId="bk-1" />);

    await waitFor(() => {
      expect(screen.getByText("landing.visa.requestSupport")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("landing.visa.requestSupport"));

    await waitFor(() => {
      expect(requestVisaSupportMock).toHaveBeenCalledWith("bk-1", "p-1");
      expect(toast.info).toHaveBeenCalledWith("Support fee quoted successfully.");
    });
  });
});

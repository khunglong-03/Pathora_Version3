import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VisaUploadForm } from "../VisaUploadForm";
import { VisaRequirementParticipant } from "@/types/booking";

vi.mock("react-i18next", () => {
  const t = (_key: string, fallback?: string) => fallback ?? _key;
  return {
    useTranslation: () => ({ t }),
  };
});

describe("VisaUploadForm", () => {
  const mockOnSubmitPassport = vi.fn();
  const mockOnSubmitVisaApp = vi.fn();
  const mockOnCancel = vi.fn();

  const baseParticipant: VisaRequirementParticipant = {
    id: "p-1",
    fullName: "John Doe",
    dateOfBirth: "1990-01-01",
    missingDateOfBirth: false,
    passport: null,
    latestVisaApplication: null,
    requiresVisa: true,
    availableActions: ["Submit"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows passport fields if passport is missing", () => {
    render(
      <VisaUploadForm
        participant={baseParticipant}
        tourReturnDate="2026-05-10"
        destinationCountry="VN"
        isResubmitting={false}
        onSubmitPassport={mockOnSubmitPassport}
        onSubmitVisaApp={mockOnSubmitVisaApp}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText("landing.visa.passportDetails")).toBeInTheDocument();
    expect(screen.getByText("landing.visa.passportNumber")).toBeInTheDocument();
    expect(screen.getByText("landing.visa.visaApplicationDetails")).toBeInTheDocument();
  });

  it("hides passport fields if passport exists", () => {
    const participantWithPassport: VisaRequirementParticipant = {
      ...baseParticipant,
      passport: {
        passportNumber: "A123",
        nationality: "US",
        issuedDate: "2020-01-01",
        expiryDate: "2030-01-01",
      } as any,
    };

    render(
      <VisaUploadForm
        participant={participantWithPassport}
        tourReturnDate="2026-05-10"
        destinationCountry="VN"
        isResubmitting={false}
        onSubmitPassport={mockOnSubmitPassport}
        onSubmitVisaApp={mockOnSubmitVisaApp}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByText("landing.visa.passportDetails")).not.toBeInTheDocument();
    expect(screen.getByText("landing.visa.visaApplicationDetails")).toBeInTheDocument();
  });

  it("validates required fields when passport is missing", async () => {
    render(
      <VisaUploadForm
        participant={baseParticipant}
        tourReturnDate="2026-05-10"
        destinationCountry="VN"
        isResubmitting={false}
        onSubmitPassport={mockOnSubmitPassport}
        onSubmitVisaApp={mockOnSubmitVisaApp}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.click(screen.getByText("common.submit"));

    await waitFor(() => {
      expect(screen.getByText("landing.visa.passportRequired")).toBeInTheDocument();
      expect(screen.getByText("landing.visa.nationalityRequired")).toBeInTheDocument();
      expect(screen.getByText("landing.visa.issuedAtRequired")).toBeInTheDocument();
      expect(screen.getByText("landing.visa.expiresAtRequired")).toBeInTheDocument();
      expect(screen.getByText("landing.visa.passportFileRequired")).toBeInTheDocument();
    });

    expect(mockOnSubmitPassport).not.toHaveBeenCalled();
    expect(mockOnSubmitVisaApp).not.toHaveBeenCalled();
  });

  it("validates expiresAt after tourReturnDate", async () => {
    render(
      <VisaUploadForm
        participant={baseParticipant}
        tourReturnDate="2026-05-10"
        destinationCountry="VN"
        isResubmitting={false}
        onSubmitPassport={mockOnSubmitPassport}
        onSubmitVisaApp={mockOnSubmitVisaApp}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(document.querySelector("input[name='passportNumber']")!, { target: { value: "A123" } });
    fireEvent.change(document.querySelector("input[name='nationality']")!, { target: { value: "US" } });
    fireEvent.change(document.querySelector("input[name='issuedAt']")!, { target: { value: "2020-01-01" } });
    fireEvent.change(document.querySelector("input[name='expiresAt']")!, { target: { value: "2026-05-09" } });
    fireEvent.change(document.querySelector("input[name='fileUrl']")!, { target: { value: "http://file.com" } });

    fireEvent.click(screen.getByText("common.submit"));

    await waitFor(() => {
      expect(screen.getByText("landing.visa.passportMustExpireAfterReturn")).toBeInTheDocument();
    });

    expect(mockOnSubmitPassport).not.toHaveBeenCalled();
  });

  it("submits valid data", async () => {
    render(
      <VisaUploadForm
        participant={baseParticipant}
        tourReturnDate="2026-05-10"
        destinationCountry="VN"
        isResubmitting={false}
        onSubmitPassport={mockOnSubmitPassport}
        onSubmitVisaApp={mockOnSubmitVisaApp}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.change(document.querySelector("input[name='passportNumber']")!, { target: { value: "A123" } });
    fireEvent.change(document.querySelector("input[name='nationality']")!, { target: { value: "US" } });
    fireEvent.change(document.querySelector("input[name='issuedAt']")!, { target: { value: "2020-01-01" } });
    fireEvent.change(document.querySelector("input[name='expiresAt']")!, { target: { value: "2026-06-01" } });
    fireEvent.change(document.querySelector("input[name='fileUrl']")!, { target: { value: "http://passport.com" } });
    fireEvent.change(document.querySelector("input[name='visaFileUrl']")!, { target: { value: "http://visa.com" } });

    fireEvent.click(screen.getByText("common.submit"));

    await waitFor(() => {
      // If there are validation errors, they will appear as text-red-500
      const errors = document.querySelectorAll('.text-red-500');
      if (errors.length > 0) {
        console.error("Validation errors found:", Array.from(errors).map(e => e.textContent));
      }
      expect(errors.length).toBe(0);

      expect(mockOnSubmitPassport).toHaveBeenCalledWith({
        passportNumber: "A123",
        nationality: "US",
        issuedAt: "2020-01-01",
        expiresAt: "2026-06-01",
        fileUrl: "http://passport.com",
      });

      expect(mockOnSubmitVisaApp).toHaveBeenCalledWith({
        destinationCountry: "VN",
        minReturnDate: "2026-05-10",
        visaFileUrl: "http://visa.com",
        isResubmitting: false,
      });
    });
  });
});

import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VisaApplicationsPage } from "../VisaApplicationsPage";
import { managerService } from "@/api/services/managerService";
import { adminService } from "@/api/services/adminService";
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
    initReactI18next: {
      type: "3rdParty",
      init: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/manager/visa-applications",
}));

vi.mock("@/api/services/managerService", () => ({
  managerService: {
    getOverview: vi.fn(),
    quoteVisaFee: vi.fn(),
    updateVisaStatus: vi.fn(),
    getVisaApplication: vi.fn(),
    registerVisaDetails: vi.fn(),
  },
}));

vi.mock("@/api/services/adminService", () => ({
  adminService: {
    getOverview: vi.fn(),
  },
}));

vi.mock("@/components/ui/SkeletonTable", () => ({
  SkeletonTable: () => <div data-testid="skeleton-table">Loading...</div>,
}));

describe("VisaApplicationsPage", () => {
  const getOverviewMock = vi.mocked(managerService.getOverview);
  const quoteVisaFeeMock = vi.mocked(managerService.quoteVisaFee);
  const updateVisaStatusMock = vi.mocked(managerService.updateVisaStatus);
  const getVisaApplicationMock = vi.mocked(managerService.getVisaApplication);

  beforeEach(() => {
    vi.clearAllMocks();
    window.prompt = vi.fn();
    window.confirm = vi.fn().mockReturnValue(true);
  });

  const mockVisaApplications = [
    { id: "VISA-001", booking: "Japan Sakura Tour", applicant: "Nguyen Van A", passport: "P1234567", country: "Japan", type: "Tourist", status: "approved", submittedDate: "Feb 15, 2026", decisionDate: "Mar 1, 2026" },
    { id: "VISA-002", booking: "Korea Autumn Adventure", applicant: "Tran Thi B", passport: "P7654321", country: "South Korea", type: "Tourist", status: "pending", submittedDate: "Mar 5, 2026", decisionDate: "-" },
    { id: "VISA-003", booking: "Europe Grand Tour", applicant: "Le Van C", passport: "P9876543", country: "Schengen", type: "Tourist", status: "under_review", submittedDate: "Feb 28, 2026", decisionDate: "-" },
  ];

  it("loads and displays data correctly", async () => {
    getOverviewMock.mockResolvedValue({ visaApplications: mockVisaApplications } as any);
    render(<VisaApplicationsPage />);

    expect(screen.getByTestId("skeleton-table")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId("skeleton-table")).not.toBeInTheDocument();
      expect(screen.getByText("Japan Sakura Tour")).toBeInTheDocument();
      expect(screen.getByText("Korea Autumn Adventure")).toBeInTheDocument();
    });
  });

  it("filters correctly by status", async () => {
    getOverviewMock.mockResolvedValue({ visaApplications: mockVisaApplications } as any);
    render(<VisaApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Japan Sakura Tour")).toBeInTheDocument();
    });

    // Click Pending filter button
    fireEvent.click(screen.getByRole("button", { name: /Pending/i }));

    await waitFor(() => {
      expect(screen.queryByText("Japan Sakura Tour")).not.toBeInTheDocument();
      expect(screen.getByText("Korea Autumn Adventure")).toBeInTheDocument();
    });
  });

  it("handles unified register details and fee action in sequential modal", async () => {
    getOverviewMock.mockResolvedValue({ visaApplications: mockVisaApplications } as any);
    getVisaApplicationMock.mockResolvedValue({
      id: "VISA-002",
      participantName: "Tran Thi B",
      passportNumber: "P7654321",
      destinationCountry: "Korea",
      status: "pending",
      isSystemAssisted: true,
      serviceFee: 0,
    } as any);
    const registerVisaDetailsMock = vi.mocked(managerService.registerVisaDetails);
    registerVisaDetailsMock.mockResolvedValue({});

    render(<VisaApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Korea Autumn Adventure")).toBeInTheDocument();
    });

    // Click Review Visa button on the Korea Bento Card
    const reviewBtns = screen.getAllByRole("button", { name: /Review Visa/i });
    fireEvent.click(reviewBtns[1]);

    await waitFor(() => {
      expect(getVisaApplicationMock).toHaveBeenCalledWith("VISA-002");
    });

    // Input the fee amount in Modal by placeholder
    const feeInput = screen.getByPlaceholderText(/e.g. 1500000/i);
    fireEvent.change(feeInput, { target: { value: "500000" } });

    // Input visa details
    const numberInput = screen.getByPlaceholderText(/Ex: V123456/i);
    fireEvent.change(numberInput, { target: { value: "V-999" } });

    const authorityInput = screen.getByPlaceholderText(/Ex: Đại sứ quán Nhật Bản/i);
    fireEvent.change(authorityInput, { target: { value: "Embassy" } });

    const issuedAtInput = screen.getByLabelText(/Ngày cấp/i);
    fireEvent.change(issuedAtInput, { target: { value: "2026-06-01" } });

    const expiresAtInput = screen.getByLabelText(/Ngày hết hạn/i);
    fireEvent.change(expiresAtInput, { target: { value: "2026-09-01" } });

    // Submit Unified Form
    const submitBtn = screen.getByRole("button", { name: /Lưu & Duyệt Visa/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(registerVisaDetailsMock).toHaveBeenCalledWith({
        visaApplicationId: "VISA-002",
        visaNumber: "V-999",
        issuingAuthority: "Embassy",
        issuedAt: "2026-06-01T00:00:00.000Z",
        expiresAt: "2026-09-01T00:00:00.000Z",
        serviceFee: 500000,
        category: undefined,
        destinationCountry: "Korea",
        entryType: undefined,
        format: undefined,
        maxStayDays: undefined,
        visaFileUrl: undefined
      });
    });
  });

  it("handles approve action in sequential modal", async () => {
    getOverviewMock.mockResolvedValue({ visaApplications: mockVisaApplications } as any);
    getVisaApplicationMock.mockResolvedValue({
      id: "VISA-003",
      participantName: "Le Van C",
      passportNumber: "P9876543",
      destinationCountry: "Schengen",
      status: "under_review",
      isSystemAssisted: false,
      visaFileUrl: "https://test-pdf.com/visa.pdf",
    } as any);
    updateVisaStatusMock.mockResolvedValue({});

    render(<VisaApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Europe Grand Tour")).toBeInTheDocument();
    });

    // Click Review Visa on Europe Bento Card
    const reviewBtns = screen.getAllByRole("button", { name: /Review Visa/i });
    fireEvent.click(reviewBtns[2]);

    await waitFor(() => {
      expect(getVisaApplicationMock).toHaveBeenCalledWith("VISA-003");
    });

    // Click Approve button in Modal by class selector to avoid duplicate role match
    const approveBtns = screen.getAllByRole("button", { name: /Approve/i });
    const approveBtn = approveBtns.find(btn => btn.className.includes("bg-emerald-600")) || approveBtns[0];
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(updateVisaStatusMock).toHaveBeenCalledWith({ visaApplicationId: "VISA-003", status: 3, refusalReason: undefined, visaFileUrl: "https://test-pdf.com/visa.pdf" });
    });
  });

  it("handles reject action in sequential modal", async () => {
    getOverviewMock.mockResolvedValue({ visaApplications: mockVisaApplications } as any);
    getVisaApplicationMock.mockResolvedValue({
      id: "VISA-003",
      participantName: "Le Van C",
      passportNumber: "P9876543",
      destinationCountry: "Schengen",
      status: "under_review",
      isSystemAssisted: false,
      visaFileUrl: "https://test-pdf.com/visa.pdf",
    } as any);
    updateVisaStatusMock.mockResolvedValue({});

    render(<VisaApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Europe Grand Tour")).toBeInTheDocument();
    });

    // Click Review Visa on Europe Bento Card
    const reviewBtns = screen.getAllByRole("button", { name: /Review Visa/i });
    fireEvent.click(reviewBtns[2]);

    await waitFor(() => {
      expect(getVisaApplicationMock).toHaveBeenCalledWith("VISA-003");
    });

    // Fill in rejection reason by placeholder
    const reasonTextarea = screen.getByPlaceholderText(/Enter reason.../i);
    fireEvent.change(reasonTextarea, { target: { value: "Blurry photo" } });

    // Click Reject button in Modal
    const rejectBtns = screen.getAllByRole("button", { name: /Reject/i });
    const rejectBtn = rejectBtns.find(btn => btn.className.includes("bg-red-50")) || rejectBtns[0];
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(updateVisaStatusMock).toHaveBeenCalledWith({ visaApplicationId: "VISA-003", status: 4, refusalReason: "Blurry photo", visaFileUrl: undefined });
    });
  });
});

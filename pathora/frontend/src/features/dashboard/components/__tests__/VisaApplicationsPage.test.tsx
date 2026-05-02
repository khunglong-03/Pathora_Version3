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

    // Click Pending filter
    const pendingFilters = screen.getAllByText("Pending");
    fireEvent.click(pendingFilters[0]); // First one should be the filter button if we are careful, or we can use getByRole but we just click the first one that is clickable. Or better, we can find the button.
    // Actually, let's just click the button with role:
    fireEvent.click(screen.getByRole("button", { name: /Pending/i }));

    await waitFor(() => {
      expect(screen.queryByText("Japan Sakura Tour")).not.toBeInTheDocument();
      expect(screen.getByText("Korea Autumn Adventure")).toBeInTheDocument();
    });
  });

  it("handles quote fee action", async () => {
    getOverviewMock.mockResolvedValue({ visaApplications: mockVisaApplications } as any);
    window.prompt = vi.fn().mockReturnValue("500000");
    quoteVisaFeeMock.mockResolvedValue({});

    render(<VisaApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Korea Autumn Adventure")).toBeInTheDocument();
    });

    const quoteBtn = screen.getByText("Quote Fee");
    fireEvent.click(quoteBtn);

    await waitFor(() => {
      expect(window.prompt).toHaveBeenCalledWith("Enter fee amount in VND:");
      expect(quoteVisaFeeMock).toHaveBeenCalledWith({ visaApplicationId: "VISA-002", fee: 500000 });
      expect(toast.success).toHaveBeenCalledWith("Fee quoted successfully");
    });
  });

  it("handles approve action", async () => {
    getOverviewMock.mockResolvedValue({ visaApplications: mockVisaApplications } as any);
    updateVisaStatusMock.mockResolvedValue({});

    render(<VisaApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Europe Grand Tour")).toBeInTheDocument();
    });

    const approveBtns = screen.getAllByText("Approve");
    fireEvent.click(approveBtns[0]); // First under_review application's approve button

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to approve this visa application?");
      expect(updateVisaStatusMock).toHaveBeenCalledWith({ visaApplicationId: "VISA-003", status: 3 });
      expect(toast.success).toHaveBeenCalledWith("Visa application approved");
    });
  });

  it("handles reject action", async () => {
    getOverviewMock.mockResolvedValue({ visaApplications: mockVisaApplications } as any);
    updateVisaStatusMock.mockResolvedValue({});
    window.prompt = vi.fn().mockReturnValue("Blurry photo");

    render(<VisaApplicationsPage />);

    await waitFor(() => {
      expect(screen.getByText("Europe Grand Tour")).toBeInTheDocument();
    });

    const rejectBtns = screen.getAllByText("Reject");
    fireEvent.click(rejectBtns[0]); // First under_review application's reject button

    await waitFor(() => {
      expect(window.prompt).toHaveBeenCalledWith("Enter reason for rejection:");
      expect(updateVisaStatusMock).toHaveBeenCalledWith({ visaApplicationId: "VISA-003", status: 4, refusalReason: "Blurry photo" });
      expect(toast.success).toHaveBeenCalledWith("Visa application rejected");
    });
  });
});

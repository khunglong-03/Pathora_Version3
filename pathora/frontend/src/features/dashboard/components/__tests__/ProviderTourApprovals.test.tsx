import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import ProviderTourApprovals from "../ProviderTourApprovals";
import { tourInstanceService } from "@/api/services/tourInstanceService";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getProviderAssigned: vi.fn(),
  },
}));

describe("ProviderTourApprovals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no activities are assigned", async () => {
    vi.mocked(tourInstanceService.getProviderAssigned).mockResolvedValue({
      total: 0,
      data: [],
    });

    render(<ProviderTourApprovals providerType="hotel" />);

    await waitFor(() => {
      expect(screen.getByText("Không có yêu cầu nào")).toBeInTheDocument();
    });
  });

  it("renders N cards when there are N activity assignments", async () => {
    const mockInstances = [
      {
        id: "tour-1",
        tourCode: "TC-1",
        title: "Ha Long Cruise",
        status: "pendingapproval",
        currentParticipation: 5,
        maxParticipation: 10,
        basePrice: 5000000,
        assignedActivities: [
          {
            activityId: "act-1",
            tourInstanceDayId: "day-1",
            dayNumber: 1,
            actualDate: "2026-05-28T00:00:00Z",
            activityType: "Accommodation",
            supplierId: "sup-1",
            supplierName: "Hotel Metropole",
            approvalStatus: "pending",
            accommodation: {
              roomType: "Deluxe",
              quantity: 2,
            },
          },
          {
            activityId: "act-2",
            tourInstanceDayId: "day-2",
            dayNumber: 2,
            actualDate: "2026-05-29T00:00:00Z",
            activityType: "Accommodation",
            supplierId: "sup-1",
            supplierName: "Hotel Metropole",
            approvalStatus: "approved",
            accommodation: {
              roomType: "Suite",
              quantity: 1,
            },
          },
        ],
      },
    ];

    vi.mocked(tourInstanceService.getProviderAssigned).mockResolvedValue({
      total: 1,
      data: mockInstances as any,
    });

    render(<ProviderTourApprovals providerType="hotel" />);

    await waitFor(() => {
      expect(screen.queryByText("Không có yêu cầu nào")).not.toBeInTheDocument();
    });

    const suppliers = screen.getAllByText("Hotel Metropole");
    expect(suppliers.length).toBe(2);

    expect(screen.getByText("Deluxe • 2 phòng")).toBeInTheDocument();
    expect(screen.getByText("Suite • 1 phòng")).toBeInTheDocument();
  });

  it("navigates to correct URL when clicking a card based on providerType", async () => {
    const mockInstances = [
      {
        id: "tour-1",
        tourCode: "TC-1",
        title: "Ha Long Cruise",
        status: "pendingapproval",
        currentParticipation: 5,
        maxParticipation: 10,
        basePrice: 5000000,
        assignedActivities: [
          {
            activityId: "act-1",
            tourInstanceDayId: "day-1",
            dayNumber: 1,
            actualDate: "2026-05-28T00:00:00Z",
            activityType: "Accommodation",
            supplierId: "sup-1",
            supplierName: "Hotel Metropole",
            approvalStatus: "pending",
            accommodation: {
              roomType: "Deluxe",
              quantity: 2,
            },
          },
        ],
      },
    ];

    vi.mocked(tourInstanceService.getProviderAssigned).mockResolvedValue({
      total: 1,
      data: mockInstances as any,
    });

    const { rerender } = render(<ProviderTourApprovals providerType="hotel" />);

    await waitFor(() => {
      expect(screen.getByText("Ha Long Cruise")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ha Long Cruise"));
    expect(mockPush).toHaveBeenCalledWith("/hotel/tour-approvals/tour-1");

    vi.clearAllMocks();
    
    rerender(<ProviderTourApprovals providerType="transport" />);

    await waitFor(() => {
      expect(screen.getByText("Ha Long Cruise")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ha Long Cruise"));
    expect(mockPush).toHaveBeenCalledWith("/transport/tour-approvals/tour-1");
  });
});

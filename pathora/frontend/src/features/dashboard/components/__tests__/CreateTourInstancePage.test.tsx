import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CreateTourInstancePage } from "../CreateTourInstancePage";
import { tourService } from "@/api/services/tourService";
import { userService } from "@/api/services/userService";
import { tourRequestService } from "@/api/services/tourRequestService";
import { supplierService } from "@/api/services/supplierService";
import { adminService } from "@/api/services/adminService";
import { fileService } from "@/api/services/fileService";
import { tourInstanceService } from "@/api/services/tourInstanceService";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

vi.mock("@/api/services/tourService", () => ({
  tourService: {
    getMyTours: vi.fn(),
    getAdminTourManagement: vi.fn(),
    getTourDetail: vi.fn(),
  },
}));

vi.mock("@/api/services/userService", () => ({
  userService: {
    getGuides: vi.fn(),
  },
}));

vi.mock("@/api/services/tourRequestService", () => ({
  tourRequestService: {
    getTourRequestDetail: vi.fn(),
  },
}));

vi.mock("@/api/services/supplierService", () => ({
  supplierService: {
    getSuppliers: vi.fn(),
  },
}));

vi.mock("@/api/services/adminService", () => ({
  adminService: {
    getHotelProviderDetail: vi.fn(),
    getTransportProviderDetail: vi.fn(),
  },
}));

vi.mock("@/api/services/fileService", () => ({
  fileService: {
    uploadFile: vi.fn(),
  },
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    createInstance: vi.fn(),
    checkDuplicate: vi.fn(),
    checkGuideAvailability: vi.fn(),
  },
}));

describe("CreateTourInstancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(tourService.getMyTours).mockResolvedValue({
      data: [{ id: "tour-1", tourName: "Northern Escape" }],
    } as any);
    vi.mocked(userService.getGuides).mockResolvedValue([]);
    vi.mocked(tourService.getTourDetail).mockResolvedValue({
      id: "tour-1",
      tourName: "Northern Escape",
      includedServices: [],
      classifications: [
        {
          id: "class-1",
          name: "Premium",
          basePrice: 1200,
          numberOfDay: 2,
          plans: [
            {
              id: "day-1",
              dayNumber: 1,
              title: "Day 1",
              description: null,
              activities: [
                {
                  id: "activity-acc-1",
                  order: 1,
                  activityType: "Accommodation",
                  title: "Hanoi Hotel",
                  description: null,
                  startTime: null,
                  endTime: null,
                  isOptional: false,
                },
              ],
            },
          ],
        },
      ],
      thumbnail: null,
      images: [],
    } as any);
    vi.mocked(supplierService.getSuppliers).mockImplementation(async (type?: string) => {
      if (type === "2") {
        return [
          {
            id: "sup-1",
            supplierCode: "HOTEL-001",
            name: "Hotel Alpha",
            phone: null,
            email: null,
            address: "Hanoi",
            supplierType: "Accommodation",
            note: null,
            isActive: true,
          },
        ];
      }

      return [];
    });
    vi.mocked(adminService.getHotelProviderDetail).mockResolvedValue({
      id: "sup-1",
      supplierName: "Hotel Alpha",
      supplierCode: "HOTEL-001",
      address: "Hanoi",
      phone: null,
      email: null,
      avatarUrl: null,
      status: "Active",
      createdOnUtc: null,
      primaryContinent: "Asia",
      continents: ["Asia"],
      properties: [],
      accommodations: [],
      roomOptions: [{ roomType: "Standard", label: "Standard", totalRooms: 5 }],
      accommodationCount: 1,
      propertyCount: 1,
      totalRooms: 5,
      bookingCount: 0,
      activeBookingCount: 0,
      completedBookingCount: 0,
    } as any);
    vi.mocked(adminService.getTransportProviderDetail).mockResolvedValue(null as any);
    vi.mocked(tourInstanceService.checkDuplicate).mockResolvedValue(null as any);
    vi.mocked(tourInstanceService.checkGuideAvailability).mockResolvedValue({ conflicts: [] });
    vi.mocked(tourInstanceService.createInstance).mockResolvedValue("instance-123" as any);
    vi.mocked(fileService.uploadFile).mockResolvedValue({ url: "https://example.com/image.jpg" } as any);
    vi.mocked(tourRequestService.getTourRequestDetail).mockResolvedValue(null as any);
  });

  it("renders the accommodation supplier picker and submits supplierId in activity assignments", async () => {
    render(<CreateTourInstancePage />);

    await waitFor(() => {
      expect(screen.getByText("Step 1: Select Tour")).toBeInTheDocument();
    });

    const initialComboboxes = screen.getAllByRole("combobox");
    fireEvent.change(initialComboboxes[0], {
      target: { value: "tour-1" },
    });

    await waitFor(() => {
      expect(screen.getAllByRole("combobox").length).toBeGreaterThan(1);
    });

    fireEvent.change(screen.getAllByRole("combobox")[1], {
      target: { value: "class-1" },
    });

    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("Provider Assignment")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("Northern Escape - Premium"), {
      target: { value: "Northern Escape - Premium Launch" },
    });

    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0] as HTMLInputElement, {
      target: { value: "2099-01-02" },
    });

    const numberInputs = document.querySelectorAll('input[type="number"]');
    fireEvent.change(numberInputs[0] as HTMLInputElement, {
      target: { value: "12" },
    });

    await waitFor(() => {
      expect(screen.getByText("Hanoi Hotel")).toBeInTheDocument();
    });

    const supplierSelect = screen.getByRole("option", {
      name: "-- Select hotel --",
    }).parentElement as HTMLSelectElement;
    fireEvent.change(supplierSelect, {
      target: { value: "sup-1" },
    });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Standard (5)" })).toBeInTheDocument();
    });

    const roomSelect = screen.getByRole("option", {
      name: "-- Select room --",
    }).parentElement as HTMLSelectElement;
    fireEvent.change(roomSelect, {
      target: { value: "Standard" },
    });

    fireEvent.click(screen.getByText("Create instance"));

    await waitFor(() => {
      expect(tourInstanceService.createInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Northern Escape - Premium Launch",
          tourId: "tour-1",
          classificationId: "class-1",
          activityAssignments: [
            expect.objectContaining({
              originalActivityId: "activity-acc-1",
              supplierId: "sup-1",
              roomType: "Standard",
            }),
          ],
        }),
      );
    });
  });
});

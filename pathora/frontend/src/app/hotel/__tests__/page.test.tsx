import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import HotelDashboardPage from "../page";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import { tourInstanceService } from "@/api/services/tourInstanceService";

vi.mock("@/api/services/hotelProviderService", () => ({
  hotelProviderService: {
    getAccommodations: vi.fn(),
    getRoomAvailability: vi.fn(),
    getGuestArrivals: vi.fn(),
    getSupplierInfo: vi.fn(),
    createSupplierInfo: vi.fn(),
  },
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getProviderAssigned: vi.fn(),
  },
}));

vi.mock("@/features/dashboard/components/UpcomingToursSection", () => ({
  default: () => <div data-testid="mock-upcoming-tours">Upcoming Tours</div>,
}));

describe("HotelDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(hotelProviderService.getSupplierInfo).mockResolvedValue([
      {
        id: "sup-1",
        supplierCode: "HOTEL-001",
        name: "Hotel Alpha",
        phone: null,
        email: null,
        address: "Hanoi",
        notes: null,
      },
      {
        id: "sup-2",
        supplierCode: "HOTEL-002",
        name: "Hotel Beta",
        phone: null,
        email: null,
        address: "Sapa",
        notes: null,
      },
    ]);
    vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([
      {
        id: "acc-1",
        supplierId: "sup-1",
        roomType: "Standard",
        totalRooms: 5,
        name: "Alpha Standard",
        address: null,
        locationArea: null,
        operatingCountries: null,
        imageUrls: null,
        notes: null,
      },
      {
        id: "acc-2",
        supplierId: "sup-2",
        roomType: "Deluxe",
        totalRooms: 9,
        name: "Beta Deluxe",
        address: null,
        locationArea: null,
        operatingCountries: null,
        imageUrls: null,
        notes: null,
      },
    ]);
    vi.mocked(hotelProviderService.getRoomAvailability).mockResolvedValue([]);
    vi.mocked(hotelProviderService.getGuestArrivals).mockResolvedValue([]);
    vi.mocked(tourInstanceService.getProviderAssigned).mockResolvedValue({
      data: [],
      total: 0,
    } as any);
  });

  it("lets a hotel owner inspect multiple properties without mixing room counts", async () => {
    render(<HotelDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Danh sách cơ sở")).toBeInTheDocument();
    });

    expect(screen.getByText("Hotel Alpha")).toBeInTheDocument();
    expect(screen.getByText("5 phòng")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hotel Beta"));

    await waitFor(() => {
      expect(screen.getByText("9 phòng")).toBeInTheDocument();
    });
  });

  it("creates a new property from the dashboard action and refreshes the owner list", async () => {
    vi.mocked(hotelProviderService.createSupplierInfo).mockResolvedValue({
      id: "sup-3",
      supplierCode: "HOTEL-003",
      name: "Hotel Gamma",
      phone: "0123",
      email: "gamma@example.com",
      address: "Da Nang",
      notes: "New property",
    });

    render(<HotelDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Thêm cơ sở mới")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Thêm cơ sở mới"));
    fireEvent.change(screen.getByLabelText("Tên cơ sở *"), { target: { value: "Hotel Gamma" } });
    fireEvent.change(screen.getByLabelText("Địa chỉ"), { target: { value: "Da Nang" } });
    fireEvent.click(screen.getByText("Lưu property"));

    await waitFor(() => {
      expect(hotelProviderService.createSupplierInfo).toHaveBeenCalledWith({
        name: "Hotel Gamma",
        address: "Da Nang",
        phone: undefined,
        email: undefined,
        notes: undefined,
      });
    });

    expect(hotelProviderService.getSupplierInfo).toHaveBeenCalledTimes(2);
  });
});

import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import HotelProfilePage from "../page";
import { hotelProviderService } from "@/api/services/hotelProviderService";

vi.mock("@/api/services/hotelProviderService", () => ({
  hotelProviderService: {
    getAccommodations: vi.fn(),
    getSupplierInfo: vi.fn(),
    updateSupplierInfo: vi.fn(),
  },
}));

vi.mock("@/features/dashboard/components", () => ({
  AdminPageHeader: ({ title }: { title: string }) => <div>{title}</div>,
  AdminErrorCard: ({ message }: { message: string }) => <div>{message}</div>,
}));

vi.mock("@/components/hotel/HotelProfileForm", () => ({
  default: ({
    data,
    onSave,
  }: {
    data: { name: string; address?: string | null };
    onSave: (value: { name: string; address?: string }) => Promise<void>;
  }) => (
    <button onClick={() => void onSave({ name: `${data.name} Updated`, address: data.address ?? undefined })}>
      Save Profile
    </button>
  ),
}));

describe("HotelProfilePage", () => {
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
    vi.mocked(hotelProviderService.updateSupplierInfo).mockResolvedValue({
      id: "sup-2",
      supplierCode: "HOTEL-002",
      name: "Hotel Beta Updated",
      phone: null,
      email: null,
      address: "Sapa",
      notes: null,
    });
  });

  it("updates the currently selected supplier instead of leaking to another property", async () => {
    render(<HotelProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Thông tin khách sạn")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByDisplayValue("Hotel Alpha"), {
      target: { value: "sup-2" },
    });

    fireEvent.click(screen.getByText("Chỉnh sửa"));
    fireEvent.click(screen.getByText("Save Profile"));

    await waitFor(() => {
      expect(hotelProviderService.updateSupplierInfo).toHaveBeenCalledWith(
        "sup-2",
        expect.objectContaining({
          name: "Hotel Beta Updated",
        }),
      );
    });
  });
});

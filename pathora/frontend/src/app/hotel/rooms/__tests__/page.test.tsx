import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

import RoomsPage from "../page";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type { AccommodationItem, RoomAvailability } from "@/api/services/hotelProviderService";

vi.mock("@/api/services/hotelProviderService", () => ({
  hotelProviderService: {
    getAccommodations: vi.fn(),
    createAccommodation: vi.fn(),
    updateAccommodation: vi.fn(),
    deleteAccommodation: vi.fn(),
    getRoomAvailability: vi.fn(),
  },
}));

const mockAccommodations: AccommodationItem[] = [
  {
    id: "acc-1",
    supplierId: "sup-1",
    roomType: "Standard",
    totalRooms: 10,
    name: "Grand Hotel",
    address: "123 Hotel St",
    locationArea: "Asia",
    operatingCountries: "VN",
    imageUrls: null,
    notes: "Ocean view",
  },
  {
    id: "acc-2",
    supplierId: "sup-1",
    roomType: "Deluxe",
    totalRooms: 5,
    name: null,
    address: null,
    locationArea: null,
    operatingCountries: null,
    imageUrls: null,
    notes: null,
  },
];

describe("RoomsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loads data", () => {
    it("shows loading skeletons while fetching accommodations", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockAccommodations), 500)),
      );

      render(<RoomsPage />);

      expect(screen.getByTestId("rooms-page")).toBeInTheDocument();
    });

    it("renders accommodation table when data is loaded", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue(mockAccommodations);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Standard")).toBeInTheDocument();
        expect(screen.getByText("Deluxe")).toBeInTheDocument();
      });
    });

    it("renders empty state when no accommodations", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Chưa có loại phòng nào")).toBeInTheDocument();
      });
    });

    it("renders error card when fetch fails", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockRejectedValue(
        new Error("Network error"),
      );

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("renders room type labels", () => {
    it("maps Standard to Vietnamese label", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([mockAccommodations[0]]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Phòng Standard")).toBeInTheDocument();
      });
    });

    it("maps Deluxe to Vietnamese label", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([mockAccommodations[1]]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Phòng Deluxe")).toBeInTheDocument();
      });
    });

    it("renders unknown room types as-is", async () => {
      const unknownType: AccommodationItem = {
        ...mockAccommodations[0],
        id: "acc-unknown",
        roomType: "VIP",
      };
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([unknownType]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Phòng VIP")).toBeInTheDocument();
      });
    });
  });

  describe("renders table columns", () => {
    it("renders notes column with null notes as dash", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([mockAccommodations[1]]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("-")).toBeInTheDocument();
      });
    });

    it("renders notes column with notes", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([mockAccommodations[0]]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Ocean view")).toBeInTheDocument();
      });
    });

    it("renders total rooms column", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([mockAccommodations[0]]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("10")).toBeInTheDocument();
      });
    });

    it("renders active status badge", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([mockAccommodations[0]]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Hoạt động")).toBeInTheDocument();
      });
    });
  });

  describe("room availability calendar", () => {
    it("renders View Availability button", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Xem tình trạng phòng")).toBeInTheDocument();
      });
    });

    it("opens calendar modal when View Availability is clicked", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);

      render(<RoomsPage />);

      await waitFor(() => {
        const btn = screen.getByText("Xem tình trạng phòng");
        btn.click();
      });

      await waitFor(() => {
        expect(screen.getByText("Tình trạng phòng")).toBeInTheDocument();
      });
    });

    it("fetches availability data when date range is selected", async () => {
      const mockAvailability: RoomAvailability[] = [
        {
          date: "2026-04-10",
          roomType: "Standard",
          totalRooms: 10,
          blockedCount: 2,
          availableRooms: 8,
        },
      ];
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);
      vi.mocked(hotelProviderService.getRoomAvailability).mockResolvedValue(mockAvailability);

      render(<RoomsPage />);

      await waitFor(() => screen.getByText("Xem tình trạng phòng"));

      // Open calendar
      screen.getByText("Xem tình trạng phòng").click();
      await waitFor(() => screen.getByText("Tình trạng phòng"));

      // Set dates (mock)
      const fromDateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      if (fromDateInput) {
        fireEvent.change(fromDateInput, { target: { value: "2026-04-10" } });
      }

      const toDateInputs = document.querySelectorAll('input[type="date"]');
      if (toDateInputs.length > 1) {
        fireEvent.change(toDateInputs[1] as HTMLInputElement, { target: { value: "2026-04-12" } });
      }

      // Click view button
      screen.getByText("Xem").click();

      await waitFor(() => {
        expect(hotelProviderService.getRoomAvailability).toHaveBeenCalled();
      });
    });

    it("shows no data message when availability is empty", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);
      vi.mocked(hotelProviderService.getRoomAvailability).mockResolvedValue([]);

      render(<RoomsPage />);

      await waitFor(() => screen.getByText("Xem tình trạng phòng"));

      screen.getByText("Xem tình trạng phòng").click();
      await waitFor(() => screen.getByText("Tình trạng phòng"));

      screen.getByText("Xem").click();

      await waitFor(() => {
        expect(screen.getByText("Không có dữ liệu cho khoảng ngày này.")).toBeInTheDocument();
      });
    });
  });

  describe("create room", () => {
    it("opens create modal when Add Room Type is clicked", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);

      render(<RoomsPage />);

      await waitFor(() => screen.getByText("Thêm loại phòng"));

      screen.getByText("Thêm loại phòng").click();

      await waitFor(() => {
        expect(screen.getByText("Thêm loại phòng")).toBeInTheDocument();
      });
    });

    it("calls createAccommodation when form is submitted", async () => {
      vi.mocked(hotelProviderService.getAccommodations)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockAccommodations[0]]);
      vi.mocked(hotelProviderService.createAccommodation).mockResolvedValue(mockAccommodations[0]);

      render(<RoomsPage />);

      await waitFor(() => screen.getByText("Thêm loại phòng"));
      screen.getByText("Thêm loại phòng").click();

      await waitFor(() => screen.getByText("Thêm"));
      screen.getByText("Thêm").click();

      await waitFor(() => {
        expect(hotelProviderService.createAccommodation).toHaveBeenCalledWith({
          roomType: "Standard",
          totalRooms: 1,
        });
      });
    });

    it("shows error message when create fails", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);
      vi.mocked(hotelProviderService.createAccommodation).mockRejectedValue(
        new Error("Tạo phòng thất bại"),
      );

      render(<RoomsPage />);

      await waitFor(() => screen.getByText("Thêm loại phòng"));
      screen.getByText("Thêm loại phòng").click();

      await waitFor(() => screen.getByText("Thêm"));
      screen.getByText("Thêm").click();

      await waitFor(() => {
        expect(screen.getByText("Tạo phòng thất bại")).toBeInTheDocument();
      });
    });
  });

  describe("delete room", () => {
    it("opens delete confirmation modal", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([mockAccommodations[0]]);

      render(<RoomsPage />);

      await waitFor(() => screen.getByText("10"));

      // Click delete button (trash icon)
      const deleteBtn = screen.getByRole("button", { name: "" });
      deleteBtn.click();

      await waitFor(() => {
        expect(screen.getByText("Xác nhận xóa")).toBeInTheDocument();
      });
    });

    it("calls deleteAccommodation when confirmed", async () => {
      vi.mocked(hotelProviderService.getAccommodations)
        .mockResolvedValueOnce([mockAccommodations[0]])
        .mockResolvedValueOnce([]);
      vi.mocked(hotelProviderService.deleteAccommodation).mockResolvedValue(undefined);

      render(<RoomsPage />);

      await waitFor(() => screen.getByText("10"));

      // Find and click delete (trash) button
      const deleteBtn = document.querySelector('button[title="Xóa"]') as HTMLButtonElement;
      deleteBtn.click();

      await waitFor(() => screen.getByText("Xác nhận xóa"));
      screen.getByText("Xóa").click();

      await waitFor(() => {
        expect(hotelProviderService.deleteAccommodation).toHaveBeenCalledWith("acc-1");
      });
    });
  });

  describe("pagination and toolbar", () => {
    it("renders page header with title and subtitle", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);

      render(<RoomsPage />);

      await waitFor(() => {
        expect(screen.getByText("Quản lý phòng")).toBeInTheDocument();
        expect(screen.getByText("Các loại phòng của khách sạn")).toBeInTheDocument();
      });
    });

    it("renders refresh button in header", async () => {
      vi.mocked(hotelProviderService.getAccommodations).mockResolvedValue([]);

      render(<RoomsPage />);

      await waitFor(() => screen.getByText("Quản lý phòng"));

      expect(screen.getByRole("button", { name: "" })).toBeInTheDocument();
    });
  });
});

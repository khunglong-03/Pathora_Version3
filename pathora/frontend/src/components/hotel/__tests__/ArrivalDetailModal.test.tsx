import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import ArrivalDetailModal from "../ArrivalDetailModal";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type { GuestArrivalItem, GuestArrivalDetail } from "@/api/services/hotelProviderService";

vi.mock("@/api/services/hotelProviderService", () => ({
  hotelProviderService: {
    getGuestArrivalDetail: vi.fn(),
    updateGuestArrival: vi.fn(),
  },
}));

const mockArrival: GuestArrivalItem = {
  id: "arr-1",
  bookingAccommodationDetailId: "bad-1",
  accommodationName: "Grand Hotel Saigon",
  status: "Pending",
  checkInDate: "2026-04-10",
  checkOutDate: "2026-04-12",
  participantCount: 2,
  submittedAt: null,
  submissionStatus: "Draft",
};

const mockDetail: GuestArrivalDetail = {
  id: "arr-1",
  bookingAccommodationDetailId: "bad-1",
  accommodationName: "Grand Hotel Saigon",
  status: "Pending",
  checkInDate: "2026-04-10",
  checkOutDate: "2026-04-12",
  participantCount: 2,
  submittedAt: null,
  submissionStatus: "Draft",
  participants: [
    {
      id: "p-1",
      fullName: "Nguyen Van A",
      passportNumber: "A123456789",
      status: "Pending",
    },
    {
      id: "p-2",
      fullName: "Tran Thi B",
      passportNumber: "B987654321",
      status: "Pending",
    },
  ],
  note: null,
};

describe("ArrivalDetailModal", () => {
  const onClose = vi.fn();
  const onRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("renders booking info", () => {
    it("displays booking ID (truncated)", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/^Booking ID$/)).toBeInTheDocument();
      });
    });

    it("displays hotel name", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Grand Hotel Saigon")).toBeInTheDocument();
      });
    });

    it("displays check-in and check-out dates", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText(/Khách sạn/)).toBeInTheDocument();
        expect(screen.getByText(/Check-in/)).toBeInTheDocument();
        expect(screen.getByText(/Check-out/)).toBeInTheDocument();
      });
    });

    it("displays participant count", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("renders null accommodationName as dash", async () => {
      const arrivalNoName: GuestArrivalItem = { ...mockArrival, accommodationName: null };
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue({
        ...mockDetail,
        accommodationName: null,
      });

      render(
        <ArrivalDetailModal
          arrival={arrivalNoName}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("-")).toBeInTheDocument();
      });
    });
  });

  describe("status labels", () => {
    it("renders Pending status with Chờ label", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Chờ")).toBeInTheDocument();
      });
    });

    it("renders CheckedIn status with Đã check-in label", async () => {
      const checkedIn: GuestArrivalItem = { ...mockArrival, status: "CheckedIn" };
      const detailCheckedIn: GuestArrivalDetail = { ...mockDetail, status: "CheckedIn" };
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(detailCheckedIn);

      render(
        <ArrivalDetailModal
          arrival={checkedIn}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Đã check-in")).toBeInTheDocument();
      });
    });

    it("renders CheckedOut status with Đã check-out label", async () => {
      const checkedOut: GuestArrivalItem = { ...mockArrival, status: "CheckedOut" };
      const detailCheckedOut: GuestArrivalDetail = { ...mockDetail, status: "CheckedOut" };
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(detailCheckedOut);

      render(
        <ArrivalDetailModal
          arrival={checkedOut}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Đã check-out")).toBeInTheDocument();
      });
    });

    it("renders NoShow status with Không đến label", async () => {
      const noShow: GuestArrivalItem = { ...mockArrival, status: "NoShow" };
      const detailNoShow: GuestArrivalDetail = { ...mockDetail, status: "NoShow" };
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(detailNoShow);

      render(
        <ArrivalDetailModal
          arrival={noShow}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Không đến")).toBeInTheDocument();
      });
    });
  });

  describe("participant list", () => {
    it("renders participant table", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Danh sách khách")).toBeInTheDocument();
        expect(screen.getByText("Nguyen Van A")).toBeInTheDocument();
        expect(screen.getByText("Tran Thi B")).toBeInTheDocument();
      });
    });

    it("masks passport numbers", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        // Masked: A1****89
        expect(screen.getByText("A1****89")).toBeInTheDocument();
        // Masked: B9****21
        expect(screen.getByText("B9****21")).toBeInTheDocument();
      });
    });

    it("renders Check-in action for pending participants", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Check-in")).toBeInTheDocument();
      });
    });

    it("renders Check-out action for checked-in participants", async () => {
      const checkedInParticipant: GuestArrivalDetail = {
        ...mockDetail,
        participants: [
          {
            id: "p-checked",
            fullName: "Nguyen Van C",
            passportNumber: "C111111",
            status: "CheckedIn",
          },
        ],
      };
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(checkedInParticipant);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Check-out")).toBeInTheDocument();
      });
    });
  });

  describe("actions", () => {
    it("renders Check-in button when status is Pending", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Check-in" })).toBeInTheDocument();
      });
    });

    it("renders Check-out button when status is CheckedIn", async () => {
      const checkedIn: GuestArrivalItem = { ...mockArrival, status: "CheckedIn" };
      const detail: GuestArrivalDetail = { ...mockDetail, status: "CheckedIn" };
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(detail);

      render(
        <ArrivalDetailModal
          arrival={checkedIn}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Check-out" })).toBeInTheDocument();
      });
    });

    it("renders NoShow button when status is Pending", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Không đến (NoShow)")).toBeInTheDocument();
      });
    });

    it("renders close button", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
      });
    });

    it("calls onClose when close button is clicked", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => screen.getByRole("button", { name: "Đóng" }));
      screen.getByRole("button", { name: "Đóng" }).click();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls updateGuestArrival with CheckedIn status", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);
      vi.mocked(hotelProviderService.updateGuestArrival).mockResolvedValue(mockArrival);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => screen.getByRole("button", { name: "Check-in" }));
      screen.getByRole("button", { name: "Check-in" }).click();

      await waitFor(() => {
        expect(hotelProviderService.updateGuestArrival).toHaveBeenCalledWith(
          "arr-1",
          { status: "CheckedIn" },
        );
      });
    });
  });

  describe("no show confirmation", () => {
    it("shows confirmation when NoShow button is clicked", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => screen.getByText("Không đến (NoShow)"));
      screen.getByText("Không đến (NoShow)").click();

      await waitFor(() => {
        expect(screen.getByText("Xác nhận đánh dấu không đến?")).toBeInTheDocument();
        expect(screen.getByText("Hành động này sẽ đánh dấu toàn bộ booking là \"Không đến\".")).toBeInTheDocument();
      });
    });

    it("cancels confirmation when cancel is clicked", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => screen.getByText("Không đến (NoShow)"));
      screen.getByText("Không đến (NoShow)").click();

      await waitFor(() => screen.getByText("Hủy"));
      screen.getByText("Hủy").click();

      await waitFor(() => {
        expect(screen.queryByText("Xác nhận đánh dấu không đến?")).not.toBeInTheDocument();
      });
    });
  });

  describe("loading and error states", () => {
    it("shows loading skeletons while fetching detail", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockDetail), 500)),
      );

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      // Should show skeleton, not detail
      expect(screen.queryByText("Grand Hotel Saigon")).not.toBeInTheDocument();
    });

    it("handles fetch error gracefully", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockRejectedValue(
        new Error("Failed to load"),
      );

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      // Modal should still render with basic arrival info even if detail fetch fails
      await waitFor(() => {
        expect(screen.queryByText(/Booking ID/)).toBeInTheDocument();
      });
    });
  });

  describe("note", () => {
    it("renders note when present in detail", async () => {
      const detailWithNote: GuestArrivalDetail = {
        ...mockDetail,
        note: "Guest requested late check-in",
      };
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(detailWithNote);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("Guest requested late check-in")).toBeInTheDocument();
      });
    });

    it("does not render note section when note is null", async () => {
      vi.mocked(hotelProviderService.getGuestArrivalDetail).mockResolvedValue(mockDetail);

      render(
        <ArrivalDetailModal
          arrival={mockArrival}
          onClose={onClose}
          onRefresh={onRefresh}
        />,
      );

      await waitFor(() => {
        expect(screen.queryByText(/Ghi chú/)).not.toBeInTheDocument();
      });
    });
  });
});

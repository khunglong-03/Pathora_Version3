import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BulkApproveConfirmationModal from "../BulkApproveConfirmationModal";

const mockT = vi.fn((_key: string, fallback?: string) => fallback ?? _key);
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

describe("BulkApproveConfirmationModal", () => {
  const mockActivities = [
    {
      dayNumber: 1,
      dayTitle: "Day 1",
      date: "2025-07-01T00:00:00Z",
      activity: {
        id: "act-1",
        title: "Bus to Ha Long",
        requestedVehicleType: "Coach",
        requestedSeatCount: 18,
      } as any,
    },
    {
      dayNumber: 2,
      dayTitle: "Day 2",
      date: "2025-07-02T00:00:00Z",
      activity: {
        id: "act-2",
        title: "Return to Hanoi",
        requestedVehicleType: "Minivan",
        requestedSeatCount: 7,
      } as any,
    },
  ];

  const mockDrafts = {
    "act-1": { vehicleId: "v1", driverId: "d1", note: "" },
    "act-2": { vehicleId: "", driverId: "", note: "" },
  };

  const mockVehicles = [
    { id: "v1", vehiclePlate: "30A-123", vehicleType: "Coach", seatCapacity: 29 } as any,
  ];

  const mockDrivers = [
    { id: "d1", fullName: "John Doe", licenseNumber: "B2" } as any,
  ];

  it("renders correctly with selected items", () => {
    render(
      <BulkApproveConfirmationModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        items={mockActivities}
        drafts={mockDrafts}
        vehicles={mockVehicles}
        drivers={mockDrivers}
        failedState={null}
      />
    );

    expect(screen.getByText("Duyệt hàng loạt")).toBeInTheDocument();
    expect(screen.getByText(/Xác nhận duyệt 2 hoạt động/)).toBeInTheDocument();
    expect(screen.getByText("Bus to Ha Long")).toBeInTheDocument();
    expect(screen.getByText("Return to Hanoi")).toBeInTheDocument();
    expect(screen.getAllByText(/30A-123 \/ John Doe/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("—")[0]).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    const onClose = vi.fn();
    render(
      <BulkApproveConfirmationModal
        open={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        items={mockActivities}
        drafts={mockDrafts}
        vehicles={mockVehicles}
        drivers={mockDrivers}
        failedState={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Huỷ/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onConfirm when confirm is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <BulkApproveConfirmationModal
        open={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        items={mockActivities}
        drafts={mockDrafts}
        vehicles={mockVehicles}
        drivers={mockDrivers}
        failedState={null}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Duyệt 2 hoạt động/i }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("renders failedState correctly", () => {
    render(
      <BulkApproveConfirmationModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        items={mockActivities}
        drafts={mockDrafts}
        vehicles={mockVehicles}
        drivers={mockDrivers}
        failedState={{ message: "Loi he thong", failedActivityId: "act-2" }}
      />
    );

    expect(screen.getAllByText("Loi he thong")[0]).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import VehicleScheduleDetail from "@/features/dashboard/components/VehicleScheduleDetail";
import type { VehicleScheduleItem } from "@/api/services/transportProviderService";

const mockItems: VehicleScheduleItem[] = [
  {
    blockId: "b1",
    vehicleId: "v1",
    vehicleType: "Car",
    vehicleBrand: "Toyota",
    vehicleModel: "Camry",
    seatCapacity: 4,
    blockedDate: "2026-05-15",
    holdStatus: "Hard",
    tourInstanceName: "Summer Tour",
    tourInstanceCode: "ST-001",
    activityTitle: "Transfer to Airport",
    fromLocationName: "Hotel A",
    toLocationName: "Airport",
  },
  {
    blockId: "b2",
    vehicleId: "v2",
    vehicleType: "Bus",
    vehicleBrand: "Hyundai",
    vehicleModel: "Universe",
    seatCapacity: 45,
    blockedDate: "2026-05-15",
    holdStatus: "Soft",
    tourInstanceName: "Winter Tour",
    tourInstanceCode: "WT-002",
    activityTitle: "City Tour",
  },
];

describe("VehicleScheduleDetail", () => {
  // F10: Click on day shows multiple vehicles
  it("renders multiple vehicle blocks with hold status badges", () => {
    render(
      <VehicleScheduleDetail
        dateLabel="15/05/2026"
        items={mockItems}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Chi tiết ngày 15/05/2026")).toBeInTheDocument();
    expect(screen.getByText(/Toyota/)).toBeInTheDocument();
    expect(screen.getByText(/Hyundai/)).toBeInTheDocument();
    expect(screen.getByText("Hard hold")).toBeInTheDocument();
    expect(screen.getByText("Soft hold")).toBeInTheDocument();
  });

  it("shows tour and route info", () => {
    render(
      <VehicleScheduleDetail
        dateLabel="15/05/2026"
        items={mockItems}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText(/ST-001/)).toBeInTheDocument();
    expect(screen.getByText(/Hotel A/)).toBeInTheDocument();
    expect(screen.getByText(/Airport/)).toBeInTheDocument();
  });

  it("shows empty state when no items", () => {
    render(
      <VehicleScheduleDetail
        dateLabel="15/05/2026"
        items={[]}
        onClose={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Không có xe nào bị đặt vào ngày này."),
    ).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    render(
      <VehicleScheduleDetail
        dateLabel="15/05/2026"
        items={[]}
        isLoading
        onClose={vi.fn()}
      />,
    );

    const skeletons = document.querySelectorAll('[style*="animation: pulse"]');
    expect(skeletons.length).toBe(3);
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <VehicleScheduleDetail
        dateLabel="15/05/2026"
        items={mockItems}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByLabelText("Đóng"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SupplierReassignmentModal from "../SupplierReassignmentModal";
import { supplierService } from "@/api/services/supplierService";
import { tourInstanceService } from "@/api/services/tourInstanceService";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/ui", () => ({
  Icon: () => null,
  Modal: ({
    isOpen,
    title,
    children,
  }: {
    isOpen?: boolean;
    title?: string;
    children?: React.ReactNode;
  }) => (isOpen ? (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ) : null),
}));

vi.mock("@/api/services/supplierService", () => ({
  supplierService: {
    getSuppliers: vi.fn(),
  },
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    assignTransportSupplier: vi.fn(),
    assignAccommodationSupplier: vi.fn(),
    confirmExternalTransport: vi.fn(),
  },
}));

describe("SupplierReassignmentModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supplierService.getSuppliers).mockResolvedValue([
      {
        id: "supplier-1",
        supplierCode: "TRANSPORT-001",
        name: "Transport Alpha",
        isActive: true,
      },
    ] as any);
    vi.mocked(tourInstanceService.assignTransportSupplier).mockResolvedValue(
      null as any,
    );
  });

  it("renders only VehicleTypeMap options and maps backend string values to numeric select values", async () => {
    render(
      <SupplierReassignmentModal
        open
        onClose={vi.fn()}
        activity={{
          id: "activity-1",
          title: "Airport transfer",
          requestedVehicleType: "Coach",
          requestedSeatCount: 32,
        } as any}
        activityType="Transportation"
        tourInstanceId="instance-1"
        onSuccess={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Nhà cung cấp")).toBeInTheDocument();
    });

    const vehicleTypeSelect = screen.getByLabelText(
      "Loại xe yêu cầu",
    ) as HTMLSelectElement;
    const optionLabels = Array.from(vehicleTypeSelect.options).map(
      (option) => option.textContent,
    );

    expect(vehicleTypeSelect).toHaveValue("5");
    expect(optionLabels).toEqual([
      "Select vehicle type...",
      "Car",
      "Bus",
      "Minibus",
      "Van",
      "Coach",
      "Motorbike",
    ]);
    expect(screen.queryByRole("option", { name: "Walking" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Flight" })).not.toBeInTheDocument();
  });

  it("hides supplier form and shows external confirmation panel for Flight activities", async () => {
    render(
      <SupplierReassignmentModal
        open
        onClose={vi.fn()}
        activity={{
          id: "activity-flight",
          title: "Hanoi → Saigon flight",
          transportationType: "Flight",
          bookingReference: "VN-1234",
          departureTime: "2026-05-01T08:00:00Z",
          arrivalTime: "2026-05-01T10:00:00Z",
          externalTransportConfirmed: false,
        } as any}
        activityType="Transportation"
        tourInstanceId="instance-1"
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText("Nhà cung cấp")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Loại xe yêu cầu")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Phương tiện đặc thù — không gán nhà cung cấp/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xác nhận vé bên ngoài/i })).toBeEnabled();
    expect(supplierService.getSuppliers).not.toHaveBeenCalled();
  });

  it("disables external confirm button when booking fields are missing", async () => {
    render(
      <SupplierReassignmentModal
        open
        onClose={vi.fn()}
        activity={{
          id: "activity-train",
          title: "Train transfer",
          transportationType: "Train",
          bookingReference: null,
          departureTime: null,
          arrivalTime: null,
          externalTransportConfirmed: false,
        } as any}
        activityType="Transportation"
        tourInstanceId="instance-1"
        onSuccess={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Xác nhận vé bên ngoài/i })).toBeDisabled();
    expect(
      screen.getByText(/Cần nhập đủ Mã đặt chỗ/i),
    ).toBeInTheDocument();
  });

  it("calls confirmExternalTransport(true) when Manager confirms", async () => {
    vi.mocked(tourInstanceService.confirmExternalTransport).mockResolvedValue(null as any);
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <SupplierReassignmentModal
        open
        onClose={onClose}
        activity={{
          id: "activity-boat",
          title: "Halong cruise ticket",
          transportationType: "Boat",
          bookingReference: "HL-789",
          departureTime: "2026-05-02T07:00:00Z",
          arrivalTime: "2026-05-02T18:00:00Z",
          externalTransportConfirmed: false,
        } as any}
        activityType="Transportation"
        tourInstanceId="instance-1"
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Xác nhận vé bên ngoài/i }));

    await waitFor(() => {
      expect(tourInstanceService.confirmExternalTransport).toHaveBeenCalledWith(
        "instance-1",
        "activity-boat",
        true,
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows Undo button and calls confirmExternalTransport(false) when already confirmed", async () => {
    vi.mocked(tourInstanceService.confirmExternalTransport).mockResolvedValue(null as any);
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <SupplierReassignmentModal
        open
        onClose={onClose}
        activity={{
          id: "activity-flight-2",
          title: "Saigon → Da Nang flight",
          transportationType: "Flight",
          bookingReference: "VJ-321",
          departureTime: "2026-05-03T09:00:00Z",
          arrivalTime: "2026-05-03T10:30:00Z",
          externalTransportConfirmed: true,
        } as any}
        activityType="Transportation"
        tourInstanceId="instance-1"
        onSuccess={onSuccess}
      />,
    );

    expect(screen.queryByRole("button", { name: /Xác nhận vé bên ngoài/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Huỷ xác nhận/i }));

    await waitFor(() => {
      expect(tourInstanceService.confirmExternalTransport).toHaveBeenCalledWith(
        "instance-1",
        "activity-flight-2",
        false,
      );
    });
  });
});

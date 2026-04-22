import "@testing-library/jest-dom/vitest";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

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
});

import "@testing-library/jest-dom/vitest";
import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TransportTourAssignmentPage from "../TransportTourAssignmentPage";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { transportProviderService } from "@/api/services/transportProviderService";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "tour-id-123" }),
  useRouter: () => ({ push }),
}));

const mockT = vi.fn((_key: string, fallback?: string, opts?: Record<string, unknown>) => {
  const template = fallback ?? _key;
  if (!opts) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_m, name) => String(opts[name] ?? ""));
});
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: mockT,
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

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    getMyAssignedInstanceDetail: vi.fn(),
    approveTransportation: vi.fn(),
    rejectTransportation: vi.fn(),
  },
}));

vi.mock("@/api/services/transportProviderService", () => ({
  transportProviderService: {
    getVehicles: vi.fn(),
    getDrivers: vi.fn(),
  },
}));

describe("TransportTourAssignmentPage", () => {
  const mockTour = {
    id: "tour-id-123",
    title: "Northern Escape",
    tourName: "Northern Escape",
    tourCode: "TT001",
    currentParticipation: 10,
    maxParticipation: 20,
    startDate: "2025-07-01T00:00:00Z",
    endDate: "2025-07-03T00:00:00Z",
    days: [
      {
        id: "day-1",
        instanceDayNumber: 1,
        actualDate: "2025-07-01T00:00:00Z",
        title: "Day 1",
        description: null,
        startTime: null,
        endTime: null,
        note: null,
        activities: [
          {
            id: "act-1",
            order: 1,
            activityType: "Transportation",
            title: "Bus to Ha Long",
            description: "Hotel to pier transfer",
            startTime: "08:00",
            endTime: "12:00",
            isOptional: false,
            note: null,
            accommodation: null,
            transportSupplierId: "supplier-1",
            transportSupplierName: "Transport Beta",
            requestedVehicleType: "Coach",
            requestedSeatCount: 18,
            transportationApprovalStatus: "Pending",
            transportationApprovalNote: null,
            vehicleId: null,
            driverId: null,
            vehiclePlate: null,
            driverName: null,
            driverPhone: null,
            pickupLocation: "Hotel A",
            dropoffLocation: "Pier B",
          },
        ],
      },
    ],
  };

  const mockVehicles = [
    {
      id: "v1",
      vehiclePlate: "30A-123",
      vehicleType: "Coach",
      brand: "Hyundai",
      model: "County",
      seatCapacity: 29,
    },
  ];

  const mockDrivers = [
    {
      id: "d1",
      fullName: "Driver John",
      licenseNumber: "B2-123",
      phoneNumber: "0909000111",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReset();
    vi.mocked(tourInstanceService.getMyAssignedInstanceDetail).mockResolvedValue(
      mockTour as never,
    );
    vi.mocked(tourInstanceService.approveTransportation).mockResolvedValue(
      undefined as never,
    );
    vi.mocked(tourInstanceService.rejectTransportation).mockResolvedValue(
      undefined as never,
    );
    vi.mocked(transportProviderService.getVehicles).mockResolvedValue(
      mockVehicles as never,
    );
    vi.mocked(transportProviderService.getDrivers).mockResolvedValue(
      mockDrivers as never,
    );
  });

  it("renders the assigned transport activity with request details", async () => {
    render(<TransportTourAssignmentPage />);

    expect(await screen.findByText("Northern Escape")).toBeInTheDocument();
    expect(screen.getByText("Bus to Ha Long")).toBeInTheDocument();
    expect(screen.getByText("Transport Beta")).toBeInTheDocument();
    expect(screen.getByText("Coach")).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Dang cho duyet")).toBeInTheDocument();
  });

  it("approves a transportation activity through the activity modal", async () => {
    render(<TransportTourAssignmentPage />);

    await screen.findByText("Bus to Ha Long");

    fireEvent.click(screen.getByRole("button", { name: /Gan xe va duyet/i }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "v1" } });
    fireEvent.change(selects[1], { target: { value: "d1" } });
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Ready to operate" },
    });

    const approveButtons = screen.getAllByRole("button", {
      name: /Gan xe va duyet/i,
    });
    fireEvent.click(approveButtons[approveButtons.length - 1]);

    await waitFor(() => {
      expect(tourInstanceService.approveTransportation).toHaveBeenCalledWith(
        "tour-id-123",
        "act-1",
        {
          assignments: [{ vehicleId: "v1", driverId: "d1" }],
          note: "Ready to operate",
        },
      );
    });
  });

  it("rejects a transportation activity through the reject modal", async () => {
    render(<TransportTourAssignmentPage />);

    await screen.findByText("Bus to Ha Long");

    fireEvent.click(screen.getByRole("button", { name: /Tu choi/i }));

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Vehicle unavailable on requested date" },
    });

    const rejectButtons = screen.getAllByRole("button", { name: /Tu choi/i });
    fireEvent.click(rejectButtons[rejectButtons.length - 1]);

    await waitFor(() => {
      expect(tourInstanceService.rejectTransportation).toHaveBeenCalledWith(
        "tour-id-123",
        "act-1",
        {
          note: "Vehicle unavailable on requested date",
        },
      );
    });
  });

  it("disables submit and renders error when vehicle type mismatches", async () => {
    transportProviderService.getVehicles = vi.fn().mockResolvedValue([
      {
        id: "v2",
        vehiclePlate: "29A-99999",
        vehicleType: "Sedan", // Mismatch with requested "Coach"
        seatCapacity: 20, // Sufficient capacity
        vehicleStatus: "Available",
      },
    ]);

    render(<TransportTourAssignmentPage />);
    await screen.findByText("Bus to Ha Long");

    fireEvent.click(screen.getByRole("button", { name: /Gan xe va duyet/i }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "v2" } });
    fireEvent.change(selects[1], { target: { value: "d1" } });

    await waitFor(() => {
      expect(screen.getByText(/Loại xe không khớp với yêu cầu/i)).toBeInTheDocument();
    });

    const submitBtns = screen.getAllByRole("button", { name: /Gan xe va duyet/i });
    expect(submitBtns[submitBtns.length - 1]).toBeDisabled();
    
    // Check escape hatch link is rendered
    expect(screen.getByRole("link", { name: /Liên hệ manager để đổi loại xe yêu cầu/i })).toBeInTheDocument();
  });

  it("disables submit and renders error when seat capacity falls short", async () => {
    transportProviderService.getVehicles = vi.fn().mockResolvedValue([
      {
        id: "v3",
        vehiclePlate: "29B-11111",
        vehicleType: "Coach", // Matches requested
        seatCapacity: 10, // Shortfall (requested 18)
        vehicleStatus: "Available",
      },
    ]);

    render(<TransportTourAssignmentPage />);
    await screen.findByText("Bus to Ha Long");

    fireEvent.click(screen.getByRole("button", { name: /Gan xe va duyet/i }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "v3" } });
    fireEvent.change(selects[1], { target: { value: "d1" } });

    await waitFor(() => {
      expect(screen.getByText(/Sức chứa không đủ/i)).toBeInTheDocument();
    });

    const submitBtns = screen.getAllByRole("button", { name: /Gan xe va duyet/i });
    expect(submitBtns[submitBtns.length - 1]).toBeDisabled();
    
    // Check escape hatch link is rendered
    expect(screen.getByRole("link", { name: /Liên hệ manager để đổi loại xe yêu cầu/i })).toBeInTheDocument();
  });

  it("renders both messages when both conditions fail", async () => {
    transportProviderService.getVehicles = vi.fn().mockResolvedValue([
      {
        id: "v4",
        vehiclePlate: "29C-22222",
        vehicleType: "Sedan", // Mismatch
        seatCapacity: 4, // Shortfall
        vehicleStatus: "Available",
      },
    ]);

    render(<TransportTourAssignmentPage />);
    await screen.findByText("Bus to Ha Long");

    fireEvent.click(screen.getByRole("button", { name: /Gan xe va duyet/i }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "v4" } });
    fireEvent.change(selects[1], { target: { value: "d1" } });

    await waitFor(() => {
      expect(screen.getByText(/Loại xe không khớp với yêu cầu/i)).toBeInTheDocument();
      expect(screen.getByText(/Sức chứa không đủ/i)).toBeInTheDocument();
    });
  });

  it("enables submit when matching type and sufficient capacity", async () => {
    // Restore default mock
    transportProviderService.getVehicles = vi.fn().mockResolvedValue([
      {
        id: "v1",
        vehiclePlate: "29A-12345",
        vehicleType: "Coach",
        seatCapacity: 20,
        vehicleStatus: "Available",
      },
    ]);

    render(<TransportTourAssignmentPage />);
    await screen.findByText("Bus to Ha Long");

    fireEvent.click(screen.getByRole("button", { name: /Gan xe va duyet/i }));

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "v1" } });
    fireEvent.change(selects[1], { target: { value: "d1" } });

    await waitFor(() => {
      const submitBtns = screen.getAllByRole("button", { name: /Gan xe va duyet/i });
      expect(submitBtns[submitBtns.length - 1]).toBeEnabled();
    });
    
    expect(screen.queryByText(/Loại xe không khớp với yêu cầu/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Sức chứa không đủ/i)).not.toBeInTheDocument();
  });

  it("adds and removes assignment rows in the approve modal", async () => {
    transportProviderService.getVehicles = vi.fn().mockResolvedValue([
      { id: "v1", vehiclePlate: "30A-1", vehicleType: "Coach", seatCapacity: 10 },
      { id: "v2", vehiclePlate: "30A-2", vehicleType: "Coach", seatCapacity: 10 },
    ]);

    render(<TransportTourAssignmentPage />);
    await screen.findByText("Bus to Ha Long");

    fireEvent.click(screen.getByRole("button", { name: /Gan xe va duyet/i }));

    expect(screen.getAllByRole("combobox")).toHaveLength(2); // 1 row (vehicle + driver)

    fireEvent.click(screen.getByRole("button", { name: /\+ Them xe/i }));
    expect(screen.getAllByRole("combobox")).toHaveLength(4); // 2 rows now

    const removeButtons = screen.getAllByRole("button", { name: /Xoa dong/i });
    fireEvent.click(removeButtons[removeButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
    });
  });

  it("blocks approve and disables add-row when assignment count does not match RequestedVehicleCount", async () => {
    vi.mocked(tourInstanceService.getMyAssignedInstanceDetail).mockResolvedValue({
      ...mockTour,
      days: [
        {
          ...mockTour.days[0],
          activities: [
            {
              ...mockTour.days[0].activities[0],
              requestedVehicleCount: 2,
              requestedSeatCount: 20,
            },
          ],
        },
      ],
    } as never);
    transportProviderService.getVehicles = vi.fn().mockResolvedValue([
      { id: "v1", vehiclePlate: "30A-1", vehicleType: "Coach", seatCapacity: 25 },
      { id: "v2", vehiclePlate: "30A-2", vehicleType: "Coach", seatCapacity: 25 },
    ]);

    render(<TransportTourAssignmentPage />);
    await screen.findByText("Bus to Ha Long");

    fireEvent.click(screen.getByRole("button", { name: /Gan xe va duyet/i }));

    // Fill just 1 row — count mismatch (1/2)
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "v1" } });
    fireEvent.change(selects[1], { target: { value: "d1" } });

    await waitFor(() => {
      expect(screen.getByText(/1\/2 xe/i)).toBeInTheDocument();
    });

    const submitBtns = screen.getAllByRole("button", { name: /Gan xe va duyet/i });
    expect(submitBtns[submitBtns.length - 1]).toBeDisabled();

    // Add a second row → 2/2, submit enabled
    fireEvent.click(screen.getByRole("button", { name: /\+ Them xe/i }));

    const afterAdd = screen.getAllByRole("combobox");
    fireEvent.change(afterAdd[2], { target: { value: "v2" } });
    fireEvent.change(afterAdd[3], { target: { value: "d1" } });

    await waitFor(() => {
      expect(screen.getByText(/2\/2 xe/i)).toBeInTheDocument();
    });

    const reSubmitBtns = screen.getAllByRole("button", { name: /Gan xe va duyet/i });
    expect(reSubmitBtns[reSubmitBtns.length - 1]).toBeEnabled();

    // Add-row button disabled when cap reached
    expect(screen.getByRole("button", { name: /\+ Them xe/i })).toBeDisabled();
  });
});

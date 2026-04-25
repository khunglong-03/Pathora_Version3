import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { CreateTourInstancePage } from "../CreateTourInstancePage";
import { adminService } from "@/api/services/adminService";
import { fileService } from "@/api/services/fileService";
import { supplierService } from "@/api/services/supplierService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { tourRequestService } from "@/api/services/tourRequestService";
import { tourService } from "@/api/services/tourService";
import { userService } from "@/api/services/userService";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("react-i18next", () => {
  const t = (_key: string, fallback?: string | Record<string, unknown>, options?: Record<string, unknown>) => {
    // Support 3-arg form: t(key, fallback, options) with {{var}} interpolation
    let text = typeof fallback === "string" ? fallback : _key;
    const vars = typeof fallback === "object" ? fallback : options;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
      }
    }
    return text;
  };
  return {
    useTranslation: () => ({ t }),
    initReactI18next: {
      type: "3rdParty",
      init: vi.fn(),
    },
  };
});

vi.mock("react-toastify", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/components/ui", () => ({
  Icon: () => null,
  CollapsibleSection: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
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

const baseTourDetail = {
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
            {
              id: "activity-trans-1",
              order: 2,
              activityType: "Transportation",
              title: "Transfer to Ha Long",
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
} as const;

const buildTransportSupplier = (id: string, name: string) => ({
  id,
  supplierCode: id.toUpperCase(),
  name,
  phone: null,
  email: null,
  address: "Ha Noi",
  supplierType: "Transport",
  note: null,
  isActive: true,
});

const hotelSuppliers = [
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

const hotelDetail = {
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
};

const buildTransportDetail = (
  supplierId: string,
  vehicles: Array<{ vehicleType: string; isActive: boolean; seatCapacity?: number }>,
) => ({
  id: supplierId,
  supplierName: supplierId,
  supplierCode: supplierId.toUpperCase(),
  address: "Ha Noi",
  phone: null,
  email: null,
  avatarUrl: null,
  status: "Active",
  userStatus: "Active",
  ownerUserId: `${supplierId}-owner`,
  userCreatedAt: null,
  primaryContinent: "Asia",
  vehicles: vehicles.map((vehicle, idx) => ({
    id: `${supplierId}-vehicle-${idx}`,
    vehiclePlate: `${supplierId}-PLATE-${idx}`,
    vehicleType: vehicle.vehicleType,
    seatCapacity: vehicle.seatCapacity ?? 16,
    isActive: vehicle.isActive,
    createdAt: "2026-04-23T00:00:00Z",
  })),
  drivers: [],
  bookingCount: 0,
  activeBookingCount: 0,
  completedBookingCount: 0,
  continents: ["Asia"],
});

let transportSuppliers: Array<ReturnType<typeof buildTransportSupplier>>;
let transportDetailResponses: Record<string, unknown>;

const getTransportSupplierSelect = () =>
  screen.getByRole("option", { name: "-- Select Supplier (Optional) --" })
    .parentElement as HTMLSelectElement;

const getHotelSupplierSelect = () =>
  screen.getByRole("option", { name: "-- Select hotel --" })
    .parentElement as HTMLSelectElement;

const getRoomSelect = () =>
  screen.getByRole("option", { name: "-- Select room --" })
    .parentElement as HTMLSelectElement;

const getVehicleTypeSelect = () =>
  document.getElementById("vehicleType-activity-trans-1") as HTMLSelectElement;

const getVehicleTypeOptionLabels = () =>
  Array.from(getVehicleTypeSelect().options).map((option) => option.textContent);

const completeRequiredFields = async () => {
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
};

const renderToInstanceDetailsStep = async () => {
  render(<CreateTourInstancePage />);

  await waitFor(() => {
    expect(
      screen.getByRole("heading", { level: 2, name: "Step 1: Select Tour" }),
    ).toBeInTheDocument();
  });

  fireEvent.change(screen.getAllByRole("combobox")[0], {
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
    expect(screen.getByText(/Tour Instance Type/)).toBeInTheDocument();
  });

  await completeRequiredFields();

  await waitFor(() => {
    expect(screen.getByText("Transfer to Ha Long")).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(getTransportSupplierSelect()).toBeInTheDocument();
  });
};

describe("CreateTourInstancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLElement.prototype.scrollIntoView = vi.fn();

    transportSuppliers = [buildTransportSupplier("trans-1", "Transport Beta")];
    transportDetailResponses = {
      "trans-1": buildTransportDetail("trans-1", [
        { vehicleType: "Bus", isActive: true },
      ]),
    };

    vi.mocked(tourService.getMyTours).mockResolvedValue({
      data: [{ id: "tour-1", tourName: "Northern Escape" }],
    } as any);
    vi.mocked(userService.getGuides).mockResolvedValue([]);
    vi.mocked(tourService.getTourDetail).mockResolvedValue(baseTourDetail as any);
    vi.mocked(supplierService.getSuppliers).mockImplementation(async (type?: string) => {
      if (type === "2") return hotelSuppliers as any;
      if (type === "1") return transportSuppliers as any;
      return [];
    });
    vi.mocked(adminService.getHotelProviderDetail).mockResolvedValue(hotelDetail as any);
    vi.mocked(adminService.getTransportProviderDetail).mockImplementation(
      async (id: string) => {
        const response = transportDetailResponses[id];
        if (response instanceof Error) throw response;
        return response as any;
      },
    );
    vi.mocked(tourInstanceService.checkDuplicate).mockResolvedValue(null as any);
    vi.mocked(tourInstanceService.checkGuideAvailability).mockResolvedValue({
      conflicts: [],
    } as any);
    vi.mocked(tourInstanceService.createInstance).mockResolvedValue("instance-123" as any);
    vi.mocked(fileService.uploadFile).mockResolvedValue({
      url: "https://example.com/image.jpg",
    } as any);
    vi.mocked(tourRequestService.getTourRequestDetail).mockResolvedValue(null as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the provider-first placeholder while no transport supplier is selected", async () => {
    await renderToInstanceDetailsStep();

    const vehicleTypeSelect = getVehicleTypeSelect();
    expect(vehicleTypeSelect).toBeDisabled();
    expect(getVehicleTypeOptionLabels()).toEqual([
      "Select a transport provider first",
    ]);
  });

  it("does not retry the admin tour endpoint after an auth failure", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      return;
    });
    vi.mocked(tourService.getMyTours).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 401,
        data: {
          code: "TOKEN_MISSING",
          message: "Authentication required. Please provide a valid token.",
          statusCode: 401,
        },
      },
    });

    render(<CreateTourInstancePage />);

    await waitFor(() => {
      expect(screen.getByText("error_response.UNAUTHORIZED")).toBeInTheDocument();
    });

    expect(tourService.getAdminTourManagement).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it("filters to active supplier vehicle types and submits Bus as VehicleType 2", async () => {
    transportDetailResponses = {
      "trans-1": buildTransportDetail("trans-1", [
        { vehicleType: "Bus", isActive: true },
        { vehicleType: "Bus", isActive: true, seatCapacity: 29 },
        { vehicleType: "Car", isActive: true },
        { vehicleType: "Minibus", isActive: false },
      ]),
    };

    await renderToInstanceDetailsStep();

    fireEvent.change(getTransportSupplierSelect(), {
      target: { value: "trans-1" },
    });

    // Active fleet: 2 Bus + 1 Car. Labels are count-annotated.
    await waitFor(() => {
      expect(getVehicleTypeOptionLabels()).toEqual([
        "",
        "Car (1 vehicles)",
        "Bus (2 vehicles)",
      ]);
    });

    expect(screen.queryByRole("option", { name: /Minibus/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Flight/ })).not.toBeInTheDocument();

    fireEvent.change(getVehicleTypeSelect(), {
      target: { value: "2" },
    });

    fireEvent.click(screen.getByText("Create instance"));

    await waitFor(() => {
      expect(tourInstanceService.createInstance).toHaveBeenCalledTimes(1);
    });

    const submittedPayload = vi.mocked(tourInstanceService.createInstance).mock
      .calls[0][0] as unknown as Record<string, unknown>;

    expect(submittedPayload.activityAssignments).toEqual([
      expect.objectContaining({
        originalActivityId: "activity-trans-1",
        transportSupplierId: "trans-1",
        // Bus must serialize as VehicleType.Bus = 2, not TransportationTypeMap.Bus = 1.
        requestedVehicleType: 2,
      }),
    ]);
  });

  it("shows the no-active-vehicles state when the selected supplier has no active fleet", async () => {
    transportDetailResponses = {
      "trans-1": buildTransportDetail("trans-1", [
        { vehicleType: "Bus", isActive: false },
        { vehicleType: "Car", isActive: false },
      ]),
    };

    await renderToInstanceDetailsStep();

    fireEvent.change(getTransportSupplierSelect(), {
      target: { value: "trans-1" },
    });

    await waitFor(() => {
      expect(getVehicleTypeSelect()).toBeDisabled();
      expect(getVehicleTypeOptionLabels()).toEqual([
        "This provider has no active vehicles yet",
      ]);
    });
  });

  it("keeps an invalid stale vehicle type visible, exposes a11y wiring, and blocks submit", async () => {
    transportSuppliers = [
      buildTransportSupplier("trans-1", "Transport Beta"),
      buildTransportSupplier("trans-2", "Transport Gamma"),
    ];
    transportDetailResponses = {
      "trans-1": buildTransportDetail("trans-1", [
        { vehicleType: "Bus", isActive: true },
      ]),
      "trans-2": buildTransportDetail("trans-2", [
        { vehicleType: "Car", isActive: true },
      ]),
    };

    await renderToInstanceDetailsStep();

    fireEvent.change(getTransportSupplierSelect(), {
      target: { value: "trans-1" },
    });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Bus (1 vehicles)" })).toBeInTheDocument();
    });

    fireEvent.change(getVehicleTypeSelect(), {
      target: { value: "2" },
    });

    fireEvent.change(getTransportSupplierSelect(), {
      target: { value: "trans-2" },
    });

    await waitFor(() => {
      expect(getVehicleTypeSelect()).toHaveValue("2");
      expect(getVehicleTypeSelect()).toHaveAttribute("aria-invalid", "true");
      expect(getVehicleTypeSelect()).toHaveAttribute(
        "aria-describedby",
        "vehicleType-activity-trans-1-error",
      );
    });

    expect(getVehicleTypeSelect()).toBeEnabled();
    // Stale "Bus" value is still rendered as a plain label because it's not in
    // the new supplier's active fleet — only the fresh supplier's active
    // vehicles get count annotations.
    expect(getVehicleTypeOptionLabels()).toEqual(["", "Car (1 vehicles)", "Bus"]);
    expect(
      document.querySelector('label[for="vehicleType-activity-trans-1"]'),
    ).toHaveTextContent("Vehicle Type");
    expect(
      screen.getByText("This vehicle type is not offered by the selected provider"),
    ).toHaveAttribute("id", "vehicleType-activity-trans-1-error");

    fireEvent.click(screen.getByText("Create instance"));

    await waitFor(() => {
      expect(tourInstanceService.createInstance).not.toHaveBeenCalled();
    });
  });

  it("shows loading while transport detail requests are still pending", async () => {
    transportDetailResponses = {
      "trans-1": new Promise(() => {}),
    };
    vi.mocked(adminService.getTransportProviderDetail).mockImplementation(
      (id: string) => transportDetailResponses[id] as Promise<any>,
    );

    await renderToInstanceDetailsStep();

    fireEvent.change(getTransportSupplierSelect(), {
      target: { value: "trans-1" },
    });

    await waitFor(() => {
      expect(getVehicleTypeSelect()).toBeDisabled();
      expect(getVehicleTypeOptionLabels()).toEqual([
        "Loading available vehicles…",
      ]);
    });
  });

  it("shows fetch-failed feedback for a supplier whose transport detail request rejects", async () => {
    transportDetailResponses = {
      "trans-1": new Error("boom"),
    };

    await renderToInstanceDetailsStep();

    fireEvent.change(getTransportSupplierSelect(), {
      target: { value: "trans-1" },
    });

    await waitFor(() => {
      expect(getVehicleTypeSelect()).toBeDisabled();
      expect(getVehicleTypeOptionLabels()).toEqual([
        "Could not load vehicles. Try again later.",
      ]);
    });
  });

  it("keeps hotel room options working when transport detail requests have mixed outcomes", async () => {
    transportSuppliers = [
      buildTransportSupplier("trans-1", "Transport Beta"),
      buildTransportSupplier("trans-2", "Transport Broken"),
      buildTransportSupplier("trans-3", "Transport Delta"),
    ];
    transportDetailResponses = {
      "trans-1": buildTransportDetail("trans-1", [
        { vehicleType: "Bus", isActive: true },
      ]),
      "trans-2": new Error("detail failed"),
      "trans-3": buildTransportDetail("trans-3", [
        { vehicleType: "Car", isActive: true },
      ]),
    };

    await renderToInstanceDetailsStep();

    fireEvent.change(getHotelSupplierSelect(), {
      target: { value: "sup-1" },
    });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Standard (5)" })).toBeInTheDocument();
    });

    fireEvent.change(getRoomSelect(), {
      target: { value: "Standard" },
    });

    fireEvent.change(getTransportSupplierSelect(), {
      target: { value: "trans-2" },
    });

    await waitFor(() => {
      expect(getVehicleTypeOptionLabels()).toEqual([
        "Could not load vehicles. Try again later.",
      ]);
    });

    fireEvent.change(getTransportSupplierSelect(), {
      target: { value: "trans-1" },
    });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Bus (1 vehicles)" })).toBeInTheDocument();
      expect(getRoomSelect()).toHaveValue("Standard");
    });
  });
});

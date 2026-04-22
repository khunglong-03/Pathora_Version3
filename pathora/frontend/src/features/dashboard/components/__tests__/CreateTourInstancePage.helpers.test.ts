import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

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

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

vi.mock("@/components/ui", () => ({
  Icon: () => null,
  CollapsibleSection: ({ children }: { children?: unknown }) => children ?? null,
}));

vi.mock("@/api/services/tourInstanceService", () => ({
  tourInstanceService: {
    createInstance: vi.fn(),
    checkDuplicate: vi.fn(),
    checkGuideAvailability: vi.fn(),
  },
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

import {
  buildAllowedVehicleKeysBySupplierId,
  buildVehicleCountsBySupplierId,
  sumVehicleCounts,
  isVehicleTypeInvalidForSupplier,
  validateTransportActivities,
} from "../CreateTourInstancePage";

describe("CreateTourInstancePage helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("buildAllowedVehicleKeysBySupplierId filters inactive vehicles, dedupes, and drops unknown names", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = buildAllowedVehicleKeysBySupplierId({
      "supplier-1": {
        id: "supplier-1",
        supplierName: "Supplier 1",
        supplierCode: "SUP-1",
        status: "Active",
        vehicles: [
          {
            id: "veh-1",
            vehiclePlate: "51A-001",
            vehicleType: "Bus",
            seatCapacity: 29,
            isActive: true,
            createdAt: "2026-04-23T00:00:00Z",
          },
          {
            id: "veh-2",
            vehiclePlate: "51A-002",
            vehicleType: "Bus",
            seatCapacity: 16,
            isActive: true,
            createdAt: "2026-04-23T00:00:00Z",
          },
          {
            id: "veh-3",
            vehiclePlate: "51A-003",
            vehicleType: "Car",
            seatCapacity: 7,
            isActive: true,
            createdAt: "2026-04-23T00:00:00Z",
          },
          {
            id: "veh-4",
            vehiclePlate: "51A-004",
            vehicleType: "Minibus",
            seatCapacity: 16,
            isActive: false,
            createdAt: "2026-04-23T00:00:00Z",
          },
          {
            id: "veh-5",
            vehiclePlate: "51A-005",
            vehicleType: "Limousine",
            seatCapacity: 9,
            isActive: true,
            createdAt: "2026-04-23T00:00:00Z",
          },
        ],
        drivers: [],
        bookingCount: 0,
        activeBookingCount: 0,
        completedBookingCount: 0,
        continents: [],
      },
    });

    expect(result["supplier-1"]).toEqual(new Set([2, 1]));
    expect(result["missing-supplier"]).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("treats missing suppliers and mismatched vehicle types as invalid", () => {
    const allowed = {
      "supplier-1": new Set([2]),
    };

    expect(
      isVehicleTypeInvalidForSupplier(
        { supplierId: "supplier-1", requestedVehicleType: 2 },
        allowed,
      ),
    ).toBe(false);
    expect(
      isVehicleTypeInvalidForSupplier(
        { supplierId: "supplier-1", requestedVehicleType: 1 },
        allowed,
      ),
    ).toBe(true);
    expect(
      isVehicleTypeInvalidForSupplier(
        { requestedVehicleType: 2 },
        allowed,
      ),
    ).toBe(true);
    expect(
      isVehicleTypeInvalidForSupplier({ supplierId: "supplier-1" }, allowed),
    ).toBe(true);
    expect(
      isVehicleTypeInvalidForSupplier(
        { supplierId: "   " },
        allowed,
      ),
    ).toBe(false);
  });

  it("validateTransportActivities only returns invalid transportation activity ids", () => {
    const invalidIds = validateTransportActivities(
      {
        "transport-ok": { supplierId: "supplier-1", requestedVehicleType: 2 },
        "transport-bad": { supplierId: "supplier-1", requestedVehicleType: 1 },
        "transport-no-supplier": { requestedVehicleType: 2 },
        "transport-missing-type": { supplierId: "supplier-1" },
        "hotel-1": { supplierId: "hotel-1" },
      },
      {
        plans: [
          {
            id: "day-1",
            activities: [
              { id: "transport-ok", activityType: "Transportation" },
              { id: "transport-bad", activityType: "Transportation" },
              { id: "transport-no-supplier", activityType: "Transportation" },
              { id: "transport-missing-type", activityType: "Transportation" },
              { id: "hotel-1", activityType: "Accommodation" },
            ],
          },
        ],
      } as any,
      {
        "supplier-1": new Set([2]),
      },
    );

    expect(invalidIds).toEqual([
      "transport-bad",
      "transport-no-supplier",
      "transport-missing-type",
    ]);
  });

  it("buildVehicleCountsBySupplierId groups active vehicles by numeric VehicleType key", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const counts = buildVehicleCountsBySupplierId({
      "supplier-1": {
        id: "supplier-1",
        supplierName: "S",
        supplierCode: "S1",
        status: "Active",
        vehicles: [
          // 2 active Buses -> key 2, count 2
          { id: "v1", vehiclePlate: "P1", vehicleType: "Bus", seatCapacity: 29, isActive: true, createdAt: "" },
          { id: "v2", vehiclePlate: "P2", vehicleType: "Bus", seatCapacity: 29, isActive: true, createdAt: "" },
          // 1 active Car -> key 1, count 1
          { id: "v3", vehiclePlate: "P3", vehicleType: "Car", seatCapacity: 4, isActive: true, createdAt: "" },
          // 1 inactive Minibus -> ignored
          { id: "v4", vehiclePlate: "P4", vehicleType: "Minibus", seatCapacity: 16, isActive: false, createdAt: "" },
          // Unknown -> dropped with warn
          { id: "v5", vehiclePlate: "P5", vehicleType: "Limousine", seatCapacity: 9, isActive: true, createdAt: "" },
        ],
        drivers: [],
        bookingCount: 0,
        activeBookingCount: 0,
        completedBookingCount: 0,
        continents: [],
      },
    });

    expect(counts["supplier-1"]).toEqual({ 1: 1, 2: 2 });
    expect(sumVehicleCounts(counts["supplier-1"])).toBe(3);
    expect(sumVehicleCounts(undefined)).toBe(0);
    expect(sumVehicleCounts({})).toBe(0);
  });
});

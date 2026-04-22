import { beforeEach, describe, expect, it, vi } from "vitest";

import { VehicleTypeMap, vehicleTypeNameToKey } from "../tour";

describe("VehicleTypeMap", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("maps Bus to VehicleType 2 and round-trips through the reverse helper", () => {
    expect(VehicleTypeMap[2]).toBe("Bus");
    expect(vehicleTypeNameToKey("Bus")).toBe(2);
    expect(VehicleTypeMap[vehicleTypeNameToKey("Bus")!]).toBe("Bus");
  });

  it("warns and returns undefined for unknown vehicle type names", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(vehicleTypeNameToKey("Limousine")).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });
});

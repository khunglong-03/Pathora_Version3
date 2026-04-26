import { describe, expect, it } from "vitest";

import {
  filterVehiclesByRequestedType,
  mapVehiclesToSelectOptions,
} from "../transportApprovalVehicleOptions";

const fleet = [
  { id: "a", vehicleType: "Coach", seatCapacity: 45 },
  { id: "b", vehicleType: "Minibus", seatCapacity: 16 },
  { id: "c", vehicleType: "Coach", seatCapacity: 29 },
];

describe("filterVehiclesByRequestedType", () => {
  it("returns all vehicles when requested type is missing", () => {
    expect(filterVehiclesByRequestedType(fleet, undefined)).toEqual(fleet);
    expect(filterVehiclesByRequestedType(fleet, null)).toEqual(fleet);
    expect(filterVehiclesByRequestedType(fleet, "   ")).toEqual(fleet);
  });

  it("keeps only vehicles whose type string matches the activity request", () => {
    expect(filterVehiclesByRequestedType(fleet, "Coach")).toEqual([
      fleet[0],
      fleet[2],
    ]);
    expect(filterVehiclesByRequestedType(fleet, "Minibus")).toEqual([fleet[1]]);
  });
});

describe("mapVehiclesToSelectOptions", () => {
  it("builds value/label pairs for the transport Select", () => {
    expect(mapVehiclesToSelectOptions([fleet[0]!])).toEqual([
      { value: "a", label: "Coach - 45 cho" },
    ]);
  });
});

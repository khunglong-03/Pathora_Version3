import { describe, expect, it } from "vitest";

import {
  computeRequiredTransportSeats,
  filterVehiclesByRequestedType,
  hasNonEmptyAssignmentId,
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

describe("hasNonEmptyAssignmentId", () => {
  it("returns false for empty string, whitespace-only, or undefined", () => {
    expect(hasNonEmptyAssignmentId(undefined)).toBe(false);
    expect(hasNonEmptyAssignmentId("")).toBe(false);
    expect(hasNonEmptyAssignmentId(" ")).toBe(false);
    expect(hasNonEmptyAssignmentId("\t")).toBe(false);
  });

  it("returns true for non-empty trimmed id", () => {
    expect(hasNonEmptyAssignmentId("019dd4fd-ba46-7b6b-ba2a-75dd4dbf1ee9")).toBe(true);
    expect(
      hasNonEmptyAssignmentId(" 019dd4fd-ba46-7b6b-ba2a-75dd4dbf1ee9 "),
    ).toBe(true);
  });
});

describe("computeRequiredTransportSeats", () => {
  it("falls back to tour MaxParticipation when requestedSeatCount is null", () => {
    expect(
      computeRequiredTransportSeats(
        { requestedSeatCount: null, requestedVehicleCount: 2 },
        12,
      ),
    ).toBe(12);
  });

  it("multiplies per-vehicle seats by requestedVehicleCount when set", () => {
    expect(
      computeRequiredTransportSeats(
        { requestedSeatCount: 6, requestedVehicleCount: 2 },
        999,
      ),
    ).toBe(12);
  });

  it("defaults requestedVehicleCount to 1 when only seat count set", () => {
    expect(computeRequiredTransportSeats({ requestedSeatCount: 4 }, 12)).toBe(
      4,
    );
  });
});

describe("mapVehiclesToSelectOptions", () => {
  it("builds value/label pairs for the transport Select", () => {
    expect(mapVehiclesToSelectOptions([fleet[0]!])).toEqual([
      { value: "a", label: "Coach - 45 cho" },
    ]);
  });
});

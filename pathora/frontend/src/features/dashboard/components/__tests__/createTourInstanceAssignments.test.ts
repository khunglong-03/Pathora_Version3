import { describe, expect, it } from "vitest";
import {
  buildActivityTypeByActivityId,
  mapActivityAssignmentsForPayload,
} from "../createTourInstanceAssignments";

describe("createTourInstanceAssignments", () => {
  it("buildActivityTypeByActivityId indexes activities by id", () => {
    const byId = buildActivityTypeByActivityId({
      plans: [
        {
          activities: [
            { id: "a1", activityType: "Transportation" },
            { id: "a2", activityType: "Accommodation" },
          ],
        },
      ],
    } as any);
    expect(byId).toEqual({
      a1: "Transportation",
      a2: "Accommodation",
    });
  });

  it("maps transport UI supplierId to transportSupplierId for Transportation activities", () => {
    const rows = mapActivityAssignmentsForPayload(
      {
        "act-t": {
          supplierId: "trans-guid",
          requestedVehicleType: 2,
        },
      },
      { "act-t": "Transportation" },
    );
    expect(rows).toEqual([
      {
        originalActivityId: "act-t",
        supplierId: undefined,
        transportSupplierId: "trans-guid",
        roomType: undefined,
        accommodationQuantity: undefined,
        vehicleId: undefined,
        requestedVehicleType: 2,
        requestedSeatCount: undefined,
        requestedVehicleCount: undefined,
      },
    ]);
  });

  it("maps hotel supplierId to supplierId for Accommodation activities", () => {
    const rows = mapActivityAssignmentsForPayload(
      {
        "act-h": {
          supplierId: "hotel-guid",
          roomType: "Standard",
          accommodationQuantity: 2,
        },
      },
      { "act-h": "Accommodation" },
    );
    expect(rows[0].supplierId).toBe("hotel-guid");
    expect(rows[0].transportSupplierId).toBeUndefined();
  });

  it("leaves both supplierId and transportSupplierId undefined when no supplier is set", () => {
    const rows = mapActivityAssignmentsForPayload(
      {
        "act-x": {
          requestedVehicleType: 1,
          requestedSeatCount: 10,
        },
      },
      { "act-x": "Transportation" },
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].supplierId).toBeUndefined();
    expect(rows[0].transportSupplierId).toBeUndefined();
  });
});

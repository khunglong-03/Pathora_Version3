import type { Vehicle } from "@/api/services/transportProviderService";

/** Activity fields matching backend TourInstanceDayActivityDto for seat math. */
export type ActivitySeatRequirementFields = {
  requestedSeatCount?: number | null;
  requestedVehicleCount?: number | null;
};

/**
 * Minimum seat capacity provider assignment must cover — mirrors
 * `ApproveTransportationActivityCommandHandler`:
 * `(RequestedSeatCount * (RequestedVehicleCount ?? 1)) ?? instance.MaxParticipation`.
 */
export function computeRequiredTransportSeats(
  activity: ActivitySeatRequirementFields,
  tourMaxParticipation?: number | null,
): number {
  const per = activity.requestedSeatCount;
  if (per == null) return tourMaxParticipation ?? 0;
  return per * (activity.requestedVehicleCount ?? 1);
}

/** True when id is a non-empty string after trim (JS treats " " as truthy — bad for Guid fields). */
export function hasNonEmptyAssignmentId(id: string | undefined): boolean {
  return typeof id === "string" && id.trim().length > 0;
}

/**
 * For manual vehicle assignment, narrows the fleet to the type requested on the activity
 * (when set). String match mirrors validation in `TransportTourAssignmentPage` (vehicleType
 * vs requestedVehicleType from the API).
 */
export function filterVehiclesByRequestedType(
  vehicles: Pick<Vehicle, "id" | "vehicleType" | "seatCapacity">[],
  requestedVehicleType: string | null | undefined,
): Pick<Vehicle, "id" | "vehicleType" | "seatCapacity">[] {
  if (!requestedVehicleType?.trim()) {
    return vehicles;
  }
  return vehicles.filter((v) => v.vehicleType === requestedVehicleType);
}

export function mapVehiclesToSelectOptions(
  vehicles: Pick<Vehicle, "id" | "vehicleType" | "seatCapacity">[],
): { value: string; label: string }[] {
  return vehicles.map((vehicle) => ({
    value: vehicle.id,
    label: `${vehicle.vehicleType} - ${vehicle.seatCapacity} cho`,
  }));
}

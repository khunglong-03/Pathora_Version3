import type { Vehicle } from "@/api/services/transportProviderService";

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

export interface DraftActivityAssignment {
  supplierId?: string;
  roomType?: string;
  accommodationQuantity?: number;
  vehicleId?: string;
  requestedVehicleType?: number;
  requestedSeatCount?: number;
  // Scope addendum 2026-04-23 — manager-specified vehicle count.
  requestedVehicleCount?: number;
}

export interface CreateInstanceActivityAssignmentPayload {
  originalActivityId: string;
  supplierId?: string;
  roomType?: string;
  accommodationQuantity?: number;
  vehicleId?: string;
  requestedVehicleType?: number;
  requestedSeatCount?: number;
  requestedVehicleCount?: number;
}

const normalizeOptionalValue = (value?: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

export const clearRoomTypeAssignments = (
  activityAssignments: Record<string, DraftActivityAssignment>,
): Record<string, DraftActivityAssignment> =>
  Object.fromEntries(
    Object.entries(activityAssignments).map(([activityId, assignment]) => [
      activityId,
      { ...assignment, roomType: undefined },
    ]),
  );

export const hasRoomAssignments = (
  activityAssignments: Record<string, DraftActivityAssignment>,
): boolean =>
  Object.values(activityAssignments).some(
    (assignment) => normalizeOptionalValue(assignment.roomType) !== undefined,
  );

export const mapActivityAssignmentsForPayload = (
  activityAssignments: Record<string, DraftActivityAssignment>,
): CreateInstanceActivityAssignmentPayload[] =>
  Object.entries(activityAssignments)
    .map(([originalActivityId, assignment]) => ({
      originalActivityId,
      supplierId: normalizeOptionalValue(assignment.supplierId),
      roomType: normalizeOptionalValue(assignment.roomType),
      accommodationQuantity: assignment.accommodationQuantity,
      vehicleId: normalizeOptionalValue(assignment.vehicleId),
      requestedVehicleType: assignment.requestedVehicleType,
      requestedSeatCount: assignment.requestedSeatCount,
      requestedVehicleCount: assignment.requestedVehicleCount,
    }))
    .filter(
      (assignment) =>
        assignment.supplierId ||
        assignment.roomType ||
        assignment.vehicleId ||
        assignment.requestedVehicleType !== undefined ||
        assignment.requestedSeatCount !== undefined ||
        assignment.requestedVehicleCount !== undefined
    );

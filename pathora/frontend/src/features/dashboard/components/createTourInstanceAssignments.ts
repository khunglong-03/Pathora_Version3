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
  /** Hotel / accommodation supplier (backend `SupplierId`). */
  supplierId?: string;
  /** Transport-only supplier (backend `TransportSupplierId`). Must not be conflated with `supplierId`. */
  transportSupplierId?: string;
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

/** Build activityId → activityType from a tour classification (Transportation vs Accommodation). */
export function buildActivityTypeByActivityId(
  classification: { plans?: { activities?: { id: string; activityType: string }[] }[] } | null,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const plan of classification?.plans ?? []) {
    for (const act of plan.activities ?? []) {
      if (act.id) out[act.id] = act.activityType;
    }
  }
  return out;
}

function inferAssignmentChannel(
  activityType: string | undefined,
  assignment: DraftActivityAssignment,
): "accommodation" | "transport" | "unknown" {
  if (activityType === "Accommodation") return "accommodation";
  if (activityType === "Transportation") return "transport";
  const hasRoom = normalizeOptionalValue(assignment.roomType) !== undefined;
  const hasTransportHints =
    assignment.requestedVehicleType !== undefined ||
    assignment.requestedVehicleCount !== undefined ||
    normalizeOptionalValue(assignment.vehicleId) !== undefined;
  if (hasRoom) return "accommodation";
  if (hasTransportHints) return "transport";
  return "unknown";
}

export const mapActivityAssignmentsForPayload = (
  activityAssignments: Record<string, DraftActivityAssignment>,
  activityTypeByActivityId?: Record<string, string>,
): CreateInstanceActivityAssignmentPayload[] =>
  Object.entries(activityAssignments)
    .map(([originalActivityId, assignment]) => {
      const activityType = activityTypeByActivityId?.[originalActivityId];
      const channel = inferAssignmentChannel(activityType, assignment);
      const sup = normalizeOptionalValue(assignment.supplierId);
      const hasRoom = normalizeOptionalValue(assignment.roomType) !== undefined;
      const hasTransportHints =
        assignment.requestedVehicleType !== undefined ||
        assignment.requestedVehicleCount !== undefined ||
        normalizeOptionalValue(assignment.vehicleId) !== undefined;

      let supplierId: string | undefined;
      let transportSupplierId: string | undefined;
      if (channel === "accommodation") {
        supplierId = sup;
      } else if (channel === "transport") {
        transportSupplierId = sup;
      } else if (hasTransportHints && !hasRoom) {
        transportSupplierId = sup;
      } else {
        supplierId = sup;
      }

      return {
        originalActivityId,
        supplierId,
        transportSupplierId,
        roomType: normalizeOptionalValue(assignment.roomType),
        accommodationQuantity: assignment.accommodationQuantity,
        vehicleId: normalizeOptionalValue(assignment.vehicleId),
        requestedVehicleType: assignment.requestedVehicleType,
        requestedSeatCount: assignment.requestedSeatCount,
        requestedVehicleCount: assignment.requestedVehicleCount,
      };
    })
    .filter(
      (assignment) =>
        assignment.supplierId ||
        assignment.transportSupplierId ||
        assignment.roomType ||
        assignment.vehicleId ||
        assignment.requestedVehicleType !== undefined ||
        assignment.requestedSeatCount !== undefined ||
        assignment.requestedVehicleCount !== undefined
    );

export interface DraftActivityAssignment {
  roomType?: string;
  vehicleId?: string;
}

export interface CreateInstanceActivityAssignmentPayload {
  originalActivityId: string;
  roomType?: string;
  vehicleId?: string;
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
      roomType: normalizeOptionalValue(assignment.roomType),
      vehicleId: normalizeOptionalValue(assignment.vehicleId),
    }))
    .filter((assignment) => assignment.roomType || assignment.vehicleId);

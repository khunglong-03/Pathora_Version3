const TOUR_OPERATOR_EDITABLE_STATUSES = new Set(["1", "3", "4"]);

export function canTourOperatorEditTour(status: number | string | null | undefined): boolean {
  return TOUR_OPERATOR_EDITABLE_STATUSES.has(String(status ?? ""));
}

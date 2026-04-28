const TOUR_DESIGNER_EDITABLE_STATUSES = new Set(["1", "3", "4"]);

export function canTourDesignerEditTour(status: number | string | null | undefined): boolean {
  return TOUR_DESIGNER_EDITABLE_STATUSES.has(String(status ?? ""));
}

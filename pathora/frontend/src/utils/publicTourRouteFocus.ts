const PUBLIC_TOUR_RETURN_FOCUS_KEY = "pathora.publicTour.returnFocusId";

export type PublicTourAssignmentKind = "accommodation" | "flight";

export const getPublicTourActionId = (
  kind: PublicTourAssignmentKind,
  bookingId: string,
) => `public-tour-${kind}-${bookingId}`;

export const storePublicTourReturnFocus = (
  kind: PublicTourAssignmentKind,
  bookingId?: string | null,
) => {
  if (typeof window === "undefined" || !bookingId) return;
  window.sessionStorage.setItem(
    PUBLIC_TOUR_RETURN_FOCUS_KEY,
    getPublicTourActionId(kind, bookingId),
  );
};

export const restorePublicTourReturnFocus = () => {
  if (typeof window === "undefined") return false;

  const focusId = window.sessionStorage.getItem(PUBLIC_TOUR_RETURN_FOCUS_KEY);
  if (!focusId) return false;

  window.sessionStorage.removeItem(PUBLIC_TOUR_RETURN_FOCUS_KEY);
  const element = window.document.getElementById(focusId);
  if (!element) return false;

  element.focus({ preventScroll: false });
  return true;
};

export const focusPageHeading = (element: HTMLElement | null) => {
  if (typeof window === "undefined" || !element) return;
  window.requestAnimationFrame(() => {
    element.focus({ preventScroll: true });
  });
};

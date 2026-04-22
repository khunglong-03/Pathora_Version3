/**
 * Centralized approval-status appearance helper for tour instance transport/hotel activities.
 *
 * This module normalizes status values into a consistent visual vocabulary used by:
 * - Provider list cards (`ProviderTourApprovals`)
 * - Transport assignment detail page (`TransportTourAssignmentPage`)
 * - Tour instance detail page (`TourInstanceDetailPage`)
 *
 * @note
 * Multi-vehicle transport (several `transportAssignments` per activity) does not change how
 * per-activity **approval status** is represented; this helper still keys off the same string/numeric fields.
 *
 * `TourInstanceVm` (the list DTO) carries only an instance-level `transportApprovalStatus: number`
 * — it does NOT contain `days[]` or per-activity data. The helper that accepts a numeric status
 * (`getInstanceApprovalAppearance`) is therefore a **worst-status-wins** approximation; it cannot
 * compute a numeric-fraction rollup ("N/M đã duyệt"). If product evidence later demands the
 * fraction, a backend DTO enrichment change (`enrich-tour-instance-vm-with-approval-rollup`)
 * would be required.
 */

export type ApprovalState = "approved" | "pending" | "rejected" | "unassigned";

export interface ApprovalAppearance {
  state: ApprovalState;
  label: string;
  icon: string;
  ringClassName: string;
}

/**
 * Ring class map shared by all approval-status pills across list cards and detail pages.
 * Keys are `ApprovalState`; values include a `ring-1` modifier for visual consistency.
 */
export const APPEARANCE_RING_CLASSES: Record<ApprovalState, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20",
  pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-500/20",
  rejected: "bg-rose-50 text-rose-700 ring-1 ring-rose-500/20",
  unassigned: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/10",
};

/**
 * Normalizes a string-based approval status (from per-activity DTO) to an `ApprovalState`.
 */
export const normalizeApprovalStatus = (status?: string | null): ApprovalState => {
  const normalized = status?.trim().toLowerCase() ?? "";
  switch (normalized) {
    case "approved":
      return "approved";
    case "pending":
      return "pending";
    case "rejected":
      return "rejected";
    default:
      return "unassigned";
  }
};

/**
 * Returns the visual appearance for a **string-based** approval status (per-activity DTO).
 *
 * Used by `TransportTourAssignmentPage` and `TourInstanceDetailPage` for per-activity pills.
 */
export const getApprovalAppearance = (status?: string | null): ApprovalAppearance => {
  const state = normalizeApprovalStatus(status);
  return getAppearanceForState(state);
};

/**
 * Returns the visual appearance for a **numeric** instance-level `transportApprovalStatus`.
 *
 * Mapping: 0 = Pending, 1 = Approved, 2 = Rejected, undefined/other = unassigned.
 *
 * @note This maps from the instance-level field which is a transition artifact.
 * Per-activity `transportationApprovalStatus` (string) is authoritative.
 */
export const getInstanceApprovalAppearance = (
  status: number | undefined,
): ApprovalAppearance => {
  switch (status) {
    case 1:
      return getAppearanceForState("approved");
    case 0:
      return getAppearanceForState("pending");
    case 2:
      return getAppearanceForState("rejected");
    default:
      return getAppearanceForState("unassigned");
  }
};

const getAppearanceForState = (state: ApprovalState): ApprovalAppearance => {
  switch (state) {
    case "approved":
      return {
        state,
        label: "Đã duyệt",
        icon: "heroicons:check-circle",
        ringClassName: APPEARANCE_RING_CLASSES.approved,
      };
    case "pending":
      return {
        state,
        label: "Đang chờ duyệt",
        icon: "heroicons:clock",
        ringClassName: APPEARANCE_RING_CLASSES.pending,
      };
    case "rejected":
      return {
        state,
        label: "Đã từ chối",
        icon: "heroicons:x-circle",
        ringClassName: APPEARANCE_RING_CLASSES.rejected,
      };
    case "unassigned":
    default:
      return {
        state: "unassigned",
        label: "Chưa giao nhà cung cấp",
        icon: "heroicons:information-circle",
        ringClassName: APPEARANCE_RING_CLASSES.unassigned,
      };
  }
};

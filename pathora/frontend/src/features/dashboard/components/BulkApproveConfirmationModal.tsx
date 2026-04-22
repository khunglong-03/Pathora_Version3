"use client";

import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Icon, Modal } from "@/components/ui";
import type { TourInstanceDayActivityDto } from "@/types/tour";
import type { ApprovalDraft } from "./TransportTourAssignmentPage";

export type BulkApproveItem = {
  dayNumber: number;
  dayTitle: string;
  activity: TourInstanceDayActivityDto;
};

interface BulkApproveConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  items: BulkApproveItem[];
  drafts: Record<string, ApprovalDraft>;
  vehicles: { id: string; vehiclePlate: string }[];
  drivers: { id: string; fullName: string }[];
  onConfirm: (note: string | undefined) => Promise<void>;
  failedState?: {
    message: string;
    failedActivityId?: string;
  } | null;
}

export default function BulkApproveConfirmationModal({
  open,
  onClose,
  items,
  drafts,
  vehicles,
  drivers,
  onConfirm,
  failedState,
}: BulkApproveConfirmationModalProps) {
  const { t } = useTranslation();
  const [sharedNote, setSharedNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(sharedNote.trim() || undefined);
    } finally {
      setSubmitting(false);
    }
  };

  const getVehiclePlate = (vehicleId?: string) =>
    vehicles.find((v) => v.id === vehicleId)?.vehiclePlate ?? "—";
  const getDriverName = (driverId?: string) =>
    drivers.find((d) => d.id === driverId)?.fullName ?? "—";

  const formatDraftSummary = (
    draft?: ApprovalDraft | { vehicleId?: string; driverId?: string; note?: string },
  ) => {
    if (draft && "rows" in draft && Array.isArray(draft.rows)) {
      const filled = draft.rows.filter((r) => r.vehicleId && r.driverId);
      if (filled.length === 0) return "—";
      return filled
        .map(
          (r) =>
            `${getVehiclePlate(r.vehicleId)} / ${getDriverName(r.driverId)}`,
        )
        .join(" · ");
    }
    const legacy = draft as { vehicleId?: string; driverId?: string } | undefined;
    if (legacy?.vehicleId && legacy?.driverId) {
      return `${getVehiclePlate(legacy.vehicleId)} / ${getDriverName(legacy.driverId)}`;
    }
    return "—";
  };

  return (
    <Modal
      isOpen={open}
      onClose={submitting ? () => {} : onClose}
      disableBackdrop={submitting}
      title={t("tourInstance.transport.bulkApproveTitle", "Duyệt hàng loạt")}
      centered
      size="lg"
    >
      <div className="space-y-4">
        {/* Failure banner */}
        {failedState && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <p className="font-semibold">
              Duyệt hàng loạt thất bại. Không có hoạt động nào được lưu.
            </p>
            <p className="mt-1">{failedState.message}</p>
          </div>
        )}

        {/* Screen reader live region */}
        {failedState && (
          <div ref={liveRegionRef} role="status" aria-live="assertive" className="sr-only">
            Bulk approve failed: {failedState.message}
          </div>
        )}

        {!failedState && (
          <p className="text-sm text-slate-600">
            Xác nhận duyệt {items.length} hoạt động vận chuyển sau:
          </p>
        )}

        {/* Activity list */}
        <ul
          role="list"
          className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200"
        >
          {items.map((item) => {
            const draft = drafts[item.activity.id];
            const isFailed = failedState?.failedActivityId === item.activity.id;

            return (
              <li
                key={item.activity.id}
                id={`bulk-row-${item.activity.id}`}
                className={`p-3 ${isFailed ? "ring-2 ring-rose-500 bg-rose-50" : ""}`}
              >
                {/* Desktop layout */}
                <div className="hidden items-center gap-4 text-sm md:flex">
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    Ngày {item.dayNumber}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-900" title={item.activity.title}>
                    {item.activity.title}
                  </span>
                  <span className="min-w-0 max-w-[280px] shrink-0 truncate text-slate-500" title={formatDraftSummary(draft)}>
                    {formatDraftSummary(draft)}
                  </span>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden">
                  <p
                    className="truncate text-sm font-medium text-slate-900"
                    title={item.activity.title}
                  >
                    Ngày {item.dayNumber}: {item.activity.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDraftSummary(draft)}
                  </p>
                </div>

                {/* Inline error for failed row */}
                {isFailed && failedState?.message && (
                  <p className="mt-1 text-xs text-rose-700">{failedState.message}</p>
                )}
              </li>
            );
          })}
        </ul>

        {/* Shared note */}
        {!failedState && (
          <div>
            <label htmlFor="bulk-shared-note" className="mb-1 block text-sm font-medium text-slate-700">
              Ghi chú chung
            </label>
            <textarea
              id="bulk-shared-note"
              rows={3}
              value={sharedNote}
              onChange={(e) => setSharedNote(e.target.value)}
              placeholder="Ghi chú này sẽ áp dụng cho tất cả hoạt động trong lần duyệt này."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {failedState ? "Đóng và xem" : t("common.cancel", "Huỷ")}
          </button>
          {!failedState && (
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
                  Đang duyệt...
                </span>
              ) : (
                `Duyệt ${items.length} hoạt động`
              )}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

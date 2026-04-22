"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Icon, Modal } from "@/components/ui";
import { supplierService, type SupplierItem } from "@/api/services/supplierService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import {
  VehicleTypeMap,
  vehicleTypeNameToKey,
  type TourInstanceDayActivityDto,
} from "@/types/tour";
import { normalizeApprovalStatus } from "@/utils/approvalStatusHelper";

interface SupplierReassignmentModalProps {
  open: boolean;
  onClose: () => void;
  activity: TourInstanceDayActivityDto;
  activityType: "Transportation" | "Accommodation";
  tourInstanceId: string;
  onSuccess: () => void;
}

type FetchState = "loading" | "empty" | "error" | "ready";

const toVehicleTypeSelectValue = (
  requestedVehicleType: TourInstanceDayActivityDto["requestedVehicleType"],
) => {
  if (!requestedVehicleType) return "";

  const numericValue = Number(requestedVehicleType);
  if (
    Number.isInteger(numericValue)
    && VehicleTypeMap[numericValue] !== undefined
  ) {
    return String(numericValue);
  }

  const mapped = vehicleTypeNameToKey(requestedVehicleType);
  return mapped !== undefined ? String(mapped) : "";
};

export default function SupplierReassignmentModal({
  open,
  onClose,
  activity,
  activityType,
  tourInstanceId,
  onSuccess,
}: SupplierReassignmentModalProps) {
  const { t } = useTranslation();

  // Supplier list state
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [fetchState, setFetchState] = useState<FetchState>("loading");

  // Form state
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [requestedVehicleType, setRequestedVehicleType] = useState<string>(
    toVehicleTypeSelectValue(activity.requestedVehicleType),
  );
  const [requestedSeatCount, setRequestedSeatCount] = useState<number>(
    activity.requestedSeatCount ?? 0,
  );
  const [submitting, setSubmitting] = useState(false);

  // Track dirty state for Esc guard
  const initialValues = useRef({
    supplierId: "",
    vehicleType: toVehicleTypeSelectValue(activity.requestedVehicleType),
    seatCount: activity.requestedSeatCount ?? 0,
  });

  const isDirty = useMemo(
    () =>
      selectedSupplierId !== initialValues.current.supplierId ||
      requestedVehicleType !== initialValues.current.vehicleType ||
      requestedSeatCount !== initialValues.current.seatCount,
    [selectedSupplierId, requestedVehicleType, requestedSeatCount],
  );

  // Refs for focus management
  const supplierSelectRef = useRef<HTMLSelectElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const isApproved =
    activityType === "Transportation"
      ? normalizeApprovalStatus(activity.transportationApprovalStatus) === "approved"
      : normalizeApprovalStatus(activity.accommodation?.supplierApprovalStatus) === "approved";

  // Fetch suppliers on open
  const fetchSuppliers = useCallback(async () => {
    setFetchState("loading");
    try {
      const supplierType = activityType === "Transportation" ? "Transport" : "Accommodation";
      const result = await supplierService.getSuppliers(supplierType);
      if (result.length === 0) {
        setFetchState("empty");
      } else {
        setSuppliers(result);
        setFetchState("ready");
      }
    } catch {
      setFetchState("error");
    }
  }, [activityType]);

  useEffect(() => {
    if (open) {
      void fetchSuppliers();
      // Reset form
      setSelectedSupplierId("");
      setRequestedVehicleType(
        toVehicleTypeSelectValue(activity.requestedVehicleType),
      );
      setRequestedSeatCount(activity.requestedSeatCount ?? 0);
      initialValues.current = {
        supplierId: "",
        vehicleType: toVehicleTypeSelectValue(activity.requestedVehicleType),
        seatCount: activity.requestedSeatCount ?? 0,
      };
    }
  }, [open, fetchSuppliers, activity]);

  // Focus management after load
  useEffect(() => {
    if (open && fetchState === "ready") {
      // Use timeout to ensure DOM has rendered
      const timer = setTimeout(() => {
        if (isApproved) {
          cancelButtonRef.current?.focus();
        } else {
          supplierSelectRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, fetchState, isApproved]);

  // Dirty-state Esc guard
  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm("Thoát không lưu thay đổi?");
      if (!confirmed) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleSubmit = async () => {
    if (
      !selectedSupplierId
      || (activityType === "Transportation" && !requestedVehicleType)
    ) {
      return;
    }
    setSubmitting(true);

    try {
      if (activityType === "Transportation") {
        await tourInstanceService.assignTransportSupplier(tourInstanceId, activity.id, {
          supplierId: selectedSupplierId,
          requestedVehicleType: Number(requestedVehicleType),
          requestedSeatCount,
        });
      } else {
        await tourInstanceService.assignAccommodationSupplier(
          tourInstanceId,
          activity.id,
          selectedSupplierId,
        );
      }

      const newSupplier = suppliers.find((s) => s.id === selectedSupplierId);
      toast.success(
        `Đã đổi nhà cung cấp Hoạt động "${activity.title}" → ${newSupplier?.name ?? ""}`,
      );
      onSuccess();
      onClose();
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    } finally {
      setSubmitting(false);
    }
  };

  const supplierOptions = suppliers.map((s) => ({
    label: `${s.name} (${s.supplierCode})`,
    value: s.id,
  }));

  const vehicleTypeOptions = [
    ...Object.entries(VehicleTypeMap).map(([value, label]) => ({
      label: t(`vehicleTypes.${label}`, label),
      value,
    })),
  ];

  const actionLabel = isApproved ? "Đổi và huỷ phê duyệt" : "Đổi nhà cung cấp";

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title={`Đổi nhà cung cấp — ${activity.title}`}
      centered
    >
      <div className="space-y-4">
        {/* Warning banner for Approved activities */}
        {isApproved && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex gap-2 items-start"
          >
            <Icon icon="heroicons:exclamation-triangle" className="size-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-semibold">Cảnh báo: Sẽ huỷ phê duyệt hiện tại</p>
              <p className="mt-1">
                Phê duyệt hiện tại sẽ bị huỷ và xe / phòng hiện đang giữ chỗ sẽ được giải phóng.
              </p>
            </div>
          </div>
        )}

        {/* Loading state */}
        {fetchState === "loading" && (
          <div className="animate-pulse space-y-3">
            <div className="h-10 rounded-lg bg-slate-100" />
            <div className="h-4 w-3/4 rounded bg-slate-100" />
          </div>
        )}

        {/* Empty state */}
        {fetchState === "empty" && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
            <p>Chưa có nhà cung cấp phù hợp</p>
            <button
              type="button"
              onClick={() => window.open("/admin/suppliers", "_blank")}
              className="mt-2 text-indigo-600 hover:underline"
            >
              Mở trang quản lý nhà cung cấp
            </button>
          </div>
        )}

        {/* Error state */}
        {fetchState === "error" && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center justify-between">
            <span>Không tải được danh sách nhà cung cấp</span>
            <button
              type="button"
              onClick={() => void fetchSuppliers()}
              className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-medium hover:bg-rose-100"
            >
              {t("common.retry", "Thử lại")}
            </button>
          </div>
        )}

        {/* Ready state — the form */}
        {fetchState === "ready" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="supplier-select" className="mb-1 block text-sm font-medium text-slate-700">
                Nhà cung cấp
              </label>
              <select
                id="supplier-select"
                ref={supplierSelectRef}
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">Chọn nhà cung cấp...</option>
                {supplierOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {activityType === "Transportation" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="vehicle-type-select" className="mb-1 block text-sm font-medium text-slate-700">
                    Loại xe yêu cầu
                  </label>
                  <select
                    id="vehicle-type-select"
                    value={requestedVehicleType}
                    onChange={(e) => setRequestedVehicleType(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">
                      {t("tourInstance.transport.selectVehicleType", "Select vehicle type...")}
                    </option>
                    {vehicleTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="seat-count-input" className="mb-1 block text-sm font-medium text-slate-700">
                    Số ghế yêu cầu
                  </label>
                  <input
                    id="seat-count-input"
                    type="number"
                    min={1}
                    value={requestedSeatCount}
                    onChange={(e) => setRequestedSeatCount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
          >
            {t("common.cancel", "Huỷ")}
          </button>
          {fetchState === "ready" && (
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={
                !selectedSupplierId
                || submitting
                || (activityType === "Transportation" && !requestedVehicleType)
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                isApproved
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {submitting ? t("common.processing", "Đang xử lý...") : actionLabel}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

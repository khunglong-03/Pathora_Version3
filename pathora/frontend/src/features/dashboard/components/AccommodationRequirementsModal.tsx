"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { Icon, Modal } from "@/components/ui";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import TextInput from "@/components/ui/TextInput";
import { supplierService, type SupplierItem } from "@/api/services/supplierService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { handleApiError } from "@/utils/apiResponse";
import { normalizeApprovalStatus } from "@/utils/approvalStatusHelper";
import type { TourInstanceDayActivityDto } from "@/types/tour";

const FALLBACK_ROOM_TYPES = [
  "Single",
  "Double",
  "Twin",
  "Triple",
  "Quad",
  "Family",
  "Suite",
  "Dormitory",
  "Standard",
  "Deluxe",
];

interface AccommodationRequirementsModalProps {
  open: boolean;
  onClose: () => void;
  activity: TourInstanceDayActivityDto;
  tourInstanceId: string;
  continent?: number | null;
  minSuggestedQuantity?: number;
  onSuccess: () => void;
}

export default function AccommodationRequirementsModal({
  open,
  onClose,
  activity,
  tourInstanceId,
  continent,
  minSuggestedQuantity = 1,
  onSuccess,
}: AccommodationRequirementsModalProps) {
  const { t } = useTranslation();
  const accommodation = activity.accommodation;

  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [supplierAccommodations, setSupplierAccommodations] = useState<
    Array<{ roomType: string; name?: string; totalRooms?: number }>
  >([]);
  const [accommodationsLoading, setAccommodationsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [supplierId, setSupplierId] = useState(accommodation?.supplierId ?? "");
  const [roomType, setRoomType] = useState(accommodation?.roomType ?? "");
  const [quantity, setQuantity] = useState(
    Math.max(accommodation?.quantity ?? 1, minSuggestedQuantity, 1),
  );

  const isApproved =
    normalizeApprovalStatus(accommodation?.supplierApprovalStatus) === "approved";

  const resetForm = useCallback(() => {
    setSupplierId(accommodation?.supplierId ?? "");
    setRoomType(accommodation?.roomType ?? "");
    setQuantity(
      Math.max(accommodation?.quantity ?? 1, minSuggestedQuantity, 1),
    );
  }, [accommodation, minSuggestedQuantity]);

  useEffect(() => {
    if (!open) return;
    resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSuppliersLoading(true);
    supplierService
      .getSuppliers("Accommodation", continent ?? null)
      .then((list) => {
        if (!cancelled) setSuppliers(list);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error(
            t(
              "tourInstance.bookingHotel.loadSuppliersError",
              "Không thể tải danh sách khách sạn",
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSuppliersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, continent, t]);

  useEffect(() => {
    if (!supplierId) {
      setSupplierAccommodations([]);
      return;
    }
    let cancelled = false;
    setAccommodationsLoading(true);
    supplierService
      .getSupplierAccommodations(supplierId)
      .then((list) => {
        if (!cancelled) setSupplierAccommodations(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setSupplierAccommodations([]);
      })
      .finally(() => {
        if (!cancelled) setAccommodationsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  const roomTypeOptions = useMemo(() => {
    if (supplierId && supplierAccommodations.length > 0) {
      return supplierAccommodations.map((a) => ({
        value: a.roomType,
        label: `${a.name ? `${a.name} — ${a.roomType}` : a.roomType}${
          typeof a.totalRooms === "number" ? ` (${a.totalRooms} phòng)` : ""
        }`,
      }));
    }
    return FALLBACK_ROOM_TYPES.map((rt) => ({ value: rt, label: rt }));
  }, [supplierAccommodations, supplierId]);

  const handleSubmit = async () => {
    if (!roomType.trim()) {
      toast.warning(
        t(
          "tourInstance.accommodation.requirements.roomTypeRequired",
          "Vui lòng chọn loại phòng.",
        ),
      );
      return;
    }
    if (quantity <= 0) {
      toast.warning(
        t(
          "tourInstance.bookingHotel.validation.roomCountPositive",
          "Số phòng phải lớn hơn 0",
        ),
      );
      return;
    }

    setSubmitting(true);
    try {
      await tourInstanceService.setAccommodationRequirements(
        tourInstanceId,
        activity.id,
        {
          supplierId: supplierId || null,
          roomType: roomType.trim(),
          quantity,
        },
      );
      toast.success(
        t(
          "tourInstance.accommodation.requirements.saved",
          "Đã cập nhật yêu cầu phòng cho hoạt động này",
        ),
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

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t(
        "tourInstance.accommodation.requirements.title",
        "Điều chỉnh yêu cầu phòng",
      )}
      centered
    >
      <div className="space-y-4">
        <p className="text-sm text-stone-600">
          {t(
            "tourInstance.accommodation.requirements.subtitle",
            "Hoạt động: {{title}}",
            { title: activity.title },
          )}
        </p>

        {isApproved && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex gap-2 items-start">
            <Icon icon="heroicons:exclamation-triangle" className="size-5 shrink-0 text-amber-600" />
            <span>
              {t(
                "tourInstance.accommodation.requirements.approvedWarning",
                "Thay đổi số phòng hoặc nhà cung cấp sẽ đặt lại trạng thái duyệt về Chờ duyệt và xóa block phòng hiện tại.",
              )}
            </span>
          </div>
        )}

        {minSuggestedQuantity > (accommodation?.quantity ?? 0) && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
            {t(
              "tourInstance.accommodation.requirements.insufficientRooms",
              "Các booking đã phân bổ tổng {{assigned}} phòng — cần ít nhất {{min}} phòng.",
              { assigned: minSuggestedQuantity, min: minSuggestedQuantity },
            )}
          </div>
        )}

        <Select
          label={t(
            "tourInstance.accommodation.requirements.supplier",
            "Khách sạn / NCC",
          )}
          value={supplierId}
          onChange={(e) => {
            setSupplierId(e.target.value);
            setRoomType("");
          }}
          disabled={submitting || suppliersLoading}
          options={[
            {
              value: "",
              label: suppliersLoading
                ? t("common.loading", "Đang tải...")
                : t(
                    "tourInstance.accommodation.requirements.selectSupplier",
                    "-- Chọn khách sạn --",
                  ),
            },
            ...suppliers.map((s) => ({
              value: s.id,
              label: s.supplierCode ? `${s.name} (${s.supplierCode})` : s.name,
            })),
          ]}
        />

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Select
              label={t("tourInstance.accommodation.roomType", "Loại phòng")}
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              disabled={submitting || (!!supplierId && accommodationsLoading)}
              options={[
                {
                  value: "",
                  label:
                    supplierId && accommodationsLoading
                      ? t("common.loading", "Đang tải...")
                      : t(
                          "tourInstance.accommodation.requirements.selectRoomType",
                          "-- Chọn loại phòng --",
                        ),
                },
                ...roomTypeOptions,
              ]}
            />
          </div>
          <div className="w-28">
            <TextInput
              label={t("tourInstance.accommodation.quantity", "Số phòng")}
              type="number"
              min={1}
              value={String(quantity)}
              onChange={(e) =>
                setQuantity(Math.max(1, Number(e.target.value) || 1))
              }
              disabled={submitting}
            />
          </div>
        </div>

        {quantity < minSuggestedQuantity && (
          <p className="text-xs font-medium text-amber-700">
            {t(
              "tourInstance.accommodation.requirements.suggestMin",
              "Đề xuất tối thiểu: {{count}} phòng",
              { count: minSuggestedQuantity },
            )}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            {t("common.cancel", "Huỷ")}
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={submitting || !roomType.trim() || quantity <= 0}
          >
            {submitting
              ? t("common.processing", "Đang xử lý...")
              : t("common.save", "Lưu")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

import React, { useState } from "react";
import * as yup from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { handleApiError } from "@/utils/apiResponse";
import { adminHotelService, type CreateRoomBlockDto } from "@/api/services/adminHotelService";

const createBlockSchema = yup.object({
  accommodationId: yup.string().required("Vui lòng chọn cơ sở lưu trú"),
  startDate: yup.string().required("Vui lòng chọn ngày bắt đầu").typeError("Ngày bắt đầu không hợp lệ"),
  endDate: yup
    .string()
    .required("Vui lòng chọn ngày kết thúc")
    .typeError("Ngày kết thúc không hợp lệ")
    .test("after-start", "Ngày kết thúc phải sau ngày bắt đầu", function (value) {
      const { startDate } = this.parent;
      if (!startDate || !value) return true;
      return new Date(value) >= new Date(startDate);
    }),
  roomCount: yup
    .number()
    .required("Vui lòng nhập số phòng")
    .typeError("Số phòng phải là số")
    .min(1, "Tối thiểu 1 phòng")
    .max(100, "Tối đa 100 phòng"),
  reason: yup.string().optional().max(500, "Ghi chú tối đa 500 ký tự"),
});

type CreateBlockFormData = yup.InferType<typeof createBlockSchema>;

interface CreateBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBlockModal({ isOpen, onClose, onSuccess }: CreateBlockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateBlockFormData>({
    resolver: yupResolver(createBlockSchema) as unknown as Parameters<typeof useForm>[0]["resolver"],
    defaultValues: {
      roomCount: 1,
    },
  });

  const onSubmitCreate = async (data: CreateBlockFormData) => {
    setIsSubmitting(true);
    try {
      await adminHotelService.createRoomBlock(data as CreateRoomBlockDto);
      reset();
      onSuccess();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Thêm chặn phòng"
      size="md"
    >
      <form onSubmit={void handleSubmit(onSubmitCreate)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
            Cơ sở lưu trú <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <select
            {...register("accommodationId")}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: errors.accommodationId ? "#DC2626" : "#E5E7EB", color: "#111827" }}
          >
            <option value="">— Chọn cơ sở lưu trú —</option>
            <option value="acc-demo">Khách sạn Mai (Demo)</option>
          </select>
          {errors.accommodationId && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.accommodationId.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
              Từ ngày <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              type="date"
              {...register("startDate")}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: errors.startDate ? "#DC2626" : "#E5E7EB", color: "#111827" }}
            />
            {errors.startDate && (
              <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.startDate.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
              Đến ngày <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <input
              type="date"
              {...register("endDate")}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: errors.endDate ? "#DC2626" : "#E5E7EB", color: "#111827" }}
            />
            {errors.endDate && (
              <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.endDate.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
            Số phòng chặn <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="number"
            min={1}
            max={100}
            {...register("roomCount")}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: errors.roomCount ? "#DC2626" : "#E5E7EB", color: "#111827" }}
          />
          {errors.roomCount && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.roomCount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
            Lý do (tùy chọn)
          </label>
          <textarea
            {...register("reason")}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
            style={{ borderColor: errors.reason ? "#DC2626" : "#E5E7EB", color: "#111827" }}
            placeholder="VD: Bảo trì, sửa chữa, sự kiện..."
          />
          {errors.reason && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{errors.reason.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
          >
            Tạo chặn phòng
          </Button>
        </div>
      </form>
    </Modal>
  );
}

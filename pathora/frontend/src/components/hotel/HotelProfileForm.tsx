"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import type { HotelSupplierInfo } from "@/api/services/hotelProviderService";

interface FormValues {
  name: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
}

const schema = yup.object({
  name: yup.string().required("Tên khách sạn là bắt buộc"),
  address: yup.string(),
  phone: yup.string(),
  email: yup.string().email("Email không hợp lệ").optional(),
  notes: yup.string(),
});

interface HotelProfileFormProps {
  data: HotelSupplierInfo;
  onSave: (data: FormValues) => Promise<void>;
  onCancel: () => void;
}

export default function HotelProfileForm({
  data,
  onSave,
  onCancel,
}: HotelProfileFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: data.name,
      address: data.address ?? "",
      phone: data.phone ?? "",
      email: data.email ?? "",
      notes: data.notes ?? "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await onSave(values);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Cập nhật thất bại",
      );
    }
  };

  return (
    <div
      className="rounded-xl p-6"
      style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
    >
      <form onSubmit={void handleSubmit(onSubmit)} className="space-y-4">
        {submitError && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
            {submitError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Tên khách sạn <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            {...register("name")}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: errors.name ? "#EF4444" : "var(--border)" }}
          />
          {errors.name && (
            <p className="text-xs mt-1" style={{ color: "#EF4444" }}>
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Địa chỉ</label>
          <input
            {...register("address")}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Số điện thoại</label>
            <input
              {...register("phone")}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: errors.email ? "#EF4444" : "var(--border)" }}
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: "#EF4444" }}>
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Ghi chú</label>
          <textarea
            {...register("notes")}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: "var(--border)" }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm border transition-all"
            style={{ borderColor: "var(--border)" }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm text-white transition-all"
            style={{ backgroundColor: "#6366F1" }}
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}

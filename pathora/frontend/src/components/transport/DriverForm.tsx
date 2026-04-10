"use client";

import React, { useState } from "react";
import { X, UsersThree } from "@phosphor-icons/react";
import type { Driver, CreateDriverDto } from "@/api/services/transportProviderService";

interface DriverFormProps {
  driver?: Driver;
  onSave: (data: CreateDriverDto) => Promise<void>;
  onCancel: () => void;
}

// Backend returns numeric DriverLicenseType (1=B1, 2=B2, 3=C, 4=D, 5=E, 6=F)
const LICENSE_TYPES = [
  { value: 1, label: "Bằng B1" },
  { value: 2, label: "Bằng B2" },
  { value: 3, label: "Bằng C" },
  { value: 4, label: "Bằng D" },
  { value: 5, label: "Bằng E" },
  { value: 6, label: "Bằng F" },
];

// Backend returns numeric license type, map to label for display
const LICENSE_TYPE_LABELS: Record<number, string> = {
  1: "Bằng B1",
  2: "Bằng B2",
  3: "Bằng C",
  4: "Bằng D",
  5: "Bằng E",
  6: "Bằng F",
};

export default function DriverForm({ driver, onSave, onCancel }: DriverFormProps) {
  const [formData, setFormData] = useState<CreateDriverDto>({
    fullName: driver?.fullName ?? "",
    phoneNumber: driver?.phoneNumber ?? "",
    licenseNumber: driver?.licenseNumber ?? "",
    licenseType: driver?.licenseType ? Number(driver.licenseType) : 1,
    avatarUrl: driver?.avatarUrl,
    notes: driver?.notes,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName || formData.fullName.trim().length === 0) {
      newErrors.fullName = "Họ tên không được để trống";
    }
    if (!formData.phoneNumber || formData.phoneNumber.trim().length === 0) {
      newErrors.phoneNumber = "Số điện thoại không được để trống";
    } else {
      // Vietnamese phone format: 09xxxxxxx, 01xxxxxxxxx, 03xxxxxxxx
      const phoneRegex = /^(0[1-9][0-9]{8,9})$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
        newErrors.phoneNumber = "Số điện thoại không hợp lệ (VD: 0912345678)";
      }
    }
    if (!formData.licenseNumber || formData.licenseNumber.trim().length === 0) {
      newErrors.licenseNumber = "Số bằng lái không được để trống";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 bg-white"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#6366F112" }}
          >
            <UsersThree size={20} style={{ color: "#6366F1" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#111827" }}>
              {driver ? "Sửa tài xế" : "Thêm tài xế"}
            </h2>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {driver ? `Tài xế: ${driver.fullName}` : "Thông tin tài xế mới"}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg transition-colors duration-150 hover:bg-gray-100"
          aria-label="Đóng"
        >
          <X size={20} style={{ color: "#6B7280" }} />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="px-6 py-6 space-y-5">
          {/* Họ tên */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn A"
              className={`w-full px-3 py-2.5 rounded-xl text-sm border transition-colors duration-150 outline-none ${
                errors.fullName ? "border-red-300" : "border-gray-200"
              } focus:border-indigo-400`}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Số điện thoại */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="VD: 0912345678"
              className={`w-full px-3 py-2.5 rounded-xl text-sm border transition-colors duration-150 outline-none ${
                errors.phoneNumber ? "border-red-300" : "border-gray-200"
              } focus:border-indigo-400`}
              aria-invalid={!!errors.phoneNumber}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Số bằng lái */}
          <div>
            <label htmlFor="licenseNumber" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              Số bằng lái <span className="text-red-500">*</span>
            </label>
            <input
              id="licenseNumber"
              name="licenseNumber"
              type="text"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="VD: 123456789012"
              className={`w-full px-3 py-2.5 rounded-xl text-sm border transition-colors duration-150 outline-none ${
                errors.licenseNumber ? "border-red-300" : "border-gray-200"
              } focus:border-indigo-400`}
              aria-invalid={!!errors.licenseNumber}
            />
            {errors.licenseNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.licenseNumber}</p>
            )}
          </div>

          {/* Loại bằng lái */}
          <div>
            <label htmlFor="licenseType" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              Loại bằng lái <span className="text-red-500">*</span>
            </label>
            <select
              id="licenseType"
              name="licenseType"
              value={formData.licenseType}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 transition-colors duration-150 outline-none focus:border-indigo-400 appearance-none bg-white"
            >
              {LICENSE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Ghi chú */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              Ghi chú
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes ?? ""}
              onChange={handleChange}
              placeholder="Thông tin bổ sung..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 transition-colors duration-150 outline-none focus:border-indigo-400 resize-none"
            />
          </div>

          {/*
            avatarUrl field is supported by the backend (CreateDriverDto / Driver entity)
            but no image upload endpoint exists yet. The field is pre-populated from
            driver?.avatarUrl and will be persisted on save once upload is implemented.
            TODO: Add a proper image upload input (e.g., file picker → backend upload endpoint)
            once the backend provides a /drivers/{id}/avatar upload handler.
          */}
          {formData.avatarUrl && (
            <div>
              <span className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                Ảnh đại diện
              </span>
              <img
                src={formData.avatarUrl}
                alt={formData.fullName}
                className="w-16 h-16 rounded-xl object-cover border border-gray-200"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-3 sticky bottom-0 bg-white"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 border hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#6366F1" }}
          >
            {isSubmitting ? "Đang lưu..." : driver ? "Lưu thay đổi" : "Thêm tài xế"}
          </button>
        </div>
      </form>
    </div>
  );
}
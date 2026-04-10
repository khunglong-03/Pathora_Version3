"use client";

import React, { useState } from "react";
import { X, Car } from "@phosphor-icons/react";
import type { Vehicle, CreateVehicleDto } from "@/api/services/transportProviderService";

interface VehicleFormProps {
  vehicle?: Vehicle;
  onSave: (data: CreateVehicleDto) => Promise<void>;
  onCancel: () => void;
}

const VEHICLE_TYPES = [
  { value: 1, label: "Xe 4 chỗ" },
  { value: 2, label: "Xe buýt" },
  { value: 3, label: "Xe 12-29 chỗ" },
  { value: 4, label: "Xe van" },
  { value: 5, label: "Xe coach" },
  { value: 6, label: "Xe máy" },
];

export default function VehicleForm({ vehicle, onSave, onCancel }: VehicleFormProps) {
  const [formData, setFormData] = useState<CreateVehicleDto>({
    vehiclePlate: vehicle?.vehiclePlate ?? "",
    vehicleType: vehicle ? (VEHICLE_TYPES.find((t) => t.value === Number(vehicle.vehicleType))?.value ?? 1) : 1,
    brand: vehicle?.brand,
    model: vehicle?.model,
    seatCapacity: vehicle?.seatCapacity ?? 4,
    notes: vehicle?.notes,
    locationArea: undefined,
    operatingCountries: vehicle?.operatingCountries,
    vehicleImageUrls: vehicle?.vehicleImageUrls,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.vehiclePlate || formData.vehiclePlate.trim().length === 0) {
      newErrors.vehiclePlate = "Biển số không được để trống";
    }
    if (!vehicle && formData.vehiclePlate) {
      // Basic plate format: at least 4 characters, alphanumeric with spaces/hyphens
      const plateRegex = /^[A-Z0-9\s-]{4,20}$/i;
      if (!plateRegex.test(formData.vehiclePlate.trim())) {
        newErrors.vehiclePlate = "Biển số không hợp lệ (ví dụ: 51A-12345)";
      }
    }
    if (!formData.seatCapacity || formData.seatCapacity < 1) {
      newErrors.seatCapacity = "Sức chứa phải lớn hơn 0";
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
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value ? parseInt(value, 10) : undefined) : value,
    }));
    // Clear error on change
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
            <Car size={20} style={{ color: "#6366F1" }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: "#111827" }}>
              {vehicle ? "Sửa phương tiện" : "Thêm phương tiện"}
            </h2>
            <p className="text-xs" style={{ color: "#9CA3AF" }}>
              {vehicle ? `Biển số: ${vehicle.vehiclePlate}` : "Thông tin phương tiện mới"}
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
          {/* Biển số */}
          <div>
            <label htmlFor="vehiclePlate" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              Biển số <span className="text-red-500">*</span>
            </label>
            <input
              id="vehiclePlate"
              name="vehiclePlate"
              type="text"
              value={formData.vehiclePlate}
              onChange={handleChange}
              disabled={!!vehicle}
              placeholder="VD: 51A-12345"
              className={`w-full px-3 py-2.5 rounded-xl text-sm border transition-colors duration-150 outline-none ${
                errors.vehiclePlate ? "border-red-300" : "border-gray-200"
              } ${vehicle ? "bg-gray-100 cursor-not-allowed" : "focus:border-indigo-400"}`}
              aria-invalid={!!errors.vehiclePlate}
              aria-describedby={errors.vehiclePlate ? "vehiclePlate-error" : undefined}
            />
            {errors.vehiclePlate && (
              <p id="vehiclePlate-error" className="text-xs text-red-500 mt-1">{errors.vehiclePlate}</p>
            )}
          </div>

          {/* Loại xe */}
          <div>
            <label htmlFor="vehicleType" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              Loại xe <span className="text-red-500">*</span>
            </label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 transition-colors duration-150 outline-none focus:border-indigo-400 appearance-none bg-white"
            >
              {VEHICLE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Brand + Model row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                Hãng xe
              </label>
              <input
                id="brand"
                name="brand"
                type="text"
                value={formData.brand ?? ""}
                onChange={handleChange}
                placeholder="VD: Toyota"
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 transition-colors duration-150 outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                Dòng xe
              </label>
              <input
                id="model"
                name="model"
                type="text"
                value={formData.model ?? ""}
                onChange={handleChange}
                placeholder="VD: Innova"
                className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 transition-colors duration-150 outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          {/* Sức chứa */}
          <div>
            <label htmlFor="seatCapacity" className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              Sức chứa (người) <span className="text-red-500">*</span>
            </label>
            <input
              id="seatCapacity"
              name="seatCapacity"
              type="number"
              min={1}
              max={100}
              value={formData.seatCapacity ?? ""}
              onChange={handleChange}
              placeholder="VD: 4"
              className={`w-full px-3 py-2.5 rounded-xl text-sm border transition-colors duration-150 outline-none ${
                errors.seatCapacity ? "border-red-300" : "border-gray-200"
              } focus:border-indigo-400`}
              aria-invalid={!!errors.seatCapacity}
            />
            {errors.seatCapacity && (
              <p className="text-xs text-red-500 mt-1">{errors.seatCapacity}</p>
            )}
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
            vehicleImageUrls field is supported by the backend (CreateVehicleDto / Vehicle entity)
            but no image upload endpoint exists yet. The field is pre-populated from
            vehicle?.vehicleImageUrls and will be persisted on save once upload is implemented.
            TODO: Add a proper image upload input (e.g., file picker → backend upload endpoint)
            once the backend provides a /vehicles/{id}/images upload handler.
          */}
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
            {isSubmitting ? "Đang lưu..." : vehicle ? "Lưu thay đổi" : "Thêm xe"}
          </button>
        </div>
      </form>
    </div>
  );
}

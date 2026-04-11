"use client";

import React, { useState } from "react";
import { X, UserPlus } from "@phosphor-icons/react";
import type { CreateStaffRequest } from "@/api/services/adminService";

interface CreateStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStaffRequest) => Promise<void>;
}

const ROLES: Array<{ value: 1 | 2; label: string; bg: string; text: string }> = [
  { value: 1, label: "Tour Designer", bg: "#EDE9FE", text: "#7C3AED" },
  { value: 2, label: "Tour Guide", bg: "#DBEAFE", text: "#2563EB" },
];

export function CreateStaffModal({ isOpen, onClose, onSubmit }: CreateStaffModalProps) {
  const [staffType, setStaffType] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = () => {
    const errs: { fullName?: string; email?: string } = {};
    if (!fullName.trim()) errs.fullName = "Họ tên không được để trống.";
    if (!email.trim()) {
      errs.email = "Email không được để trống.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = "Email không hợp lệ.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError(null);
    try {
      await onSubmit({ staffType, email: email.trim(), fullName: fullName.trim() });
      // Reset form on success
      setFullName("");
      setEmail("");
      setStaffType(1);
      setErrors({});
      setApiError(null);
    } catch (err: unknown) {
      // 409 = duplicate email
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        setErrors((prev) => ({ ...prev, email: "Email này đã được sử dụng trong hệ thống." }));
      } else {
        setApiError("Đã xảy ra lỗi. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFullName("");
      setEmail("");
      setStaffType(1);
      setErrors({});
      setApiError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentRole = ROLES.find((r) => r.value === staffType) ?? ROLES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white shadow-xl"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: currentRole.bg }}
            >
              <UserPlus size={18} weight="bold" style={{ color: currentRole.text }} />
            </div>
            <h2 className="text-base font-bold" style={{ color: "#111827" }}>
              Tạo nhân viên mới
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[#F3F4F6] disabled:opacity-50"
            aria-label="Đóng"
          >
            <X size={18} weight="bold" style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {/* Role tabs */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>
                Vai trò
              </label>
              <div className="flex gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setStaffType(role.value)}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 border"
                    style={
                      staffType === role.value
                        ? {
                            backgroundColor: role.bg,
                            color: role.text,
                            borderColor: role.text,
                          }
                        : {
                            backgroundColor: "#FFFFFF",
                            color: "#6B7280",
                            borderColor: "#E5E7EB",
                          }
                    }
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label
                htmlFor="create-staff-fullname"
                className="block text-sm font-medium mb-2"
                style={{ color: "#374151" }}
              >
                Họ và tên
              </label>
              <input
                id="create-staff-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                style={
                  errors.fullName
                    ? { borderColor: "#DC2626", color: "#111827" }
                    : { borderColor: "#E5E7EB", color: "#111827" }
                }
              />
              {errors.fullName && (
                <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="create-staff-email"
                className="block text-sm font-medium mb-2"
                style={{ color: "#374151" }}
              >
                Email
              </label>
              <input
                id="create-staff-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                style={
                  errors.email
                    ? { borderColor: "#DC2626", color: "#111827" }
                    : { borderColor: "#E5E7EB", color: "#111827" }
                }
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl border border-[#E5E7EB] transition-all duration-200 hover:bg-[#FAFAFA] disabled:opacity-50"
              style={{ color: "#374151" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-xl text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#C9873A" }}
            >
              {isSubmitting ? "Đang tạo..." : "Tạo nhân viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
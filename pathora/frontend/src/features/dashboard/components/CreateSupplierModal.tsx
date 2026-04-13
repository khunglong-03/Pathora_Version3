"use client";

import React, { useState } from "react";
import { XIcon, BuildingsIcon } from "@phosphor-icons/react";
import { createSupplierWithOwner, type SupplierType } from "@/api/services/adminSupplierService";

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierType: SupplierType;
  supplierTypeLabel: string;
  iconBg: string;
  iconColor: string;
}

const EMPTY = {
  // Owner (user account)
  ownerEmail: "",
  ownerFullName: "",
  // Supplier
  supplierCode: "",
  supplierName: "",
  phone: "",
  email: "",
  address: "",
  note: "",
};

export function CreateSupplierModal({
  isOpen,
  onClose,
  onSuccess,
  supplierType,
  supplierTypeLabel,
  iconBg,
  iconColor,
}: CreateSupplierModalProps) {
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (field: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    // Owner fields
    if (!form.ownerEmail.trim()) {
      errs.ownerEmail = "Email chủ sở hữu không được để trống.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.ownerEmail.trim())) {
      errs.ownerEmail = "Email không hợp lệ.";
    }
    if (!form.ownerFullName.trim()) {
      errs.ownerFullName = "Họ tên chủ sở hữu không được để trống.";
    }

    // Supplier fields
    if (!form.supplierCode.trim()) {
      errs.supplierCode = "Mã nhà cung cấp không được để trống.";
    } else if (form.supplierCode.trim().length > 50) {
      errs.supplierCode = "Mã nhà cung cấp tối đa 50 ký tự.";
    }
    if (!form.supplierName.trim()) {
      errs.supplierName = "Tên nhà cung cấp không được để trống.";
    } else if (form.supplierName.trim().length > 200) {
      errs.supplierName = "Tên nhà cung cấp tối đa 200 ký tự.";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Email nhà cung cấp không hợp lệ.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createSupplierWithOwner({
        ownerEmail: form.ownerEmail.trim(),
        ownerFullName: form.ownerFullName.trim(),
        supplierCode: form.supplierCode.trim(),
        supplierType,
        supplierName: form.supplierName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        note: form.note.trim() || undefined,
      });
      // Reset and close on success
      setForm({ ...EMPTY });
      onSuccess();
    } catch {
      setApiError("Tạo nhà cung cấp thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setForm({ ...EMPTY });
      setErrors({});
      setApiError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

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
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white shadow-xl"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: iconBg }}
            >
              <BuildingsIcon size={18} weight="bold" style={{ color: iconColor }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#111827" }}>
                Tạo nhà cung cấp {supplierTypeLabel}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                Tạo tài khoản chủ sở hữu + thông tin nhà cung cấp cùng lúc
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[#F3F4F6] disabled:opacity-50"
            aria-label="Đóng"
          >
            <XIcon size={18} weight="bold" style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {apiError && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
              >
                {apiError}
              </div>
            )}

            {/* Section: Owner Account */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>
                Tài khoản chủ sở hữu
              </p>
              <div className="space-y-3">
                {/* Owner Full Name */}
                <div>
                  <label
                    htmlFor="owner-fullname"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Họ và tên chủ sở hữu <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    id="owner-fullname"
                    type="text"
                    value={form.ownerFullName}
                    onChange={set("ownerFullName")}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.ownerFullName
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.ownerFullName && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.ownerFullName}
                    </p>
                  )}
                </div>

                {/* Owner Email */}
                <div>
                  <label
                    htmlFor="owner-email"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Email chủ sở hữu <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    id="owner-email"
                    type="email"
                    value={form.ownerEmail}
                    onChange={set("ownerEmail")}
                    placeholder="owner@company.com"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.ownerEmail
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.ownerEmail && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.ownerEmail}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>
                    Tài khoản sẽ được tạo, mật khẩu tạm thời sẽ được gửi qua email.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ borderTop: "1px solid #F3F4F6" }} />

            {/* Section: Supplier Info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#9CA3AF" }}>
                Thông tin nhà cung cấp
              </p>
              <div className="space-y-3">
                {/* Supplier Code */}
                <div>
                  <label
                    htmlFor="supplier-code"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Mã nhà cung cấp <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    id="supplier-code"
                    type="text"
                    value={form.supplierCode}
                    onChange={set("supplierCode")}
                    placeholder="VD: TRANSPORT-001"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.supplierCode
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.supplierCode && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.supplierCode}
                    </p>
                  )}
                </div>

                {/* Supplier Name */}
                <div>
                  <label
                    htmlFor="supplier-name"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Tên nhà cung cấp <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    id="supplier-name"
                    type="text"
                    value={form.supplierName}
                    onChange={set("supplierName")}
                    placeholder="VD: Công ty TNHH Vận tải A"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.supplierName
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.supplierName && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.supplierName}
                    </p>
                  )}
                </div>

                {/* Supplier Email */}
                <div>
                  <label
                    htmlFor="supplier-email"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Email nhà cung cấp
                  </label>
                  <input
                    id="supplier-email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="contact@company.com"
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

                {/* Phone */}
                <div>
                  <label
                    htmlFor="supplier-phone"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Số điện thoại
                  </label>
                  <input
                    id="supplier-phone"
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    placeholder="VD: 0901 234 567"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={{ borderColor: "#E5E7EB", color: "#111827" }}
                  />
                </div>

                {/* Address */}
                <div>
                  <label
                    htmlFor="supplier-address"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Địa chỉ
                  </label>
                  <input
                    id="supplier-address"
                    type="text"
                    value={form.address}
                    onChange={set("address")}
                    placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={{ borderColor: "#E5E7EB", color: "#111827" }}
                  />
                </div>

                {/* Note */}
                <div>
                  <label
                    htmlFor="supplier-note"
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "#374151" }}
                  >
                    Ghi chú
                  </label>
                  <textarea
                    id="supplier-note"
                    value={form.note}
                    onChange={set("note")}
                    placeholder="Thông tin bổ sung..."
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                    style={{ borderColor: "#E5E7EB", color: "#111827" }}
                  />
                </div>
              </div>
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
              style={{ backgroundColor: iconColor }}
            >
              {isSubmitting ? "Đang tạo..." : "Tạo nhà cung cấp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

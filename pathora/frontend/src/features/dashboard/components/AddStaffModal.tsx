"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import { adminService } from "@/api/services/adminService";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerId: string;
  onSuccess: () => void;
}

type StaffType = "TourDesigner" | "TourGuide";

export function AddStaffModal({ isOpen, onClose, managerId, onSuccess }: AddStaffModalProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<StaffType>("TourDesigner");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !fullName) {
      setError(t("admin.staff.validation.required"));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t("admin.staff.validation.invalidEmail"));
      return;
    }

    if (password) {
      if (password.length < 6) {
        setError(t("admin.staff.validation.passwordMin"));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("admin.staff.validation.passwordMismatch"));
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await adminService.createStaffUnderManager(managerId, {
        staffType: selectedType === "TourDesigner" ? 1 : 2,
        email: email.trim(),
        fullName: fullName.trim(),
        password: password || undefined,
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || t("admin.staff.createError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedType("TourDesigner");
      setEmail("");
      setFullName("");
      setPassword("");
      setConfirmPassword("");
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("admin.staff.title")}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Staff Type Selection */}
        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: "#374151" }}>
            {t("admin.staff.type")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label
              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === "TourDesigner"
                  ? "border-[#7C3AED] bg-[#F5F3FF]"
                  : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
              }`}
            >
              <input
                type="radio"
                name="staffType"
                value="TourDesigner"
                checked={selectedType === "TourDesigner"}
                onChange={(e) => setSelectedType(e.target.value as StaffType)}
                className="sr-only"
                disabled={isSubmitting}
              />
              <Icon
                icon="PaintBrush"
                className="size-4 shrink-0"
                style={{ color: selectedType === "TourDesigner" ? "#7C3AED" : "#6B7280" }}
              />
              <p
                className="text-xs font-semibold"
                style={{ color: selectedType === "TourDesigner" ? "#7C3AED" : "#374151" }}
              >
                {t("admin.staff.designer")}
              </p>
            </label>

            <label
              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                selectedType === "TourGuide"
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]"
              }`}
            >
              <input
                type="radio"
                name="staffType"
                value="TourGuide"
                checked={selectedType === "TourGuide"}
                onChange={(e) => setSelectedType(e.target.value as StaffType)}
                className="sr-only"
                disabled={isSubmitting}
              />
              <Icon
                icon="MapTrifold"
                className="size-4 shrink-0"
                style={{ color: selectedType === "TourGuide" ? "#2563EB" : "#6B7280" }}
              />
              <p
                className="text-xs font-semibold"
                style={{ color: selectedType === "TourGuide" ? "#2563EB" : "#374151" }}
              >
                {t("admin.staff.guide")}
              </p>
            </label>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              {t("admin.staff.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhanvien@example.com"
              disabled={isSubmitting}
              className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#C9873A]/20"
              style={{ borderColor: "#D1D5DB" }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
              {t("admin.staff.fullName")}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              disabled={isSubmitting}
              className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#C9873A]/20"
              style={{ borderColor: "#D1D5DB" }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                {t("admin.staff.password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                disabled={isSubmitting}
                className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#C9873A]/20"
                style={{ borderColor: "#D1D5DB" }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>
                {t("admin.staff.confirmPassword")}
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="********"
                disabled={isSubmitting}
                className="w-full px-4 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-[#C9873A]/20"
                style={{ borderColor: "#D1D5DB" }}
              />
            </div>
          </div>
          <p className="text-[10px] text-stone-400 italic">
            {t("admin.staff.passwordHint")}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <Icon icon="Warning" className="size-5 shrink-0" style={{ color: "#DC2626" }} />
            <p className="text-sm" style={{ color: "#DC2626" }}>
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:bg-[#F3F4F6]"
            style={{ color: "#6B7280" }}
          >
            {t("admin.staff.cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#C9873A", color: "#FFFFFF" }}
          >
            {isSubmitting ? t("admin.staff.submitting") : t("admin.staff.submit")}
          </button>
        </div>
      </form>
    </Modal>
  );
}

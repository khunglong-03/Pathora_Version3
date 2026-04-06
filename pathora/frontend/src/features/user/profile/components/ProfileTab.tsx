"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiSave } from "react-icons/fi";
import { toast } from "react-toastify";
import { Button } from "@/components/ui";
import { handleApiError } from "@/utils/apiResponse";
import type { UserInfo } from "@/store/domain/auth";
import { AvatarUpload } from "./AvatarUpload";
import type { ProfileFormData } from "../types";
import { VIETNAM_PHONE_REGEX } from "../types";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const CSS = {
  accent:       "var(--accent)",
  accentMuted:  "var(--accent-muted)",
  border:       "var(--border)",
  borderSub:    "var(--border-subtle)",
  muted:        "var(--muted)",
  textPrimary:  "var(--text-primary)",
  textSecondary:"var(--text-secondary)",
  textMuted:    "var(--text-muted)",
  success:      "var(--success)",
  successMuted: "var(--success-muted)",
  danger:       "var(--danger)",
  dangerMuted:  "var(--danger-muted)",
  shadowCard:   "var(--shadow-card)",
} as const;

interface ProfileTabProps {
  user: UserInfo | null;
  isLoading: boolean;
  isUpdating: boolean;
  onUpdate: (payload: { fullName?: string; phoneNumber?: string; address?: string; avatar?: string }) => Promise<void>;
}

function ProfileTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-56 rounded" style={{ backgroundColor: CSS.muted }} />
      <div className="h-24 w-24 rounded-full" style={{ backgroundColor: CSS.muted }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-10 rounded-lg" style={{ backgroundColor: CSS.muted }} />
        <div className="h-10 rounded-lg" style={{ backgroundColor: CSS.muted }} />
        <div className="md:col-span-2 h-10 rounded-lg" style={{ backgroundColor: CSS.muted }} />
        <div className="h-10 rounded-lg" style={{ backgroundColor: CSS.muted }} />
      </div>
    </div>
  );
}

export function ProfileTab({ user, isLoading, isUpdating, onUpdate }: ProfileTabProps) {
  const { t } = useTranslation();
  const initialData = useMemo<ProfileFormData>(
    () => ({
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      address: user?.address || "",
      avatar: user?.avatar || "",
    }),
    [user?.fullName, user?.phoneNumber, user?.address, user?.avatar],
  );

  const [profileData, setProfileData] = useState<ProfileFormData>(initialData);
  const [initialProfileData, setInitialProfileData] = useState<ProfileFormData>(initialData);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (
      profileData.fullName === "" &&
      profileData.phoneNumber === "" &&
      profileData.address === "" &&
      profileData.avatar === "" &&
      (initialData.fullName !== "" || initialData.phoneNumber !== "" || initialData.address !== "" || initialData.avatar !== "")
    ) {
      setProfileData(initialData);
      setInitialProfileData(initialData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const phoneError = useMemo(() => {
    if (!profileData.phoneNumber) return "";
    return VIETNAM_PHONE_REGEX.test(profileData.phoneNumber)
      ? ""
      : t("common.auth.phoneNumberInvalid") || "Số điện thoại không đúng định dạng";
  }, [profileData.phoneNumber, t]);

  const fullNameError = useMemo(() => {
    const trimmed = profileData.fullName.trim();
    if (!trimmed) return t("common.profilePage.fullNameRequired") || "Full name is required";
    if (trimmed.length > 100) return t("common.profilePage.fullNameTooLong") || "Full name must be 100 characters or less";
    return "";
  }, [profileData.fullName, t]);

  const addressError = useMemo(() => {
    if (profileData.address.length > 500) {
      return t("common.profilePage.addressTooLong") || "Address must be 500 characters or less";
    }
    return "";
  }, [profileData.address, t]);

  const isDirty = useMemo(
    () =>
      profileData.fullName !== initialProfileData.fullName ||
      profileData.phoneNumber !== initialProfileData.phoneNumber ||
      profileData.address !== initialProfileData.address ||
      profileData.avatar !== initialProfileData.avatar,
    [profileData, initialProfileData],
  );

  const isSubmitDisabled = isUpdating || !isDirty || !!phoneError || !!fullNameError || !!addressError || !!avatarError;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setSaveState("saving");

    try {
      await onUpdate({
        fullName: profileData.fullName.trim(),
        phoneNumber: profileData.phoneNumber.trim() || undefined,
        address: profileData.address.trim() || undefined,
        avatar: profileData.avatar.trim() || undefined,
      });

      setInitialProfileData(profileData);
      setSaveState("saved");
      toast.success(t("common.profilePage.updateSuccess") || "Cập nhật thông tin thành công");
      window.setTimeout(() => setSaveState("idle"), 2000);
    } catch (error) {
      const apiError = handleApiError(error);
      setSaveState("idle");
      toast.error(apiError.message || t("common.profilePage.updateFailed") || "Cập nhật thất bại");
    }
  };

  if (isLoading) {
    return <ProfileTabSkeleton />;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="pb-4" style={{ borderBottom: `1px solid ${CSS.borderSub}` }}>
        <h2 style={{ color: CSS.textPrimary }} className="text-lg font-semibold">{t("common.profilePage.profileSectionTitle") || "Thông tin cá nhân"}</h2>
        <p style={{ color: CSS.textSecondary }} className="text-sm mt-1">
          {t("common.profilePage.profileSectionDesc") || "Cập nhật họ tên, số điện thoại và địa chỉ của bạn"}
        </p>
      </div>

      <AvatarUpload
        value={profileData.avatar}
        fullName={profileData.fullName}
        disabled={isUpdating}
        onValidationChange={setAvatarError}
        onChange={(avatar) => setProfileData((prev) => ({ ...prev, avatar }))}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label style={{ color: CSS.textPrimary }} className="block text-sm font-medium mb-2">{t("common.auth.fullName") || "Họ và tên"}</label>
          <input
            type="text"
            value={profileData.fullName}
            onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
            style={{
              borderColor: fullNameError ? CSS.danger : CSS.border,
              outline: "none",
              boxShadow: `0 0 0 3px ${fullNameError ? CSS.dangerMuted : "transparent"}`,
            }}
            className={`w-full px-4 py-2 border rounded-lg transition-all ${
              fullNameError ? "" : "focus:ring-2"
            }`}
          />
          {fullNameError ? <p style={{ color: CSS.danger }} className="text-xs mt-1">{fullNameError}</p> : null}
        </div>

        <div>
          <label style={{ color: CSS.textPrimary }} className="block text-sm font-medium mb-2">{t("common.auth.phoneNumber") || "Số điện thoại"}</label>
          <input
            type="tel"
            value={profileData.phoneNumber}
            onChange={(e) => setProfileData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="0912345678"
            style={{
              borderColor: phoneError ? CSS.danger : CSS.border,
              outline: "none",
              boxShadow: `0 0 0 3px ${phoneError ? CSS.dangerMuted : "transparent"}`,
            }}
            className={`w-full px-4 py-2 border rounded-lg transition-all ${
              phoneError ? "" : "focus:ring-2"
            }`}
          />
          {phoneError ? <p style={{ color: CSS.danger }} className="text-xs mt-1">{phoneError}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label style={{ color: CSS.textPrimary }} className="block text-sm font-medium mb-2">{t("common.auth.address") || "Địa chỉ"}</label>
          <input
            type="text"
            value={profileData.address}
            onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
            style={{
              borderColor: addressError ? CSS.danger : CSS.border,
              outline: "none",
              boxShadow: `0 0 0 3px ${addressError ? CSS.dangerMuted : "transparent"}`,
            }}
            className={`w-full px-4 py-2 border rounded-lg transition-all ${
              addressError ? "" : "focus:ring-2"
            }`}
          />
          {addressError ? <p style={{ color: CSS.danger }} className="text-xs mt-1">{addressError}</p> : null}
        </div>

        <div>
          <label style={{ color: CSS.textPrimary }} className="block text-sm font-medium mb-2">{t("common.email") || "Email"}</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            style={{
              backgroundColor: CSS.muted,
              color: CSS.textMuted,
              borderColor: CSS.borderSub,
            }}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          style={{
            backgroundColor: isSubmitDisabled ? CSS.muted : CSS.accent,
            color: isSubmitDisabled ? CSS.textMuted : "#fff",
            cursor: isSubmitDisabled ? "not-allowed" : "pointer",
          }}
          className="flex items-center gap-2 px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          <FiSave className="w-4 h-4" />
          {saveState === "saving" || isUpdating
            ? t("common.saving") || "Đang lưu..."
            : saveState === "saved"
              ? t("common.saved") || "✓ Saved"
              : t("common.save") || "Lưu"}
        </Button>
      </div>
    </form>
  );
}

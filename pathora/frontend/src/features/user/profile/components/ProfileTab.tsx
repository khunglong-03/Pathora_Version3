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
// Using Tailwind directly to match the-hieu-design.md

interface ProfileTabProps {
  user: UserInfo | null;
  isLoading: boolean;
  isUpdating: boolean;
  onUpdate: (payload: { fullName?: string; phoneNumber?: string; address?: string; avatar?: string }) => Promise<void>;
}

function ProfileTabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 w-56 rounded bg-slate-100" />
      <div className="h-24 w-24 rounded-full bg-slate-100" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="h-10 rounded-xl bg-slate-100" />
        <div className="md:col-span-2 h-10 rounded-xl bg-slate-100" />
        <div className="h-10 rounded-xl bg-slate-100" />
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
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t("common.profilePage.profileSectionTitle") || "Thông tin cá nhân"}</h2>
        <p className="text-sm mt-1 text-slate-500">
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
          <label className="block text-sm font-semibold mb-2 text-slate-700">{t("common.auth.fullName") || "Họ và tên"}</label>
          <input
            type="text"
            value={profileData.fullName}
            onChange={(e) => setProfileData((prev) => ({ ...prev, fullName: e.target.value }))}
            className={`w-full px-4 py-2.5 border rounded-xl transition-all outline-none ${
              fullNameError 
                ? "border-red-500 ring-4 ring-red-50" 
                : "border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            }`}
          />
          {fullNameError ? <p className="text-xs mt-1.5 font-medium text-red-500">{fullNameError}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">{t("common.auth.phoneNumber") || "Số điện thoại"}</label>
          <input
            type="tel"
            value={profileData.phoneNumber}
            onChange={(e) => setProfileData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="0912345678"
            className={`w-full px-4 py-2.5 border rounded-xl transition-all outline-none ${
              phoneError 
                ? "border-red-500 ring-4 ring-red-50" 
                : "border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            }`}
          />
          {phoneError ? <p className="text-xs mt-1.5 font-medium text-red-500">{phoneError}</p> : null}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-slate-700">{t("common.auth.address") || "Địa chỉ"}</label>
          <input
            type="text"
            value={profileData.address}
            onChange={(e) => setProfileData((prev) => ({ ...prev, address: e.target.value }))}
            className={`w-full px-4 py-2.5 border rounded-xl transition-all outline-none ${
              addressError 
                ? "border-red-500 ring-4 ring-red-50" 
                : "border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
            }`}
          />
          {addressError ? <p className="text-xs mt-1.5 font-medium text-red-500">{addressError}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-700">{t("common.email") || "Email"}</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full px-4 py-2.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-xl cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isSubmitDisabled}
          className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-semibold transition-all outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${
            isSubmitDisabled
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] shadow-sm"
          }`}
        >
          {saveState === "saving" || isUpdating ? (
            <div className="size-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          {saveState === "saving" || isUpdating
            ? t("common.saving") || "Đang lưu..."
            : saveState === "saved"
              ? t("common.saved") || "✓ Đã lưu"
              : t("common.save") || "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
}

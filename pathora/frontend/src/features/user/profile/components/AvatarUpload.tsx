"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { handleApiError } from "@/utils/apiResponse";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

interface AvatarUploadProps {
  value: string;
  fullName: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onValidationChange?: (error: string) => void;
}

type UploadState = "idle" | "selected" | "uploading" | "success" | "error";

const getInitials = (fullName: string) => {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
};

const validateFile = (file: File): string => {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return "Chỉ chấp nhận file JPEG, PNG, WebP.";
  }
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Loại file không hợp lệ.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File quá lớn (tối đa 5MB).";
  }
  return "";
};

async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload/avatar", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    let message = "Tải lên thất bại.";
    try {
      const json = await response.json();
      message = json.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const json = await response.json();
  // Backend returns { data: { avatarUrl: "..." } }
  const url = json.data?.avatarUrl ?? json.avatarUrl;
  if (!url) throw new Error("Phản hồi không hợp lệ từ server.");
  return url;
}

export function AvatarUpload({ value, fullName, disabled = false, onChange, onValidationChange }: AvatarUploadProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<UploadState>("idle");
  const [previewUrl, setPreviewUrl] = useState(value || "");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousValueRef = useRef(value);

  const initials = getInitials(fullName);

  // Sync preview when value changes externally (e.g., after profile update)
  useEffect(() => {
    if (state === "idle" || state === "success") {
      setPreviewUrl(value || "");
    }
    previousValueRef.current = value;
  }, [value, state]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setErrorMsg(validationError);
      setState("error");
      onValidationChange?.(validationError);
      return;
    }

    // Show local preview immediately (before upload)
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setErrorMsg("");
    setState("selected");

    // Upload
    setState("uploading");

    (async () => {
      try {
        const uploadedUrl = await uploadAvatar(file);

        // Both upload and profile update succeeded
        setPreviewUrl(uploadedUrl);
        setState("success");
        onChange(uploadedUrl);
        onValidationChange?.("");
        toast.success(t("common.profilePage.avatar.uploadSuccess") || "Cập nhật ảnh thành công");

        // Clean up object URL
        URL.revokeObjectURL(objectUrl);
      } catch (err) {
        // Revert to previous avatar
        URL.revokeObjectURL(objectUrl);
        const apiError = handleApiError(err as unknown as Parameters<typeof handleApiError>[0]);
        setErrorMsg(apiError.message || "Tải lên thất bại.");
        setState("error");
        onValidationChange?.(apiError.message || "Tải lên thất bại.");

        // Revert preview to previous avatar
        setPreviewUrl(previousValueRef.current || "");

        toast.error(t("common.profilePage.avatar.uploadFailed") || "Không thể lưu ảnh đại diện");
      }
    })();
  }, [onChange, onValidationChange, t]);

  const handleAvatarClick = useCallback(() => {
    if (disabled || state === "uploading") return;
    fileInputRef.current?.click();
  }, [disabled, state]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFileSelect(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }, [handleFileSelect]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {/* Avatar circle */}
        <div
          className="relative h-24 w-24 rounded-full overflow-hidden flex items-center justify-center cursor-pointer group"
          style={{ border: `1px solid var(--border)`, backgroundColor: "var(--accent-muted)" }}
          onClick={handleAvatarClick}
          title={t("common.profilePage.avatar.changePhoto") || "Đổi ảnh"}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={t("common.profilePage.avatar.alt") || "Avatar"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span style={{ color: "var(--accent)" }} className="text-xl font-semibold">{initials}</span>
          )}

          {/* Upload overlay */}
          {(state === "uploading" || state === "selected") && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div
                style={{ borderColor: "#fff", borderTopColor: "transparent" }}
                className="h-7 w-7 rounded-full border-2 animate-spin"
              />
            </div>
          )}

          {/* Hover overlay */}
          {state === "idle" && !disabled && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">
                {t("common.profilePage.avatar.changePhoto") || "Đổi ảnh"}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <p style={{ color: "var(--text-secondary)" }} className="text-sm">
            {t("common.profilePage.avatar.hint") || "Nhấn vào ảnh để đổi ảnh đại diện"}
          </p>
          <p style={{ color: "var(--text-muted)" }} className="text-xs">
            JPEG, PNG, WebP • Tối đa 5MB
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>

      {errorMsg ? (
        <p style={{ color: "var(--danger)" }} className="text-xs">{errorMsg}</p>
      ) : null}
    </div>
  );
}

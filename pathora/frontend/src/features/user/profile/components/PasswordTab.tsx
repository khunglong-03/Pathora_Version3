"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiLock, FiCheck, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import { handleApiError } from "@/utils/apiResponse";

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Using Tailwind directly to match the-hieu-design.md

// ─── Password Validation ────────────────────────────────────────────────────
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

interface PasswordRule {
  ruleKey: string;
  check: (p: string) => boolean;
}

const getPasswordRules = (): PasswordRule[] => [
  { ruleKey: "common.profilePage.password.ruleMinLength", check: (p) => p.length >= 8 },
  { ruleKey: "common.profilePage.password.ruleUppercase", check: (p) => /[A-Z]/.test(p) },
  { ruleKey: "common.profilePage.password.ruleLowercase", check: (p) => /[a-z]/.test(p) },
  { ruleKey: "common.profilePage.password.ruleDigit", check: (p) => /\d/.test(p) },
  { ruleKey: "common.profilePage.password.ruleSpecial", check: (p) => /[@$!%*?&]/.test(p) },
];

type StrengthLevel = "weak" | "fair" | "good" | "strong";

function getStrengthLevel(score: number): StrengthLevel {
  if (score <= 1) return "weak";
  if (score === 2) return "fair";
  if (score <= 4) return "good";
  return "strong";
}

function getStrengthColor(level: StrengthLevel): string {
  if (level === "weak") return "text-red-500";
  if (level === "fair") return "text-amber-500";
  if (level === "good") return "text-orange-500";
  return "text-green-500";
}

function getStrengthBgColor(level: StrengthLevel): string {
  if (level === "weak") return "bg-red-500";
  if (level === "fair") return "bg-amber-500";
  if (level === "good") return "bg-orange-500";
  return "bg-green-500";
}

function getStrengthLabel(level: StrengthLevel, t: ReturnType<typeof useTranslation>["t"]): string {
  const keys: Record<StrengthLevel, string> = {
    weak: "common.profilePage.password.strengthWeak",
    fair: "common.profilePage.password.strengthFair",
    good: "common.profilePage.password.strengthGood",
    strong: "common.profilePage.password.strengthStrong",
  };
  return t(keys[level]) || level;
}

// ─── Password Input Component ───────────────────────────────────────────────
interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  show: boolean;
  onToggle: () => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

function PasswordInput({ id, label, value, onChange, onBlur, onFocus, show, onToggle, error, disabled, placeholder }: PasswordInputProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold mb-2 text-stone-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={id === "oldPassword" ? "current-password" : id === "newPassword" ? "new-password" : "confirm-password"}
          style={{
            paddingRight: "2.5rem",
          }}
          className={`w-full px-4 py-2.5 border rounded-xl transition-all outline-none text-stone-900 ${
            error 
              ? "border-red-500 ring-4 ring-red-50" 
              : "border-stone-200 hover:border-stone-300 focus:border-stone-900 focus:ring-4 focus:ring-stone-100"
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:!text-stone-700 transition-colors disabled:opacity-40"
          aria-label={show ? t("common.hidePassword") || "Hide password" : t("common.showPassword") || "Show password"}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-xs mt-1.5 font-medium text-red-500">{error}</p>}
    </div>
  );
}

// ─── Strength Meter ──────────────────────────────────────────────────────────
function StrengthMeter({ password, t }: { password: string; t: ReturnType<typeof useTranslation>["t"] }) {
  if (!password) return null;

  const rules = getPasswordRules();
  const results = rules.map((rule) => ({
    label: t(rule.ruleKey),
    satisfied: rule.check(password),
  }));
  const score = results.filter((r) => r.satisfied).length;
  const level = getStrengthLevel(score);
  const color = getStrengthColor(level);
  const label = getStrengthLabel(level, t);

  return (
    <div className="space-y-2 mt-2">
      {/* Checklist */}
      <div className="space-y-1">
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            {r.satisfied ? (
              <FiCheck className="w-3.5 h-3.5 flex-shrink-0 text-green-500" />
            ) : (
              <FiX className="w-3.5 h-3.5 flex-shrink-0 text-stone-300" />
            )}
            <span
              className={`text-xs ${r.satisfied ? "text-green-600" : "text-stone-400"}`}
            >
              {r.label}
            </span>
          </div>
        ))}
      </div>

      {/* Strength bar */}
      <div>
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4].map((segment) => {
            const filled = segment <= score;
            const segLevel = getStrengthLevel(segment);
            return (
              <div
                key={segment}
                className={`flex-1 h-1 rounded-full transition-colors duration-200 ${
                  filled ? getStrengthBgColor(segLevel) : "bg-stone-200"
                }`}
              />
            );
          })}
        </div>
        <p className={`text-xs font-medium ${color}`}>{label}</p>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
interface PasswordTabProps {
  isUpdating: boolean;
  onChangePassword: (payload: { oldPassword: string; newPassword: string }) => Promise<void>;
}

export function PasswordTab({ isUpdating, onChangePassword }: PasswordTabProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Visibility toggles
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Submit state machine
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "success">("idle");

  // Per-field errors
  const [errors, setErrors] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  // Confirm password match state
  const [confirmMatch, setConfirmMatch] = useState<boolean | null>(null);

  const rules = getPasswordRules();

  // Validate old password on blur
  const handleOldPasswordBlur = () => {
    if (!form.oldPassword.trim()) {
      setErrors((prev) => ({ ...prev, oldPassword: t("common.profilePage.password.oldPasswordRequired") }));
    } else {
      setErrors((prev) => ({ ...prev, oldPassword: "" }));
    }
  };

  // Validate new password on blur
  const handleNewPasswordBlur = () => {
    if (!form.newPassword) {
      setErrors((prev) => ({ ...prev, newPassword: t("common.profilePage.password.newPasswordRequired") }));
    } else if (!PASSWORD_REGEX.test(form.newPassword)) {
      const failed = rules.filter((r) => !r.check(form.newPassword)).map((r) => t(r.ruleKey));
      setErrors((prev) => ({
        ...prev,
        newPassword: `${t("common.profilePage.password.passwordRequirements")}${failed.join(", ")}`,
      }));
    } else {
      setErrors((prev) => ({ ...prev, newPassword: "" }));
    }
  };

  // Validate confirm on blur
  const handleConfirmBlur = () => {
    if (!form.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: t("common.profilePage.password.confirmPasswordRequired") }));
    } else if (form.confirmPassword !== form.newPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: t("common.profilePage.password.passwordMismatch") }));
      setConfirmMatch(false);
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      setConfirmMatch(true);
    }
  };

  // Handle confirm password change
  const handleConfirmChange = (value: string) => {
    setForm((prev) => ({ ...prev, confirmPassword: value }));
    if (!value) {
      setConfirmMatch(null);
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    } else if (form.newPassword) {
      const matches = value === form.newPassword;
      setConfirmMatch(matches);
      if (!matches) {
        setErrors((prev) => ({ ...prev, confirmPassword: t("common.profilePage.password.passwordMismatch") }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  // Reset confirm match when new password changes
  const handleNewPasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, newPassword: value }));
    setConfirmMatch(null);
    if (form.confirmPassword) {
      if (value && form.confirmPassword === value) {
        setConfirmMatch(true);
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      } else if (value) {
        setConfirmMatch(false);
        setErrors((prev) => ({ ...prev, confirmPassword: t("common.profilePage.password.passwordMismatch") }));
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Final validation
    let hasError = false;
    if (!form.oldPassword.trim()) {
      setErrors((prev) => ({ ...prev, oldPassword: t("common.profilePage.password.oldPasswordRequired") }));
      hasError = true;
    }
    if (!form.newPassword || !PASSWORD_REGEX.test(form.newPassword)) {
      setErrors((prev) => ({ ...prev, newPassword: t("common.profilePage.password.passwordTooWeak") }));
      hasError = true;
    }
    if (form.newPassword !== form.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: t("common.profilePage.password.passwordMismatch") }));
      setConfirmMatch(false);
      hasError = true;
    }
    if (hasError) return;

    setSubmitState("saving");

    try {
      await onChangePassword({ oldPassword: form.oldPassword, newPassword: form.newPassword });
      setSubmitState("success");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setConfirmMatch(null);
      setErrors({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success(t("common.profilePage.password.changedSuccess") || "Password changed successfully");
      window.setTimeout(() => setSubmitState("idle"), 2000);
    } catch (error) {
      setSubmitState("idle");
      const apiError = handleApiError(error);
      toast.error(t(apiError.message) || t("common.auth.passwordChangeFailed") || "Password change failed");
      setForm((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
      setConfirmMatch(null);
    }
  };

  // Derive button state
  const isDisabled = isUpdating || submitState === "saving" || submitState === "success";
  const isSuccess = submitState === "success";
  const isSaving = submitState === "saving";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl">
      <div className="pb-4 border-b border-stone-100/80">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">
          {t("common.profilePage.passwordSectionTitle") || "Bảo mật tài khoản"}
        </h2>
        <p className="text-sm mt-1 text-stone-500 font-medium">
          {t("common.profilePage.passwordSectionDesc") || "Thay đổi mật khẩu thường xuyên để bảo vệ tài khoản của bạn"}
        </p>
      </div>

      {/* Current password */}
      <PasswordInput
        id="oldPassword"
        label={t("common.profilePage.password.currentPassword") || "Current Password"}
        value={form.oldPassword}
        onChange={(v) => setForm((prev) => ({ ...prev, oldPassword: v }))}
        onBlur={handleOldPasswordBlur}
        onFocus={() => setErrors((prev) => ({ ...prev, oldPassword: "" }))}
        show={showOld}
        onToggle={() => setShowOld((s) => !s)}
        error={errors.oldPassword}
        disabled={isDisabled}
        placeholder="••••••••"
      />

      {/* New password */}
      <PasswordInput
        id="newPassword"
        label={t("common.profilePage.password.newPassword") || "New Password"}
        value={form.newPassword}
        onChange={handleNewPasswordChange}
        onBlur={handleNewPasswordBlur}
        onFocus={() => setErrors((prev) => ({ ...prev, newPassword: "" }))}
        show={showNew}
        onToggle={() => setShowNew((s) => !s)}
        error={errors.newPassword}
        disabled={isDisabled}
        placeholder="••••••••"
      />

      {/* Strength meter */}
      <StrengthMeter password={form.newPassword} t={t} />

      {/* Confirm password */}
      <div>
        <PasswordInput
          id="confirmPassword"
          label={t("common.profilePage.password.confirmPassword") || "Confirm New Password"}
          value={form.confirmPassword}
          onChange={handleConfirmChange}
          onBlur={handleConfirmBlur}
          onFocus={() => {
            setErrors((prev) => ({ ...prev, confirmPassword: "" }));
          }}
          show={showConfirm}
          onToggle={() => setShowConfirm((s) => !s)}
          error={errors.confirmPassword}
          disabled={isDisabled}
          placeholder="••••••••"
        />
        {/* Match indicator */}
        {form.confirmPassword && form.newPassword && (
          <div className="flex items-center gap-1.5 mt-2">
            {confirmMatch ? (
              <>
                <FiCheck className="w-3.5 h-3.5 text-green-500" />
                <p className="text-xs font-medium text-green-600">
                  {t("common.profilePage.password.passwordsMatch") || "Passwords match"}
                </p>
              </>
            ) : (
              <>
                <FiX className="w-3.5 h-3.5 text-red-500" />
                <p className="text-xs font-medium text-red-500">
                  {t("common.profilePage.password.passwordsDontMatch") || "Passwords do not match"}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isDisabled}
          className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-semibold transition-all outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
            isSuccess
              ? "bg-green-600 text-white shadow-sm"
              : isDisabled
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98] shadow-sm"
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>{t("common.profilePage.password.changing") || "Changing..."}</span>
            </>
          ) : isSuccess ? (
            <>
              <FiCheck className="w-4 h-4" />
              <span>{t("common.profilePage.password.changedSuccess") || "Password changed"}</span>
            </>
          ) : (
            <>
              <FiLock className="w-4 h-4" />
              <span>{t("common.changePassword") || "Change Password"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

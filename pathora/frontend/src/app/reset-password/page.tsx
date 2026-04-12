"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui";
import { useResetPasswordMutation } from "@/store/api/auth/authApiSlice";
import { toast } from "react-toastify";

function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetPassword] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t("landing.auth.resetPasswordNoToken"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("landing.auth.passwordsDoNotMatch"));
      return;
    }

    if (password.length < 8) {
      toast.error(t("landing.auth.passwordMinLength"));
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword: password }).unwrap();
      toast.success(t("landing.auth.passwordResetSuccess"));
      // Redirect to login after short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch {
      toast.error(t("landing.auth.passwordResetFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mx-auto mb-4">
            <Icon icon="heroicons-outline:exclamation-triangle" className="h-7 w-7 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            {t("landing.auth.resetPasswordNoToken")}
          </h2>
          <p className="text-sm text-stone-500 mb-6">
            {t("landing.auth.resetPasswordNoTokenHelp")}
          </p>
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-xl bg-landing-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-landing-accent-hover"
          >
            <Icon icon="heroicons-outline:arrow-left" className="h-4 w-4" />
            {t("landing.auth.backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-landing-accent/10 mb-4">
            <Icon icon="heroicons-outline:lock-closed" className="h-7 w-7 text-landing-accent" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">
            {t("landing.auth.createNewPassword")}
          </h1>
          <p className="mt-2 text-sm text-stone-500 text-center">
            {t("landing.auth.createNewPasswordHelp")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-semibold text-stone-700">
              {t("landing.auth.newPassword")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("landing.auth.enterNewPassword")}
                required
                minLength={8}
                className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 pr-12 text-sm text-stone-900 placeholder:text-stone-400 focus:border-landing-accent focus:outline-none focus:ring-2 focus:ring-landing-accent/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                aria-label={showPassword ? t("landing.auth.hidePassword") : t("landing.auth.showPassword")}
              >
                <Icon
                  icon={showPassword ? "heroicons-outline:eye" : "heroicons-outline:eye-slash"}
                  className="h-5 w-5"
                />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-2">
            <label htmlFor="confirm-password" className="text-sm font-semibold text-stone-700">
              {t("landing.auth.confirmPassword")}
            </label>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("landing.auth.enterConfirmPassword")}
              required
              minLength={8}
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-landing-accent focus:outline-none focus:ring-2 focus:ring-landing-accent/30"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-landing-accent px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-landing-accent-hover disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && <Icon icon="heroicons-outline:arrow-path" className="h-5 w-5 animate-spin" />}
            {isLoading ? t("common.processing") : t("landing.auth.updatePassword")}
          </button>

          {/* Back to login */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-stone-500 transition-colors hover:text-landing-accent"
          >
            <Icon icon="heroicons-outline:arrow-left" className="h-4 w-4" />
            {t("landing.auth.backToLogin")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-landing-accent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}

"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import Checkbox from "@/components/ui/Checkbox";
import TextInput from "@/components/ui/TextInput";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon } from "@/components/ui";
import {
  authApiSlice,
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
} from "@/store/api/auth/authApiSlice";
import type { AppDispatch } from "@/store";
import { GOOGLE_LOGIN_URL } from "@/configs/apiGateway";
import { resolveLoginDestination } from "@/utils/authRouting";
import { handleApiError } from "@/utils/apiResponse";

type AuthView = "signup" | "login" | "forgot";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  /** Which view to show when opened. Defaults to "signup". */
  initialView?: AuthView;
};


const PRIMARY_ACTION_CLASS =
  "group inline-flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-full bg-[#111] px-7 py-3.5 text-[0.8125rem] font-semibold tracking-wide text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-[2px] hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9873A]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] active:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)]";
const OUTLINE_ACTION_CLASS =
  "group inline-flex min-h-[3.5rem] w-full items-center justify-center gap-3 rounded-full bg-white/60 px-7 py-3.5 text-[0.8125rem] font-semibold tracking-wide text-[#111] ring-1 ring-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.8)] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-[1px] hover:bg-white/80 hover:shadow-[0_6px_16px_rgba(0,0,0,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9873A]/30 focus-visible:ring-offset-2 active:scale-[0.98]";
const LINK_ACTION_CLASS =
  "font-semibold text-[#111] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#C9873A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9873A]/30 rounded";

/* ── Double-Bezel Modal Shell (Doppelrand architecture) ───── */
const ModalShell = ({
  children,
  onClose,
  ariaLabel,
  closeLabel,
  dialogRef,
}: {
  children: React.ReactNode;
  onClose: () => void;
  ariaLabel: string;
  closeLabel: string;
  dialogRef?: React.RefObject<HTMLDivElement | null>;
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
    {/* Backdrop — heavy glass */}
    <button
      type="button"
      className="absolute inset-0 bg-black/40 backdrop-blur-[6px] transition-opacity duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
      onClick={onClose}
      aria-label={closeLabel}
    />
    {/* Outer Shell (Double-Bezel outer tray) */}
    <div className="relative w-full max-w-[34rem] rounded-[2.5rem] bg-black/[0.03] p-1.5 ring-1 ring-black/[0.04] animate-blur-in">
      {/* Inner Core (Double-Bezel content plate) */}
      <div
        ref={dialogRef}
        className="max-h-[85vh] overflow-y-auto rounded-[calc(2.5rem-0.375rem)] bg-white/90 px-8 py-10 shadow-[0_24px_64px_-16px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl sm:px-12 sm:py-12"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  </div>
);

/* ── Premium Input Field ──────────────────────────────────── */
const InputField = ({
  id,
  label,
  type = "text",
  name,
  value,
  onChange,
  placeholder,
  trailing,
}: {
  id?: string;
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  trailing?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2.5">
    <label
      htmlFor={id ?? name}
      className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#78716C]">
      {label}
    </label>
    {/* Input Double-Bezel: outer ring + inner field */}
    <div className="relative rounded-2xl bg-black/[0.02] p-px ring-1 ring-black/[0.05] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:ring-2 focus-within:ring-[#C9873A]/30 focus-within:bg-transparent">
      <TextInput
        id={id ?? name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`!rounded-[calc(1rem-1px)] !border-0 !bg-[#F7F6F3]/60 !px-5 !py-4 !text-[0.875rem] !font-medium !text-[#111] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] placeholder:!text-[#A8A29E] focus:!bg-white focus:!shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus-visible:!ring-0 ${trailing ? "!pr-14" : ""}`}
      />
      {trailing}
    </div>
  </div>
);

/* ── Sign Up View ──────────────────────────────────────────── */
const SignUpView = ({
  onClose,
  goToLogin,
}: {
  onClose: () => void;
  goToLogin: () => void;
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
  });
  const [register, { isLoading }] = useRegisterMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error(t("landing.auth.mustAgreeToTerms"));
      return;
    }

    try {
      await register({
        username: form.username,
        fullName: form.name,
        email: form.email,
        password: form.password,
      }).unwrap();

      toast.success(t("landing.auth.registrationSuccess"));
      goToLogin();
    } catch (err: unknown) {
      // Error is handled by RTK Query / middleware generally,
      // but specific form errors could be shown here
      const apiError = handleApiError(err);
      console.error("Registration failed:", apiError.message);

      // Check for email temporarily locked error
      if (apiError.code === "Auth.EmailTemporarilyLocked") {
        // Extract minutes from message if available, otherwise show default
        const minutesMatch = apiError.message.match(/(\d+)\s*phút/i);
        const minutes = minutesMatch ? minutesMatch[1] : "30";
        toast.error(t("landing.auth.emailTemporarilyLocked", { minutes }));
      } else {
        toast.error(t("landing.auth.registrationFailed"));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Header — Eyebrow + Premium Close */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="mb-3 inline-flex items-center rounded-full bg-[#C9873A]/[0.08] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9873A]">
            {t("landing.auth.getStarted", "Get Started")}
          </span>
          <h2 className="mt-3 text-[1.75rem] font-bold tracking-[-0.03em] text-[#111] sm:text-[2rem] leading-none">
            {t("landing.auth.createAccount")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[#78716C] ring-1 ring-black/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.06] hover:text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9873A]/30"
          aria-label={t("landing.auth.close")}>
          <Icon icon="heroicons-outline:x-mark" className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <InputField
          id="signup-username"
          label={t("landing.auth.username")}
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder={t("landing.auth.enterUsername")}
        />
        <InputField
          id="signup-name"
          label={t("landing.auth.nameAndSurname")}
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder={t("landing.auth.enterNameAndSurname")}
        />
        <InputField
          id="signup-email"
          label={t("landing.auth.emailAddress")}
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder={t("landing.auth.enterEmailAddress")}
        />
        <InputField
          id="signup-password"
          label={t("landing.auth.password")}
          type={showPassword ? "text" : "password"}
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder={t("landing.auth.enterPassword")}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent/30 dark:text-slate-500 dark:hover:text-slate-300"
              aria-label={
                showPassword
                  ? t("landing.auth.hidePassword")
                  : t("landing.auth.showPassword")
              }>
              <Icon
                icon={
                  showPassword
                    ? "heroicons-outline:eye"
                    : "heroicons-outline:eye-slash"
                }
                className="h-5 w-5"
              />
            </button>
          }
        />

        {/* Terms */}
        <Checkbox
          value={agreed}
          onChange={() => setAgreed((prev) => !prev)}
          activeClass="!bg-landing-accent !ring-landing-accent !border-landing-accent"
          label={
            <span className="text-sm leading-normal text-slate-600 dark:text-slate-300">
              {t("landing.auth.agreeWith")}{" "}
              <a href="/terms" className={LINK_ACTION_CLASS}>
                {t("landing.auth.terms")}
              </a>{" "}
              {t("landing.auth.and")}{" "}
              <a href="/privacy" className={LINK_ACTION_CLASS}>
                {t("landing.auth.privacy")}
              </a>
            </span>
          }
        />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button type="submit" disabled={isLoading} className={PRIMARY_ACTION_CLASS}>
          {isLoading && (
            <Icon icon="heroicons-outline:arrow-path" className="h-5 w-5 animate-spin" />
          )}
          {isLoading ? t("common.processing") : t("common.signUp")}
        </button>
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#A8A29E]">
            {t("landing.auth.or")}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = GOOGLE_LOGIN_URL;
          }}
          className={OUTLINE_ACTION_CLASS}>
          <FcGoogle className="h-5 w-5" aria-hidden="true" />
          <span>{t("landing.auth.signUpWithGoogle")}</span>
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-[0.8125rem] text-[#78716C]">
        {t("landing.auth.alreadyHaveAccount")}{" "}
        <button type="button" className={LINK_ACTION_CLASS} onClick={goToLogin}>
          {t("landing.auth.logIn")}
        </button>
      </p>
    </form>
  );
};

/* ── Login View ────────────────────────────────────────────── */
const LoginView = ({
  onClose,
  goToSignUp,
  goToForgot,
}: {
  onClose: () => void;
  goToSignUp: () => void;
  goToForgot: () => void;
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clear error when user starts typing
    if (loginError) {
      setLoginError(null);
    }
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Login first to get tokens and set cookies
      const loginResult = await login({
        email: form.email,
        password: form.password,
      }).unwrap();

      // Provider redirects depend on role names, not just portal metadata.
      const userInfoRequest = dispatch(
        authApiSlice.endpoints.getUserInfo.initiate(),
      );
      const userInfoResult = await userInfoRequest;
      userInfoRequest.unsubscribe();
      const userInfo = "data" in userInfoResult
        ? userInfoResult.data?.data ?? null
        : null;

      // Get next parameter from URL (preserved from original protected destination)
      const nextParam = searchParams.get("next");

      const destination = resolveLoginDestination({
        next: nextParam,
        defaultPath: userInfo?.defaultPath ?? loginResult.data?.defaultPath ?? null,
        portal: userInfo?.portal ?? loginResult.data?.portal ?? null,
        roles: userInfo?.roles ?? null,
      });

      toast.success(t("landing.auth.loginSuccess"));

      // Keep the short delay so the success toast/modal transition remains smooth.
      setTimeout(() => {
        onClose();
        router.replace(destination);
      }, 300);
    } catch (err: unknown) {
      // Handle specific login errors and display in form
      const apiError = handleApiError(err);
      // Translate the error message key to display user-friendly text
      const translatedError = t(apiError.message, apiError.message);
      setLoginError(translatedError);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Header — Eyebrow + Premium Close */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="mb-3 inline-flex items-center rounded-full bg-[#C9873A]/[0.08] px-3.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9873A]">
            {t("landing.auth.welcomeBack", "Welcome Back")}
          </span>
          <h2 className="mt-3 text-[1.75rem] font-bold tracking-[-0.03em] text-[#111] sm:text-[2rem] leading-none">
            {t("landing.auth.login")}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/[0.04] text-[#78716C] ring-1 ring-black/[0.04] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-black/[0.06] hover:text-[#111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9873A]/30"
          aria-label={t("landing.auth.close")}>
          <Icon icon="heroicons-outline:x-mark" className="h-4 w-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="space-y-5">
        <InputField
          id="login-email"
          label={t("landing.auth.emailAddress")}
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder={t("landing.auth.enterEmailAddress")}
        />
        <div className="space-y-2">
          <InputField
            id="login-password"
            label={t("landing.auth.password")}
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder={t("landing.auth.enterPassword")}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-accent/30 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label={
                  showPassword
                    ? t("landing.auth.hidePassword")
                    : t("landing.auth.showPassword")
                }>
                <Icon
                  icon={
                    showPassword
                      ? "heroicons-outline:eye"
                      : "heroicons-outline:eye-slash"
                  }
                  className="h-5 w-5"
                />
              </button>
            }
          />
          {/* Error message display */}
          {loginError && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-[#9F2F2D]/[0.06] px-4 py-3 text-[0.8125rem] font-medium text-[#9F2F2D] ring-1 ring-[#9F2F2D]/10">
              <Icon icon="heroicons-outline:exclamation-circle" className="h-5 w-5 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={goToForgot}
              className="text-[0.8125rem] font-medium text-[#78716C] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#C9873A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9873A]/30 rounded">
              {t("landing.auth.forgotYourPassword")}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button type="submit" disabled={isLoading} className={PRIMARY_ACTION_CLASS}>
          {isLoading && (
            <Icon icon="heroicons-outline:arrow-path" className="h-5 w-5 animate-spin" />
          )}
          {isLoading ? t("common.processing") : t("common.signIn")}
        </button>
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#A8A29E]">
            {t("landing.auth.or")}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-black/[0.08] to-transparent" />
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = GOOGLE_LOGIN_URL;
          }}
          className={OUTLINE_ACTION_CLASS}>
          <FcGoogle className="h-5 w-5" aria-hidden="true" />
          <span>{t("landing.auth.signInWithGoogle")}</span>
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-[0.8125rem] text-[#78716C]">
        {t("landing.auth.dontHaveAccount")}{" "}
        <button type="button" className={LINK_ACTION_CLASS} onClick={goToSignUp}>
          {t("common.signUp")}
        </button>
      </p>
    </form>
  );
};

/* ── Forgot Password View ──────────────────────────────────── */
const ForgotPasswordView = ({ goToLogin }: { goToLogin: () => void }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPassword] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotPassword(email).unwrap();
      setSubmitted(true);
    } catch {
      // Always show success to prevent email enumeration
      // (backend also always returns success per security design)
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Key icon — Double-Bezel circle */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C9873A]/[0.08] ring-1 ring-[#C9873A]/10">
          <Icon
            icon="heroicons-outline:key"
            className="h-6 w-6 text-[#C9873A]"
          />
        </div>
        <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#111] sm:text-[2rem]">
          {t("landing.auth.checkYourEmail")}
        </h2>
        <p className="text-[0.875rem] leading-relaxed text-[#78716C]">
          {t("landing.auth.resetLinkSentTo")}{" "}
          <span className="font-semibold text-[#111]">
            {email}
          </span>
        </p>
        <button
          type="button"
          onClick={goToLogin}
          className="inline-flex items-center gap-2 rounded-full text-[0.8125rem] font-medium text-[#78716C] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#C9873A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9873A]/30">
          <Icon icon="heroicons-outline:arrow-left" className="h-4 w-4" />
          {t("landing.auth.backToLogin")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
      {/* Key icon — Double-Bezel */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C9873A]/[0.08] ring-1 ring-[#C9873A]/10">
        <Icon icon="heroicons-outline:key" className="h-6 w-6 text-[#C9873A]" />
      </div>

      <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] text-[#111] sm:text-[2rem]">
        {t("landing.auth.forgotPassword")}
      </h2>
      <p className="-mt-3 text-center text-[0.875rem] leading-relaxed text-[#78716C]">
        {t("landing.auth.forgotPasswordHelp")}
      </p>

      {/* Email field */}
      <div className="w-full">
        <InputField
          id="forgot-email"
          label={t("landing.auth.emailAddress")}
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("landing.auth.enterEmailAddress")}
        />
      </div>

      <button type="submit" disabled={isLoading} className={PRIMARY_ACTION_CLASS}>
        {isLoading && (
          <Icon icon="heroicons-outline:arrow-path" className="h-5 w-5 animate-spin" />
        )}
        {isLoading ? t("common.processing") : t("landing.auth.resetPassword")}
      </button>

      <button
        type="button"
        onClick={goToLogin}
        className="inline-flex items-center gap-2 rounded-full text-[0.8125rem] font-medium text-[#78716C] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-[#C9873A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9873A]/30">
        <Icon icon="heroicons-outline:arrow-left" className="h-4 w-4" />
        {t("landing.auth.backToLogin")}
      </button>
    </form>
  );
};

/* ── AuthModal (orchestrator) ──────────────────────────────── */
export const AuthModal = ({
  open,
  onClose,
  initialView = "signup",
}: AuthModalProps) => {
  const { t } = useTranslation();
  const [view, setView] = useState<AuthView>(initialView);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const selectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>(selectors),
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusables.length === 0) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  const ariaLabels: Record<AuthView, string> = {
    signup: t("landing.auth.createAccount"),
    login: t("landing.auth.login"),
    forgot: t("landing.auth.forgotPassword"),
  };

  return (
    <ModalShell
      onClose={handleClose}
      ariaLabel={ariaLabels[view]}
      closeLabel={t("landing.auth.closeModal")}
      dialogRef={dialogRef}>
      {view === "signup" && (
        <SignUpView onClose={handleClose} goToLogin={() => setView("login")} />
      )}
      {view === "login" && (
        <LoginView
          onClose={handleClose}
          goToSignUp={() => setView("signup")}
          goToForgot={() => setView("forgot")}
        />
      )}
      {view === "forgot" && (
        <ForgotPasswordView goToLogin={() => setView("login")} />
      )}
    </ModalShell>
  );
};

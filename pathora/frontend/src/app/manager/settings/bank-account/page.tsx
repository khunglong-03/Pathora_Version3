"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { TourRequestAdminLayout } from "@/features/dashboard/components/TourRequestAdminLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { handleApiError } from "@/utils/apiResponse";
import { managerService, type ManagerBankAccountDto } from "@/api/services/managerService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BankAccountFormData {
  bankAccountNumber: string;
  bankCode: string;
  bankAccountName: string;
}

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const bankAccountSchema = yup.object({
  bankAccountNumber: yup
    .string()
    .required("Bank account number is required")
    .min(6, "Bank account number must be at least 6 digits")
    .max(20, "Bank account number must be at most 20 digits")
    .matches(/^\d+$/, "Bank account number must contain only digits"),
  bankCode: yup
    .string()
    .required("Bank code is required")
    .min(2, "Bank code is too short")
    .max(10, "Bank code is too long")
    .matches(/^[A-Z0-9]+$/, "Bank code must contain only uppercase letters and digits"),
  bankAccountName: yup
    .string()
    .required("Account holder name is required")
    .min(2, "Account name must be at least 2 characters")
    .max(100, "Account name must be at most 100 characters"),
});

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

async function fetchBankAccount(): Promise<ManagerBankAccountDto | null> {
  try {
    return await managerService.getMyBankAccount();
  } catch {
    return null;
  }
}

async function updateBankAccount(data: BankAccountFormData): Promise<void> {
  await managerService.updateMyBankAccount({
    bankAccountNumber: data.bankAccountNumber,
    bankCode: data.bankCode,
    bankAccountName: data.bankAccountName,
  });
}

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------

interface EditBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ManagerBankAccountDto | null;
  onSuccess: (data: ManagerBankAccountDto) => void;
}

function EditBankAccountModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: EditBankAccountModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BankAccountFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(bankAccountSchema) as any,
    defaultValues: {
      bankAccountNumber: initialData?.bankAccountNumber ?? "",
      bankCode: initialData?.bankCode ?? "",
      bankAccountName: initialData?.bankAccountName ?? "",
    },
  });

  const onSubmit = async (formData: BankAccountFormData) => {
    setIsSubmitting(true);
    try {
      await updateBankAccount(formData);
      const updated: ManagerBankAccountDto = {
        userId: initialData?.userId ?? "",
        bankAccountNumber: formData.bankAccountNumber,
        bankCode: formData.bankCode.toUpperCase(),
        bankAccountName: formData.bankAccountName,
        bankAccountVerified: false,
        bankAccountVerifiedAt: null,
      };
      onSuccess(updated);
      toast.success(t("common.bankAccount.updateSuccess") || "Bank account updated successfully");
      handleClose();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const inputBaseStyle: React.CSSProperties = {
    borderColor: "#E5E7EB",
    color: "#111827",
  };
  const errorInputBaseStyle: React.CSSProperties = {
    borderColor: "#DC2626",
    color: "#111827",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t("common.bankAccount.editTitle") || "Edit Bank Account"}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Bank Account Number */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
            {t("common.bankAccount.bankAccountNumber") || "Bank Account Number"} <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 1234567890"
            {...register("bankAccountNumber")}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={errors.bankAccountNumber ? errorInputBaseStyle : inputBaseStyle}
          />
          {errors.bankAccountNumber && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
              {errors.bankAccountNumber.message}
            </p>
          )}
        </div>

        {/* Bank Code */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
            {t("common.bankAccount.bankCode") || "Bank Code"} <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. VCB, ACB, TPB"
            {...register("bankCode")}
            className="w-full px-3 py-2 rounded-lg border text-sm uppercase"
            style={errors.bankCode ? errorInputBaseStyle : inputBaseStyle}
          />
          {errors.bankCode && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
              {errors.bankCode.message}
            </p>
          )}
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
            {t("common.bankAccount.accountName") || "Account Holder Name"} <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Nguyen Van A"
            {...register("bankAccountName")}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={errors.bankAccountName ? errorInputBaseStyle : inputBaseStyle}
          />
          {errors.bankAccountName && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
              {errors.bankAccountName.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClose}
          >
            {t("common.cancel") || "Cancel"}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
          >
            {t("common.save") || "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ManagerBankAccountPage() {
  const { t } = useTranslation();
  const [bankAccount, setBankAccount] = useState<ManagerBankAccountDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initial data fetch
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchBankAccount();
      setBankAccount(data);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when modal closes
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    void loadData();
  }, [loadData]);

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleEditSuccess = (updated: ManagerBankAccountDto) => {
    setBankAccount(updated);
    setIsModalOpen(false);
    void loadData();
  };

  return (
    <TourRequestAdminLayout
      title={t("common.bankAccount.pageTitle") || "Bank Account"}
      subtitle={t("common.bankAccount.pageSubtitle") || "Manage your bank account for receiving payments"}
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
        >
          <svg className="size-5 mt-0.5 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-amber-800">
            {t("common.bankAccount.infoBanner") || "Only verified accounts will be used for payment QR codes. Contact admin to verify."}
          </p>
        </motion.div>

        {/* Bank Account Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoading ? "loading" : "content"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="bg-white rounded-[2rem] border border-border shadow-card overflow-hidden"
          >
            {isLoading ? (
              /* Loading skeleton */
              <div className="p-8 space-y-4">
                <div className="h-4 w-32 rounded bg-stone-100 animate-pulse" />
                <div className="h-8 w-64 rounded bg-stone-100 animate-pulse" />
                <div className="h-4 w-48 rounded bg-stone-100 animate-pulse mt-6" />
                <div className="h-4 w-40 rounded bg-stone-100 animate-pulse" />
              </div>
            ) : bankAccount && bankAccount.bankAccountNumber ? (
              /* Account details */
              <div className="p-8">
                {/* Header row */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">
                      {t("common.bankAccount.currentAccount") || "Current Bank Account"}
                    </h3>
                    <p className="mt-1 text-sm text-stone-500">
                      {t("common.bankAccount.currentAccountDesc") || "Your registered bank account for receiving payments"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                    text={t("common.edit") || "Edit"}
                    icon={
                      <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    }
                  />
                </div>

                {/* Account details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Bank */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-1">
                      {t("common.bankAccount.bankCode") || "Bank Code"}
                    </p>
                    <p className="text-base font-semibold text-stone-900">
                      {bankAccount.bankCode?.toUpperCase() ?? "—"}
                    </p>
                  </div>

                  {/* Account Number */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-1">
                      {t("common.bankAccount.bankAccountNumber") || "Account Number"}
                    </p>
                    <p className="text-base font-semibold text-stone-900 font-mono">
                      {maskAccountNumber(bankAccount.bankAccountNumber)}
                    </p>
                  </div>

                  {/* Account Name */}
                  <div>
                    <p className="text-xs font-medium uppercase tracking-widest text-stone-400 mb-1">
                      {t("common.bankAccount.accountName") || "Account Name"}
                    </p>
                    <p className="text-base font-semibold text-stone-900">
                      {bankAccount.bankAccountName ?? "—"}
                    </p>
                  </div>
                </div>

                {/* Verification status */}
                <div className="mt-6 pt-6 border-t border-stone-100 flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-widest text-stone-400">
                    {t("common.bankAccount.status") || "Verification Status"}:
                  </span>
                  <Badge
                    className={
                      bankAccount.bankAccountVerified
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }
                    label={
                      bankAccount.bankAccountVerified
                        ? (t("common.bankAccount.verified") || "Verified")
                        : (t("common.bankAccount.pendingVerification") || "Pending verification")
                    }
                    icon={
                      bankAccount.bankAccountVerified ? "check" : "clock"
                    }
                  />
                  {bankAccount.bankAccountVerified && bankAccount.bankAccountVerifiedAt && (
                    <span className="text-xs text-stone-400">
                      {t("common.bankAccount.verifiedAt") || "Verified at"}{" "}
                      {formatDate(bankAccount.bankAccountVerifiedAt)}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* No account set */
              <div className="p-8 flex flex-col items-center text-center">
                <div className="size-12 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                  <svg className="size-6 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-stone-900 mb-1">
                  {t("common.bankAccount.noAccount") || "No bank account set"}
                </h3>
                <p className="text-sm text-stone-500 mb-6 max-w-sm">
                  {t("common.bankAccount.noAccountDesc") || "Add your bank account to receive payments from tour bookings."}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleEditClick}
                  text={t("common.bankAccount.addAccount") || "Add Bank Account"}
                  icon={
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  }
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Edit Modal */}
        <EditBankAccountModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          initialData={bankAccount}
          onSuccess={handleEditSuccess}
        />
      </div>
    </TourRequestAdminLayout>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskAccountNumber(accountNumber: string | null): string {
  if (!accountNumber) return "—";
  if (accountNumber.length <= 4) return accountNumber;
  const visible = accountNumber.slice(-4);
  const masked = "*".repeat(Math.min(accountNumber.length - 4, 8));
  return `${masked}${visible}`;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

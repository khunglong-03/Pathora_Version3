"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { TourRequestAdminLayout } from "@/features/dashboard/components/TourRequestAdminLayout";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { handleApiError } from "@/utils/apiResponse";
import {
  managerService,
  type ManagerBankAccountItemDto,
  type VietQRBank,
} from "@/api/services/managerService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BankAccountFormData {
  bankAccountNumber: string;
  bankCode: string;
  bankAccountName: string;
  isDefault: boolean;
}

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const bankAccountSchema = yup.object({
  bankAccountNumber: yup
    .string()
    .required("Số tài khoản là bắt buộc")
    .min(6, "Số tài khoản tối thiểu 6 ký tự")
    .max(20, "Số tài khoản tối đa 20 ký tự")
    .matches(/^\d+$/, "Số tài khoản chỉ chứa chữ số"),
  bankCode: yup
    .string()
    .required("Vui lòng chọn ngân hàng"),
  bankAccountName: yup
    .string()
    .required("Tên chủ tài khoản là bắt buộc")
    .min(2, "Tên tối thiểu 2 ký tự")
    .max(100, "Tên tối đa 100 ký tự"),
  isDefault: yup.boolean().defined(),
});

// ---------------------------------------------------------------------------
// Bank Selector Component (VietQR integration)
// ---------------------------------------------------------------------------

function BankSelector({
  banks,
  value,
  onChange,
  error,
}: {
  banks: VietQRBank[];
  value: string;
  onChange: (code: string) => void;
  error?: string;
}) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const selectedBank = banks.find((b) => b.code === value);

  const filtered = useMemo(() => {
    if (!search) return banks;
    const q = search.toLowerCase();
    return banks.filter(
      (b) =>
        b.shortName.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q)
    );
  }, [banks, search]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
        Ngân hàng <span style={{ color: "#DC2626" }}>*</span>
      </label>

      {/* Selected display / trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2.5 rounded-lg border text-sm text-left flex items-center gap-3 transition-colors"
        style={{
          borderColor: error ? "#DC2626" : "#E5E7EB",
          color: "#111827",
          backgroundColor: "#fff",
        }}
      >
        {selectedBank ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedBank.logo}
              alt={selectedBank.shortName}
              className="w-6 h-6 object-contain rounded shrink-0"
            />
            <span className="flex-1 truncate">
              {selectedBank.shortName} — {selectedBank.name}
            </span>
          </>
        ) : (
          <span className="text-stone-400 flex-1">Chọn ngân hàng...</span>
        )}
        <svg className="size-4 text-stone-400 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-xl max-h-64 overflow-hidden"
          >
            {/* Search */}
            <div className="p-2 border-b border-stone-100">
              <input
                type="text"
                placeholder="Tìm ngân hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>
            {/* Options */}
            <div className="overflow-y-auto max-h-48">
              {filtered.length === 0 ? (
                <div className="px-4 py-3 text-sm text-stone-400 text-center">
                  Không tìm thấy ngân hàng
                </div>
              ) : (
                filtered.map((bank) => (
                  <button
                    key={bank.code}
                    type="button"
                    onClick={() => {
                      onChange(bank.code);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors hover:bg-amber-50 ${
                      bank.code === value ? "bg-amber-50 text-amber-900" : "text-stone-700"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bank.logo} alt={bank.shortName} className="w-6 h-6 object-contain rounded shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{bank.shortName}</span>
                      <span className="text-stone-400 ml-1.5 text-xs truncate">{bank.name}</span>
                    </div>
                    {bank.code === value && (
                      <svg className="size-4 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearch(""); }} />
      )}

      {error && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit/Create Modal
// ---------------------------------------------------------------------------

interface BankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ManagerBankAccountItemDto | null;
  banks: VietQRBank[];
  onSuccess: () => void;
}

function BankAccountModal({
  isOpen,
  onClose,
  initialData,
  banks,
  onSuccess,
}: BankAccountModalProps) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<BankAccountFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: yupResolver(bankAccountSchema) as any,
    defaultValues: {
      bankAccountNumber: initialData?.bankAccountNumber ?? "",
      bankCode: initialData?.bankCode ?? "",
      bankAccountName: initialData?.bankAccountName ?? "",
      isDefault: initialData?.isDefault ?? false,
    },
  });

  // Reset form when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      reset({
        bankAccountNumber: initialData?.bankAccountNumber ?? "",
        bankCode: initialData?.bankCode ?? "",
        bankAccountName: initialData?.bankAccountName ?? "",
        isDefault: initialData?.isDefault ?? false,
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (formData: BankAccountFormData) => {
    setIsSubmitting(true);
    try {
      const bank = banks.find((b) => b.code === formData.bankCode);
      const payload = {
        bankAccountNumber: formData.bankAccountNumber,
        bankCode: formData.bankCode,
        bankBin: bank?.bin ?? "",
        bankShortName: bank?.shortName,
        bankAccountName: formData.bankAccountName,
        isDefault: formData.isDefault,
      };

      if (isEditing && initialData) {
        await managerService.updateBankAccount(initialData.id, payload);
        toast.success("Cập nhật tài khoản thành công");
      } else {
        await managerService.createBankAccount(payload);
        toast.success("Thêm tài khoản thành công");
      }

      onSuccess();
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

  const inputStyle: React.CSSProperties = { borderColor: "#E5E7EB", color: "#111827" };
  const errorStyle: React.CSSProperties = { borderColor: "#DC2626", color: "#111827" };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Sửa tài khoản ngân hàng" : "Thêm tài khoản ngân hàng"}
      size="md"
    >
      <form onSubmit={void handleSubmit(onSubmit)} className="space-y-4">
        {/* Bank Selector (VietQR) */}
        <Controller
          name="bankCode"
          control={control}
          render={({ field }) => (
            <BankSelector
              banks={banks}
              value={field.value}
              onChange={field.onChange}
              error={errors.bankCode?.message}
            />
          )}
        />

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
            Số tài khoản <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="VD: 1234567890"
            {...register("bankAccountNumber")}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={errors.bankAccountNumber ? errorStyle : inputStyle}
          />
          {errors.bankAccountNumber && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
              {errors.bankAccountNumber.message}
            </p>
          )}
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151" }}>
            Tên chủ tài khoản <span style={{ color: "#DC2626" }}>*</span>
          </label>
          <input
            type="text"
            placeholder="VD: NGUYEN VAN A"
            {...register("bankAccountName")}
            className="w-full px-3 py-2 rounded-lg border text-sm uppercase"
            style={errors.bankAccountName ? errorStyle : inputStyle}
          />
          {errors.bankAccountName && (
            <p className="text-xs mt-1" style={{ color: "#DC2626" }}>
              {errors.bankAccountName.message}
            </p>
          )}
        </div>

        {/* Default toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("isDefault")}
            className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-400"
          />
          <span className="text-sm text-stone-700">Đặt làm tài khoản mặc định</span>
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
            {t("common.cancel") || "Hủy"}
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {isEditing ? "Cập nhật" : "Thêm mới"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirmation Modal
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  isOpen,
  onClose,
  account,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  account: ManagerBankAccountItemDto | null;
  onConfirm: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!account) return;
    setIsDeleting(true);
    try {
      await managerService.deleteBankAccount(account.id);
      toast.success("Xóa tài khoản thành công");
      onConfirm();
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận xóa" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-stone-600">
          Bạn có chắc chắn muốn xóa tài khoản{" "}
          <strong className="text-stone-900">
            {account?.bankShortName ?? account?.bankCode} — ****
            {account?.bankAccountNumber.slice(-4)}
          </strong>{" "}
          không? Hành động này không thể hoàn tác.
        </p>
        {account?.isDefault && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <svg className="size-4 mt-0.5 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-amber-800">
              Đây là tài khoản mặc định. Sau khi xóa, tài khoản gần nhất sẽ tự động trở thành mặc định.
            </p>
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="destructive" size="sm" isLoading={isDeleting} onClick={handleDelete}>
            Xóa
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Bank Account Card
// ---------------------------------------------------------------------------

function BankAccountCard({
  account,
  bank,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  account: ManagerBankAccountItemDto;
  bank?: VietQRBank;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const masked = maskAccountNumber(account.bankAccountNumber);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className={`relative bg-white rounded-2xl border overflow-hidden transition-shadow duration-200 ${
        account.isDefault
          ? "border-amber-300 shadow-lg shadow-amber-100/50 ring-1 ring-amber-200/50"
          : "border-stone-200 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Default ribbon */}
      {account.isDefault && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
      )}

      <div className="p-5">
        {/* Header: bank logo + name + badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {bank?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={bank.logo}
                alt={bank.shortName}
                className="w-10 h-10 object-contain rounded-lg border border-stone-100 bg-white p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                <svg className="size-5 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                {bank?.shortName ?? account.bankCode}
              </h3>
              <p className="text-xs text-stone-400">{account.bankCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {account.isDefault && (
              <Badge className="bg-amber-100 text-amber-700" label="Mặc định" icon="heroicons:star-20-solid" />
            )}
            <Badge
              className={account.isVerified ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}
              label={account.isVerified ? "Đã xác minh" : "Chờ xác minh"}
              icon={account.isVerified ? "heroicons:check-badge-20-solid" : "heroicons:clock-20-solid"}
            />
          </div>
        </div>

        {/* Account details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400 mb-0.5">
              Số tài khoản
            </p>
            <p className="text-sm font-semibold text-stone-900 font-mono">{masked}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400 mb-0.5">
              Chủ tài khoản
            </p>
            <p className="text-sm font-semibold text-stone-900">{account.bankAccountName ?? "—"}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-stone-100">
          {!account.isDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              className="text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
            >
              <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Đặt mặc định
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
              aria-label="Sửa"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Xóa"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ManagerBankAccountsPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<ManagerBankAccountItemDto[]>([]);
  const [banks, setBanks] = useState<VietQRBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ManagerBankAccountItemDto | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<ManagerBankAccountItemDto | null>(null);

  // Build bank lookup
  const bankMap = useMemo(() => {
    const map = new Map<string, VietQRBank>();
    for (const b of banks) map.set(b.code, b);
    return map;
  }, [banks]);

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [accountsData, banksData] = await Promise.all([
        managerService.getMyBankAccounts(),
        managerService.getVietQRBanks(),
      ]);
      setAccounts(accountsData);
      setBanks(banksData);
    } catch (err) {
      handleApiError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSetDefault = async (account: ManagerBankAccountItemDto) => {
    try {
      const bank = bankMap.get(account.bankCode);
      await managerService.updateBankAccount(account.id, {
        bankAccountNumber: account.bankAccountNumber,
        bankCode: account.bankCode,
        bankBin: account.bankBin ?? bank?.bin ?? "",
        bankShortName: account.bankShortName ?? bank?.shortName,
        bankAccountName: account.bankAccountName ?? undefined,
        isDefault: true,
      });
      toast.success("Đã đặt tài khoản mặc định");
      void loadData();
    } catch (err) {
      handleApiError(err);
    }
  };

  const openCreate = () => {
    setEditingAccount(null);
    setIsFormOpen(true);
  };

  const openEdit = (account: ManagerBankAccountItemDto) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  return (
    <TourRequestAdminLayout
      title={t("common.bankAccounts.pageTitle") || "Tài khoản ngân hàng"}
      subtitle={
        t("common.bankAccounts.pageSubtitle") ||
        "Quản lý các tài khoản ngân hàng để nhận thanh toán"
      }
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
            Tài khoản <strong>mặc định</strong> sẽ được sử dụng để tạo mã QR thanh toán. Bạn có thể thay đổi tài khoản mặc định bất kỳ lúc nào.
            Liên hệ admin để xác minh tài khoản.
          </p>
        </motion.div>

        {/* Header + Add button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">
              Danh sách tài khoản
            </h2>
            <p className="text-sm text-stone-500 mt-0.5">
              {accounts.length} tài khoản
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={openCreate}
            text="Thêm tài khoản"
            icon={
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            }
          />
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            /* Loading skeleton */
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-stone-100 animate-pulse" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3.5 w-24 rounded bg-stone-100 animate-pulse" />
                      <div className="h-3 w-16 rounded bg-stone-100 animate-pulse" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-8 rounded bg-stone-50 animate-pulse" />
                    <div className="h-8 rounded bg-stone-50 animate-pulse" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : accounts.length === 0 ? (
            /* Empty state */
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-[2rem] border border-stone-200 shadow-sm p-12 flex flex-col items-center text-center"
            >
              <div className="size-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-5">
                <svg className="size-8 text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-stone-900 mb-1">
                Chưa có tài khoản ngân hàng
              </h3>
              <p className="text-sm text-stone-500 mb-6 max-w-sm">
                Thêm tài khoản ngân hàng để bắt đầu nhận thanh toán từ khách hàng đặt tour.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={openCreate}
                text="Thêm tài khoản đầu tiên"
                icon={
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                }
              />
            </motion.div>
          ) : (
            /* Account cards grid */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <AnimatePresence>
                {accounts.map((account) => (
                  <BankAccountCard
                    key={account.id}
                    account={account}
                    bank={bankMap.get(account.bankCode)}
                    onEdit={() => openEdit(account)}
                    onDelete={() => setDeletingAccount(account)}
                    onSetDefault={() => void handleSetDefault(account)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modals */}
        <BankAccountModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingAccount}
          banks={banks}
          onSuccess={() => void loadData()}
        />

        <DeleteConfirmModal
          isOpen={!!deletingAccount}
          onClose={() => setDeletingAccount(null)}
          account={deletingAccount}
          onConfirm={() => {
            setDeletingAccount(null);
            void loadData();
          }}
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
  const masked = "•".repeat(Math.min(accountNumber.length - 4, 8));
  return `${masked}${visible}`;
}

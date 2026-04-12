"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useDebounce } from "@/hooks/useDebounce";
import {
  AdminPageHeader,
  AdminFilterTabs,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import TextInput from "@/components/ui/TextInput";
import Icon from "@/components/ui/Icon";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ManagerBankAccountDto {
  userId: string;
  username: string;
  fullName: string | null;
  email: string;
  bankAccountNumber: string | null;
  bankCode: string | null;
  bankAccountName: string | null;
  bankAccountVerified: boolean;
  bankAccountVerifiedAt: string | null;
}

interface PaginatedManagersResponse {
  items: ManagerBankAccountDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface EditBankAccountForm {
  bankAccountNumber: string;
  bankCode: string;
  bankAccountName: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

type BankStatusFilter = "all" | "verified" | "pending";

const FILTER_TABS = [
  { label: "Tất cả", value: "all" },
  { label: "Đã xác minh", value: "verified" },
  { label: "Chờ xác minh", value: "pending" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function maskAccountNumber(num: string | null): string {
  if (!num) return "—";
  if (num.length <= 4) return num;
  return `****${num.slice(-4)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManagerBankAccountsPage() {
  const [managers, setManagers] = useState<ManagerBankAccountDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [bankFilter, setBankFilter] = useState<BankStatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<ManagerBankAccountDto | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // ── Load data ────────────────────────────────────────────────────────────

  const loadManagers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const filterParams =
      bankFilter === "verified"
        ? { verified: "true" }
        : bankFilter === "pending"
        ? { verified: "false" }
        : {};

    const result = await (
      await import("@/api/services/adminService")
    ).adminService.getManagersBankAccounts({
      page: currentPage,
      limit: 50,
      search: debouncedSearch || undefined,
      ...filterParams,
    });

    setManagers(result?.items ?? []);
    setTotalPages(result?.totalPages ?? 1);
    setTotal(result?.total ?? 0);
    setIsLoading(false);
  }, [currentPage, debouncedSearch, bankFilter]);

  useEffect(() => {
    void loadManagers();
  }, [loadManagers, reloadToken]);

  // ── Edit modal form ───────────────────────────────────────────────────────

  const editSchema = yup.object({
    bankAccountNumber: yup
      .string()
      .required("Số tài khoản là bắt buộc")
      .matches(/^\d{6,20}$/, "Số tài khoản phải là 6–20 chữ số"),
    bankCode: yup
      .string()
      .required("Mã ngân hàng là bắt buộc")
      .matches(/^[A-Z]{2,10}$/, "Mã ngân hàng phải là 2–10 ký tự IN HOA"),
    bankAccountName: yup.string().optional(),
  });

  const editForm = useForm<EditBankAccountForm>({
    resolver: yupResolver(editSchema),
    defaultValues: {
      bankAccountNumber: "",
      bankCode: "",
      bankAccountName: "",
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFilterChange = (value: string) => {
    setBankFilter(value as BankStatusFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRefresh = () => {
    setReloadToken((t) => t + 1);
  };

  const handleEditClick = (manager: ManagerBankAccountDto) => {
    setEditingManager(manager);
    editForm.reset({
      bankAccountNumber: manager.bankAccountNumber ?? "",
      bankCode: manager.bankCode ?? "",
      bankAccountName: manager.bankAccountName ?? "",
    });
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEditingManager(null);
    editForm.reset({ bankAccountNumber: "", bankCode: "", bankAccountName: "" });
  };

  const handleSaveEdit = async (values: EditBankAccountForm) => {
    if (!editingManager) return;
    setIsSaving(true);

    await (
      await import("@/api/services/adminService")
    ).adminService.updateManagerBankAccount(editingManager.userId, {
      bankAccountNumber: values.bankAccountNumber,
      bankCode: values.bankCode.toUpperCase(),
      bankAccountName: values.bankAccountName || undefined,
    });

    setIsSaving(false);
    handleEditModalClose();
    void handleRefresh();
  };

  const handleVerify = async (manager: ManagerBankAccountDto) => {
    setVerifyingId(manager.userId);

    await (
      await import("@/api/services/adminService")
    ).adminService.verifyManagerBankAccount(manager.userId);

    setVerifyingId(null);
    void handleRefresh();
  };

  // ── Tabs with counts ──────────────────────────────────────────────────────

  const tabsWithCounts = FILTER_TABS.map((tab) => ({
    ...tab,
    count: tab.value === "all" ? total : 0,
  }));

  // ── Pagination ────────────────────────────────────────────────────────────

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Icon icon="heroicons-outline:chevron-left" />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-9 text-center text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => handlePageChange(p as number)}
              className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Icon icon="heroicons-outline:chevron-right" />
        </button>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Manager Bank Accounts"
        subtitle="Manage bank accounts for tour managers"
        onRefresh={handleRefresh}
      />

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <AdminFilterTabs
          tabs={tabsWithCounts}
          activeValue={bankFilter}
          onChange={handleFilterChange}
        />
        <div className="w-full md:w-72">
          <TextInput
            type="text"
            placeholder="Search by name, username, email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            icon="MagnifyingGlass"
            hasicon={false}
          />
        </div>
      </div>

      {/* Content */}
      {error && <AdminErrorCard message={error} onRetry={handleRefresh} />}

      {!error && !isLoading && managers.length === 0 && (
        <AdminEmptyState
          icon="BuildingOffice2"
          heading="No managers found"
          description="No managers match your current filters."
        />
      )}

      {!error && !isLoading && managers.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b border-slate-100 dark:border-slate-700"
                  style={{ backgroundColor: "#F9FAFB" }}
                >
                  {[
                    "Manager Name",
                    "Username",
                    "Email",
                    "Bank Code",
                    "Account Number",
                    "Status",
                    "Verified At",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "#6B7280" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {managers.map((m) => (
                  <tr
                    key={m.userId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {m.fullName ?? m.username}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {m.username}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {m.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {m.bankCode ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {maskAccountNumber(m.bankAccountNumber)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {m.bankAccountVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          <span className="size-1.5 rounded-full bg-green-600 dark:bg-green-400" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          <span className="size-1.5 rounded-full bg-yellow-500" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatDate(m.bankAccountVerifiedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-accent hover:text-accent-foreground transition-colors dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          <Icon icon="heroicons-outline:pencil-square" className="size-3.5" />
                          Edit
                        </button>
                        {!m.bankAccountVerified && (
                          <button
                            onClick={() => handleVerify(m)}
                            disabled={verifyingId === m.userId}
                            className="inline-flex items-center gap-1 rounded-lg border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors dark:border-green-700 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                          >
                            <Icon icon="heroicons-outline:check-badge" className="size-3.5" />
                            {verifyingId === m.userId ? "Verifying..." : "Verify"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {renderPagination()}
        </>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Edit Bank Account Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={handleEditModalClose}
        title="Edit Bank Account"
        size="md"
        footerContent={
          <div className="flex w-full items-center justify-end gap-3">
            <Button
              variant="outline"
              text="Cancel"
              onClick={handleEditModalClose}
              disabled={isSaving}
            />
            <Button
              variant="primary"
              text={isSaving ? "Saving..." : "Save"}
              isLoading={isSaving}
              onClick={() => void editForm.handleSubmit(handleSaveEdit)()}
            />
          </div>
        }
      >
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="flex flex-col gap-5">
            {/* Manager info */}
            {editingManager && (
              <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-700">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {editingManager.fullName ?? editingManager.username}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingManager.email}
                </p>
              </div>
            )}

            {/* Bank Account Number */}
            <TextInput
              id="bankAccountNumber"
              label="Bank Account Number"
              placeholder="e.g. 1234567890"
              {...editForm.register("bankAccountNumber")}
              value={editForm.watch("bankAccountNumber")}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                editForm.setValue("bankAccountNumber", raw, { shouldValidate: true });
              }}
              error={editForm.formState.errors.bankAccountNumber}
            />

            {/* Bank Code */}
            <TextInput
              id="bankCode"
              label="Bank Code"
              placeholder="e.g. MBB, VCB, TPB"
              {...editForm.register("bankCode")}
              value={editForm.watch("bankCode")}
              onChange={(e) => {
                editForm.setValue("bankCode", e.target.value.toUpperCase(), {
                  shouldValidate: true,
                });
              }}
              error={editForm.formState.errors.bankCode}
            />

            {/* Account Name */}
            <TextInput
              id="bankAccountName"
              label="Account Name (optional)"
              placeholder="Name as shown on the account"
              {...editForm.register("bankAccountName")}
              value={editForm.watch("bankAccountName")}
              onChange={(e) => editForm.setValue("bankAccountName", e.target.value)}
              error={editForm.formState.errors.bankAccountName}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

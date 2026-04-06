"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { siteContentAdminService } from "@/api/services/siteContentAdminService";
import { Icon } from "@/components/ui";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import type {
  SiteContentAdminDetailItem,
  SiteContentAdminListItem,
} from "@/types/siteContent";

const springTransition = { type: "spring" as const, stiffness: 100, damping: 20 };

const formatDate = (value: string | null): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString();
};

const tryValidateJson = (value: string): string | null => {
  if (!value.trim()) return "empty";
  try {
    JSON.parse(value);
    return null;
  } catch {
    return "invalid";
  }
};

export function SiteContentManagementPage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<SiteContentAdminListItem[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState(true);
  const [rowsError, setRowsError] = useState<string | null>(null);
  const [pageKeyFilter, setPageKeyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SiteContentAdminDetailItem | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [englishContentValue, setEnglishContentValue] = useState("");
  const [vietnameseContentValue, setVietnameseContentValue] = useState("");
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadRows = useCallback(async () => {
    setIsLoadingRows(true);
    setRowsError(null);
    const response = await siteContentAdminService.getList();
    if (!response.success) {
      setRows([]);
      setRowsError(t("dashboard.siteContent.errors.loadList", "Unable to load site content records. Please try again."));
      setIsLoadingRows(false);
      return;
    }
    setRows(response.data ?? []);
    setIsLoadingRows(false);
  }, [t]);

  const loadDetail = useCallback(
    async (id: string) => {
      setIsLoadingDetail(true);
      setDetailError(null);
      setSaveError(null);
      setSaveSuccess(null);
      setJsonValidationError(null);

      const response = await siteContentAdminService.getById(id);
      if (!response.success || !response.data) {
        setDetail(null);
        setEnglishContentValue("");
        setVietnameseContentValue("");
        setDetailError(t("dashboard.siteContent.errors.loadDetail", "Unable to load content detail. Please try again."));
        setIsLoadingDetail(false);
        return;
      }
      setDetail(response.data);
      setEnglishContentValue(response.data.englishContentValue);
      setVietnameseContentValue(response.data.vietnameseContentValue);
      setIsLoadingDetail(false);
    },
    [t],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (pageKeyFilter !== "all" && row.pageKey !== pageKeyFilter) return false;
      if (!normalizedSearch) return true;
      return `${row.pageKey} ${row.contentKey}`.toLowerCase().includes(normalizedSearch);
    });
  }, [pageKeyFilter, rows, searchQuery]);

  const pageKeyOptions = useMemo(() => {
    const keys = new Set(rows.map((row) => row.pageKey));
    return Array.from(keys).sort((left, right) => left.localeCompare(right));
  }, [rows]);

  const handleSelectRow = async (id: string) => {
    setSelectedId(id);
    await loadDetail(id);
  };

  const handleSave = async () => {
    if (!detail) return;
    setJsonValidationError(null);
    setSaveError(null);
    setSaveSuccess(null);

    const englishValidation = tryValidateJson(englishContentValue);
    const vietnameseValidation = tryValidateJson(vietnameseContentValue);

    if (englishValidation || vietnameseValidation) {
      setJsonValidationError(t("dashboard.siteContent.errors.invalidJson", "English and Vietnamese content must be valid JSON."));
      return;
    }

    setIsSaving(true);
    const response = await siteContentAdminService.updateById(detail.id, {
      englishContentValue,
      vietnameseContentValue,
    });

    if (!response.success) {
      setSaveError(t("dashboard.siteContent.errors.saveFailed", "Unable to save content changes. Please try again."));
      setIsSaving(false);
      return;
    }

    await Promise.all([loadRows(), loadDetail(detail.id)]);
    setSaveSuccess(t("dashboard.siteContent.messages.saveSuccess", "Site content updated successfully."));
    setIsSaving(false);
  };

  const handleCloseEditor = () => {
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    setJsonValidationError(null);
    setSaveError(null);
    setSaveSuccess(null);
  };

  return (
    <div className="px-4 pb-12 pt-4 lg:px-8">
      {/* Page header */}
      <div className="mb-8 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-linear-to-b from-amber-400 to-amber-600" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
                  {t("dashboard.siteContent.title", "Site Content")}
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                  {t("dashboard.siteContent.description", "Manage page content records and edit English/Vietnamese JSON values.")}
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { void loadRows(); }}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 active:scale-[0.98] sm:self-start"
          >
            <Icon icon="heroicons:arrow-path" className="size-4" />
            {t("dashboard.siteContent.actions.refresh", "Refresh")}
          </button>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.05 }}
        className="mb-6 overflow-hidden rounded-[2rem] border border-stone-200/50 bg-white shadow-[0_8px_24px_-8px_rgba(0,0,0,0.04)]"
      >
        <div className="flex flex-col gap-3 p-5 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Icon
              icon="heroicons:magnifying-glass"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("dashboard.siteContent.searchPlaceholder", "Search by page key or content key")}
              className="w-full rounded-xl border border-stone-200/80 bg-stone-50/60 py-2.5 pl-10 pr-4 text-sm text-stone-700 outline-none transition-all duration-200 placeholder:text-stone-400 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/15"
            />
          </div>

          {/* Filter */}
          <div className="w-full lg:w-56">
            <select
              value={pageKeyFilter}
              onChange={(event) => setPageKeyFilter(event.target.value)}
              className="w-full rounded-xl border border-stone-200/80 bg-white px-3 py-2.5 text-sm text-stone-700 outline-none transition-all duration-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
            >
              <option value="all">
                {t("dashboard.siteContent.filters.allPageKeys", "All page keys")}
              </option>
              {pageKeyOptions.map((pageKey) => (
                <option key={pageKey} value={pageKey}>
                  {pageKey}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Loading state */}
      {isLoadingRows && (
        <>
          <SkeletonTable rows={8} columns={5} className="hidden lg:block" />
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-stone-200/50 bg-white p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.04)]">
                <div className="skeleton mb-2 h-5 w-1/2 rounded" />
                <div className="skeleton mb-3 h-3 w-2/3 rounded" />
                <div className="flex gap-2">
                  <div className="skeleton h-6 w-10 rounded-full" />
                  <div className="skeleton h-6 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Error state */}
      {!isLoadingRows && rowsError && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-red-200/50 bg-red-50/80 p-6 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.04)]"
        >
          <div className="flex items-start gap-3">
            <Icon icon="heroicons:exclamation-circle" className="size-5 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">{rowsError}</p>
              <button
                type="button"
                onClick={() => { void loadRows(); }}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 active:scale-[0.98]"
              >
                <Icon icon="heroicons:arrow-path" className="size-3.5" />
                {t("dashboard.siteContent.actions.retry", "Retry")}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoadingRows && !rowsError && filteredRows.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2.5rem] border border-stone-200/50 bg-white p-12 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
        >
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100">
            <Icon icon="heroicons:document" className="size-6 text-stone-400" />
          </div>
          <p className="text-base font-semibold text-stone-800">
            {t("dashboard.siteContent.states.emptyTitle", "No site content records found")}
          </p>
          <p className="mt-2 text-sm text-stone-500">
            {t("dashboard.siteContent.states.emptyDescription", "Try another filter or search keyword.")}
          </p>
        </motion.div>
      )}

      {/* Table */}
      {!isLoadingRows && !rowsError && filteredRows.length > 0 && (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-[2rem] border border-stone-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] lg:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">
                    {t("dashboard.siteContent.table.pageKey", "Page key")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">
                    {t("dashboard.siteContent.table.contentKey", "Content key")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">
                    {t("dashboard.siteContent.table.locales", "Locales")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-widest text-stone-400">
                    {t("dashboard.siteContent.table.updated", "Last updated")}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-stone-400">
                    {t("dashboard.siteContent.table.actions", "Actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredRows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springTransition, delay: index * 0.03 }}
                    className="hover:bg-stone-50/60 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-stone-900 tracking-tight">
                      {row.pageKey}
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">{row.contentKey}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${
                            row.hasEnglish
                              ? "bg-blue-50 text-blue-600"
                              : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          EN
                        </span>
                        <span
                          className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${
                            row.hasVietnamese
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          VI
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-stone-600">{formatDate(row.lastModifiedOnUtc)}</p>
                      <p className="text-xs text-stone-400">
                        {row.lastModifiedBy || t("dashboard.siteContent.table.system", "system")}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => { void handleSelectRow(row.id); }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all duration-200 hover:border-amber-300 hover:bg-amber-100 active:scale-[0.98]"
                      >
                        <Icon icon="heroicons:pencil-square" className="size-3.5" />
                        {t("dashboard.siteContent.actions.edit", "Edit")}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {filteredRows.map((row, index) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: index * 0.04 }}
                className="overflow-hidden rounded-[1.5rem] border border-stone-200/50 bg-white p-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-stone-900 tracking-tight">{row.pageKey}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{row.contentKey}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { void handleSelectRow(row.id); }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-all duration-200 hover:border-amber-300 hover:bg-amber-100 active:scale-[0.98]"
                  >
                    <Icon icon="heroicons:pencil-square" className="size-3.5" />
                    {t("dashboard.siteContent.actions.edit", "Edit")}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${row.hasEnglish ? "bg-blue-50 text-blue-600" : "bg-stone-100 text-stone-400"}`}>
                    EN
                  </span>
                  <span className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold ${row.hasVietnamese ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-400"}`}>
                    VI
                  </span>
                </div>
                <p className="mt-3 text-xs text-stone-400">
                  {formatDate(row.lastModifiedOnUtc)} · {row.lastModifiedBy || t("dashboard.siteContent.table.system", "system")}
                </p>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Editor panel */}
      <AnimatePresence>
        {selectedId && (
          <motion.section
            key="editor"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={springTransition}
            className="mt-8 overflow-hidden rounded-[2.5rem] border border-stone-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
          >
            {/* Editor header */}
            <div className="flex flex-col gap-4 border-b border-stone-100 px-8 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-7 w-1 rounded-full bg-linear-to-b from-amber-400 to-amber-600" />
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-stone-900">
                      {t("dashboard.siteContent.editor.title", "Bilingual content editor")}
                    </h2>
                    {detail && (
                      <p className="mt-0.5 text-xs text-stone-400 font-medium">
                        {detail.pageKey}
                        <span className="mx-1.5 text-stone-300">/</span>
                        {detail.contentKey}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEditor}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-stone-200/80 bg-white px-4 py-2 text-sm font-medium text-stone-500 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 active:scale-[0.98]"
              >
                <Icon icon="heroicons:x-mark" className="size-4" />
                {t("dashboard.siteContent.actions.close", "Close")}
              </button>
            </div>

            {/* Editor body */}
            <div className="p-8">
              {isLoadingDetail && (
                <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-6 text-sm text-stone-500">
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
                    {t("dashboard.siteContent.states.loadingDetail", "Loading content detail...")}
                  </div>
                </div>
              )}

              {!isLoadingDetail && detailError && (
                <div className="rounded-2xl border border-red-200/50 bg-red-50/60 p-5 text-sm text-red-700">
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:exclamation-circle" className="size-4 shrink-0" />
                    {detailError}
                  </div>
                </div>
              )}

              {!isLoadingDetail && !detailError && detail && (
                <div className="space-y-6">
                  {/* JSON editors */}
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* English */}
                    <div className="space-y-2">
                      <label htmlFor="site-content-en" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                        <span className="inline-flex h-5 w-8 items-center justify-center rounded-md bg-blue-50 text-[10px] font-bold text-blue-600">EN</span>
                        {t("dashboard.siteContent.editor.englishLabel", "English JSON")}
                      </label>
                      <textarea
                        id="site-content-en"
                        value={englishContentValue}
                        onChange={(event) => setEnglishContentValue(event.target.value)}
                        className="h-72 w-full resize-none rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 font-mono text-xs leading-relaxed text-stone-700 outline-none transition-all duration-200 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/15"
                        spellCheck={false}
                      />
                    </div>

                    {/* Vietnamese */}
                    <div className="space-y-2">
                      <label htmlFor="site-content-vi" className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                        <span className="inline-flex h-5 w-8 items-center justify-center rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-600">VI</span>
                        {t("dashboard.siteContent.editor.vietnameseLabel", "Vietnamese JSON")}
                      </label>
                      <textarea
                        id="site-content-vi"
                        value={vietnameseContentValue}
                        onChange={(event) => setVietnameseContentValue(event.target.value)}
                        className="h-72 w-full resize-none rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 font-mono text-xs leading-relaxed text-stone-700 outline-none transition-all duration-200 focus:border-amber-400 focus:bg-white focus:ring-2 focus:ring-amber-400/15"
                        spellCheck={false}
                      />
                    </div>
                  </div>

                  {/* Error / success messages */}
                  {jsonValidationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-red-200/50 bg-red-50/60 p-4 text-sm text-red-700"
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon="heroicons:exclamation-circle" className="size-4 shrink-0" />
                        {jsonValidationError}
                      </div>
                    </motion.div>
                  )}

                  {saveError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-red-200/50 bg-red-50/60 p-4 text-sm text-red-700"
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon="heroicons:exclamation-circle" className="size-4 shrink-0" />
                        {saveError}
                      </div>
                    </motion.div>
                  )}

                  {saveSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-emerald-200/50 bg-emerald-50/60 p-4 text-sm text-emerald-700"
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon="heroicons:check-circle" className="size-4 shrink-0 text-emerald-500" />
                        {saveSuccess}
                      </div>
                    </motion.div>
                  )}

                  {/* Save button */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseEditor}
                      className="inline-flex items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-5 py-2.5 text-sm font-medium text-stone-500 transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-stone-800 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                    >
                      <Icon
                        icon={isSaving ? "heroicons:arrow-path" : "heroicons:check"}
                        className={`size-4 ${isSaving ? "animate-spin" : ""}`}
                      />
                      {isSaving
                        ? t("dashboard.siteContent.actions.saving", "Saving...")
                        : t("dashboard.siteContent.actions.save", "Save changes")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SiteContentManagementPage;

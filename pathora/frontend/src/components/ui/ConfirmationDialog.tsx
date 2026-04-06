"use client";

import { useTranslation } from "react-i18next";
import Modal from "@/components/ui/Modal";
import Icon from "@/components/ui/Icon";

interface ConfirmationDialogProps {
  active: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export default function ConfirmationDialog({
  active,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
}: ConfirmationDialogProps) {
  const { t } = useTranslation();

  const resolvedTitle = title ?? t("tourAdmin.confirmDelete.title", "Confirm Delete?");
  const resolvedMessage = message ?? t("tourAdmin.confirmDelete.message", "This action cannot be undone.");
  const resolvedConfirm = confirmLabel ?? t("tourAdmin.confirmDelete.confirm", "Delete");
  const resolvedCancel = cancelLabel ?? t("tourAdmin.confirmDelete.cancel", "Cancel");

  return (
    <Modal
      activeModal={active}
      onClose={onClose}
      title={resolvedTitle}
      className="max-w-md"
      centered
    >
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
          <Icon
            icon="heroicons:exclamation-triangle"
            className={`size-6 ${isDestructive ? "text-red-600 dark:text-red-400" : "text-slate-600 dark:text-slate-400"}`}
          />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {resolvedMessage}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {resolvedCancel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
            isDestructive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-orange-500 hover:bg-orange-600"
          }`}
        >
          <Icon icon="heroicons:trash" className="size-4" />
          {resolvedConfirm}
        </button>
      </div>
    </Modal>
  );
}

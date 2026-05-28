"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  useGetTourGuideTasksQuery,
  useCreateTourGuideTaskMutation,
  useUpdateTourGuideTaskMutation,
  useDeleteTourGuideTaskMutation,
} from "@/store/api/tourGuideApi";
import { TourGuideTaskStatus, TourGuideTask } from "@/types/tour-guide-tasks";
import { handleApiError } from "@/utils/apiResponse";

import type { TourInstanceManagerDto } from "@/types/tour";

interface TourGuideTasksManagementSectionProps {
  tourInstanceId: string;
  managers: TourInstanceManagerDto[];
  readOnly?: boolean;
}

const inputClassName =
  "w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all";

export default function TourGuideTasksManagementSection({
  tourInstanceId,
  managers,
  readOnly = false,
}: TourGuideTasksManagementSectionProps) {
  const { t } = useTranslation();

  // Queries & Mutations
  const { data: tasks = [], isLoading } = useGetTourGuideTasksQuery(tourInstanceId);
  const [createTask, { isLoading: isCreating }] = useCreateTourGuideTaskMutation();
  const [updateTask, { isLoading: isUpdating }] = useUpdateTourGuideTaskMutation();
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTourGuideTaskMutation();

  // Local UI State
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TourGuideTask | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsMandatory, setFormIsMandatory] = useState(false);
  const [formAssignedGuideId, setFormAssignedGuideId] = useState("");

  // Extract assigned guides from managers list
  const guides = managers.filter(
    (m) => m.role?.toLowerCase() === "guide" || m.role?.toLowerCase() === "tourguide"
  );

  const openAddModal = () => {
    setEditingTask(null);
    setFormTitle("");
    setFormDescription("");
    setFormIsMandatory(false);
    setFormAssignedGuideId("");
    setShowModal(true);
  };

  const openEditModal = (task: TourGuideTask) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description ?? "");
    setFormIsMandatory(task.isMandatory);
    setFormAssignedGuideId(task.assignedGuideId ?? "");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast.error(t("tourInstance.tasks.validation.titleRequired", "Vui lòng nhập tiêu đề nhiệm vụ"));
      return;
    }

    try {
      const guideId = formAssignedGuideId === "" ? null : formAssignedGuideId;

      if (editingTask) {
        await updateTask({
          id: editingTask.id,
          tourInstanceId,
          request: {
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            isMandatory: formIsMandatory,
            assignedGuideId: guideId,
          },
        }).unwrap();
        toast.success(t("tourInstance.tasks.updateSuccess", "Cập nhật nhiệm vụ thành công!"));
      } else {
        await createTask({
          tourInstanceId,
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          isMandatory: formIsMandatory,
          assignedGuideId: guideId,
        }).unwrap();
        toast.success(t("tourInstance.tasks.createSuccess", "Tạo nhiệm vụ mới thành công!"));
      }
      closeModal();
    } catch (err) {
      const apiError = handleApiError(err);
      toast.error(apiError.message || t("tourInstance.tasks.error", "Đã xảy ra lỗi, vui lòng thử lại"));
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm(t("tourInstance.tasks.confirmDelete", "Bạn có chắc chắn muốn xóa nhiệm vụ này không?"))) {
      return;
    }

    try {
      await deleteTask({ id: taskId, tourInstanceId }).unwrap();
      toast.success(t("tourInstance.tasks.deleteSuccess", "Đã xóa nhiệm vụ thành công!"));
    } catch (err) {
      const apiError = handleApiError(err);
      toast.error(apiError.message || t("tourInstance.tasks.deleteError", "Không thể xóa nhiệm vụ"));
    }
  };

  // Progress Calculations
  const totalTasksCount = tasks.length;
  const completedTasksCount = tasks.filter((t) => t.status === TourGuideTaskStatus.Completed).length;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const pendingMandatoryCount = tasks.filter(
    (t) => t.isMandatory && t.status === TourGuideTaskStatus.Pending
  ).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-stone-400">
          <svg className="size-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium">Đang tải danh sách nhiệm vụ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview & Progress Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-stone-900">
              {t("tourInstance.tasks.progressTitle", "Tiến độ hoàn thành nhiệm vụ")}
            </h3>
            <p className="text-sm text-stone-500">
              {t("tourInstance.tasks.progressSubtitle", {
                completed: completedTasksCount,
                total: totalTasksCount,
                defaultValue: `Đã hoàn thành ${completedTasksCount}/${totalTasksCount} nhiệm vụ vận hành`,
              })}
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 active:scale-[0.98] shadow-sm shrink-0"
            >
              <Icon icon="heroicons:plus" className="size-4" />
              {t("tourInstance.tasks.addButton", "Thêm nhiệm vụ")}
            </button>
          )}
        </div>

        {totalTasksCount > 0 ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-600">
              <span>{t("tourInstance.tasks.percentage", "Tỷ lệ hoàn thành")}</span>
              <span className="text-orange-600 font-mono text-sm">{completionPercentage}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {pendingMandatoryCount > 0 && (
              <div className="mt-4 items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3 h-stack">
                <Icon icon="heroicons:exclamation-triangle" className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-amber-800 leading-relaxed">
                  {t("tourInstance.tasks.mandatoryWarning", {
                    count: pendingMandatoryCount,
                    defaultValue: `Lưu ý: Còn ${pendingMandatoryCount} nhiệm vụ BẮT BUỘC chưa hoàn thành. Tour không thể chuyển sang trạng thái "Hoàn thành" (Completed) cho đến khi các nhiệm vụ này được tick off.`,
                  })}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 text-sm text-stone-500 italic bg-stone-50 p-4 rounded-xl border border-stone-200/50">
            {t("tourInstance.tasks.noProgress", "Chưa có tiến độ, vui lòng tạo nhiệm vụ mới bên dưới.")}
          </div>
        )}
      </div>

      {/* Task List */}
      {totalTasksCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-stone-200 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-[1.5rem] bg-stone-50 border border-stone-200 flex items-center justify-center mb-4">
            <Icon icon="heroicons:check-badge" className="size-8 text-stone-300" />
          </div>
          <h3 className="text-base font-bold text-stone-900 mb-1">
            {t("tourInstance.tasks.emptyTitle", "Chưa có nhiệm vụ")}
          </h3>
          <p className="text-sm text-stone-500 max-w-md mb-6 leading-relaxed">
            {t(
              "tourInstance.tasks.emptySubtitle",
              "Thiết lập các đầu việc bắt buộc hoặc tùy chọn để hướng dẫn viên thực thi trong suốt chuyến đi. Theo dõi thời gian và bằng chứng hoàn thành dễ dàng."
            )}
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-stone-800 active:scale-[0.98]"
            >
              <Icon icon="heroicons:plus" className="size-4" />
              {t("tourInstance.tasks.addButton", "Thêm nhiệm vụ")}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => {
            const isCompleted = task.status === TourGuideTaskStatus.Completed;
            const assignedGuide = guides.find((g) => g.userId === task.assignedGuideId);

            return (
              <div
                key={task.id}
                className={cn(
                  "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                  isCompleted ? "border-stone-100 bg-stone-50/30" : "border-stone-200"
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="spacer flex items-start gap-3">
                    {/* Status Checkbox Indicator (Read-only for operator) */}
                    <div
                      className={cn(
                        "size-5 rounded-full border-2 center shrink-0 mt-1.5",
                        isCompleted
                          ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                          : "border-stone-300 text-stone-300"
                      )}
                    >
                      {isCompleted && <Icon icon="heroicons:check" className="size-3.5 font-bold" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          className={cn(
                            "text-base font-bold tracking-tight text-stone-900",
                            isCompleted && "text-stone-500 line-through font-semibold"
                          )}
                        >
                          {task.title}
                        </h4>
                        
                        {task.isMandatory && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 shadow-sm">
                            <Icon icon="heroicons:exclamation-circle" className="size-3" />
                            {t("tourInstance.tasks.mandatoryBadge", "Bắt buộc")}
                          </span>
                        )}

                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                            isCompleted
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100 animate-pulse"
                          )}
                        >
                          {isCompleted
                            ? t("tourInstance.tasks.statusDone", "Đã xong")
                            : t("tourInstance.tasks.statusTodo", "Cần làm")}
                        </span>
                      </div>

                      {task.description && (
                        <p className={cn("text-sm text-stone-600 leading-relaxed", isCompleted && "text-stone-400")}>
                          {task.description}
                        </p>
                      )}

                      {/* Guide Assignment Information */}
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-stone-500">
                        <Icon icon="heroicons:user" className="size-3.5 text-stone-400" />
                        <span>{t("tourInstance.tasks.assignedTo", "Giao cho:")}</span>
                        {task.assignedGuideId ? (
                          <span className="inline-flex items-center gap-1 text-stone-800 font-bold bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
                            {assignedGuide?.userAvatar && (
                              <img
                                src={assignedGuide.userAvatar}
                                alt=""
                                className="size-3.5 rounded-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            )}
                            {task.assignedGuideName || assignedGuide?.userName || "Hướng dẫn viên"}
                          </span>
                        ) : (
                          <span className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100">
                            {t("tourInstance.tasks.allGuides", "Tất cả HDV")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {!readOnly && (
                    <div className="flex gap-2 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={() => openEditModal(task)}
                        disabled={isCompleted}
                        className="inline-flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-orange-500 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title={t("tourInstance.tasks.editTooltip", "Sửa nhiệm vụ")}
                      >
                        <Icon icon="heroicons:pencil-square" className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(task.id)}
                        className="inline-flex size-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title={t("tourInstance.tasks.deleteTooltip", "Xóa nhiệm vụ")}
                      >
                        <Icon icon="heroicons:trash" className="size-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Evidence Section (visible if completed) */}
                {isCompleted && (task.notes || (task.evidenceImageUrls && task.evidenceImageUrls.length > 0)) && (
                  <div className="mt-4 border-t border-stone-100 pt-4 space-y-3 bg-stone-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                    <div className="items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 h-stack">
                      <Icon icon="heroicons:clipboard-document-check" className="size-4" />
                      <span>{t("tourInstance.tasks.evidenceTitle", "Bằng chứng hoàn thành")}</span>
                    </div>

                    {task.completedByName && (
                      <p className="text-xs text-stone-500">
                        {t("tourInstance.tasks.completedByText", "Hoàn thành bởi:")}{" "}
                        <span className="font-bold text-stone-700">{task.completedByName}</span>
                        {task.completedAt && (
                          <>
                            {" "}{t("tourInstance.tasks.atText", "vào lúc")}{" "}
                            <span className="font-semibold text-stone-700">
                              {new Date(task.completedAt).toLocaleString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </span>
                          </>
                        )}
                      </p>
                    )}

                    {task.notes && (
                      <div className="rounded-xl border border-stone-200/60 bg-white p-3 shadow-sm">
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                          {t("tourInstance.tasks.evidenceNotes", "Ghi chú của Hướng dẫn viên:")}
                        </p>
                        <p className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                          {task.notes}
                        </p>
                      </div>
                    )}

                    {task.evidenceImageUrls && task.evidenceImageUrls.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                          {t("tourInstance.tasks.evidenceImages", "Hình ảnh đính kèm:")}
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {task.evidenceImageUrls.map((url, index) => (
                            <div
                              key={index}
                              onClick={() => setActiveLightboxImage(url)}
                              className="group relative aspect-[4/3] w-24 overflow-hidden rounded-xl border border-stone-200 bg-stone-100 shadow-sm cursor-zoom-in transition-all hover:scale-105"
                            >
                              <img
                                src={url}
                                alt="evidence"
                                className="h-full w-full object-cover transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icon icon="heroicons:magnifying-glass-plus" className="size-5 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Overlay */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setActiveLightboxImage(null)}
        >
          <button
            type="button"
            className="absolute top-6 right-6 text-white/75 hover:text-white transition-colors p-2"
            onClick={() => setActiveLightboxImage(null)}
            aria-label={t("common.close", "Đóng")}
          >
            <Icon icon="heroicons:x-mark" className="size-8" />
          </button>
          <div
            className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeLightboxImage}
              alt="Evidence Large"
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Add / Edit Task Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="items-center gap-2 h-stack">
                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                  <Icon icon="heroicons:clipboard-document-list" className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    {editingTask
                      ? t("tourInstance.tasks.modalEditTitle", "Cập nhật nhiệm vụ")
                      : t("tourInstance.tasks.modalAddTitle", "Thêm nhiệm vụ mới")}
                  </h3>
                  <p className="text-xs text-stone-500">
                    {editingTask
                      ? t("tourInstance.tasks.modalEditSubtitle", "Chỉnh sửa thông tin nhiệm vụ được giao")
                      : t("tourInstance.tasks.modalAddSubtitle", "Tạo đầu việc cho hướng dẫn viên thực hiện")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-stone-400 transition-colors hover:text-stone-900 p-1"
                aria-label={t("common.close", "Đóng")}
              >
                <Icon icon="heroicons:x-mark" className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t("tourInstance.tasks.formTitle", "Tiêu đề nhiệm vụ")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={t("tourInstance.tasks.formTitlePlaceholder", "Ví dụ: Điểm danh và chụp ảnh check-in đoàn tại Dinh Độc Lập")}
                  className={inputClassName}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t("tourInstance.tasks.formDescription", "Mô tả chi tiết")}
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t(
                    "tourInstance.tasks.formDescriptionPlaceholder",
                    "Ghi chi tiết các bước cần thực hiện, giấy tờ cần kiểm tra hoặc hình ảnh cụ thể cần chụp bằng chứng..."
                  )}
                  rows={4}
                  className={cn(inputClassName, "resize-none")}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  {t("tourInstance.tasks.formAssignedGuide", "Hướng dẫn viên phụ trách")}
                </label>
                <select
                  value={formAssignedGuideId}
                  onChange={(e) => setFormAssignedGuideId(e.target.value)}
                  className={inputClassName}
                >
                  <option value="">{t("tourInstance.tasks.formAllGuidesOption", "Tất cả Hướng dẫn viên (HDV)")}</option>
                  {guides.map((guide) => (
                    <option key={guide.userId} value={guide.userId}>
                      {guide.userName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="items-center justify-between rounded-xl border border-stone-200 p-4 h-stack bg-stone-50/50">
                <div className="space-y-0.5">
                  <span className="text-sm font-bold text-stone-800">
                    {t("tourInstance.tasks.formMandatory", "Nhiệm vụ Bắt buộc (Mandatory)")}
                  </span>
                  <p className="text-xs text-stone-500 max-w-[28ch]">
                    {t("tourInstance.tasks.formMandatoryDesc", "HDV bắt buộc phải hoàn thành nhiệm vụ này mới được phép kết thúc tour.")}
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="task-is-mandatory"
                  checked={formIsMandatory}
                  onChange={(e) => setFormIsMandatory(e.target.checked)}
                  className="size-5 rounded border-stone-300 text-orange-500 focus:ring-orange-500/20"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition-all hover:bg-stone-100"
                >
                  {t("common.cancel", "Huỷ")}
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm"
                >
                  {(isCreating || isUpdating) ? (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Icon icon="heroicons:check" className="size-4" />
                  )}
                  {editingTask ? t("common.save", "Cập nhật") : t("common.add", "Thêm mới")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

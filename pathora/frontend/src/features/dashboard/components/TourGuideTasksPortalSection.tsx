"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  useGetTourGuideTasksQuery,
  useUpdateTourGuideTaskStatusMutation,
} from "@/store/api/tourGuideApi";
import { TourGuideTaskStatus, TourGuideTask } from "@/types/tour-guide-tasks";
import { fileService } from "@/api/services/fileService";
import { handleApiError } from "@/utils/apiResponse";

interface TourGuideTasksPortalSectionProps {
  tourInstanceId: string;
}

export default function TourGuideTasksPortalSection({
  tourInstanceId,
}: TourGuideTasksPortalSectionProps) {
  const { t } = useTranslation();

  // Queries & Mutations
  const { data: tasks = [], isLoading, refetch } = useGetTourGuideTasksQuery(tourInstanceId);
  const [updateTaskStatus, { isLoading: isUpdatingStatus }] = useUpdateTourGuideTaskStatusMutation();

  // Local UI State
  const [filterTab, setFilterTab] = useState<"all" | "todo" | "done">("all");
  const [activeTaskToComplete, setActiveTaskToComplete] = useState<TourGuideTask | null>(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  // Form completion state
  const [completeNotes, setCompleteNotes] = useState("");
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const openCompleteModal = (task: TourGuideTask) => {
    setActiveTaskToComplete(task);
    setCompleteNotes("");
    setUploadedImageUrls([]);
  };

  const closeCompleteModal = () => {
    setActiveTaskToComplete(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingFiles(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await fileService.uploadFile(file);
        if (res?.url) {
          urls.push(res.url);
        }
      }
      setUploadedImageUrls((prev) => [...prev, ...urls]);
      toast.success(t("tourGuide.tasks.uploadSuccess", "Tải ảnh lên thành công!"));
    } catch (err) {
      toast.error(t("tourGuide.tasks.uploadError", "Lỗi khi tải ảnh lên."));
    } finally {
      setIsUploadingFiles(false);
      // Reset input element
      e.target.value = "";
    }
  };

  const removeUploadedImage = (index: number) => {
    setUploadedImageUrls((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmComplete = async () => {
    if (!activeTaskToComplete) return;

    try {
      await updateTaskStatus({
        id: activeTaskToComplete.id,
        tourInstanceId,
        request: {
          status: TourGuideTaskStatus.Completed,
          notes: completeNotes.trim() || null,
          evidenceImageUrls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
        },
      }).unwrap();

      toast.success(t("tourGuide.tasks.completeSuccess", "Nhiệm vụ đã được đánh dấu hoàn thành!"));
      closeCompleteModal();
    } catch (err) {
      const apiError = handleApiError(err);
      toast.error(apiError.message || t("tourGuide.tasks.completeError", "Không thể cập nhật trạng thái nhiệm vụ."));
    }
  };

  // Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === TourGuideTaskStatus.Completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingMandatoryTasks = tasks.filter(
    (t) => t.isMandatory && t.status === TourGuideTaskStatus.Pending
  );

  // Filters
  const filteredTasks = tasks.filter((t) => {
    if (filterTab === "todo") return t.status === TourGuideTaskStatus.Pending;
    if (filterTab === "done") return t.status === TourGuideTaskStatus.Completed;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[250px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <svg className="size-8 animate-spin text-indigo-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium">Đang tải nhiệm vụ vận hành...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress & Stat Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 mb-1">
            {t("tourGuide.tasks.statusCardTitle", "Nhiệm vụ vận hành chuyến đi")}
          </h3>
          <p className="text-sm text-slate-500">
            {totalTasks > 0
              ? t("tourGuide.tasks.statusCardSubtitle", {
                  completed: completedTasks,
                  total: totalTasks,
                  defaultValue: `Đã hoàn thành ${completedTasks}/${totalTasks} nhiệm vụ được gán`,
                })
              : t("tourGuide.tasks.statusCardEmpty", "Hiện chưa có nhiệm vụ nào được chỉ định.")}
          </p>
        </div>

        {totalTasks > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>{t("tourGuide.tasks.percentageText", "Tiến độ")}</span>
              <span className="text-indigo-600 text-sm font-black">{completionPercentage}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}

        {pendingMandatoryTasks.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/50 p-3">
            <Icon icon="heroicons:exclamation-circle" className="size-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-800 leading-relaxed">
              {t("tourGuide.tasks.mandatoryWarningPortal", {
                count: pendingMandatoryTasks.length,
                defaultValue: `Cảnh báo: Bạn còn ${pendingMandatoryTasks.length} nhiệm vụ BẮT BUỘC chưa hoàn thành. Vui lòng tick off các nhiệm vụ này trước khi kết thúc chuyến đi.`,
              })}
            </p>
          </div>
        )}
      </div>

      {totalTasks > 0 && (
        <>
          {/* Tab Filter Links */}
          <div className="flex border-b border-slate-200 gap-1 bg-white p-1 rounded-xl shadow-sm border">
            <button
              onClick={() => setFilterTab("all")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
                filterTab === "all" ? "bg-indigo-50 text-indigo-700 font-extrabold" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t("tourGuide.tasks.filterAll", "Tất cả")} ({totalTasks})
            </button>
            <button
              onClick={() => setFilterTab("todo")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
                filterTab === "todo" ? "bg-indigo-50 text-indigo-700 font-extrabold" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t("tourGuide.tasks.filterTodo", "Cần làm")} ({totalTasks - completedTasks})
            </button>
            <button
              onClick={() => setFilterTab("done")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all text-center",
                filterTab === "done" ? "bg-indigo-50 text-indigo-700 font-extrabold" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t("tourGuide.tasks.filterDone", "Đã xong")} ({completedTasks})
            </button>
          </div>

          {/* Checklist */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl text-sm text-slate-400 italic">
              {t("tourGuide.tasks.filterEmpty", "Không có nhiệm vụ nào khớp với bộ lọc.")}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isCompleted = task.status === TourGuideTaskStatus.Completed;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "bg-white rounded-2xl border border-slate-200 p-4 transition-all shadow-sm",
                      isCompleted ? "border-slate-100 bg-slate-50/50" : "border-slate-200"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Check Button Wrapper */}
                      <button
                        type="button"
                        disabled={isCompleted}
                        onClick={() => openCompleteModal(task)}
                        className={cn(
                          "size-6 rounded-full border-2 center shrink-0 mt-0.5 transition-all",
                          isCompleted
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600 cursor-default"
                            : "border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 text-slate-300 hover:text-indigo-600 cursor-pointer active:scale-[0.93]"
                        )}
                        aria-label={t("tourGuide.tasks.checkLabel", "Hoàn thành nhiệm vụ")}
                      >
                        {isCompleted && <Icon icon="heroicons:check" className="size-4 font-bold" />}
                      </button>

                      <div className="spacer min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4
                            className={cn(
                              "font-bold text-sm sm:text-base text-slate-900 cursor-pointer",
                              isCompleted ? "text-slate-500 line-through font-semibold" : "hover:text-indigo-600"
                            )}
                            onClick={() => !isCompleted && openCompleteModal(task)}
                          >
                            {task.title}
                          </h4>

                          {task.isMandatory && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border border-red-200 bg-red-50 text-[10px] font-black uppercase tracking-wider text-red-600 shadow-sm">
                              {t("tourGuide.tasks.mandatoryBadge", "Bắt buộc")}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className={cn("text-xs sm:text-sm text-slate-500 leading-relaxed", isCompleted && "text-slate-400")}>
                            {task.description}
                          </p>
                        )}

                        {/* Completed Detail Display */}
                        {isCompleted && (task.notes || (task.evidenceImageUrls && task.evidenceImageUrls.length > 0)) && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                            {task.notes && (
                              <p className="text-xs text-slate-600 leading-relaxed">
                                <span className="font-bold text-slate-700">{t("tourGuide.tasks.notesLabel", "Ghi chú HDV:")}</span>{" "}
                                {task.notes}
                              </p>
                            )}

                            {task.evidenceImageUrls && task.evidenceImageUrls.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {task.evidenceImageUrls.map((url, index) => (
                                  <div
                                    key={index}
                                    onClick={() => setActiveLightboxImage(url)}
                                    className="group relative aspect-[4/3] w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm cursor-zoom-in transition-all hover:scale-105"
                                  >
                                    <img
                                      src={url}
                                      alt="evidence"
                                      className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Icon icon="heroicons:magnifying-glass-plus" className="size-4 text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
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

      {/* Complete Task Modal */}
      {activeTaskToComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={closeCompleteModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-indigo-50/20">
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-base">
                  {t("tourGuide.tasks.completeModalTitle", "Xác nhận hoàn thành")}
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-tight pr-2">
                  {activeTaskToComplete.title}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCompleteModal}
                className="text-slate-400 hover:text-slate-900 transition-colors p-1"
                aria-label={t("common.close", "Đóng")}
              >
                <Icon icon="heroicons:x-mark" className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {t("tourGuide.tasks.notesLabel", "Ghi chú thực địa")}
                </label>
                <textarea
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder={t(
                    "tourGuide.tasks.notesPlaceholder",
                    "Nhập ghi chú vận hành chi tiết, các vấn đề lưu ý tại thực địa (nếu có)..."
                  )}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
                />
              </div>

              {/* Upload Image Section */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  {t("tourGuide.tasks.imagesLabel", "Ảnh bằng chứng hoàn thành")}
                </label>

                {uploadedImageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {uploadedImageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-[4/3] w-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm"
                      >
                        <img
                          src={url}
                          alt="uploaded"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeUploadedImage(idx)}
                          className="absolute top-1 right-1 size-5 rounded-full bg-red-600 text-white center hover:bg-red-700 shadow shadow-red-950/20 active:scale-[0.9]"
                          aria-label="Remove image"
                        >
                          <Icon icon="heroicons:x-mark" className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer select-none">
                    {isUploadingFiles ? (
                      <>
                        <div className="size-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                        <span>Đang tải ảnh...</span>
                      </>
                    ) : (
                      <>
                        <Icon icon="heroicons:camera" className="size-4 text-slate-400" />
                        <span>Chọn ảnh từ điện thoại</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploadingFiles}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
              <button
                type="button"
                onClick={closeCompleteModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
              >
                {t("common.cancel", "Huỷ")}
              </button>
              <button
                type="button"
                onClick={handleConfirmComplete}
                disabled={isUpdatingStatus || isUploadingFiles}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white transition-all hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm shadow-indigo-600/20"
              >
                {isUpdatingStatus ? (
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Icon icon="heroicons:check" className="size-4 font-bold" />
                )}
                {t("common.done", "Xác nhận")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

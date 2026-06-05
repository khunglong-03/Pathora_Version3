"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { 
  Check, 
  X, 
  Clock, 
  Warning, 
  Spinner, 
  User, 
  Calendar, 
  Globe, 
  MagnifyingGlassPlus,
  GenderMale,
  GenderFemale,
  ArrowRight
} from "@phosphor-icons/react";
import { Modal } from "@/components/ui";
import { bookingService } from "@/api/services/bookingService";
import type { ParticipantDto } from "@/types/booking";
import { ReservationStatusEnum, GenderTypeEnum } from "@/types/booking";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface ParticipantReviewModalProps {
  bookingId: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewed?: (updatedParticipants: ParticipantDto[]) => void;
}

export default function ParticipantReviewModal({
  bookingId,
  isOpen,
  onClose,
  onReviewed
}: ParticipantReviewModalProps) {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.auth.user);
  const isTourOperator = user?.roles?.some((r) => r.name === "TourOperator");

  const [participants, setParticipants] = useState<ParticipantDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submittingRow, setSubmittingRow] = useState<string | null>(null);
  
  // Rejection form states
  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  // Re-review state for approved participants
  const [reReviewIds, setReReviewIds] = useState<string[]>([]);
  
  // Image enlargement state
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  
  // Bulk approve states
  const [bulkApproving, setBulkApproving] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);

  // A11y trigger element ref to restore focus on close
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const fetchParticipants = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await bookingService.getOperatorParticipants(bookingId);
      setParticipants(data || []);
      setReReviewIds([]);
    } catch (err) {
      setError(true);
      toast.error(t("participantReview.state.error", "Không thể tải danh sách hành khách. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = document.activeElement as HTMLElement;
      fetchParticipants();
    } else {
      // Restore focus when closing
      if (triggerElementRef.current) {
        setTimeout(() => {
          triggerElementRef.current?.focus();
        }, 50);
      }
      // Reset states
      setActiveRejectId(null);
      setRejectReason("");
      setBulkConfirm(false);
      setBulkProgress(0);
      setBulkApproving(false);
      setReReviewIds([]);
    }
  }, [isOpen, bookingId]);

  // Handle ESC key press for closing modal & enlargement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (enlargedImage) {
          setEnlargedImage(null);
        } else if (activeRejectId) {
          setActiveRejectId(null);
          setRejectReason("");
        } else if (isOpen && !loading && !bulkApproving) {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, enlargedImage, activeRejectId, loading, bulkApproving]);

  // Handle A11y focus trap inside the modal
  useEffect(() => {
    if (!isOpen || loading || !modalContentRef.current) return;
    const focusableElements = modalContentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen, loading, participants, activeRejectId, bulkConfirm]);

  const handleApprove = async (participantId: string) => {
    setSubmittingRow(participantId);
    try {
      await bookingService.reviewParticipantInfo(bookingId, participantId, {
        isApproved: true,
        rejectionReason: null
      });
      toast.success(t("participantReview.toast.success.approved", "Đã duyệt thông tin hành khách."));
      setReReviewIds(prev => prev.filter(id => id !== participantId));
      const latest = await bookingService.getOperatorParticipants(bookingId);
      setParticipants(latest || []);
      onReviewed?.(latest || []);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error(t("participantReview.toast.error.conflict", "Đã có người duyệt trước — đang tải lại."));
        fetchParticipants();
      } else {
        toast.error(t("participantReview.toast.error.general", "Duyệt thất bại. Vui lòng thử lại."));
      }
    } finally {
      setSubmittingRow(null);
    }
  };

  const handleRejectSubmit = async (participantId: string) => {
    if (!rejectReason.trim()) {
      toast.error(t("participantReview.modal.reasonRequired", "Vui lòng nhập lý do từ chối."));
      return;
    }
    setSubmittingRow(participantId);
    try {
      await bookingService.reviewParticipantInfo(bookingId, participantId, {
        isApproved: false,
        rejectionReason: rejectReason.trim()
      });
      toast.success(t("participantReview.toast.success.rejected", "Đã từ chối duyệt thông tin hành khách."));
      setActiveRejectId(null);
      setRejectReason("");
      setReReviewIds(prev => prev.filter(id => id !== participantId));
      const latest = await bookingService.getOperatorParticipants(bookingId);
      setParticipants(latest || []);
      onReviewed?.(latest || []);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.error(t("participantReview.toast.error.conflict", "Đã có người duyệt trước — đang tải lại."));
        fetchParticipants();
      } else {
        toast.error(t("participantReview.toast.error.general", "Từ chối duyệt thất bại. Vui lòng thử lại."));
      }
    } finally {
      setSubmittingRow(null);
    }
  };

  const handleBulkApprove = async () => {
    const pendingIds = participants
      .filter(p => p.status !== "Cancelled" && p.infoReviewStatus !== "Approved")
      .map(p => p.participantId);

    if (pendingIds.length === 0) return;

    setBulkConfirm(false);
    setBulkApproving(true);
    setBulkProgress(10);
    
    try {
      const interval = setInterval(() => {
        setBulkProgress(prev => (prev < 90 ? prev + 15 : prev));
      }, 200);

      await bookingService.bulkApproveParticipantInfo(bookingId, pendingIds);
      
      clearInterval(interval);
      setBulkProgress(100);
      toast.success(t("participantReview.bulk.summary", "Đã duyệt {{count}} hành khách.", { count: pendingIds.length }));
      
      const latest = await bookingService.getOperatorParticipants(bookingId);
      setParticipants(latest || []);
      onReviewed?.(latest || []);
    } catch (err: any) {
      toast.error(t("participantReview.toast.error.general", "Duyệt hàng loạt thất bại."));
      fetchParticipants();
    } finally {
      setTimeout(() => {
        setBulkApproving(false);
        setBulkProgress(0);
      }, 500);
    }
  };

  // Sort participants: Rejected -> NotReviewed -> Approved -> Cancelled
  const sortedParticipants = [...participants].sort((a, b) => {
    const getWeight = (p: ParticipantDto) => {
      if (p.status === "Cancelled") return 4;
      if (p.infoReviewStatus === "Rejected") return 1;
      if (p.infoReviewStatus === "NotReviewed") return 2;
      if (p.infoReviewStatus === "Approved") return 3;
      return 5;
    };
    return getWeight(a) - getWeight(b);
  });

  const countNotReviewed = participants.filter(p => p.status !== "Cancelled" && p.infoReviewStatus === "NotReviewed").length;
  const countApproved = participants.filter(p => p.status !== "Cancelled" && p.infoReviewStatus === "Approved").length;
  const countRejected = participants.filter(p => p.status !== "Cancelled" && p.infoReviewStatus === "Rejected").length;

  const footer = (
    <div className="flex w-full items-center justify-between">
      <div>
        {bulkApproving && (
          <div className="w-48 bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${bulkProgress}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={bulkApproving}
          className="px-4 py-2 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {t("common.close", "Đóng")}
        </button>
        {countNotReviewed > 0 && !bulkApproving && (
          <>
            {!bulkConfirm ? (
              <button
                type="button"
                onClick={() => setBulkConfirm(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="size-4" />
                {t("participantReview.bulk.button", "Duyệt tất cả chưa duyệt ({{count}})", { count: countNotReviewed })}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-600 font-semibold">{t("participantReview.bulk.confirm", "Xác nhận duyệt tất cả?")}</span>
                <button
                  type="button"
                  onClick={handleBulkApprove}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700"
                >
                  {t("common.yes", "Có")}
                </button>
                <button
                  type="button"
                  onClick={() => setBulkConfirm(false)}
                  className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-300"
                >
                  {t("common.no", "Không")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={bulkApproving ? () => {} : onClose}
        title={t("participantReview.modal.title", "Duyệt Thông Tin Hành Khách")}
        centered
        size="lg"
        scrollContent
        disableBackdrop={bulkApproving}
        footerContent={footer}
      >
        <div ref={modalContentRef} className="space-y-6">
          {/* Sticky Counts Header */}
          <div className="sticky top-0 z-10 -mx-6 -mt-8 bg-slate-50 border-b border-slate-100 px-6 py-3 flex items-center justify-between text-xs font-bold text-slate-500">
            <div className="flex gap-4">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-slate-400" />
                {t("participantReview.counts.notReviewed", "Chờ duyệt")}: {countNotReviewed}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500" />
                {t("participantReview.counts.approved", "Đã duyệt")}: {countApproved}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500" />
                {t("participantReview.counts.rejected", "Yêu cầu sửa")}: {countRejected}
              </span>
            </div>
          </div>

          {/* Modal States */}
          {loading ? (
            <div className="space-y-4 pt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse border border-slate-100 rounded-2xl p-5 space-y-3 bg-slate-50/50">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-20 bg-slate-200 rounded-xl" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-4">
              <Warning className="size-12 text-slate-300" />
              <div>
                <p className="font-extrabold text-slate-800 text-sm">{t("participantReview.state.error", "Không thể tải danh sách hành khách")}</p>
                <p className="text-slate-400 text-xs mt-1">{t("participantReview.state.errorDesc", "Đã xảy ra lỗi kết nối hệ thống.")}</p>
              </div>
              <button
                type="button"
                onClick={fetchParticipants}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                {t("participantReview.state.errorRetry", "Thử lại")}
              </button>
            </div>
          ) : sortedParticipants.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <User className="size-12 text-slate-300" />
              <div>
                <p className="font-extrabold text-slate-800 text-sm">{t("participantReview.state.empty", "Chưa có hành khách nào")}</p>
                <p className="text-slate-400 text-xs mt-1">{t("participantReview.state.emptyDesc", "Đặt chỗ này hiện tại chưa có thông tin hành khách.")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {sortedParticipants.map(participant => {
                const isCancelled = participant.status === "Cancelled";
                const isApproved = participant.infoReviewStatus === "Approved";
                const isRejected = participant.infoReviewStatus === "Rejected";
                const isNotReviewed = participant.infoReviewStatus === "NotReviewed";
                const hasPassport = !!participant.passport;
                const isRowSubmitting = submittingRow === participant.participantId;

                return (
                  <div
                    key={participant.participantId}
                    className={`border rounded-2xl p-5 transition-all duration-300 relative flex flex-col gap-4 ${
                      isCancelled
                        ? "bg-slate-50/50 border-slate-100 opacity-60"
                        : isApproved
                        ? "bg-emerald-50/20 border-emerald-100"
                        : isRejected
                        ? "bg-red-50/20 border-red-100"
                        : "bg-white border-slate-100 shadow-sm"
                    }`}
                  >
                    {/* Top Header Badge */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800">
                          {participant.fullName || t("passenger.anonymous", "Hành khách chưa đặt tên")}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold text-[10px] uppercase">
                          {participant.participantType}
                        </span>
                      </div>
                      
                      {/* Review status badge */}
                      <div>
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full border border-slate-200">
                            {t("participantReview.status.cancelled", "Đã hủy")}
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
                            <Check weight="bold" className="size-3 text-emerald-600" />
                            {t("participantReview.status.approved", "Đã duyệt")}
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-100">
                            <Warning weight="fill" className="size-3 text-red-600" />
                            {t("participantReview.status.rejected", "Yêu cầu sửa")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full border border-slate-200">
                            <Clock weight="fill" className="size-3 text-slate-400" />
                            {t("participantReview.status.notReviewed", "Chờ duyệt")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Passport Thumbnail & Fields */}
                    <div className="flex gap-4 items-start">
                      {/* Thumbnail (Task 8.8: passport image first) */}
                      {hasPassport && participant.passport?.fileUrl ? (
                        <div className="relative group shrink-0 size-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 cursor-pointer">
                          <img
                            src={participant.passport.fileUrl}
                            alt="Passport scan"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <button
                            type="button"
                            onClick={() => setEnlargedImage(participant.passport!.fileUrl)}
                            className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-300"
                            aria-label="Enlarge image"
                          >
                            <MagnifyingGlassPlus className="size-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="shrink-0 size-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                          <User className="size-6" />
                          <span className="text-[8px] font-bold text-center mt-1 uppercase tracking-wider">{t("passenger.noScan", "Không ảnh")}</span>
                        </div>
                      )}

                      {/* Detail Fields (Task 8.8: Name/DOB -> PassportNum -> Nationality -> Gender -> Visa) */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 col-span-2">
                          <Calendar className="size-3.5 text-slate-400 shrink-0" />
                          <span>
                            {t("passenger.dob", "Ngày sinh")}:{" "}
                            <strong className="text-slate-700 font-semibold">
                              {participant.dateOfBirth ? new Date(participant.dateOfBirth).toLocaleDateString("vi-VN") : "—"}
                            </strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Globe className="size-3.5 text-slate-400 shrink-0" />
                          <span>
                            {t("passenger.nationality", "Quốc tịch")}:{" "}
                            <strong className="text-slate-700 font-semibold">{participant.nationality || "—"}</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {participant.gender === GenderTypeEnum.Male ? (
                            <GenderMale className="size-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <GenderFemale className="size-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>
                            {t("passenger.gender", "Giới tính")}:{" "}
                            <strong className="text-slate-700 font-semibold">
                              {participant.gender !== null && participant.gender !== undefined
                                ? participant.gender === GenderTypeEnum.Male
                                  ? t("passenger.gender.male", "Nam")
                                  : participant.gender === GenderTypeEnum.Female
                                  ? t("passenger.gender.female", "Nữ")
                                  : t("passenger.gender.other", "Khác")
                                : "—"}
                            </strong>
                          </span>
                        </div>

                        {hasPassport && (
                          <div className="flex items-center gap-1.5 col-span-2 mt-1">
                            <span className="size-1.5 rounded-full bg-slate-300" />
                            <span>
                              {t("passenger.passportNum", "Hộ chiếu")}:{" "}
                              <strong className="text-slate-700 font-mono font-bold tracking-wider">{participant.passport!.passportNumber || "—"}</strong>
                            </span>
                          </div>
                        )}

                        {/* Visa status badge if present */}
                        {participant.visaApplications && participant.visaApplications.length > 0 && (
                          <div className="col-span-2 mt-1 flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-blue-400" />
                            <span>
                              {t("passenger.visa", "Visa")}:{" "}
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[9px] uppercase border border-blue-100">
                                {participant.visaApplications[0].status || "Pending"}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rejection reason warning (Task 8.3: danger banner) */}
                    {isRejected && participant.infoRejectionReason && (
                      <div role="alert" className="bg-red-50/50 border border-red-100 rounded-xl px-4 py-2.5 text-xs text-red-800 flex items-start gap-2">
                        <Warning weight="fill" className="size-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-extrabold">{t("participantReview.rejectedBannerReason", "Lý do từ chối: ")}</strong>
                          <span className="font-medium">{participant.infoRejectionReason}</span>
                        </div>
                      </div>
                    )}

                    {/* Reviewed Operator & Timestamp Info (Task 8.4) */}
                    {(isApproved || isRejected) && (
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-2 pt-1 border-t border-slate-100/50">
                        <span>
                          {t("passenger.reviewedBy", "Người duyệt")}: {participant.infoReviewedByName || t("participantReview.reviewer.unknown", "Tour Operator cũ")}
                        </span>
                        <span className="size-1 rounded-full bg-slate-300" />
                        <span>
                          {participant.infoReviewedAt
                            ? new Date(participant.infoReviewedAt).toLocaleString("vi-VN", {
                                timeZone: "Asia/Ho_Chi_Minh",
                                hour12: false
                              }) + " (Asia/Ho_Chi_Minh)"
                            : "—"}
                        </span>
                      </div>
                    )}

                    {/* Action Row */}
                    {!isCancelled && isTourOperator && (
                      <div className="flex justify-end gap-2 mt-1">
                        {isRowSubmitting ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold px-3 py-2">
                            <Spinner className="size-3.5 animate-spin" />
                            {t("common.saving", "Đang lưu...")}
                          </div>
                        ) : isApproved && !reReviewIds.includes(participant.participantId) ? (
                          // Task 8.9: Single "Duyệt lại" link for Approved participants
                          <button
                            type="button"
                            onClick={() => {
                              setReReviewIds(prev => [...prev, participant.participantId]);
                            }}
                            className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors py-1.5 px-3 underline underline-offset-4 cursor-pointer"
                          >
                            {t("participantReview.modal.reviewAgain", "Duyệt lại")}
                          </button>
                        ) : (
                          <>
                            {activeRejectId !== participant.participantId ? (
                              <div className="flex gap-2 items-center">
                                {isApproved && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReReviewIds(prev => prev.filter(id => id !== participant.participantId));
                                    }}
                                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                                  >
                                    {t("common.cancel", "Hủy")}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleApprove(participant.participantId)}
                                  className="px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100/50 cursor-pointer min-h-[44px]"
                                >
                                  {t("participantReview.modal.approve", "Duyệt")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveRejectId(participant.participantId);
                                    setRejectReason("");
                                  }}
                                  className="px-4 py-2 text-xs font-bold bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all border border-red-100/50 cursor-pointer min-h-[44px]"
                                >
                                  {t("participantReview.modal.reject", "Từ chối")}
                                </button>
                              </div>
                            ) : (
                              // Task 8.2: Expanded Inline rejection form
                              <div className="w-full flex flex-col gap-2 pt-2 border-t border-slate-100">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  {t("participantReview.modal.rejectionReasonLabel", "Lý do từ chối")}
                                </label>
                                <textarea
                                  value={rejectReason}
                                  onChange={e => setRejectReason(e.target.value.slice(0, 2000))}
                                  placeholder={t("participantReview.modal.reasonPlaceholder", "Ví dụ: Ảnh hộ chiếu bị mờ, vui lòng tải lại...")}
                                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-red-400 transition-all font-semibold text-slate-800 font-sans min-h-[80px]"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-slate-400 font-bold">
                                    {rejectReason.length}/2000
                                  </span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveRejectId(null);
                                        setRejectReason("");
                                        if (isApproved) {
                                          setReReviewIds(prev => prev.filter(id => id !== participant.participantId));
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
                                    >
                                      {t("common.cancel", "Hủy")}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectSubmit(participant.participantId)}
                                      className="px-3.5 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                      {t("participantReview.modal.submitReject", "Gửi từ chối")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Enlarged Image Overlay Dialog */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setEnlargedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Passport Enlarged View"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent">
            <button
              type="button"
              className="absolute -top-12 right-0 size-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10"
              onClick={(e) => {
                e.stopPropagation();
                setEnlargedImage(null);
              }}
              aria-label="Close image viewer"
            >
              <X className="size-5" />
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged Passport scan"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/5"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}

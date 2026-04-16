"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Icon, TourRequestStatusBadge } from "@/components/ui";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { tourRequestService } from "@/api/services/tourRequestService";
import {
  normalizeTourRequestStatus,
  type TourRequestDetailDto,
} from "@/types/tourRequest";
import { handleApiError } from "@/utils/apiResponse";

type ReviewAction = "approve" | "reject";

const formatDate = (value: string | null | undefined): string => {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return parsedDate.toLocaleString();
};

const formatBudget = (value: number): string => {
  if (!value || value <= 0) {
    return "-";
  }

  return `${new Intl.NumberFormat("en-US").format(value)} USD`;
};

/* (TourRequestStatusBadge imported from @/components/ui) */

/* ══════════════════════════════════════════════════════════════
   Animation Variants
   ══════════════════════════════════════════════════════════════ */
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

/* ══════════════════════════════════════════════════════════════
   Detail Field Row
   ══════════════════════════════════════════════════════════════ */
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-3 border-b border-stone-100 last:border-0">
      <dt className="text-xs font-semibold text-stone-400 uppercase tracking-wide">
        {label}
      </dt>
      <dd className="text-sm text-stone-800">{value}</dd>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Travel Interest Tags
   ══════════════════════════════════════════════════════════════ */
function TravelInterestTags({
  interests,
  detailId,
}: {
  interests: string[];
  detailId: string;
}) {
  const { t } = useTranslation();

  if (!interests || interests.length === 0) {
    return <span className="text-stone-500">-</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {interests.map((interest) => (
        <span
          key={`${detailId}-${interest}`}
          className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
        >
          {t(
            `tourRequest.travelInterests.${interest.charAt(0).toLowerCase()}${interest.slice(1)}`,
            { defaultValue: interest },
          )}
        </span>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Review Modal
   ══════════════════════════════════════════════════════════════ */
interface ReviewModalProps {
  action: ReviewAction;
  adminNote: string;
  setAdminNote: (v: string) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ReviewModal({
  action,
  adminNote,
  setAdminNote,
  isSubmitting,
  onCancel,
  onConfirm,
}: ReviewModalProps) {
  const { t } = useTranslation();
  const isApprove = action === "approve";

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-full max-w-lg rounded-[2.5rem] bg-white shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b border-stone-200 ${isApprove ? "bg-emerald-50" : "bg-rose-50"}`}>
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isApprove ? "bg-emerald-100" : "bg-rose-100"
              }`}
            >
              <Icon
                icon={isApprove ? "heroicons:check-circle" : "heroicons:x-circle"}
                className={`size-5 ${isApprove ? "text-emerald-600" : "text-rose-600"}`}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-stone-900">
                {isApprove
                  ? t("tourRequest.admin.review.approveTitle")
                  : t("tourRequest.admin.review.rejectTitle")}
              </h3>
              <p className="text-sm text-stone-500 mt-0.5">
                {isApprove
                  ? t("tourRequest.admin.review.approveDescription")
                  : t("tourRequest.admin.review.rejectDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label
            htmlFor="review-admin-note"
            className="block text-sm font-semibold text-stone-700 mb-2"
          >
            {t("tourRequest.admin.review.adminNote")}
            {!isApprove && (
              <span className="text-rose-500 ml-1">*</span>
            )}
          </label>
          <textarea
            id="review-admin-note"
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            maxLength={2000}
            rows={4}
            className="w-full rounded-xl border border-stone-200 px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
            placeholder={
              isApprove
                ? t("tourRequest.admin.review.notePlaceholderApprove", "Optional note...")
                : t("tourRequest.admin.review.notePlaceholderReject", "Rejection reason is required...")
            }
          />

          {!isApprove && !adminNote.trim() && (
            <p className="mt-2 text-sm text-rose-600 flex items-center gap-1.5">
              <Icon icon="heroicons:exclamation-circle" className="size-4" />
              {t("tourRequest.admin.review.rejectionReasonRequired")}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-stone-200 px-6 py-4 bg-stone-50">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition-colors disabled:opacity-60"
          >
            {t("tourRequest.buttons.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isSubmitting || (!isApprove && !adminNote.trim())}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] transition-colors ${
              isApprove
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {isSubmitting && (
              <Icon icon="heroicons:arrow-path" className="size-4 animate-spin" />
            )}
            {t("tourRequest.buttons.confirm")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   TourRequestDetailPage
   ══════════════════════════════════════════════════════════════ */
export function TourRequestDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const requestId = typeof params.id === "string" ? params.id : "";

  const [detail, setDetail] = useState<TourRequestDetailDto | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const isLoading = dataState === "loading";
  const isError = dataState === "error";

  const loadDetail = useCallback(async () => {
    if (!requestId) {
      return;
    }

    setDataState("loading");
    setErrorMessage(null);

    try {
      const result = await tourRequestService.getTourRequestDetail(requestId, {
        admin: true,
      });

      setDetail(result);
      setDataState("ready");
    } catch (error) {
      setDetail(null);
      setDataState("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : t("tourRequest.toast.loadDetailError", "Failed to load tour request detail"),
      );
    }
  }, [requestId, t]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail, reloadToken]);

  const normalizedStatus = useMemo(() => {
    return normalizeTourRequestStatus(detail?.status);
  }, [detail?.status]);

  const canReview = normalizedStatus === "Pending";

  const openReviewModal = (action: ReviewAction) => {
    setReviewAction(action);
    setAdminNote(detail?.adminNote ?? "");
  };

  const closeReviewModal = () => {
    setReviewAction(null);
    setAdminNote("");
  };

  const retryLoading = () => {
    setReloadToken((value) => value + 1);
  };

  const submitReview = async () => {
    if (!detail || !reviewAction) {
      return;
    }

    if (reviewAction === "reject" && !adminNote.trim()) {
      return;
    }

    setIsSubmittingReview(true);

    try {
      await tourRequestService.reviewTourRequest(detail.id, {
        status: reviewAction === "approve" ? "Approved" : "Rejected",
        adminNote: adminNote.trim() || null,
      });

      toast.success(
        reviewAction === "approve"
          ? t("tourRequest.toast.reviewApprovedSuccess")
          : t("tourRequest.toast.reviewRejectedSuccess"),
      );

      closeReviewModal();
      await loadDetail();
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(
        t(apiError.message, {
          defaultValue: t("tourRequest.toast.reviewError"),
        }),
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <main
        id="main-content"
        className="p-6 lg:py-8 lg:pr-8 lg:pl-6"
      >
        <div className="max-w-7xl mx-auto space-y-5">
          <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* ── Page Header ── */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between gap-3 flex-wrap"
          >
            <Link
              href="/dashboard/tour-requests"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition-colors"
            >
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t("tourRequest.common.backToList", "Back to list")}
            </Link>

            {detail && <TourRequestStatusBadge status={detail.status} />}
          </motion.div>

          {/* ── Detail Card ── */}
          <motion.section
            className="rounded-[2.5rem] border border-stone-200/50 bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
            variants={itemVariants}
          >
            {/* Loading skeleton */}
            {isLoading && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <SkeletonCard key={`sk-${idx}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Error state */}
            {isError && (
              <motion.div
                className="bg-white border border-red-200/50 rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6 m-6"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring" as const, stiffness: 100, damping: 20 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <Icon
                        icon="heroicons:exclamation-circle"
                        className="size-5 text-red-600"
                      />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-red-800">
                        {t("tourRequest.error.title", "Could not load tour request detail")}
                      </h2>
                      <p className="text-sm text-red-700 mt-1">
                        {errorMessage ??
                          t(
                            "tourRequest.error.fallback",
                            "Unable to load tour request detail. Please try again.",
                          )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={retryLoading}
                    className="px-3 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 active:scale-[0.98] transition-colors shrink-0"
                  >
                    {t("tourRequest.common.retry", "Retry")}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Detail content */}
            {detail && !isError && (
              <>
                {/* Customer & Contact Info */}
                <div className="px-6 pt-6 pb-2">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                      <Icon
                        icon="heroicons:user"
                        className="size-6 text-amber-600"
                      />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-stone-900">
                        {detail.customerName || t("tourRequest.common.unknownCustomer", "Unknown Customer")}
                      </h2>
                      <p className="text-sm text-stone-500">
                        {detail.customerEmail || detail.customerPhone
                          ? [detail.customerEmail, detail.customerPhone].filter(Boolean).join(" · ")
                          : t("tourRequest.common.noContact", "No contact info")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-stone-50 rounded-xl p-3.5 text-center">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                        {t("tourRequest.admin.detail.numberOfParticipants")}
                      </p>
                      <p className="text-xl font-bold tracking-tight text-stone-900 data-value">
                        {detail.numberOfParticipants}
                      </p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3.5 text-center">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                        {t("tourRequest.admin.detail.budgetPerPerson")}
                      </p>
                      <p className="text-xl font-bold tracking-tight text-stone-900 data-value">
                        {formatBudget(detail.budgetPerPersonUsd)}
                      </p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3.5 text-center">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                        {t("tourRequest.admin.detail.startDate")}
                      </p>
                      <p className="text-xl font-bold tracking-tight text-stone-900">
                        {formatDate(detail.startDate)}
                      </p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3.5 text-center">
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                        {t("tourRequest.admin.detail.endDate")}
                      </p>
                      <p className="text-xl font-bold tracking-tight text-stone-900">
                        {formatDate(detail.endDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Travel Details */}
                <div className="px-6 py-4 border-t border-stone-100">
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DetailRow
                      label={t("tourRequest.admin.detail.destination")}
                      value={
                        <span className="font-semibold tracking-tight text-stone-900">
                          {detail.destination}
                        </span>
                      }
                    />
                    <DetailRow
                      label={t("tourRequest.admin.detail.preferredAccommodation")}
                      value={detail.preferredAccommodation || "-"}
                    />
                    <DetailRow
                      label={t("tourRequest.admin.detail.transportationPreference")}
                      value={detail.transportationPreference || "-"}
                    />
                    <DetailRow
                      label={t("tourRequest.admin.detail.createdOn")}
                      value={formatDate(detail.createdOnUtc)}
                    />
                  </dl>

                  {/* Travel Interests */}
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <dt className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                      {t("tourRequest.admin.detail.travelInterests")}
                    </dt>
                    <dd>
                      <TravelInterestTags
                        interests={detail.travelInterests}
                        detailId={detail.id}
                      />
                    </dd>
                  </div>

                  {/* Special Requests */}
                  {detail.specialRequests && (
                    <div className="mt-4 pt-4 border-t border-stone-100">
                      <dt className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                        {t("tourRequest.admin.detail.specialRequests")}
                      </dt>
                      <dd className="text-sm text-stone-700 bg-amber-50 rounded-xl p-3">
                        {detail.specialRequests}
                      </dd>
                    </div>
                  )}
                </div>

                {/* Review Info (if not pending) */}
                {!canReview && detail.reviewedAt && (
                  <div className="px-6 py-4 border-t border-stone-100 bg-stone-50">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          normalizedStatus === "Approved"
                            ? "bg-emerald-100"
                            : "bg-rose-100"
                        }`}
                      >
                        <Icon
                          icon={
                            normalizedStatus === "Approved"
                              ? "heroicons:check-circle"
                              : "heroicons:x-circle"
                          }
                          className={`size-4 ${
                            normalizedStatus === "Approved"
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-700">
                          {t("tourRequest.admin.detail.reviewedBy", "Reviewed by")}:{" "}
                          {detail.reviewedBy || "-"}
                        </p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {t("tourRequest.admin.detail.reviewedAt", "Reviewed at")}:{" "}
                          {formatDate(detail.reviewedAt)}
                        </p>
                        {detail.adminNote && (
                          <p className="text-sm text-stone-600 mt-2 italic">
                            &ldquo;{detail.adminNote}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {(canReview || (normalizedStatus === "Approved" && !detail.tourInstanceId)) && (
                  <div className="px-6 py-5 border-t border-stone-100 bg-stone-50 flex flex-wrap gap-3">
                    {canReview && (
                      <>
                        <button
                          type="button"
                          onClick={() => openReviewModal("approve")}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98] transition-colors shadow-sm"
                        >
                          <Icon icon="heroicons:check" className="size-4" />
                          {t("tourRequest.buttons.approve")}
                        </button>

                        <button
                          type="button"
                          onClick={() => openReviewModal("reject")}
                          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 active:scale-[0.98] transition-colors shadow-sm"
                        >
                          <Icon icon="heroicons:x-mark" className="size-4" />
                          {t("tourRequest.buttons.reject")}
                        </button>
                      </>
                    )}

                    {normalizedStatus === "Approved" && !detail.tourInstanceId && (
                      <button
                        type="button"
                        onClick={() => router.push(`/manager/tour-instances/create?tourRequestId=${detail.id}`)}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 active:scale-[0.98] transition-colors shadow-sm"
                      >
                        <Icon icon="heroicons:plus" className="size-4" />
                        {t("tourRequest.buttons.createTourInstance")}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </motion.section>
        </motion.div>
        </div>

        {/* ── Review Modal ── */}
        {reviewAction && (
          <ReviewModal
            action={reviewAction}
            adminNote={adminNote}
            setAdminNote={setAdminNote}
            isSubmitting={isSubmittingReview}
            onCancel={closeReviewModal}
            onConfirm={submitReview}
          />
        )}
      </main>
    </>
  );
}

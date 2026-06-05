"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { WarningCircle, CheckCircle, Clock, AirplaneTilt, XCircle, HandHeart, CurrencyCircleDollar } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { bookingService } from "@/api/services";
import { handleApiError } from "@/utils/apiResponse";
import {
  VisaRequirementResponse,
  VisaRequirementParticipant,
  BookingPendingTransaction,
  VisaApplicationSummaryDto,
} from "@/types/booking";
import { VisaUploadForm } from "./VisaUploadForm";

interface BookingVisaSectionProps {
  bookingId: string;
  pendingTransactions?: BookingPendingTransaction[];
}

function isServiceFeePaid(app: VisaApplicationSummaryDto): boolean {
  return Boolean(app.serviceFeePaid ?? app.serviceFeePaidAt);
}

export function BookingVisaSection({ bookingId, pendingTransactions = [] }: BookingVisaSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VisaRequirementResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [activeFormParticipantId, setActiveFormParticipantId] = useState<string | null>(null);
  const [isRequestingSupport, setIsRequestingSupport] = useState<string | null>(null);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await bookingService.getVisaRequirements(bookingId);
      setData(res);
    } catch (err) {
      setError(handleApiError(err).message || t("common.errorFetch"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      void fetchRequirements();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 v-stack gap-4 animate-pulse">
        <div className="h-6 w-1/4 bg-slate-200 rounded"></div>
        <div className="h-20 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 rounded-3xl p-6 shadow-sm border border-red-100 h-stack items-center gap-4">
        <WarningCircle size={24} weight="fill" />
        <div className="flex-1">
          <p className="font-bold">{t("landing.visa.errorLoading")}</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
        <button onClick={fetchRequirements} className="text-sm font-bold underline">
          {t("common.retry")}
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (data.participants.length === 0) {
    return null;
  }

  const displayParticipants = data.participants;

  const approvedCount = displayParticipants.filter(p => 
    !p.requiresVisa || p.latestVisaApplication?.status === "Approved"
  ).length;

  const handleRequestSupport = async (participantId: string) => {
    if (!window.confirm(t("landing.visa.confirmSupportFee"))) {
      return;
    }
    
    setIsRequestingSupport(participantId);
    try {
      const res = await bookingService.requestVisaSupport(bookingId, participantId);
      if (res.serviceFeeQuoted) {
        toast.info(res.message);
      } else {
        toast.success(res.message);
      }
      await fetchRequirements();
    } catch (err) {
      const handled = handleApiError(err);
      toast.error(handled.message);
    } finally {
      setIsRequestingSupport(null);
    }
  };

  const handleSubmitPassport = async (participantId: string, payload: any): Promise<string> => {
    const passportId = await bookingService.upsertParticipantPassport(bookingId, participantId, payload);
    return passportId ?? "";
  };

  const handleSubmitVisaApp = async (participantId: string, passportId: string, applicationId: string | undefined, isResubmitting: boolean, payload: any) => {
    if (isResubmitting && applicationId) {
      await bookingService.updateVisaApplication(bookingId, applicationId, {
        passportId: passportId,
        destinationCountry: payload.destinationCountry,
        minReturnDate: payload.minReturnDate,
        visaFileUrl: payload.visaFileUrl,
        category: payload.category,
        format: payload.format,
        maxStayDays: payload.maxStayDays,
        issuingAuthority: payload.issuingAuthority,
        visaNumber: payload.visaNumber,
        entryType: payload.entryType,
        issuedAt: payload.issuedAt,
        expiresAt: payload.expiresAt,
      });
    } else {
      await bookingService.submitVisaApplication(bookingId, {
        bookingParticipantId: participantId,
        passportId: passportId,
        destinationCountry: payload.destinationCountry,
        minReturnDate: payload.minReturnDate,
        visaFileUrl: payload.visaFileUrl,
        category: payload.category,
        format: payload.format,
        maxStayDays: payload.maxStayDays,
        issuingAuthority: payload.issuingAuthority,
        visaNumber: payload.visaNumber,
        entryType: payload.entryType,
        issuedAt: payload.issuedAt,
        expiresAt: payload.expiresAt,
      });
    }
    toast.success(t("landing.visa.submitSuccess"));
    setActiveFormParticipantId(null);
    await fetchRequirements();
  };

  const handlePayVisaFee = (participant: VisaRequirementParticipant) => {
    const app = participant.latestVisaApplication;
    const feeAmount = app?.serviceFee ?? undefined;
    const visaTx = pendingTransactions.find(
      (tx) =>
        tx.type === "VisaServiceFee" &&
        (feeAmount == null || tx.amount === feeAmount),
    );

    if (!visaTx?.transactionCode) {
      toast.error(t("landing.visa.noPendingFeeTransaction", "Không tìm thấy giao dịch phí visa. Vui lòng tải lại trang."));
      return;
    }

    router.push(`/payment/${visaTx.transactionCode}?bookingId=${bookingId}`);
  };

  const renderStatusBadge = (participant: VisaRequirementParticipant) => {
    if (!participant.requiresVisa) {
      return (
        <span className="h-stack items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
          <CheckCircle weight="fill" /> {t("landing.visa.notRequired", "Miễn Visa")}
        </span>
      );
    }
    const app = participant.latestVisaApplication;
    if (!app) {
      return (
        <span className="h-stack items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
          {t("landing.visa.notSubmitted")}
        </span>
      );
    }

    if (app.isSystemAssisted && app.serviceFee != null && !isServiceFeePaid(app)) {
      return (
        <span className="h-stack items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
          <WarningCircle weight="fill" /> {t("landing.visa.supportFeePending")}
        </span>
      );
    }

    if (app.isSystemAssisted && isServiceFeePaid(app) && (app.status === "Pending" || app.status === "Processing")) {
      return (
        <span className="h-stack items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
          <CheckCircle weight="fill" /> {t("landing.visa.supportFeePaid")}
        </span>
      );
    }

    switch (app.status) {
      case "Pending":
        return (
          <span className="h-stack items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            <Clock weight="fill" /> {t("landing.visa.pendingReview")}
          </span>
        );
      case "Processing":
        return (
          <span className="h-stack items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
            <Clock weight="fill" /> {t("landing.visa.pendingReview")}
          </span>
        );
      case "Approved":
        return (
          <span className="h-stack items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
            <CheckCircle weight="fill" /> {t("landing.visa.approved")}
          </span>
        );
      case "Rejected":
        return (
          <span className="h-stack items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
            <XCircle weight="fill" /> {t("landing.visa.rejected")}
          </span>
        );
      default:
        return (
          <span className="h-stack items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
            {app.status}
          </span>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
      className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 v-stack gap-6"
    >
      <div className="h-stack items-start justify-between gap-4">
        <div className="v-stack gap-1">
          <div className="h-stack items-center gap-2">
            <AirplaneTilt size={24} weight="bold" className="text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900">{t("landing.visa.sectionTitle")}</h3>
          </div>
          <p className="text-sm text-slate-500">{t("landing.visa.sectionDescription")}</p>
        </div>
        <div className="v-stack items-end">
          <span className="text-sm font-medium text-slate-500">{t("landing.visa.progress")}</span>
          <span className="text-xl font-bold text-slate-900">
            {approvedCount} <span className="text-slate-400">/ {displayParticipants.length}</span>
          </span>
        </div>
      </div>

      <div className="v-stack gap-4">
        {displayParticipants.map((participant) => {
          const app = participant.latestVisaApplication;
          const isFormOpen = activeFormParticipantId === participant.participantId;
          const destinationCountry = app?.destinationCountry || "VN"; // fallback for now if new
          const canSubmit =
            (participant.availableActions.includes("submit_visa") ||
              participant.availableActions.includes("resubmit_visa")) &&
            !participant.missingDateOfBirth;
          const canRequestSupport = participant.availableActions.includes("request_support");
          const canPayVisaFee = participant.availableActions.includes("pay_visa_fee");
          const isRejected = app?.status === "Rejected";

          return (
            <div key={participant.participantId} className="border border-slate-100 rounded-2xl p-4 v-stack gap-3 transition-colors hover:border-blue-100">
              <div className="h-stack justify-between items-center flex-wrap gap-2">
                <div className="h-stack items-center gap-3">
                  <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                    {participant.fullName.charAt(0)}
                  </div>
                  <div className="v-stack">
                    <span className="font-bold text-slate-900">{participant.fullName}</span>
                    {renderStatusBadge(participant)}
                  </div>
                </div>
                
                <div className="h-stack items-center gap-2">
                  {canPayVisaFee && !isFormOpen && (
                    <button
                      type="button"
                      onClick={() => handlePayVisaFee(participant)}
                      className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg transition-colors h-stack items-center gap-1"
                    >
                      <CurrencyCircleDollar weight="bold" /> {t("landing.visa.payServiceFee", "Thanh toán phí visa")}
                    </button>
                  )}
                  {canRequestSupport && !isFormOpen && (
                    <button
                      onClick={() => handleRequestSupport(participant.participantId)}
                      disabled={isRequestingSupport === participant.participantId}
                      className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors h-stack items-center gap-1 disabled:opacity-50"
                    >
                      <HandHeart weight="bold" /> {t("landing.visa.requestSupport")}
                    </button>
                  )}
                  {canSubmit && !isFormOpen && (
                    <button
                      onClick={() => setActiveFormParticipantId(participant.participantId)}
                      className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
                    >
                      {isRejected ? t("landing.visa.resubmit") : t("landing.visa.provideDetails")}
                    </button>
                  )}
                </div>
              </div>

              {app?.refusalReason && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                  <span className="font-bold">{t("landing.visa.refusalReason")}: </span>
                  {app.refusalReason}
                </div>
              )}

              {isFormOpen && (
                <VisaUploadForm
                  participant={participant}
                  tourReturnDate={undefined} // could pass from booking details
                  destinationCountry={destinationCountry}
                  isResubmitting={isRejected}
                  onSubmitPassport={async (payload) => {
                    const newPassportId = await handleSubmitPassport(participant.participantId, payload);
                    return newPassportId;
                  }}
                  onSubmitVisaApp={async (payload) => {
                    // passportId comes from either the just-created passport or the existing one
                    const passportId = payload._passportId || participant.passport?.id || "";
                    await handleSubmitVisaApp(participant.participantId, passportId, app?.id, isRejected, payload);
                  }}
                  onCancel={() => setActiveFormParticipantId(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

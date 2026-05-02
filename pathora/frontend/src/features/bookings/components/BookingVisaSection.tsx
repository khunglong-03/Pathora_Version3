"use client";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { WarningCircle, CheckCircle, Clock, AirplaneTilt, IdentificationCard, XCircle, HandHeart } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { bookingService } from "@/api/services";
import { handleApiError } from "@/utils/apiResponse";
import {
  VisaRequirementResponse,
  VisaRequirementParticipant,
} from "@/types/booking";
import { VisaUploadForm } from "./VisaUploadForm";

interface BookingVisaSectionProps {
  bookingId: string;
}

export function BookingVisaSection({ bookingId }: BookingVisaSectionProps) {
  const { t } = useTranslation();
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

  if (!data || !data.isVisaRequired || data.participants.length === 0) {
    return null;
  }

  const requiredParticipants = data.participants.filter(p => p.requiresVisa);
  if (requiredParticipants.length === 0) {
    return null;
  }

  const approvedCount = requiredParticipants.filter(p => p.latestVisaApplication?.status === "Approved").length;

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

  const handleSubmitPassport = async (participantId: string, payload: any) => {
    await bookingService.upsertParticipantPassport(bookingId, participantId, payload);
  };

  const handleSubmitVisaApp = async (participantId: string, applicationId: string | undefined, isResubmitting: boolean, payload: any) => {
    if (isResubmitting && applicationId) {
      await bookingService.updateVisaApplication(bookingId, applicationId, payload);
    } else {
      await bookingService.submitVisaApplication(bookingId, {
        bookingParticipantId: participantId,
        destinationCountry: payload.destinationCountry,
        minReturnDate: payload.minReturnDate,
        visaFileUrl: payload.visaFileUrl,
      });
    }
    toast.success(t("landing.visa.submitSuccess"));
    setActiveFormParticipantId(null);
    await fetchRequirements();
  };

  const renderStatusBadge = (participant: VisaRequirementParticipant) => {
    if (participant.missingDateOfBirth) {
      return (
        <span className="h-stack items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
          <WarningCircle weight="fill" /> {t("landing.visa.missingDob")}
        </span>
      );
    }
    if (!participant.passport) {
      return (
        <span className="h-stack items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
          <IdentificationCard weight="fill" /> {t("landing.visa.missingPassport")}
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
    switch (app.status) {
      case "PendingReview":
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
      case "SupportFeePending":
        return (
          <span className="h-stack items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
            <WarningCircle weight="fill" /> {t("landing.visa.supportFeePending")}
          </span>
        );
      case "SupportFeePaid":
        return (
          <span className="h-stack items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-md">
            <CheckCircle weight="fill" /> {t("landing.visa.supportFeePaid")}
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
            {approvedCount} <span className="text-slate-400">/ {requiredParticipants.length}</span>
          </span>
        </div>
      </div>

      <div className="v-stack gap-4">
        {requiredParticipants.map((participant) => {
          const app = participant.latestVisaApplication;
          const isFormOpen = activeFormParticipantId === participant.id;
          const destinationCountry = app?.destinationCountry || "VN"; // fallback for now if new
          const canSubmit = participant.availableActions.includes("Submit");
          const canRequestSupport = participant.availableActions.includes("RequestSupport");
          const isRejected = app?.status === "Rejected";

          return (
            <div key={participant.id} className="border border-slate-100 rounded-2xl p-4 v-stack gap-3 transition-colors hover:border-blue-100">
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
                  {canRequestSupport && !isFormOpen && (
                    <button
                      onClick={() => handleRequestSupport(participant.id)}
                      disabled={isRequestingSupport === participant.id}
                      className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors h-stack items-center gap-1 disabled:opacity-50"
                    >
                      <HandHeart weight="bold" /> {t("landing.visa.requestSupport")}
                    </button>
                  )}
                  {(canSubmit || isRejected) && !isFormOpen && !participant.missingDateOfBirth && (
                    <button
                      onClick={() => setActiveFormParticipantId(participant.id)}
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
                    await handleSubmitPassport(participant.id, payload);
                  }}
                  onSubmitVisaApp={async (payload) => {
                    await handleSubmitVisaApp(participant.id, app?.id, isRejected, payload);
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

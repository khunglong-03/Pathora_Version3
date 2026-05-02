"use client";
import React from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslation } from "react-i18next";
import { VisaRequirementParticipant, VisaApplicationSummaryDto } from "@/types/booking";

interface VisaUploadFormProps {
  participant: VisaRequirementParticipant;
  tourReturnDate?: string;
  destinationCountry: string;
  isResubmitting: boolean;
  onSubmitPassport: (data: any) => Promise<void>;
  onSubmitVisaApp: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function VisaUploadForm({
  participant,
  tourReturnDate,
  destinationCountry,
  isResubmitting,
  onSubmitPassport,
  onSubmitVisaApp,
  onCancel,
}: VisaUploadFormProps) {
  const { t } = useTranslation();

  const isPassportMissing = !participant.passport;
  const application = participant.latestVisaApplication;

  const schema = yup.object().shape({
    passportNumber: yup.string().when("$isPassportMissing", {
      is: true,
      then: (s) => s.required(t("landing.visa.passportRequired")),
    }),
    nationality: yup.string().when("$isPassportMissing", {
      is: true,
      then: (s) => s.required(t("landing.visa.nationalityRequired")),
    }),
    issuedAt: yup.string().when("$isPassportMissing", {
      is: true,
      then: (s) => s.required(t("landing.visa.issuedAtRequired")),
    }),
    expiresAt: yup.string().when("$isPassportMissing", {
      is: true,
      then: (s) =>
        s
          .required(t("landing.visa.expiresAtRequired"))
          .test(
            "expires-after-return",
            t("landing.visa.passportMustExpireAfterReturn"),
            function (value) {
              if (!value || !tourReturnDate) return true;
              return new Date(value) >= new Date(tourReturnDate);
            }
          ),
    }),
    fileUrl: yup.string().when("$isPassportMissing", {
      is: true,
      then: (s) => s.required(t("landing.visa.passportFileRequired")),
    }),
    destinationCountry: yup.string().required(t("landing.visa.countryRequired")),
    minReturnDate: yup.string().nullable(),
    visaFileUrl: yup.string().nullable(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    context: { isPassportMissing },
    defaultValues: {
      passportNumber: participant.passport?.passportNumber || "",
      nationality: participant.passport?.countryCode || "",
      issuedAt: participant.passport?.issuedDate ? participant.passport.issuedDate.split("T")[0] : "",
      expiresAt: participant.passport?.expiryDate ? participant.passport.expiryDate.split("T")[0] : "",
      fileUrl: "",
      destinationCountry: application?.destinationCountry || destinationCountry || "",
      minReturnDate: application?.minReturnDate ? application.minReturnDate.split("T")[0] : tourReturnDate || "",
      visaFileUrl: application?.visaFileUrl || "",
    },
  });

  const handleFormSubmit = async (data: any) => {
    try {
      if (isPassportMissing) {
        await onSubmitPassport({
          passportNumber: data.passportNumber,
          nationality: data.nationality,
          issuedAt: data.issuedAt,
          expiresAt: data.expiresAt,
          fileUrl: data.fileUrl,
        });
      }
      await onSubmitVisaApp({
        destinationCountry: data.destinationCountry,
        minReturnDate: data.minReturnDate,
        visaFileUrl: data.visaFileUrl,
        isResubmitting,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="v-stack gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
      {isPassportMissing && (
        <>
          <h4 className="font-bold text-slate-700">{t("landing.visa.passportDetails")}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                {t("landing.visa.passportNumber")}
              </label>
              <input
                {...register("passportNumber")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: C1234567"
              />
              {errors.passportNumber && <p className="text-red-500 text-xs mt-1">{errors.passportNumber.message as string}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                {t("landing.visa.nationality")}
              </label>
              <input
                {...register("nationality")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: VN"
              />
              {errors.nationality && <p className="text-red-500 text-xs mt-1">{errors.nationality.message as string}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                {t("landing.visa.issuedAt")}
              </label>
              <input
                type="date"
                {...register("issuedAt")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.issuedAt && <p className="text-red-500 text-xs mt-1">{errors.issuedAt.message as string}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                {t("landing.visa.expiresAt")}
              </label>
              <input
                type="date"
                {...register("expiresAt")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.expiresAt && <p className="text-red-500 text-xs mt-1">{errors.expiresAt.message as string}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-600 mb-1 block">
                {t("landing.visa.passportFileUrl")}
              </label>
              <input
                {...register("fileUrl")}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
              {errors.fileUrl && <p className="text-red-500 text-xs mt-1">{errors.fileUrl.message as string}</p>}
            </div>
          </div>
        </>
      )}

      <h4 className="font-bold text-slate-700 mt-2">{t("landing.visa.visaApplicationDetails")}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-600 mb-1 block">
            {t("landing.visa.destinationCountry")}
          </label>
          <input
            {...register("destinationCountry")}
            readOnly
            className="w-full px-3 py-2 border rounded-lg bg-slate-100 focus:outline-none cursor-not-allowed"
          />
          {errors.destinationCountry && <p className="text-red-500 text-xs mt-1">{errors.destinationCountry.message as string}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 mb-1 block">
            {t("landing.visa.minReturnDate")}
          </label>
          <input
            type="date"
            {...register("minReturnDate")}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-600 mb-1 block">
            {t("landing.visa.visaFileUrlOptional")}
          </label>
          <input
            {...register("visaFileUrl")}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="h-stack justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {t("common.cancel")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? t("common.submitting") : t("common.submit")}
        </button>
      </div>
    </form>
  );
}

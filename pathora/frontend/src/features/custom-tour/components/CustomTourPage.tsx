"use client";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Icon from "@/components/ui/Icon";
import { tourRequestService } from "@/api/services/tourRequestService";
import { type CreateTourRequestPayload, type TourRequestTravelInterest } from "@/types/tourRequest";
import { handleApiError } from "@/utils/apiResponse";


import { FormValues, DEFAULT_VALUES } from "./CustomTourData";
import { CustomTourHero } from "./CustomTourHero";
import { CustomTourForm } from "./CustomTourForm";

export function CustomTourPage() {
  const { t } = useTranslation();
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validationSchema = useMemo(
    () =>
      yup.object({
        destination: yup
          .string()
          .required(t("tourRequest.validation.destinationRequired"))
          .max(500, t("tourRequest.validation.destinationMax")),
        startDate: yup
          .string()
          .required(t("tourRequest.validation.startDateRequired")),
        endDate: yup
          .string()
          .test(
            "endDateAfterStart",
            t("tourRequest.validation.endDateAfterStart"),
            (value, context) => {
              if (!value) return true;
              if (!context.parent.startDate) return true;
              return new Date(value) >= new Date(context.parent.startDate);
            },
          ),
        numberOfParticipants: yup
          .number()
          .typeError(t("tourRequest.validation.participantsRequired"))
          .required(t("tourRequest.validation.participantsRequired"))
          .min(1, t("tourRequest.validation.participantsMin")),
        budgetPerPersonUsd: yup
          .number()
          .transform((currentValue, originalValue) => {
            if (originalValue === "" || originalValue === null) return undefined;
            return currentValue;
          })
          .nullable()
          .notRequired()
          .moreThan(0, t("tourRequest.validation.budgetMin")),
        travelInterests: yup.array(yup.string()),
        preferredAccommodation: yup
          .string()
          .max(500, t("tourRequest.validation.preferredAccommodationMax")),
        transportationPreference: yup
          .string()
          .max(500, t("tourRequest.validation.transportationPreferenceMax")),
        specialRequests: yup
          .string()
          .max(2000, t("tourRequest.validation.specialRequestsMax")),
      }),
    [t],
  );

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver: yupResolver(validationSchema) as never,
  });

  const toggleTravelInterest = (interest: TourRequestTravelInterest) => {
    const current = (watch("travelInterests") ?? []) as TourRequestTravelInterest[];
    const next = current.includes(interest)
      ? current.filter((item) => item !== interest)
      : [...current, interest];
    setValue("travelInterests", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload: CreateTourRequestPayload = {
        destination: values.destination.trim(),
        startDate: values.startDate,
        endDate: values.endDate || null,
        numberOfParticipants: values.numberOfParticipants,
        budgetPerPersonUsd: values.budgetPerPersonUsd
          ? Number(values.budgetPerPersonUsd)
          : null,
        travelInterests: values.travelInterests as TourRequestTravelInterest[],
        preferredAccommodation: values.preferredAccommodation.trim() || null,
        transportationPreference: values.transportationPreference.trim() || null,
        specialRequests: values.specialRequests.trim() || null,
      };

      await tourRequestService.createTourRequest(payload);

      setHasSubmitted(true);
      reset(DEFAULT_VALUES);

      toast.success(
        <span>
          {t("tourRequest.toast.createSuccess")}{" "}
          <Link href="/tours/my-requests" className="underline font-semibold">
            {t("tourRequest.form.viewMyRequests")}
          </Link>
        </span>,
      );
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(
        t(apiError.message, {
          defaultValue: t("tourRequest.toast.createError"),
        }),
      );
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 min-h-screen">
      

      <CustomTourHero
        title={t("tourRequest.page.customTour.title")}
        subtitle={t("tourRequest.page.customTour.subtitle")}
        backLabel={t("landing.customTour.backToHome")}
      />

      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <CustomTourForm
          register={register}
          setValue={setValue}
          watch={watch}
          handleSubmit={handleSubmit}
          errors={errors}
          isSubmitting={isSubmitting}
          hasSubmitted={hasSubmitted}
          t={t}
          toggleTravelInterest={toggleTravelInterest}
          onSubmit={onSubmit}
        />
      </section>

      
    </div>
  );
}

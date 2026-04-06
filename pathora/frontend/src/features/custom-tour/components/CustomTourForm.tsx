"use client";
import React from "react";
import Link from "next/link";
import { useForm, UseFormRegister, UseFormSetValue, UseFormWatch, UseFormHandleSubmit, FieldErrors } from "react-hook-form";
import Icon from "@/components/ui/Icon";
import {
  FormValues,
  TRAVEL_INTEREST_LABEL_KEYS,
  TOUR_REQUEST_TRAVEL_INTERESTS,
} from "./CustomTourData";
import type { TourRequestTravelInterest } from "@/types/tourRequest";

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

interface CustomTourFormProps {
  register: UseFormRegister<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  watch: UseFormWatch<FormValues>;
  handleSubmit: UseFormHandleSubmit<FormValues>;
  errors: FieldErrors<FormValues>;
  isSubmitting: boolean;
  hasSubmitted: boolean;
  t: (key: string) => string;
  toggleTravelInterest: (interest: TourRequestTravelInterest) => void;
  onSubmit: (values: FormValues) => Promise<void>;
}

export function CustomTourForm({
  register,
  setValue,
  watch,
  handleSubmit,
  errors,
  isSubmitting,
  hasSubmitted,
  t,
  toggleTravelInterest,
  onSubmit,
}: CustomTourFormProps) {
  const selectedInterests = watch("travelInterests");
  const budgetHint = t("tourRequest.form.budgetHint");
  const submittingLabel = t("tourRequest.form.submitting");
  const submitLabel = t("tourRequest.form.submit");

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
        {t("tourRequest.page.customTour.title")}
      </h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        {t("landing.customTour.intro")}
      </p>

      {hasSubmitted && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm">
          {t("tourRequest.toast.createSuccess")}{" "}
          <Link href="/tours/my-requests" className="font-semibold underline">
            {t("tourRequest.form.viewMyRequests")}
          </Link>
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Destination */}
          <div className="md:col-span-2">
            <FormField label={t("tourRequest.form.destination")} error={errors.destination?.message as string | undefined}>
              <input
                id="destination"
                type="text"
                maxLength={500}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
                {...register("destination")}
              />
            </FormField>
          </div>

          {/* Start Date */}
          <FormField label={t("tourRequest.form.startDate")} error={errors.startDate?.message as string | undefined}>
            <input
              id="startDate"
              type="date"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              {...register("startDate")}
            />
          </FormField>

          {/* End Date */}
          <FormField label={t("tourRequest.form.endDate")} error={errors.endDate?.message as string | undefined}>
            <input
              id="endDate"
              type="date"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              {...register("endDate")}
            />
          </FormField>

          {/* Participants */}
          <FormField label={t("tourRequest.form.numberOfParticipants")} error={errors.numberOfParticipants?.message as string | undefined}>
            <input
              id="numberOfParticipants"
              type="number"
              min={1}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              {...register("numberOfParticipants", { valueAsNumber: true })}
            />
          </FormField>

          {/* Budget */}
          <FormField label={t("tourRequest.form.budgetPerPerson")} error={errors.budgetPerPersonUsd?.message as string | undefined}>
            <input
              id="budgetPerPersonUsd"
              type="number"
              min={0}
              step="0.01"
              placeholder="500"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              {...register("budgetPerPersonUsd", { valueAsNumber: true })}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{budgetHint}</p>
          </FormField>
        </div>

        {/* Travel Interests */}
        <div>
          <p className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3">
            {t("tourRequest.form.travelInterests")}
          </p>
          <div className="flex flex-wrap gap-2">
            {TOUR_REQUEST_TRAVEL_INTERESTS.map((interest) => {
              const selected = (selectedInterests ?? []).includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleTravelInterest(interest)}
                  className={`px-3 py-2 rounded-full border text-sm transition-colors ${
                    selected
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-orange-400"
                  }`}
                >
                  {t(TRAVEL_INTEREST_LABEL_KEYS[interest])}
                </button>
              );
            })}
          </div>
        </div>

        {/* Additional fields */}
        <div className="grid grid-cols-1 gap-5">
          <FormField label={t("tourRequest.form.preferredAccommodation")} error={errors.preferredAccommodation?.message as string | undefined}>
            <input
              id="preferredAccommodation"
              type="text"
              maxLength={500}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              {...register("preferredAccommodation")}
            />
          </FormField>

          <FormField label={t("tourRequest.form.transportationPreference")} error={errors.transportationPreference?.message as string | undefined}>
            <input
              id="transportationPreference"
              type="text"
              maxLength={500}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              {...register("transportationPreference")}
            />
          </FormField>

          <FormField label={t("tourRequest.form.specialRequests")} error={errors.specialRequests?.message as string | undefined}>
            <textarea
              id="specialRequests"
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-300"
              {...register("specialRequests")}
            />
          </FormField>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting && (
              <Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" />
            )}
            <span>{isSubmitting ? submittingLabel : submitLabel}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

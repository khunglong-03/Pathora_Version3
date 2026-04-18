"use client";

import React, { useMemo, useState } from "react";
import { XIcon, BuildingsIcon } from "@phosphor-icons/react";
import { useForm, type Resolver } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { createSupplierWithOwner, type SupplierType } from "@/api/services/adminSupplierService";
import {
  CONTINENT_TRANSLATION_KEYS,
  SUPPORTED_CONTINENT_CODES,
  type SupportedContinentCode,
} from "@/constants/continents";

interface CreateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierType: SupplierType;
  supplierTypeLabel: string;
  iconBg: string;
  iconColor: string;
}

interface FormValues {
  ownerEmail: string;
  ownerFullName: string;
  supplierCode: string;
  supplierName: string;
  phone: string;
  email: string;
  address: string;
  note: string;
  primaryContinent: string;
}

const DEFAULT_VALUES: FormValues = {
  ownerEmail: "",
  ownerFullName: "",
  supplierCode: "",
  supplierName: "",
  phone: "",
  email: "",
  address: "",
  note: "",
  primaryContinent: "",
};

export function CreateSupplierModal({
  isOpen,
  onClose,
  onSuccess,
  supplierType,
  supplierTypeLabel,
  iconBg,
  iconColor,
}: CreateSupplierModalProps) {
  const { t } = useTranslation();
  const isHotelSupplier = supplierType === "Accommodation";
  const isTransportSupplier = supplierType === "Transport";
  const requireContinent = isHotelSupplier || isTransportSupplier;
  const [apiError, setApiError] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      yup.object({
        ownerEmail: yup
          .string()
          .trim()
          .required(t("adminSupplierModal.validation.ownerEmailRequired"))
          .email(t("adminSupplierModal.validation.ownerEmailInvalid")),
        ownerFullName: yup
          .string()
          .trim()
          .required(t("adminSupplierModal.validation.ownerFullNameRequired")),
        supplierCode: yup
          .string()
          .trim()
          .required(t("adminSupplierModal.validation.supplierCodeRequired"))
          .max(50, t("adminSupplierModal.validation.supplierCodeTooLong")),
        supplierName: yup
          .string()
          .trim()
          .required(t("adminSupplierModal.validation.supplierNameRequired"))
          .max(200, t("adminSupplierModal.validation.supplierNameTooLong")),
        phone: yup.string().optional(),
        email: yup
          .string()
          .trim()
          .email(t("adminSupplierModal.validation.supplierEmailInvalid"))
          .optional(),
        address: yup.string().optional(),
        note: yup.string().optional(),
        primaryContinent: yup
          .string()
          .oneOf([...SUPPORTED_CONTINENT_CODES, ""])
          .when([], {
            is: () => requireContinent,
            then: (fieldSchema) =>
              fieldSchema.required(t("adminSupplierModal.validation.primaryContinentRequired")),
            otherwise: (fieldSchema) => fieldSchema.optional(),
          }),
      }),
    [requireContinent, t],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: yupResolver(schema) as Resolver<FormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(DEFAULT_VALUES);
      setApiError(null);
    }
  }, [isOpen, reset]);

  const closeModal = () => {
    if (!isSubmitting) {
      reset(DEFAULT_VALUES);
      setApiError(null);
      onClose();
    }
  };

  const onSubmit = async (values: FormValues) => {
    setApiError(null);

    try {
      await createSupplierWithOwner({
        ownerEmail: values.ownerEmail.trim(),
        ownerFullName: values.ownerFullName.trim(),
        supplierCode: values.supplierCode.trim(),
        supplierType,
        supplierName: values.supplierName.trim(),
        phone: values.phone.trim() || undefined,
        email: values.email.trim() || undefined,
        address: values.address.trim() || undefined,
        note: values.note.trim() || undefined,
        primaryContinent: requireContinent
          ? (values.primaryContinent as SupportedContinentCode)
          : undefined,
      });

      reset(DEFAULT_VALUES);
      onSuccess();
    } catch {
      setApiError(t("adminSupplierModal.error.createFailed"));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={closeModal}
      />

      <div
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#E5E7EB] bg-white shadow-xl"
        style={{ boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)" }}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: iconBg }}
            >
              <BuildingsIcon size={18} weight="bold" style={{ color: iconColor }} />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#111827" }}>
                {t("adminSupplierModal.title", { supplierType: supplierTypeLabel })}
              </h2>
              <p className="mt-0.5 text-xs" style={{ color: "#6B7280" }}>
                {t("adminSupplierModal.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            disabled={isSubmitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[#F3F4F6] disabled:opacity-50"
            aria-label={t("common.close")}
          >
            <XIcon size={18} weight="bold" style={{ color: "#6B7280" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            {apiError && (
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{ backgroundColor: "#FEF2F2", color: "#DC2626" }}
              >
                {apiError}
              </div>
            )}

            <div>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#9CA3AF" }}
              >
                {t("adminSupplierModal.sections.owner")}
              </p>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="owner-fullname"
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: "#374151" }}
                  >
                    {t("adminSupplierModal.fields.ownerFullName")}{" "}
                    <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    id="owner-fullname"
                    type="text"
                    {...register("ownerFullName")}
                    placeholder={t("adminSupplierModal.placeholders.ownerFullName")}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.ownerFullName
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.ownerFullName && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.ownerFullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="owner-email"
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: "#374151" }}
                  >
                    {t("adminSupplierModal.fields.ownerEmail")}{" "}
                    <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    id="owner-email"
                    type="email"
                    {...register("ownerEmail")}
                    placeholder={t("adminSupplierModal.placeholders.ownerEmail")}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.ownerEmail
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.ownerEmail && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.ownerEmail.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>
                    {t("adminSupplierModal.fields.ownerEmailHint")}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #F3F4F6" }} />

            <div>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#9CA3AF" }}
              >
                {t("adminSupplierModal.sections.supplier")}
              </p>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="supplier-code"
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: "#374151" }}
                  >
                    {t("adminSupplierModal.fields.supplierCode")}{" "}
                    <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    id="supplier-code"
                    type="text"
                    {...register("supplierCode")}
                    placeholder={t("adminSupplierModal.placeholders.supplierCode")}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.supplierCode
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.supplierCode && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.supplierCode.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="supplier-name"
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: "#374151" }}
                  >
                    {t("adminSupplierModal.fields.supplierName")}{" "}
                    <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    id="supplier-name"
                    type="text"
                    {...register("supplierName")}
                    placeholder={t("adminSupplierModal.placeholders.supplierName")}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.supplierName
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.supplierName && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.supplierName.message}
                    </p>
                  )}
                </div>

                {requireContinent && (
                  <div>
                    <label
                      htmlFor="supplier-primary-continent"
                      className="mb-1.5 block text-sm font-medium"
                      style={{ color: "#374151" }}
                    >
                      {t("adminSupplierModal.fields.primaryContinent")}{" "}
                      <span style={{ color: "#DC2626" }}>*</span>
                    </label>
                    <select
                      id="supplier-primary-continent"
                      {...register("primaryContinent")}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      style={
                        errors.primaryContinent
                          ? { borderColor: "#DC2626", color: "#111827" }
                          : { borderColor: "#E5E7EB", color: "#111827" }
                      }
                      defaultValue=""
                    >
                      <option value="">
                        {t("adminSupplierModal.placeholders.primaryContinent")}
                      </option>
                      {SUPPORTED_CONTINENT_CODES.map((continent) => (
                        <option key={continent} value={continent}>
                          {t(CONTINENT_TRANSLATION_KEYS[continent])}
                        </option>
                      ))}
                    </select>
                    {errors.primaryContinent && (
                      <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                        {errors.primaryContinent.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs" style={{ color: "#9CA3AF" }}>
                      {t("adminSupplierModal.fields.primaryContinentHint")}
                    </p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="supplier-email"
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: "#374151" }}
                  >
                    {t("adminSupplierModal.fields.supplierEmail")}
                  </label>
                  <input
                    id="supplier-email"
                    type="email"
                    {...register("email")}
                    placeholder={t("adminSupplierModal.placeholders.supplierEmail")}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={
                      errors.email
                        ? { borderColor: "#DC2626", color: "#111827" }
                        : { borderColor: "#E5E7EB", color: "#111827" }
                    }
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="supplier-phone"
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: "#374151" }}
                  >
                    {t("adminSupplierModal.fields.phone")}
                  </label>
                  <input
                    id="supplier-phone"
                    type="tel"
                    {...register("phone")}
                    placeholder={t("adminSupplierModal.placeholders.phone")}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={{ borderColor: "#E5E7EB", color: "#111827" }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="supplier-address"
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: "#374151" }}
                  >
                    {t("adminSupplierModal.fields.address")}
                  </label>
                  <input
                    id="supplier-address"
                    type="text"
                    {...register("address")}
                    placeholder={t("adminSupplierModal.placeholders.address")}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={{ borderColor: "#E5E7EB", color: "#111827" }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="supplier-note"
                    className="mb-1.5 block text-sm font-medium"
                    style={{ color: "#374151" }}
                  >
                    {t("adminSupplierModal.fields.note")}
                  </label>
                  <textarea
                    id="supplier-note"
                    {...register("note")}
                    placeholder={t("adminSupplierModal.placeholders.note")}
                    rows={2}
                    className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    style={{ borderColor: "#E5E7EB", color: "#111827" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-[#FAFAFA] disabled:opacity-50"
              style={{ color: "#374151" }}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: iconColor }}
            >
              {isSubmitting
                ? t("adminSupplierModal.actions.creating")
                : t("adminSupplierModal.actions.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

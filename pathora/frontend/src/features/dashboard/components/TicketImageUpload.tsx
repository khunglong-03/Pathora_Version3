"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { tourInstanceService } from "@/api/services/tourInstanceService";
import { Icon } from "@/components/ui";
import type { TicketImageDto, TourInstanceDayActivityDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";

const ACCEPTED_TICKET_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_TICKET_IMAGE_SIZE = 10 * 1024 * 1024;

export interface TicketImageBookingOption {
  id: string;
  label: string;
}

interface TicketImageUploadProps {
  instanceId: string;
  activity: Pick<TourInstanceDayActivityDto, "id" | "title" | "transportationType">;
  bookingOptions?: TicketImageBookingOption[];
  bookingOptionsLoading?: boolean;
  hasBookings: boolean;
}

const formatUploadedAt = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TicketImageUpload({
  instanceId,
  activity,
  bookingOptions = [],
  bookingOptionsLoading = false,
  hasBookings,
}: TicketImageUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<TicketImageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState("");
  const [bookingReference, setBookingReference] = useState("");
  const [note, setNote] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    let active = true;

    const loadImages = async () => {
      setLoading(true);
      try {
        const result = await tourInstanceService.getTicketImages(instanceId, activity.id);
        if (active) {
          setImages(result);
          setInlineError(null);
        }
      } catch (error) {
        if (!active) return;
        const apiError = handleApiError(error);
        setInlineError(t(apiError.message, t("tourInstance.transport.ticketImages.loadError", "Could not load ticket images.")));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadImages();
    return () => {
      active = false;
    };
  }, [activity.id, instanceId, t]);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED_TICKET_IMAGE_TYPES.includes(file.type)) {
        return t(
          "tourInstance.transport.ticketImages.wrongFormat",
          "Wrong file format. Use JPEG, PNG, or WEBP.",
        );
      }
      if (file.size > MAX_TICKET_IMAGE_SIZE) {
        return t(
          "tourInstance.transport.ticketImages.fileTooLarge",
          "File too large. Maximum size is 10MB.",
        );
      }
      return null;
    },
    [t],
  );

  const handleSelectedFile = useCallback(
    (file?: File) => {
      if (!file) return;
      const error = validateFile(file);
      if (error) {
        setInlineError(error);
        toast.error(error);
        return;
      }
      setSelectedFile(file);
      setInlineError(null);
    },
    [validateFile],
  );

  const handleUpload = async () => {
    if (!hasBookings) return;
    if (!selectedFile) {
      const message = t(
        "tourInstance.transport.ticketImages.selectFileRequired",
        "Select a ticket image first.",
      );
      setInlineError(message);
      toast.error(message);
      return;
    }

    setUploading(true);
    setInlineError(null);
    try {
      const uploaded = await tourInstanceService.uploadTicketImage(instanceId, activity.id, {
        file: selectedFile,
        bookingId: bookingId || null,
        bookingReference,
        note,
      });
      if (uploaded) setImages((current) => [...current, uploaded]);
      setSelectedFile(null);
      setBookingId("");
      setBookingReference("");
      setNote("");
      toast.success(t("tourInstance.transport.ticketImages.uploadSuccess", "Ticket image uploaded."));
    } catch (error) {
      const apiError = handleApiError(error);
      const message = t(
        apiError.message,
        t("tourInstance.transport.ticketImages.uploadFailed", "Could not upload ticket image."),
      );
      setInlineError(message);
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    const confirmed = window.confirm(
      t("tourInstance.transport.ticketImages.confirmDelete", "Delete this ticket image?"),
    );
    if (!confirmed) return;

    setDeletingId(imageId);
    setInlineError(null);
    try {
      await tourInstanceService.deleteTicketImage(instanceId, activity.id, imageId);
      setImages((current) => current.filter((image) => image.id !== imageId));
      toast.success(t("tourInstance.transport.ticketImages.deleteSuccess", "Ticket image deleted."));
    } catch (error) {
      const apiError = handleApiError(error);
      const message = t(
        apiError.message,
        t("tourInstance.transport.ticketImages.deleteFailed", "Could not delete ticket image."),
      );
      setInlineError(message);
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const onDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleSelectedFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="mt-3 border-t border-cyan-100 pt-3">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-700">
            <Icon icon="heroicons:ticket" className="size-3" />
            {t("tourInstance.transport.ticketImages.title", "Ticket images")}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">
            {t(
              "tourInstance.transport.ticketImages.subtitle",
              "Attach flight, train, ferry, or other external ticket photos after customer booking.",
            )}
          </p>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
          {images.length} {t("tourInstance.transport.ticketImages.countLabel", "uploaded")}
        </span>
      </div>

      {!hasBookings && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t(
            "tourInstance.transport.ticketImages.noBookings",
            "Ticket upload is available after at least one customer booking exists.",
          )}
        </div>
      )}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TICKET_IMAGE_TYPES.join(",")}
            className="hidden"
            disabled={!hasBookings || uploading}
            onChange={(event) => handleSelectedFile(event.target.files?.[0])}
          />

          <label
            onDragOver={(event) => {
              event.preventDefault();
              if (hasBookings && !uploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-5 text-center transition-all active:scale-[0.99] ${
              hasBookings
                ? isDragging
                  ? "border-cyan-500 bg-cyan-50"
                  : "border-cyan-200 bg-white hover:border-cyan-400 hover:bg-cyan-50/50"
                : "cursor-not-allowed border-stone-200 bg-stone-50 opacity-70"
            }`}
            onClick={(event) => {
              event.preventDefault();
              if (hasBookings && !uploading) fileInputRef.current?.click();
            }}
          >
            {previewUrl ? (
              <div className="w-full">
                <div className="relative mx-auto aspect-[4/3] max-h-44 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={t("tourInstance.transport.ticketImages.previewAlt", "Selected ticket preview")}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-2 truncate text-xs font-medium text-stone-700">
                  {selectedFile?.name}
                </p>
              </div>
            ) : (
              <>
                <span className="flex size-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                  <Icon icon="heroicons:cloud-arrow-up" className="size-5" />
                </span>
                <span className="mt-3 text-sm font-semibold text-stone-800">
                  {t("tourInstance.transport.ticketImages.dropLabel", "Drop ticket image here")}
                </span>
                <span className="mt-1 text-xs text-stone-500">
                  {t("tourInstance.transport.ticketImages.dropHint", "JPEG, PNG, or WEBP up to 10MB")}
                </span>
              </>
            )}
          </label>

          <div className="grid gap-2">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-stone-600">
                {t("tourInstance.transport.ticketImages.booking", "Booking")}
              </span>
              <select
                value={bookingId}
                disabled={!hasBookings || uploading || bookingOptionsLoading}
                onChange={(event) => setBookingId(event.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed disabled:bg-stone-50"
              >
                <option value="">
                  {bookingOptionsLoading
                    ? t("common.loading", "Loading...")
                    : t("tourInstance.transport.ticketImages.bookingPlaceholder", "Group ticket / no specific booking")}
                </option>
                {bookingOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-stone-600">
                {t("tourInstance.transport.ticketImages.bookingReference", "Booking reference")}
              </span>
              <input
                value={bookingReference}
                disabled={!hasBookings || uploading}
                onChange={(event) => setBookingReference(event.target.value)}
                placeholder={t("tourInstance.transport.ticketImages.bookingReferencePlaceholder", "PNR, e-ticket, or train code")}
                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed disabled:bg-stone-50"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-stone-600">
                {t("tourInstance.transport.ticketImages.note", "Note")}
              </span>
              <textarea
                value={note}
                disabled={!hasBookings || uploading}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                placeholder={t("tourInstance.transport.ticketImages.notePlaceholder", "Passenger, leg, seat, or internal note")}
                className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 disabled:cursor-not-allowed disabled:bg-stone-50"
              />
            </label>

            {inlineError && (
              <p className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {inlineError}
              </p>
            )}

            <button
              type="button"
              disabled={!hasBookings || uploading}
              onClick={() => void handleUpload()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Icon
                icon={uploading ? "heroicons:arrow-path" : "heroicons:arrow-up-tray"}
                className={`size-3.5 ${uploading ? "animate-spin" : ""}`}
              />
              {uploading
                ? t("tourInstance.transport.ticketImages.uploading", "Uploading...")
                : t("tourInstance.transport.ticketImages.upload", "Upload ticket")}
            </button>
          </div>
        </div>

        <div className="min-h-40 rounded-lg border border-stone-200 bg-white">
          {loading ? (
            <div className="space-y-2 p-3">
              {[0, 1].map((item) => (
                <div key={item} className="flex animate-pulse gap-3">
                  <div className="size-16 rounded-lg bg-stone-100" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-1/2 rounded bg-stone-100" />
                    <div className="h-3 w-3/4 rounded bg-stone-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="flex h-full min-h-40 flex-col items-center justify-center px-4 py-8 text-center">
              <Icon icon="heroicons:photo" className="size-8 text-stone-300" />
              <p className="mt-2 text-sm font-semibold text-stone-700">
                {t("tourInstance.transport.ticketImages.empty", "No tickets uploaded yet")}
              </p>
              <p className="mt-1 text-xs text-stone-500">
                {t("tourInstance.transport.ticketImages.emptyPrompt", "Upload a ticket photo once the booking is paid.")}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {images.map((image) => (
                <li key={image.id} className="flex gap-3 p-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                    {image.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={image.imageUrl}
                        alt={image.originalFileName ?? t("tourInstance.transport.ticketImages.imageAlt", "Ticket image")}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Icon icon="heroicons:photo" className="absolute inset-0 m-auto size-6 text-stone-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-stone-800">
                          {image.originalFileName ?? t("tourInstance.transport.ticketImages.unnamed", "Ticket image")}
                        </p>
                        <p className="mt-0.5 text-[11px] text-stone-500">
                          {formatUploadedAt(image.uploadedAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={deletingId === image.id}
                        onClick={() => void handleDelete(image.id)}
                        aria-label={t("tourInstance.transport.ticketImages.delete", "Delete ticket image")}
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-stone-200 text-stone-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Icon
                          icon={deletingId === image.id ? "heroicons:arrow-path" : "heroicons:trash"}
                          className={`size-3.5 ${deletingId === image.id ? "animate-spin" : ""}`}
                        />
                      </button>
                    </div>
                    {(image.bookingReference || image.note) && (
                      <div className="mt-1 space-y-0.5 text-[11px] text-stone-600">
                        {image.bookingReference && (
                          <p>
                            <span className="font-semibold">
                              {t("tourInstance.transport.ticketImages.bookingReference", "Booking reference")}:
                            </span>{" "}
                            {image.bookingReference}
                          </p>
                        )}
                        {image.note && <p className="line-clamp-2">{image.note}</p>}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

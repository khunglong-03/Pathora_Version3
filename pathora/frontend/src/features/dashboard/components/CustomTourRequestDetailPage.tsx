"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icon, TourStatusBadge } from "@/components/ui";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { NormalizedTourInstanceDto } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";
import { formatDate } from "@/utils/format";

/* ── Animation Variants ───────────────────────────────────── */
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 100, damping: 20 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

/* ── Helpers ──────────────────────────────────────────────── */
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + " ₫";

export interface CustomTourRequestDetailPageProps {
  role?: "manager" | "tour-operator";
}

export default function CustomTourRequestDetailPage({
  role = "manager",
}: CustomTourRequestDetailPageProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [dataState, setDataState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const backHref =
    role === "tour-operator"
      ? "/tour-operator/custom-tour-requests"
      : "/manager/dashboard/custom-tour-requests";

  const instanceHref =
    role === "tour-operator"
      ? `/tour-operator/tour-instances/${id}`
      : `/manager/tour-instances/${id}`;

  const loadData = useCallback(async () => {
    try {
      setDataState("loading");
      setErrorMessage(null);
      const detail = await tourInstanceService.getInstanceDetail(id);
      setData(detail);
      setDataState("ready");
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      setData(null);
      setDataState("error");
      setErrorMessage(apiError.message);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData, reloadToken]);

  /* ── Loading ──────────────────────────────────────────────── */
  if (dataState === "loading") {
    return (
      <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
        <SkeletonCard />
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard lines={5} />
          <SkeletonCard lines={5} />
        </div>
        <SkeletonCard lines={4} />
      </main>
    );
  }

  /* ── Error ────────────────────────────────────────────────── */
  if (dataState === "error" || !data) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-xl rounded-[2.5rem] border border-stone-200 bg-white p-10 text-center shadow-md">
          <Icon
            icon="heroicons:exclamation-circle"
            className="mx-auto mb-3 size-12 text-red-400"
          />
          <p className="text-base font-semibold text-stone-900">
            Không thể tải thông tin yêu cầu
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm text-stone-500">{errorMessage}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
            >
              Thử lại
            </button>
            <Link
              href={backHref}
              className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Quay lại
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /* ── Ready ────────────────────────────────────────────────── */
  return (
    <main className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <motion.nav
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex items-center gap-2 text-sm text-stone-500"
        aria-label="Breadcrumb"
      >
        <Link
          href={backHref}
          className="flex items-center gap-1.5 hover:text-stone-800 transition-colors"
        >
          <Icon icon="heroicons:arrow-left" className="size-4" />
          Custom Tour Requests
        </Link>
        <Icon icon="heroicons:chevron-right" className="size-3.5" />
        <span className="text-stone-800 font-medium truncate max-w-[30ch]">
          {data.title || data.tourName}
        </span>
      </motion.nav>

      {/* ── Hero card ─────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="bg-white border border-stone-200/60 rounded-[2rem] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)]"
      >
        {/* Cover image */}
        <div className="w-full h-56 bg-stone-100 relative overflow-hidden">
          {data.thumbnail?.publicURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.thumbnail.publicURL}
              alt={data.title || data.tourName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <Icon icon="heroicons:photo" className="size-20" />
            </div>
          )}
          {/* Status badge overlay */}
          <div className="absolute top-4 right-4">
            <TourStatusBadge status={data.status} />
          </div>
        </div>

        {/* Title + meta */}
        <div className="p-6 space-y-2">
          <h1 className="text-2xl font-bold text-stone-900 leading-snug">
            {data.title || data.tourName}
          </h1>
          <p className="text-sm text-stone-400 font-mono">
            {data.tourInstanceCode}
          </p>
        </div>
      </motion.div>

      {/* ── Info grid ─────────────────────────────────────────── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {[
          {
            icon: "heroicons:calendar",
            label: "Ngày khởi hành",
            value: formatDate(data.startDate),
          },
          {
            icon: "heroicons:calendar-days",
            label: "Ngày kết thúc",
            value: formatDate(data.endDate),
          },
          {
            icon: "heroicons:clock",
            label: "Thời gian",
            value: `${data.durationDays} ngày`,
          },
          {
            icon: "heroicons:user-group",
            label: "Số khách",
            value: `${data.currentParticipation ?? 0}/${data.maxParticipation}`,
          },
          {
            icon: "heroicons:map-pin",
            label: "Địa điểm",
            value: data.location || "N/A",
          },
          {
            icon: "heroicons:banknotes",
            label: "Giá cơ bản",
            value: formatCurrency(data.basePrice ?? 0),
          },
        ].map(({ icon, label, value }) => (
          <motion.div
            key={label}
            variants={itemVariants}
            className="bg-stone-50 rounded-2xl p-4 space-y-1.5 border border-stone-100"
          >
            <div className="flex items-center gap-1.5 text-xs text-stone-400">
              <Icon icon={icon} className="size-3.5" />
              {label}
            </div>
            <p className="text-sm font-semibold text-stone-800">{value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Customization Notes ───────────────────────────────── */}
      {data.customizationNotes && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-2"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider">
            <Icon
              icon="heroicons:chat-bubble-left-ellipsis"
              className="size-4"
            />
            Ghi chú tuỳ chỉnh từ khách
          </div>
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
            {data.customizationNotes}
          </p>
        </motion.div>
      )}

      {/* ── Final price ───────────────────────────────────────── */}
      {data.finalSellPrice != null && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">
              Giá chốt (Co-design)
            </p>
            <p className="text-2xl font-bold text-green-700">
              {formatCurrency(data.finalSellPrice)}
            </p>
          </div>
          <Icon
            icon="heroicons:check-badge"
            className="size-10 text-green-400 opacity-60"
          />
        </motion.div>
      )}

      {/* ── Included services ─────────────────────────────────── */}
      {data.includedServices && data.includedServices.length > 0 && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="show"
          className="bg-white border border-stone-100 rounded-2xl p-5 space-y-3"
        >
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Dịch vụ bao gồm
          </p>
          <div className="flex flex-wrap gap-2">
            {data.includedServices.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 bg-stone-100 text-stone-700 text-sm rounded-xl"
              >
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Itinerary days ────────────────────────────────────── */}
      {data.days && data.days.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider px-1">
            Lịch trình ({data.days.length} ngày)
          </h2>
          {data.days.map((day, idx) => (
            <motion.div
              key={day.id ?? idx}
              variants={itemVariants}
              className="bg-white border border-stone-100 rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-stone-900">
                    {day.title}
                  </h3>
                  {day.actualDate && (
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDate(day.actualDate)}
                    </p>
                  )}
                  {day.description && (
                    <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">
                      {day.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Activities */}
              {day.activities && day.activities.length > 0 && (
                <div className="ml-11 space-y-2">
                  {day.activities.map((act, aIdx) => (
                    <div
                      key={act.id ?? aIdx}
                      className="flex items-start gap-2 bg-stone-50 rounded-xl p-3"
                    >
                      <Icon
                        icon="heroicons:bolt"
                        className="size-4 text-stone-400 mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800">
                          {act.title}
                        </p>
                        {act.note && (
                          <p className="text-xs text-stone-500 mt-0.5">
                            {act.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Footer actions ────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="show"
        className="flex items-center gap-3 pb-8"
      >
        <Link
          href={backHref}
          className="flex-1 px-4 py-3 rounded-2xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors text-center"
        >
          ← Quay lại danh sách
        </Link>
        <Link
          href={instanceHref}
          className="flex-1 px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Icon icon="heroicons:cog-6-tooth" className="size-4" />
          Quản lý Tour Instance
        </Link>
      </motion.div>
    </main>
  );
}

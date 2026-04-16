"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { Icon, TourStatusBadge } from "@/components/ui";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import {
  UpdateTourInstancePayload,
  tourInstanceService,
} from "@/api/services/tourInstanceService";
import { userService } from "@/api/services/userService";
import {
  NormalizedTourInstanceDto,
  UserInfo,
} from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";

type EditForm = {
  title: string;
  instanceType: string;
  startDate: string;
  endDate: string;
  maxParticipation: string;
  basePrice: string;
  location: string;
  confirmationDeadline: string;
  includedServices: string[];
  guideUserIds: string[];
  managerUserIds: string[];
  thumbnailUrl: string;
  imageUrls: string[];
};

const inputClassName =
  "w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20";

const toDateInput = (value?: string | null): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const toEditForm = (data: NormalizedTourInstanceDto): EditForm => ({
  title: data.title ?? "",
  instanceType: data.instanceType?.toLowerCase() === "private" ? "1" : "2",
  startDate: toDateInput(data.startDate),
  endDate: toDateInput(data.endDate),
  maxParticipation: String(data.maxParticipation ?? 0),
  basePrice: String(data.basePrice ?? 0),
  location: data.location ?? "",
  confirmationDeadline: toDateInput(data.confirmationDeadline),
  includedServices: data.includedServices ?? [],
  guideUserIds: (data.managers ?? [])
    .filter((m) => m.role === "Guide")
    .map((m) => m.userId),
  managerUserIds: (data.managers ?? [])
    .filter((m) => m.role === "Manager")
    .map((m) => m.userId),
  thumbnailUrl: data.thumbnail?.publicURL ?? "",
  imageUrls: (data.images ?? [])
    .map((image) => image.publicURL ?? "")
    .filter(Boolean),
});

/* (TourStatusBadge imported from @/components/ui) */

const formatCurrency = (value: number): string =>
  `${new Intl.NumberFormat("vi-VN").format(value)} VND`;

type InstanceDetailDataState = "loading" | "ready" | "error";

function ManagerChip({ name, avatar, role }: { name: string; avatar?: string | null; role: string }) {
  const isGuide = role === "Guide";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${isGuide ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={name}
          className="size-5 rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <Icon icon="heroicons:user" className="size-3" />
      )}
      <span className="max-w-32 truncate">{name}</span>
    </span>
  );
}

export default function TourInstanceDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [dataState, setDataState] = useState<InstanceDetailDataState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingDayId, setEditingDayId] = useState<string | null>(null);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [dayEditForm, setDayEditForm] = useState<Record<string, { title: string; description: string; actualDate: string; startTime: string; endTime: string; note: string }>>({});
  const [activityEditForm, setActivityEditForm] = useState<Record<string, { note: string; startTime: string; endTime: string; isOptional: boolean }>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [data, setData] = useState<NormalizedTourInstanceDto | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [showCreatedBanner, setShowCreatedBanner] = useState(false);
  const [addingDay, setAddingDay] = useState(false);
  const [newDayForm, setNewDayForm] = useState({
    title: "",
    actualDate: "",
    description: "",
  });

  // Check if navigated from creation and try to reuse POST response
  useEffect(() => {
    // Try to read full POST response from sessionStorage first
    try {
      const stored = sessionStorage.getItem("tourInstanceCreated");
      if (stored) {
        // New format: full TourInstanceDto as JSON string
        const parsed = JSON.parse(stored) as NormalizedTourInstanceDto;
        if (parsed && parsed.id === id) {
          setData(parsed);
          setForm(toEditForm(parsed));
          setShowCreatedBanner(true);
          setDataState("ready");
          sessionStorage.removeItem("tourInstanceCreated");
          // Auto-dismiss after 5 seconds
          const timer = setTimeout(() => setShowCreatedBanner(false), 5000);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Fall through to GET request
    }
  }, [id]);

  const participantRatio = useMemo(() => {
    if (!data || data.maxParticipation <= 0) return 0;
    return Math.min(
      100,
      Math.round((data.currentParticipation / data.maxParticipation) * 100),
    );
  }, [data]);

  const guides = useMemo(
    () => allUsers.filter((u) => !u.isDeleted),
    [allUsers],
  );

  const selectedGuides = useMemo(
    () => guides.filter((u) => (form?.guideUserIds ?? []).includes(u.id)),
    [guides, form?.guideUserIds],
  );

  const selectedManagers = useMemo(
    () => guides.filter((u) => (form?.managerUserIds ?? []).includes(u.id)),
    [guides, form?.managerUserIds],
  );

  const loadData = useCallback(async () => {
    try {
      setErrorMessage(null);
      const detail = await tourInstanceService.getInstanceDetail(id);
      setData(detail);
      setForm(detail ? toEditForm(detail) : null);
      setDataState("ready");
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(
        apiError.message ||
          t("tourInstance.fetchError", "Failed to load tour instance details"),
      );
      setData(null);
      setForm(null);
      setDataState("error");
      setErrorMessage(apiError.message);
    }
  }, [id, t]);

  const fetchUsers = useCallback(async () => {
    try {
      const users = await userService.getAll(undefined, 1, 100);
      setAllUsers(users ?? []);
    } catch {
      setAllUsers([]);
    }
  }, []);

  useEffect(() => {
    // Skip if data was already loaded from sessionStorage
    if (dataState !== "loading") return;
    let active = true;
    const doLoad = async () => {
      try {
        setErrorMessage(null);
        const detail = await tourInstanceService.getInstanceDetail(id);
        if (!active) return;
        setData(detail);
        setForm(detail ? toEditForm(detail) : null);
        setDataState("ready");
      } catch (error: unknown) {
        if (!active) return;
        const apiError = handleApiError(error);
        toast.error(
          apiError.message ||
            t(
              "tourInstance.fetchError",
              "Failed to load tour instance details",
            ),
        );
        setData(null);
        setForm(null);
        setDataState("error");
        setErrorMessage(apiError.message);
      }
    };
    void doLoad();
    return () => {
      active = false;
    };
  }, [id, t, reloadToken, dataState]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateField = <K extends keyof EditForm>(field: K, value: EditForm[K]) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setErrors((current) => {
      if (!current[field as string]) return current;
      const next = { ...current };
      delete next[field as string];
      return next;
    });
  };

  const updateListItem = (
    field: "includedServices" | "imageUrls",
    index: number,
    value: string,
  ) => {
    setForm((current) => {
      if (!current) return current;
      const items = [...current[field]];
      items[index] = value;
      return { ...current, [field]: items };
    });
  };

  const appendListItem = (field: "includedServices" | "imageUrls") => {
    setForm((current) => {
      if (!current) return current;
      return { ...current, [field]: [...current[field], ""] };
    });
  };

  const removeListItem = (
    field: "includedServices" | "imageUrls",
    index: number,
  ) => {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const toggleUser = (
    userId: string,
    field: "guideUserIds" | "managerUserIds",
  ) => {
    setForm((current) => {
      if (!current) return current;
      const currentIds = current[field];
      const next = currentIds.includes(userId)
        ? currentIds.filter((id) => id !== userId)
        : [...currentIds, userId];
      return { ...current, [field]: next };
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEditDay = (day: any) => {
    setEditingDayId(day.id);
    setEditingActivityId(null);
    setDayEditForm({
      title: day.title ?? "",
      description: day.description ?? "",
      actualDate: day.actualDate ? day.actualDate.split("T")[0] : "",
      startTime: day.startTime ?? "",
      endTime: day.endTime ?? "",
      note: day.note ?? "",
    });
  };

  const cancelEditDay = () => {
    setEditingDayId(null);
    setDayEditForm({});
  };

  const saveDay = async () => {
    if (!data || !editingDayId) return;
    const f = dayEditForm[editingDayId];
    if (!f) return;

    try {
      // Validate startTime < endTime when both are provided
      if (f.startTime && f.endTime && f.startTime >= f.endTime) {
        toast.error(t("tourInstance.validation.startTimeBeforeEndTime", "Giờ bắt đầu phải trước giờ kết thúc"));
        return;
      }
      const updated = await tourInstanceService.updateInstanceDay(data.id, editingDayId, {
        title: f.title,
        description: f.description || null,
        actualDate: f.actualDate ? f.actualDate + "T00:00:00Z" : "",
        startTime: f.startTime || null,
        endTime: f.endTime || null,
        note: f.note || null,
      });
      if (updated) {
        toast.success(t("tourInstance.dayUpdated", "Day updated successfully"));
        setEditingDayId(null);
        setDayEditForm({});
        await loadData();
      }
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || t("tourInstance.dayUpdateError", "Failed to update day"));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startEditActivity = (dayId: string, activity: any) => {
    setEditingDayId(dayId);
    setEditingActivityId(activity.id);
    setActivityEditForm({
      note: activity.note ?? "",
      startTime: activity.startTime ?? "",
      endTime: activity.endTime ?? "",
      isOptional: activity.isOptional ?? false,
    });
  };

  const cancelEditActivity = () => {
    setEditingActivityId(null);
    setActivityEditForm({});
  };

  const saveActivity = async () => {
    if (!data || !editingDayId || !editingActivityId) return;
    const f = activityEditForm[editingActivityId];
    if (!f) return;

    try {
      const updated = await tourInstanceService.updateInstanceActivity(
        data.id,
        editingDayId,
        editingActivityId,
        {
          note: f.note || null,
          startTime: f.startTime || null,
          endTime: f.endTime || null,
          isOptional: f.isOptional,
        },
      );
      if (updated) {
        toast.success(t("tourInstance.activityUpdated", "Activity updated successfully"));
        setEditingActivityId(null);
        setActivityEditForm({});
        await loadData();
      }
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || t("tourInstance.activityUpdateError", "Failed to update activity"));
    }
  };

  const saveNewDay = async () => {
    if (!data) return;
    if (!newDayForm.title.trim()) {
      toast.error(t("tourInstance.validation.titleRequired", "Title is required"));
      return;
    }
    if (!newDayForm.actualDate) {
      toast.error(t("tourInstance.validation.actualDateRequired", "Actual date is required"));
      return;
    }
    // Validate actualDate within instance date range
    if (data.startDate && data.endDate) {
      const startDate = data.startDate.split("T")[0];
      const endDate = data.endDate.split("T")[0];
      if (newDayForm.actualDate < startDate || newDayForm.actualDate > endDate) {
        toast.error(t("tourInstance.validation.dateOutOfRange", "Ngày thực tế phải nằm trong khoảng ngày bắt đầu và kết thúc của tour"));
        return;
      }
    }
    try {
      await tourInstanceService.addCustomDay(data.id, {
        title: newDayForm.title.trim(),
        actualDate: newDayForm.actualDate + "T00:00:00Z",
        description: newDayForm.description.trim() || undefined,
      });
      toast.success(t("tourInstance.dayAdded", "Day added successfully"));
      setAddingDay(false);
      setNewDayForm({ title: "", actualDate: "", description: "" });
      await loadData();
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      toast.error(apiError.message || t("tourInstance.dayAddError", "Failed to add day"));
    }
  };

  const handleCancelEdit = () => {
    if (!data) return;
    setForm(toEditForm(data));
    setErrors({});
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!data || !form) return;

    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) {
      newErrors.title = t(
        "tourInstance.validation.titleRequired",
        "Title is required",
      );
    }
    if (!form.startDate) {
      newErrors.startDate = t(
        "tourInstance.validation.startDateRequired",
        "Start date is required",
      );
    }
    if (!form.endDate) {
      newErrors.endDate = t(
        "tourInstance.validation.endDateRequired",
        "End date is required",
      );
    }
    if (!form.maxParticipation || Number(form.maxParticipation) <= 0) {
      newErrors.maxParticipation = t(
        "tourInstance.validation.maxParticipantsRequired",
        "Maximum participants must be greater than 0",
      );
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t("tourInstance.validationFailed", "Please fill in all required fields"));
      return;
    }

    try {
      setSaving(true);
      setErrors({});

      const includedServices = form.includedServices
        .map((service) => service.trim())
        .filter(Boolean);
      const imageUrls = form.imageUrls
        .map((url) => url.trim())
        .filter(Boolean);

      const payload: UpdateTourInstancePayload = {
        id: data.id,
        title: form.title.trim(),
        instanceType: Number(form.instanceType),
        startDate: form.startDate + "T00:00:00Z",
        endDate: form.endDate + "T00:00:00Z",
        maxParticipation: Number(form.maxParticipation),
        basePrice: Number(form.basePrice) || 0,
        location: form.location.trim() || undefined,
        confirmationDeadline: form.confirmationDeadline
          ? form.confirmationDeadline + "T00:00:00Z"
          : undefined,
        includedServices:
          includedServices.length > 0 ? includedServices : undefined,
        guideUserIds: form.guideUserIds,
        managerUserIds: form.managerUserIds,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };

      await tourInstanceService.updateInstance(payload);
      toast.success(
        t("tourInstance.updated", "Tour instance updated successfully!"),
      );

      await loadData();
      setIsEditing(false);
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      const isConflict = (error as { response?: { status?: number } })?.response?.status === 409
        || apiError.code === "TourInstance.ConcurrencyConflict";
      if (isConflict) {
        toast.error(
          t(
            "tourInstance.concurrencyConflict.message",
            "This tour instance was modified by another user. Please refresh and try again.",
          ),
        );
        await loadData();
      } else {
        toast.error(
          apiError.message || "Failed to update tour instance",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (dataState === "loading") {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <SkeletonCard />
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard lines={6} />
            <SkeletonCard lines={6} />
          </div>
        </div>
      </main>
    );
  }

  if (dataState === "error" || !data || !form) {
    return (
      <main className="p-6 md:p-8">
        <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-stone-200 bg-white p-8 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <Icon
            icon="heroicons:exclamation-circle"
            className="mx-auto mb-2 size-10 text-stone-400"
          />
          <p className="text-base font-semibold text-stone-900">
            {dataState === "error"
              ? t(
                  "tourInstance.form.error.title",
                  "Could not load tour instance",
                )
              : t("tourInstance.notFound", "Tour instance not found")}
          </p>
          {dataState === "error" && errorMessage && (
            <p className="mt-2 text-sm text-stone-500">{errorMessage}</p>
          )}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 active:scale-[0.98] transition-colors">
              {t("common.retry", "Retry")}
            </button>
            <Link
              href="/manager/tour-instances"
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-600 active:-translate-y-[1px] transition-all">
              <Icon icon="heroicons:arrow-left" className="size-4" />
              {t(
                "tourInstance.backToInstances",
                "Back to Tour Instances",
              )}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const guidesDisplay = (data.managers ?? []).filter((m) => m.role === "Guide");
  const managersDisplay = (data.managers ?? []).filter((m) => m.role === "Manager");

  return (
    <main className="p-6 md:p-8">
      {showCreatedBanner && (
        <div className="mx-auto max-w-6xl mb-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Icon icon="heroicons:check-circle" className="size-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">
                {t("tourInstance.createdBanner.title", "Tour instance created successfully!")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowCreatedBanner(false)}
              className="text-emerald-600 hover:text-emerald-800 transition-colors"
              aria-label={t("tourInstance.createdBanner.dismiss", "Dismiss")}
            >
              <Icon icon="heroicons:x-mark" className="size-4" />
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-[2.5rem] border border-stone-200 bg-white p-4 md:p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => router.push("/manager/tour-instances")}
                className="inline-flex items-center gap-1 text-sm font-semibold text-stone-600 hover:text-stone-900 active:-translate-y-[1px] transition-all">
                <Icon icon="heroicons:arrow-left" className="size-4" />
                {t("tourInstance.backToInstances", "Back to Tour Instances")}
              </button>
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                {data.title}
              </h1>
              <p className="text-sm text-stone-500">
                {data.tourName} &bull; {data.tourInstanceCode}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <TourStatusBadge status={data.status} />
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 active:scale-[0.98] transition-all">
                  <Icon icon="heroicons:pencil-square" className="size-4" />
                  {t("tourInstance.edit", "Edit")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-100 active:scale-[0.98] transition-all">
                    {t("tourInstance.cancel", "Cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] transition-all">
                    <Icon icon="heroicons:check" className="size-4" />
                    {saving
                      ? t("common.saving", "Saving...")
                      : t("common.save", "Save")}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {!isEditing ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-[2.5rem] border border-stone-200 bg-white p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  {t("tourInstance.participants", "Participants")}
                </p>
                <p className="mt-2 text-2xl font-bold text-stone-900">
                  {data.currentParticipation}/{data.maxParticipation}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{ width: `${participantRatio}%` }}
                  />
                </div>
              </article>
              <article className="rounded-[2.5rem] border border-stone-200 bg-white p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  {t("tourInstance.basePrice", "Base Price")}
                </p>
                <p className="mt-2 text-xl font-bold text-orange-500">
                  {formatCurrency(data.basePrice)}
                </p>
              </article>
              <article className="rounded-[2.5rem] border border-stone-200 bg-white p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  {t("tourInstance.totalBookings", "Total Bookings")}
                </p>
                <p className="mt-2 text-2xl font-bold text-stone-900">
                  {data.totalBookings}
                </p>
              </article>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <h2 className="text-base font-bold text-stone-900">
                  {t("tourInstance.tourInformation", "Tour Information")}
                </h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t("tourInstance.form.title", "Title")}
                    </dt>
                    <dd className="font-semibold text-stone-900">{data.title}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t(
                        "tourInstance.tourInstanceCode",
                        "Tour Instance Code",
                      )}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {data.tourInstanceCode}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t("tourInstance.instanceType", "Tour Instance Type")}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {data.instanceType}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t("tourInstance.classification", "Classification")}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {data.classificationName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t("tourInstance.location", "Location")}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {data.location || "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t("tourInstance.startDate", "Start Date")}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {toDateInput(data.startDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t("tourInstance.endDate", "End Date")}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {toDateInput(data.endDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t("tourInstance.maxParticipants", "Maximum Participants")}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {data.maxParticipation}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t(
                        "tourInstance.form.currentParticipation",
                        "Current participants",
                      )}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {data.currentParticipation}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-stone-100 pb-2">
                    <dt className="text-stone-500">
                      {t(
                        "tourInstance.confirmationDeadline",
                        "Confirmation Deadline",
                      )}
                    </dt>
                    <dd className="font-semibold text-stone-900">
                      {toDateInput(data.confirmationDeadline) || "—"}
                    </dd>
                  </div>
                  {data.cancellationReason && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-stone-500">
                        {t(
                          "tourInstance.form.cancellationReason",
                          "Cancellation reason",
                        )}
                      </dt>
                      <dd className="text-right font-semibold text-stone-700">
                        {data.cancellationReason}
                      </dd>
                    </div>
                  )}
                </dl>
              </article>

              <article className="rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <h2 className="text-base font-bold text-stone-900">
                  {t("tourInstance.guidesAndManagers", "Guides & Managers")}
                </h2>
                {guidesDisplay.length > 0 || managersDisplay.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {guidesDisplay.map((m) => (
                      <ManagerChip key={m.id} name={m.userName} avatar={m.userAvatar} role={m.role} />
                    ))}
                    {managersDisplay.map((m) => (
                      <ManagerChip key={m.id} name={m.userName} avatar={m.userAvatar} role={m.role} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-500">
                    {t("tourInstance.noGuidesOrManagers", "No guides or managers assigned")}
                  </p>
                )}

                <h3 className="mt-6 text-sm font-bold text-stone-900">
                  {t("tourInstance.includedServices", "Included Services")}
                </h3>
                {data.includedServices.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {data.includedServices.map((service) => (
                      <li
                        key={service}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                        {service}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-stone-500">—</p>
                )}
              </article>
            </section>

            {/* Transport & Hotel Provider Section */}
            <section className="grid gap-4 md:grid-cols-2">
              {/* Transport Provider */}
              <div className="rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Icon icon="heroicons:truck" className="size-5 text-cyan-600" />
                  {t("tourInstance.transportProvider", "Transport Provider")}
                </h2>
                {data.transportProviderName ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">{data.transportProviderName}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        data.transportApprovalStatus === 2
                          ? "bg-emerald-100 text-emerald-700"
                          : data.transportApprovalStatus === 3
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {data.transportApprovalStatus === 2
                          ? t("tourInstance.approved", "Đã duyệt")
                          : data.transportApprovalStatus === 3
                          ? t("tourInstance.rejected", "Từ chối")
                          : t("tourInstance.pending", "Chờ duyệt")}
                      </span>
                    </div>
                    {data.transportApprovalNote && (
                      <p className="text-xs text-stone-500 bg-stone-50 rounded-lg p-2">
                        <span className="font-medium">Ghi chú: </span>{data.transportApprovalNote}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-400 italic">
                    {t("tourInstance.noTransportProvider", "Chưa có đơn vị vận chuyển được phân công")}
                  </p>
                )}
              </div>

              {/* Hotel Provider */}
              <div className="rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px-40px_-15px_rgba(0,0,0,0.05)]">
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <Icon icon="heroicons:building-office" className="size-5 text-indigo-600" />
                  {t("tourInstance.hotelProvider", "Hotel Provider")}
                </h2>
                {data.hotelProviderName ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-stone-900">{data.hotelProviderName}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        data.hotelApprovalStatus === 2
                          ? "bg-emerald-100 text-emerald-700"
                          : data.hotelApprovalStatus === 3
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {data.hotelApprovalStatus === 2
                          ? t("tourInstance.approved", "Đã duyệt")
                          : data.hotelApprovalStatus === 3
                          ? t("tourInstance.rejected", "Từ chối")
                          : t("tourInstance.pending", "Chờ duyệt")}
                      </span>
                    </div>
                    {data.hotelApprovalNote && (
                      <p className="text-xs text-stone-500 bg-stone-50 rounded-lg p-2">
                        <span className="font-medium">Ghi chú: </span>{data.hotelApprovalNote}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-stone-400 italic">
                    {t("tourInstance.noHotelProvider", "Chưa có khách sạn được phân công")}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <h2 className="text-base font-bold text-stone-900">
                {t("tourInstance.form.media", "Media")}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.images.length > 0 ? (
                  data.images.map((image, index) => (
                    <div
                      key={`${image.publicURL}-${index}`}
                      className="overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                      {image.publicURL ? (
                        <img
                          src={image.publicURL}
                          alt={`${data.title} image ${index + 1}`}
                          className="h-36 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center text-stone-400">
                          <Icon icon="heroicons:photo" className="size-6" />
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-500">—</p>
                )}
              </div>
            </section>

            {/* Itinerary */}
            <section className="rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-stone-900">
                  {t("tourInstance.itinerary", "Itinerary")}
                </h2>
                <span className="text-xs text-stone-500">
                  {(data.days ?? []).length} {t("tourInstance.days", "days")}
                </span>
                {data.status === "available" && (
                  <button
                    type="button"
                    onClick={() => setAddingDay(!addingDay)}
                    className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-100">
                    {addingDay ? t("common.cancel", "Cancel") : t("tourInstance.addDay", "Thêm ngày")}
                  </button>
                )}
              </div>

              {/* Inline form for adding a new custom day */}
              {addingDay && (
                <div className="mb-4 space-y-3 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50 p-4">
                  <h4 className="text-sm font-semibold text-orange-700">
                    {t("tourInstance.addCustomDay", "Thêm ngày mới")}
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-600">
                        {t("tourInstance.form.title", "Title")} *
                      </label>
                      <input
                        type="text"
                        className={inputClassName}
                        value={newDayForm.title}
                        onChange={(e) => setNewDayForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder={t("tourInstance.form.titlePlaceholder", "VD: Tham quan tự do")}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-stone-600">
                        {t("tourInstance.form.actualDate", "Actual Date")} *
                      </label>
                      <input
                        type="date"
                        className={inputClassName}
                        value={newDayForm.actualDate}
                        onChange={(e) => setNewDayForm((f) => ({ ...f, actualDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-stone-600">
                      {t("tourInstance.form.description", "Description")}
                    </label>
                    <input
                      type="text"
                      className={inputClassName}
                      value={newDayForm.description}
                      onChange={(e) => setNewDayForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder={t("tourInstance.form.descriptionPlaceholder", "Mô tả ngày mới (tùy chọn)")}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingDay(false);
                        setNewDayForm({ title: "", actualDate: "", description: "" });
                      }}
                      className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100">
                      {t("common.cancel", "Cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={saveNewDay}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                      {t("tourInstance.confirmAddDay", "Thêm")}
                    </button>
                  </div>
                </div>
              )}
              {(!data.days || data.days.length === 0) ? (
                <p className="text-sm text-stone-500">
                  {t("tourInstance.noItinerary", "No itinerary available for this instance.")}
                </p>
              ) : (
                <div className="space-y-4">
                  {data.days.map((day) => (
                    <div key={day.id} className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                      <div className="flex items-center justify-between gap-3 p-4 bg-stone-50 border-b border-stone-200">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center size-8 rounded-full bg-orange-500 text-sm font-bold text-white">
                            {day.instanceDayNumber}
                          </span>
                          {editingDayId === day.id ? (
                            <div className="flex-1 grid gap-2 md:grid-cols-2">
                              <input
                                className={inputClassName}
                                value={dayEditForm[day.id]?.title ?? ""}
                                onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], title: e.target.value } }))}
                                placeholder={t("tourInstance.form.title", "Title")}
                              />
                              <input
                                type="date"
                                className={inputClassName}
                                value={dayEditForm[day.id]?.actualDate ?? ""}
                                onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], actualDate: e.target.value } }))}
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-stone-900">{day.title}</h3>
                              </div>
                              {day.actualDate && (
                                <p className="text-xs text-stone-500">
                                  {t("tourInstance.form.actualDate", "Actual Date")}:{" "}
                                  {new Date(day.actualDate).toLocaleDateString("vi-VN")}
                                  {day.startTime && ` ${day.startTime}`}
                                  {day.endTime && ` - ${day.endTime}`}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {editingDayId === day.id ? (
                            <>
                              <button
                                type="button"
                                onClick={cancelEditDay}
                                className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100">
                                {t("common.cancel", "Cancel")}
                              </button>
                              <button
                                type="button"
                                onClick={saveDay}
                                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                                {t("common.save", "Save")}
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditDay(day)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-3 py-1.5 text-xs font-semibold text-orange-500 hover:bg-orange-50">
                              <Icon icon="heroicons:pencil-square" className="size-3.5" />
                              {t("common.edit", "Edit")}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Day Edit Form */}
                      {editingDayId === day.id && dayEditForm[day.id] && (
                        <div className="p-4 space-y-3 border-b border-stone-200 bg-blue-50">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-stone-600">
                                {t("tourInstance.form.startTime", "Start Time")}
                              </label>
                              <input
                                type="time"
                                className={inputClassName}
                                value={dayEditForm[day.id]?.startTime ?? ""}
                                onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], startTime: e.target.value } }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-stone-600">
                                {t("tourInstance.form.endTime", "End Time")}
                              </label>
                              <input
                                type="time"
                                className={inputClassName}
                                value={dayEditForm[day.id]?.endTime ?? ""}
                                onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], endTime: e.target.value } }))}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-stone-600">
                              {t("tourInstance.form.description", "Description")}
                            </label>
                            <textarea
                              className={inputClassName + " resize-none"}
                              rows={2}
                              value={dayEditForm[day.id]?.description ?? ""}
                              onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], description: e.target.value } }))}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-stone-600">
                              {t("tourInstance.form.note", "Note")}
                            </label>
                            <input
                              className={inputClassName}
                              value={dayEditForm[day.id]?.note ?? ""}
                              onChange={(e) => setDayEditForm((f) => ({ ...f, [day.id]: { ...f[day.id], note: e.target.value } }))}
                              placeholder={t("tourInstance.form.notePlaceholder", "Admin note for this day...")}
                            />
                          </div>
                        </div>
                      )}

                      {!dayEditForm[day.id] && day.description && (
                        <p className="px-4 py-2 text-xs text-stone-600 border-b border-stone-100 bg-stone-50">
                          {day.description}
                        </p>
                      )}

                      {!dayEditForm[day.id] && day.note && (
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="text-xs text-stone-500">
                            <span className="font-medium">{t("tourInstance.form.note", "Note")}:</span> {day.note}
                          </p>
                        </div>
                      )}

                      {/* Activities */}
                      {day.activities && day.activities.length > 0 && (
                        <div className="p-4 space-y-2">
                          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                            {t("tourInstance.activities", "Activities")}
                          </p>
                          {day.activities.map((activity) => (
                            <div key={activity.id} className="rounded-xl border border-stone-100 p-3 hover:border-stone-300 transition-colors">
                              {editingActivityId === activity.id && activityEditForm[activity.id] ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-stone-900">{activity.title}</p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={cancelEditActivity}
                                        className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-600 hover:bg-stone-100">
                                        {t("common.cancel", "Cancel")}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={saveActivity}
                                        className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                                        {t("common.save", "Save")}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid gap-2 md:grid-cols-2">
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-stone-500">
                                        {t("tourInstance.form.startTime", "Start Time")}
                                      </label>
                                      <input
                                        type="time"
                                        className={inputClassName}
                                        value={activityEditForm[activity.id]?.startTime ?? ""}
                                        onChange={(e) => setActivityEditForm((f) => ({ ...f, [activity.id]: { ...f[activity.id], startTime: e.target.value } }))}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-stone-500">
                                        {t("tourInstance.form.endTime", "End Time")}
                                      </label>
                                      <input
                                        type="time"
                                        className={inputClassName}
                                        value={activityEditForm[activity.id]?.endTime ?? ""}
                                        onChange={(e) => setActivityEditForm((f) => ({ ...f, [activity.id]: { ...f[activity.id], endTime: e.target.value } }))}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-xs font-medium text-stone-500">
                                      {t("tourInstance.form.note", "Note")}
                                    </label>
                                    <input
                                      className={inputClassName}
                                      value={activityEditForm[activity.id]?.note ?? ""}
                                      onChange={(e) => setActivityEditForm((f) => ({ ...f, [activity.id]: { ...f[activity.id], note: e.target.value } }))}
                                      placeholder={t("tourInstance.form.activityNotePlaceholder", "Admin note for this activity...")}
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 text-xs text-stone-600">
                                    <input
                                      type="checkbox"
                                      checked={activityEditForm[activity.id]?.isOptional ?? false}
                                      onChange={(e) => setActivityEditForm((f) => ({ ...f, [activity.id]: { ...f[activity.id], isOptional: e.target.checked } }))}
                                      className="size-4 rounded border-stone-300 text-orange-500"
                                    />
                                    {t("tourInstance.optional", "Optional")}
                                  </label>
                                </div>
                              ) : (
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 shrink-0 inline-flex items-center justify-center size-6 rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                    {activity.order}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-sm font-medium text-stone-900">{activity.title}</p>
                                      {activity.isOptional && (
                                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                          {t("tourInstance.optional", "Optional")}
                                        </span>
                                      )}
                                    </div>
                                    {activity.description && (
                                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{activity.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                                      {activity.startTime && <span>{activity.startTime}</span>}
                                      {activity.endTime && <span> - {activity.endTime}</span>}
                                    </div>

                                    {/* Transport Info — Transportation activity */}
                                    {activity.activityType?.toLowerCase() === "transportation" && activity.routes && activity.routes.length > 0 && (
                                      <div className="mt-2 space-y-1.5 rounded-lg border border-cyan-100 bg-cyan-50/60 p-2.5">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 mb-1.5 flex items-center gap-1.5">
                                          <Icon icon="heroicons:truck" className="size-3" />
                                          {t("tourInstance.transport.vehicleInfo", "Thông tin xe")}
                                        </p>
                                        {activity.routes.map((route) => (
                                          <div key={route.id} className="space-y-1">
                                            {route.vehiclePlate ? (
                                              <div className="flex items-center gap-2">
                                                <Icon icon="heroicons:identification" className="size-3 text-cyan-600 shrink-0" />
                                                <span className="text-xs font-semibold text-stone-800 font-mono">{route.vehiclePlate}</span>
                                                {route.vehicleType && (
                                                  <span className="text-[10px] text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded">
                                                    {route.vehicleType}
                                                  </span>
                                                )}
                                                {route.seatCapacity && (
                                                  <span className="text-[10px] text-stone-500 flex items-center gap-0.5">
                                                    <Icon icon="heroicons:user-group" className="size-3" />
                                                    {route.seatCapacity}
                                                  </span>
                                                )}
                                                {route.vehicleBrand && (
                                                  <span className="text-[10px] text-stone-400">{route.vehicleBrand}{route.vehicleModel ? ` ${route.vehicleModel}` : ""}</span>
                                                )}
                                              </div>
                                            ) : (
                                              <p className="text-[10px] text-amber-600 italic">{t("tourInstance.transport.notAssigned", "Chưa có xe được phân công")}</p>
                                            )}
                                            {route.driverName && (
                                              <div className="flex items-center gap-2">
                                                <Icon icon="heroicons:user" className="size-3 text-cyan-600 shrink-0" />
                                                <span className="text-xs text-stone-700">{route.driverName}</span>
                                                {route.driverPhone && (
                                                  <span className="text-[10px] text-stone-400">{route.driverPhone}</span>
                                                )}
                                              </div>
                                            )}
                                            {(route.pickupLocation || route.dropoffLocation) && (
                                              <div className="space-y-0.5">
                                                {route.pickupLocation && (
                                                  <div className="flex items-start gap-1.5">
                                                    <Icon icon="heroicons:map-pin" className="size-3 text-emerald-600 mt-0.5 shrink-0" />
                                                    <div>
                                                      <span className="text-[10px] font-medium text-stone-500 uppercase">Điểm đón: </span>
                                                      <span className="text-xs text-stone-700">{route.pickupLocation}</span>
                                                    </div>
                                                  </div>
                                                )}
                                                {route.dropoffLocation && (
                                                  <div className="flex items-start gap-1.5">
                                                    <Icon icon="heroicons:map-pin" className="size-3 text-red-500 mt-0.5 shrink-0" />
                                                    <div>
                                                      <span className="text-[10px] font-medium text-stone-500 uppercase">Điểm trả: </span>
                                                      <span className="text-xs text-stone-700">{route.dropoffLocation}</span>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            {(route.departureTime || route.arrivalTime) && (
                                              <div className="flex items-center gap-3 text-[10px] text-stone-500">
                                                {route.departureTime && (
                                                  <span>Khởi hành: {new Date(route.departureTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                                                )}
                                                {route.arrivalTime && (
                                                  <span>Đến: {new Date(route.arrivalTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {activity.note && (
                                      <p className="text-xs text-stone-500 mt-1">
                                        <span className="font-medium">{t("tourInstance.form.note", "Note")}:</span> {activity.note}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => startEditActivity(day.id, activity)}
                                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2 py-1 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700">
                                    <Icon icon="heroicons:pencil" className="size-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="space-y-6 rounded-[2.5rem] border border-stone-200 bg-white p-5 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
            <h2 className="text-base font-bold text-stone-900">
              {t("tourInstance.form.editInformation", "Edit tour instance")}
            </h2>

            {/* Immutable fields — shown as read-only chips */}
            <div className="flex flex-wrap gap-2 rounded-xl border border-stone-100 bg-stone-50 p-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-600">
                <Icon icon="heroicons:lock-closed" className="size-3" />
                {t("tourInstance.instanceType", "Tour Instance Type")}: {data.instanceType}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-600">
                <Icon icon="heroicons:lock-closed" className="size-3" />
                {t("tourInstance.form.packageTour", "Package Tour")}: {data.tourName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-200 px-3 py-1 text-xs font-medium text-stone-600">
                <Icon icon="heroicons:lock-closed" className="size-3" />
                {t("tourInstance.classification", "Classification")}: {data.classificationName}
              </span>
              <p className="w-full text-xs text-stone-500">
                {t("tourInstance.immutableFields.note", "This field is locked after the instance is created")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">
                  {t("tourInstance.form.title", "Title")} *
                </label>
                <input
                  className={inputClassName}
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                />
                {errors.title && (
                  <p className="text-xs text-red-600">{errors.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">
                  {t("tourInstance.location", "Location")}
                </label>
                <input
                  className={inputClassName}
                  value={form.location}
                  onChange={(event) =>
                    updateField("location", event.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">
                  {t("tourInstance.instanceType", "Tour Instance Type")} *
                </label>
                <select
                  className={inputClassName}
                  value={form.instanceType}
                  onChange={(event) => updateField("instanceType", event.target.value)}>
                  <option value="1">{t("tourInstance.private", "Private")}</option>
                  <option value="2">{t("tourInstance.public", "Public")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">
                  {t("tourInstance.startDate", "Start Date")} *
                </label>
                <input
                  type="date"
                  className={inputClassName}
                  value={form.startDate}
                  onChange={(event) =>
                    updateField("startDate", event.target.value)
                  }
                />
                {errors.startDate && (
                  <p className="text-xs text-red-600">{errors.startDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">
                  {t("tourInstance.endDate", "End Date")} *
                </label>
                <input
                  type="date"
                  className={inputClassName}
                  value={form.endDate}
                  onChange={(event) =>
                    updateField("endDate", event.target.value)
                  }
                />
                {errors.endDate && (
                  <p className="text-xs text-red-600">{errors.endDate}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">
                  {t("tourInstance.maxParticipants", "Maximum Participants")} *
                </label>
                <input
                  type="number"
                  min={1}
                  className={inputClassName}
                  value={form.maxParticipation}
                  onChange={(event) =>
                    updateField("maxParticipation", event.target.value)
                  }
                />
                {errors.maxParticipation && (
                  <p className="text-xs text-red-600">
                    {errors.maxParticipation}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-700">
                  {t("tourInstance.basePrice", "Base Price")} *
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputClassName}
                  value={form.basePrice}
                  onChange={(event) =>
                    updateField("basePrice", event.target.value)
                  }
                />
                {errors.basePrice && (
                  <p className="text-xs text-red-600">{errors.basePrice}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.confirmationDeadline", "Confirmation Deadline")}
              </label>
              <input
                type="date"
                className={inputClassName}
                value={form.confirmationDeadline}
                onChange={(event) =>
                  updateField("confirmationDeadline", event.target.value)
                }
              />
            </div>

            {/* Guides */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.wizard.section.guides", "Guides")}
              </label>
              {selectedGuides.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedGuides.map((guide) => (
                    <span
                      key={guide.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
                      {guide.avatar ? (
                        <img
                          src={guide.avatar}
                          alt=""
                          className="size-5 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Icon icon="heroicons:user" className="size-3" />
                      )}
                      <span className="max-w-24 truncate">
                        {guide.fullName || guide.username || guide.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleUser(guide.id, "guideUserIds")}
                        className="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-orange-500 hover:text-orange-700">
                        <Icon icon="heroicons:x-mark" className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <select
                className={inputClassName}
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    toggleUser(e.target.value, "guideUserIds");
                  e.target.value = "";
                }}>
                <option value="">
                  {t("tourInstance.form.addGuide", "+ Add guide")}
                </option>
                {guides
                  .filter((u) => !form.guideUserIds.includes(u.id))
                  .map((guide) => (
                    <option key={guide.id} value={guide.id}>
                      {guide.fullName || guide.username || guide.email}
                    </option>
                  ))}
              </select>
            </div>

            {/* Managers */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.wizard.section.managers", "Managers")}
              </label>
              {selectedManagers.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {selectedManagers.map((mgr) => (
                    <span
                      key={mgr.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {mgr.avatar ? (
                        <img
                          src={mgr.avatar}
                          alt=""
                          className="size-5 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Icon icon="heroicons:user" className="size-3" />
                      )}
                      <span className="max-w-24 truncate">
                        {mgr.fullName || mgr.username || mgr.email}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleUser(mgr.id, "managerUserIds")}
                        className="ml-0.5 flex size-3.5 items-center justify-center rounded-full text-blue-500 hover:text-blue-700">
                        <Icon icon="heroicons:x-mark" className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <select
                className={inputClassName}
                value=""
                onChange={(e) => {
                  if (e.target.value)
                    toggleUser(e.target.value, "managerUserIds");
                  e.target.value = "";
                }}>
                <option value="">
                  {t("tourInstance.form.addManager", "+ Add manager")}
                </option>
                {guides
                  .filter((u) => !form.managerUserIds.includes(u.id))
                  .map((mgr) => (
                    <option key={mgr.id} value={mgr.id}>
                      {mgr.fullName || mgr.username || mgr.email}
                    </option>
                  ))}
              </select>
            </div>

            {/* Included Services */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.includedServices", "Included Services")}
              </label>
              <div className="space-y-2">
                {form.includedServices.map((service, index) => (
                  <div key={`service-${index}`} className="flex items-center gap-2">
                    <input
                      className={inputClassName}
                      value={service}
                      onChange={(event) =>
                        updateListItem(
                          "includedServices",
                          index,
                          event.target.value,
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        removeListItem("includedServices", index)
                      }
                      className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 whitespace-nowrap">
                      {t("common.remove", "Remove")}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendListItem("includedServices")}
                  className="rounded-xl border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-500 hover:bg-orange-50">
                  + {t("tourInstance.form.addService", "Add service")}
                </button>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-stone-700">
                {t("tourInstance.form.media", "Media")}
              </label>
              <div className="space-y-2">
                {form.imageUrls.map((url, index) => (
                  <div key={`image-${index}`} className="flex items-center gap-2">
                    <input
                      className={inputClassName}
                      value={url}
                      onChange={(event) =>
                        updateListItem("imageUrls", index, event.target.value)
                      }
                      placeholder={t(
                        "tourInstance.form.imageUrl",
                        "Image URL",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => removeListItem("imageUrls", index)}
                      className="rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 whitespace-nowrap">
                      {t("common.remove", "Remove")}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendListItem("imageUrls")}
                  className="rounded-xl border border-orange-200 px-3 py-2 text-sm font-semibold text-orange-500 hover:bg-orange-50">
                  + {t("tourInstance.form.addImage", "Add image")}
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

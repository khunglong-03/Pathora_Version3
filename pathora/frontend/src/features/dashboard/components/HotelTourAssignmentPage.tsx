"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, X, Bed } from "@phosphor-icons/react";
import { format } from "date-fns";
import { toast } from "react-toastify";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import TextInput from "@/components/ui/TextInput";
import Badge from "@/components/ui/Badge";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import Textarea from "@/components/ui/Textarea";

import { tourInstanceService } from "@/api/services/tourInstanceService";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type { AccommodationItem, RoomAvailability } from "@/api/services/hotelProviderService";
import { TourInstanceDto } from "@/types/tour";
import { buildProviderRoomOptions } from "@/utils/providerRoomOptions";
import { handleApiError } from "@/utils/apiResponse";
import { formatDate } from "@/utils/format";

/** Backend maps enum with `.ToString()` → `"Accommodation"`; older clients/tests may send `"8"`. */
const isAccommodationActivity = (activityType?: string | number | null) => {
  if (activityType == null) return false;
  const normalized = String(activityType).trim().toLowerCase();
  return normalized === "accommodation" || normalized === "8";
};

const getStatusLabel = (status?: string) => {
  if (!status) return "Chưa gửi";
  switch (status.toLowerCase()) {
    case "approved": return "Đã duyệt";
    case "rejected": return "Bị từ chối";
    case "pending": return "Chờ duyệt";
    default: return status;
  }
};

interface RoomAssignmentForm {
  [activityId: string]: {
    supplierId: string;
    roomType: string;
    roomCount: number;
    isSubmitting: boolean;
  };
}

interface HotelTourAssignmentPageProps {
  instanceId?: string;
  backUrl?: string;
  filterBookingId?: string;
}

export default function HotelTourAssignmentPage(props: HotelTourAssignmentPageProps) {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const instanceId = props.instanceId || (params.id as string);
  const backUrl = props.backUrl || "/hotel/tour-approvals";

  const [instance, setInstance] = useState<TourInstanceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<RoomAssignmentForm>({});
  const [inventory, setInventory] = useState<AccommodationItem[]>([]);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [hotelSuppliers, setHotelSuppliers] = useState<any[]>([]); // Using any to avoid importing SupplierItem if it's messy, but we can import it.
  const [accommodationsBySupplier, setAccommodationsBySupplier] = useState<Record<string, any[]>>({});
  const [providerSupplierIds, setProviderSupplierIds] = useState<string[]>([]);
  const inFlightActivitiesRef = useRef<Set<string>>(new Set());

  // Approval Modals
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [isApprovalActionLoading, setIsApprovalActionLoading] = useState(false);

  const providerRoomOptions = useMemo(
    () => buildProviderRoomOptions(inventory),
    [inventory],
  );
  const roomTypeOptions = useMemo(
    () =>
      providerRoomOptions.map((option) => ({
        value: option.roomType,
        label: option.label,
      })),
    [providerRoomOptions],
  );

  const fetchDetail = async () => {
    setIsLoading(true);
    try {
      const data = props.instanceId
        ? await tourInstanceService.getInstanceDetail(instanceId)
        : await tourInstanceService.getMyAssignedInstanceDetail(instanceId);
      if (data) {
        setInstance(data);
        let canonicalRoomOptions = buildProviderRoomOptions([]);
        
        // Only fetch inventory and availability if the user is a Hotel Provider (not passing instanceId)
        if (!props.instanceId) {
          try {
            const supplierInfo = await hotelProviderService.getSupplierInfo();
            setProviderSupplierIds(supplierInfo.map((s) => s.id));
            const invData = await hotelProviderService.getAccommodations();
            const availData = await hotelProviderService.getRoomAvailability(
              format(new Date(data.startDate), "yyyy-MM-dd"),
              format(new Date(data.endDate), "yyyy-MM-dd")
            );
            canonicalRoomOptions = buildProviderRoomOptions(invData || []);
            setInventory(invData || []);
            setAvailability(availData || []);
          } catch (e) {
            console.error("Failed to load inventory:", e);
          }
        } else {
          // Tour Operator view: Fetch hotel suppliers matching continent
          try {
            const { supplierService } = await import("@/api/services/supplierService");
            const suppliers = await supplierService.getSuppliers("Accommodation", data.continent);
            setHotelSuppliers(suppliers);
          } catch (e) {
            console.error("Failed to load suppliers:", e);
          }
        }

        // Initialize form state out of currently assigned accommodations
        const tempAssigns: RoomAssignmentForm = {};
        data.days?.forEach((day) => {
          day.activities?.forEach((act) => {
            if (isAccommodationActivity(act.activityType)) {
              tempAssigns[act.id] = {
                supplierId: act.accommodation?.supplierId ?? "",
                roomType:
                  act.accommodation?.roomType ??
                  canonicalRoomOptions[0]?.roomType ??
                  "",
                roomCount:
                  act.accommodation?.quantity && act.accommodation.quantity > 0
                    ? act.accommodation.quantity
                    : Math.max(1, Math.ceil((data.currentParticipation ?? 2) / 2)),
                isSubmitting: false,
              };
            }
          });
        });
        setAssignments(tempAssigns);

        if (props.instanceId) {
          const sids = Object.values(tempAssigns).map(a => a.supplierId).filter(id => id);
          const uniqueSids = Array.from(new Set(sids));
          if (uniqueSids.length > 0) {
            try {
              const { supplierService } = await import("@/api/services/supplierService");
              const accommsMap: Record<string, any[]> = {};
              await Promise.all(uniqueSids.map(async sid => {
                accommsMap[sid] = await supplierService.getSupplierAccommodations(sid);
              }));
              setAccommodationsBySupplier(accommsMap);
            } catch (e) {
              console.error("Failed to load supplier accommodations:", e);
            }
          }
        }
      }
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (instanceId) {
      fetchDetail();
    }
  }, [instanceId]);

  const accommodationActivities = useMemo(() => {
    if (!instance?.days) return [];
    
    const acts: Array<{
      dayId: string;
      dayNumber: number;
      date: string;
      activityId: string;
      title: string;
      description: string | null;
      price?: number | null;
      accommodation: any;
    }> = [];

    instance.days.forEach((day) => {
      day.activities?.forEach((act) => {
        if (isAccommodationActivity(act.activityType)) {
          if (!props.instanceId) {
            if (!act.accommodation?.supplierId || !providerSupplierIds.includes(act.accommodation.supplierId)) {
              return;
            }
          }
          acts.push({
            dayId: day.id,
            dayNumber: day.instanceDayNumber,
            date: day.actualDate,
            activityId: act.id,
            title: act.title,
            description: act.description,
            price: act.price,
            accommodation: act.accommodation,
          });
        }
      });
    });

    return acts;
  }, [instance, props.instanceId, providerSupplierIds]);

  const groupedAccommodationDays = useMemo(() => {
    const dayMap = new Map<number, {
      dayId: string;
      dayNumber: number;
      date: string;
      activities: typeof accommodationActivities;
    }>();

    accommodationActivities.forEach(act => {
      if (!dayMap.has(act.dayNumber)) {
        dayMap.set(act.dayNumber, {
          dayId: act.dayId,
          dayNumber: act.dayNumber,
          date: act.date,
          activities: []
        });
      }
      dayMap.get(act.dayNumber)!.activities.push(act);
    });

    return Array.from(dayMap.values()).sort((a, b) => a.dayNumber - b.dayNumber);
  }, [accommodationActivities]);

  const approvableActivityIds = useMemo(
    () => accommodationActivities.map((activity) => activity.activityId),
    [accommodationActivities],
  );

  const pendingApprovalCount = useMemo(
    () =>
      accommodationActivities.filter(
        (activity) =>
          activity.accommodation?.supplierId
          && activity.accommodation?.supplierApprovalStatus !== "Approved",
      ).length,
    [accommodationActivities],
  );

  const pendingApprovalActivities = useMemo(
    () =>
      accommodationActivities.filter(
        (activity) =>
          activity.accommodation?.supplierId
          && activity.accommodation?.supplierApprovalStatus !== "Approved",
      ),
    [accommodationActivities],
  );

  const inventorySummary = useMemo(() => {
    return providerRoomOptions.map((item) => {
      const itemAvailabilities = availability.filter(a => a.roomType === item.roomType);
      // blockedCount from API = all existing hard blocks (includes this tour's own blocks)
      const maxBlocked = itemAvailabilities.length > 0
        ? Math.max(...itemAvailabilities.map(a => a.blockedCount))
        : 0;
      const minAvailable = itemAvailabilities.length > 0
        ? Math.min(...itemAvailabilities.map(a => a.availableRooms))
        : item.totalRooms;

      // Rooms blocked specifically by activities in this current tour instance
      const blockedByThisTour = accommodationActivities
        .filter(act => act.accommodation?.roomType === item.roomType)
        .reduce((sum, act) => sum + (act.accommodation?.roomBlocksTotal ?? 0), 0);

      const percentage = item.totalRooms > 0 ? (minAvailable / item.totalRooms) * 100 : 0;
      let statusColor = "bg-success-100 text-success-800";
      if (percentage < 10) statusColor = "bg-danger-100 text-danger-800";
      else if (percentage <= 50) statusColor = "bg-warning-100 text-warning-800";

      return {
        ...item,
        minAvailable,
        maxBlocked,
        blockedByThisTour,
        statusColor,
      };
    });
  }, [availability, providerRoomOptions, accommodationActivities]);

  const { totalAccoms, assignedAccoms } = useMemo(() => {
    let total = 0;
    let assigned = 0;
    accommodationActivities.forEach(act => {
      total++;
      if (act.accommodation) {
        const blocks = act.accommodation.roomBlocksTotal ?? 0;
        const qty = act.accommodation.quantity ?? 0;
        if ((qty > 0 && blocks >= qty) || (qty === 0 && blocks > 0)) {
          assigned++;
        }
      }
    });
    return { totalAccoms: total, assignedAccoms: assigned };
  }, [accommodationActivities]);

  const progressPercent = totalAccoms > 0 ? (assignedAccoms / totalAccoms) * 100 : 0;

  /**
   * Số phòng thực tế còn có thể gán = availableRooms (từ API) + số block đang giữ cho activity này.
   * Lý do: API `availableRooms` đã trừ cả block của activity này rồi, nên cộng lại tránh double-count.
   */
  const getEffectiveAvailable = (actDate: string, roomType: string, ownBlocks: number): number | null => {
    const actDateStr = format(new Date(actDate), "yyyy-MM-dd");
    const availItem = availability.find(
      (a) => a.date.startsWith(actDateStr) && a.roomType === roomType
    );
    if (!availItem) return null;
    return availItem.availableRooms + ownBlocks;
  };

  const handleAssignmentChange = async (activityId: string, field: "supplierId" | "roomType" | "roomCount", value: string | number) => {
    if (field === "supplierId" && value) {
      const sid = value as string;
      if (!accommodationsBySupplier[sid]) {
        try {
          const { supplierService } = await import("@/api/services/supplierService");
          const accomms = await supplierService.getSupplierAccommodations(sid);
          setAccommodationsBySupplier(prev => ({ ...prev, [sid]: accomms }));
        } catch (e) {
          console.error("Failed to load supplier accommodations:", e);
        }
      }
      setAssignments((prev) => ({
        ...prev,
        [activityId]: {
          ...prev[activityId],
          supplierId: sid,
          roomType: "", // reset roomType when supplier changes
        },
      }));
      return;
    }

    setAssignments((prev) => ({
      ...prev,
      [activityId]: {
        ...prev[activityId],
        [field]: value,
      },
    }));
  };

  const handleAssignRoom = async (activityId: string) => {
    const currentState = assignments[activityId];
    if (!currentState) return;

    setAssignments((prev) => ({
      ...prev,
      [activityId]: { ...prev[activityId], isSubmitting: true },
    }));

    try {
      const res = await tourInstanceService.assignRoomToAccommodation(instanceId, activityId, {
        roomType: currentState.roomType,
        roomCount: currentState.roomCount,
      });

      if (res?.success) {
        toast.success(t("room_assigned_successfully") || "Room assigned successfully.");
        // Refresh detail to get updated assigned info
        await fetchDetail();
      } else {
        toast.error(t("failed_to_assign_room") || "Failed to assign room.");
      }
    } catch (error: any) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    } finally {
      setAssignments((prev) => ({
        ...prev,
        [activityId]: { ...prev[activityId], isSubmitting: false },
      }));
    }
  };

  const handleSetRequirements = async (activityId: string) => {
    const currentState = assignments[activityId];
    if (!currentState) return;
    if (inFlightActivitiesRef.current.has(activityId)) return;
    inFlightActivitiesRef.current.add(activityId);

    setAssignments((prev) => ({
      ...prev,
      [activityId]: { ...prev[activityId], isSubmitting: true },
    }));

    try {
      const res = await tourInstanceService.setAccommodationRequirements(instanceId, activityId, {
        supplierId: currentState.supplierId,
        roomType: currentState.roomType,
        quantity: currentState.roomCount,
      });

      if (res) {
        toast.success(t("requirements_set_successfully") || "Requirements set successfully.");
        await fetchDetail();
      }
    } catch (error: any) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    } finally {
      inFlightActivitiesRef.current.delete(activityId);
      setAssignments((prev) => ({
        ...prev,
        [activityId]: { ...prev[activityId], isSubmitting: false },
      }));
    }
  };

  const handleApprove = async () => {
    setIsApprovalActionLoading(true);
    try {
      await tourInstanceService.hotelApprove(
        instanceId,
        true,
        approvalNote,
        approvableActivityIds,
      );
      toast.success(t("tour_approved") || "Tour approved successfully");
      setIsApproveModalOpen(false);
      setApprovalNote("");
      await fetchDetail();
    } catch (error: any) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsApprovalActionLoading(true);
    try {
      await tourInstanceService.hotelApprove(
        instanceId,
        false,
        approvalNote,
        approvableActivityIds,
      );
      toast.success(t("tour_declined") || "Tour declined successfully");
      setIsDeclineModalOpen(false);
      setApprovalNote("");
      await fetchDetail();
    } catch (error: any) {
      const apiError = handleApiError(error);
      toast.error(t(apiError.message));
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

  // Derive aggregate hotel approval from per-accommodation supplier statuses
  const aggregateHotelApproval = useMemo(() => {
    if (accommodationActivities.length === 0) return 0; // NotAssigned
    const statuses = accommodationActivities.map((a) => a.accommodation?.supplierApprovalStatus ?? "NotAssigned");
    if (statuses.length === 0) return 0;
    if (statuses.some((s) => s === "Rejected")) return 3;
    if (statuses.every((s) => s === "Approved")) return 2;
    return 1; // Pending
  }, [accommodationActivities]);

  const isApproved = aggregateHotelApproval === 2;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="mb-4 text-slate-500">{t("tour_not_found", "Không tìm thấy tour")}</p>
        <Button variant="outline" onClick={() => router.push(backUrl)}>
          <ArrowLeft className="mr-2" /> {t("back_to_list", "Quay lại danh sách")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-8 md:py-10 space-y-8 bg-[#f9fafb] min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(backUrl)} className="-ml-3 mt-1 md:mt-0 shrink-0 hover:bg-slate-200/50 transition-colors">
            <ArrowLeft size={24} weight="bold" />
          </Button>
          <div className="min-w-0 flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-[11px] font-bold uppercase tracking-wider w-fit border border-indigo-100">
              <Bed size={14} weight="bold" />
              {t("accommodation_assignment", "Phân bổ lưu trú")}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 leading-none break-words">
              {instance.title}
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              {instance.tourInstanceCode} • {format(new Date(instance.startDate), "dd/MM/yyyy")} - {format(new Date(instance.endDate), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-12 md:pl-0">
          {aggregateHotelApproval === 1 && (
            <Badge className="bg-warning-500 text-white px-3 py-1 text-xs md:text-sm font-semibold tracking-wide uppercase rounded-full shadow-sm">{t("pending_approval", "Chờ duyệt")}</Badge>
          )}
          {aggregateHotelApproval === 2 && (
            <Badge className="bg-success-500 text-white px-3 py-1 text-xs md:text-sm font-semibold tracking-wide uppercase rounded-full shadow-sm">{t("approved", "Đã duyệt")}</Badge>
          )}
          {aggregateHotelApproval === 3 && (
            <Badge className="bg-danger-500 text-white px-3 py-1 text-xs md:text-sm font-semibold tracking-wide uppercase rounded-full shadow-sm">{t("rejected", "Bị từ chối")}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Info Column */}
        <div className="space-y-6 md:col-span-1">
          <Card className="p-6 lg:p-8 rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] bg-white">
            <h3 className="mb-6 text-xl font-semibold tracking-tight text-slate-800">{t("tour_summary", "Tóm tắt tour")}</h3>
            <dl className="space-y-4 text-sm md:text-base text-slate-600">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <dt>{t("participants", "Hành khách")}</dt>
                <dd className="font-semibold text-slate-900">{instance.currentParticipation} / {instance.maxParticipation}</dd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <dt>{t("duration", "Thời lượng")}</dt>
                <dd className="font-semibold text-slate-900">{instance.durationDays} ngày</dd>
              </div>
            </dl>
          </Card>

          {/* Action Card */}
          {aggregateHotelApproval === 1 && !props.instanceId && (
            <Card className="p-6 lg:p-8 rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] bg-white">
              <h3 className="mb-6 text-xl font-semibold tracking-tight text-slate-800">{t("action_required", "Yêu cầu xử lý")}</h3>
              <p className="mb-4 text-sm text-slate-600">
                Vui lòng xem xét các yêu cầu đặt phòng dưới đây và phản hồi đồng ý hoặc từ chối. Hệ thống sẽ tự động cấu hình việc gán phòng.
              </p>
              <p className="mb-4 text-xs font-medium text-slate-500">
                {pendingApprovalCount > 0
                  ? `Có ${pendingApprovalCount} hoạt động cần bạn duyệt.`
                  : "Tất cả đã được xử lý xong."}
              </p>
              {pendingApprovalActivities.length > 0 && (
                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Các hoạt động chờ duyệt
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {pendingApprovalActivities.map((activity) => (
                      <span
                        key={activity.activityId}
                        className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                      >
                        Ngày {activity.dayNumber}: {activity.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button 
                  variant="primary" 
                  className="w-full justify-center" 
                  onClick={() => setIsApproveModalOpen(true)}
                >
                  <Check className="mr-2" />{" "}
                  {t("approve_assignment", "Phê duyệt tất cả")}
                </Button>
                <Button variant="outline" className="w-full justify-center text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setIsDeclineModalOpen(true)}>
                  <X className="mr-2" />{" "}
                  {t("decline_tour", "Từ chối tất cả")}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Accommodation Activities Column */}
        <div className="space-y-6 md:col-span-2">
          {/* Inventory Summary Table */}
          {inventory.length > 0 && (
            <Card className="p-6 lg:p-8 rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] bg-white">
              <h3 className="mb-6 text-xl font-semibold tracking-tight text-slate-800">Tổng quan phòng của tôi</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Loại phòng</th>
                      <th className="px-4 py-3 text-center">Tổng phòng</th>
                      <th className="px-4 py-3 text-center">Đã block (tour này)</th>
                      <th className="px-4 py-3 text-center">Còn có thể gán</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inventorySummary.map((item) => {
                      // Effective available = API availableRooms + blocks owned by this tour
                      // (API already deducted this tour's blocks, so add them back to show real capacity)
                      const effectiveAvailable = item.minAvailable + item.blockedByThisTour;
                      const effectivePct = item.totalRooms > 0 ? (effectiveAvailable / item.totalRooms) * 100 : 0;
                      let effColor = "bg-success-100 text-success-800";
                      if (effectivePct < 10) effColor = "bg-danger-100 text-danger-800";
                      else if (effectivePct <= 40) effColor = "bg-warning-100 text-warning-800";
                      return (
                        <tr key={item.roomType}>
                          <td className="px-4 py-3 font-medium text-slate-700">{item.roomType}</td>
                          <td className="px-4 py-3 text-center text-slate-600">{item.totalRooms}</td>
                          <td className="px-4 py-3 text-center">
                            {item.blockedByThisTour > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/10">
                                {item.blockedByThisTour} phòng
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${effColor}`}>
                              {effectiveAvailable} / {item.totalRooms} phòng
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-slate-400">* &quot;Còn có thể gán&quot; = tổng phòng trống + phòng đang giữ cho tour này (để không bị trừ 2 lần)</p>
            </Card>
          )}

          {/* Progress Bar */}
          {!!props.instanceId && (
            <Card className="p-6 lg:p-8 rounded-[2rem] border border-slate-200/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] bg-white">
               <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-800">{t("assignment_progress", "Tiến độ phân bổ")}</h3>
                  <span className="text-sm font-medium text-slate-600">{assignedAccoms} / {totalAccoms} {t("assigned", "đã phân bổ")}</span>
               </div>
               <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-success-500' : 'bg-primary'}`} 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
               </div>
               {progressPercent === 100 && aggregateHotelApproval === 1 && (
                  <p className="mt-3 text-sm text-success-600 flex items-center gap-1.5 font-medium">
                    <Check size={16} weight="bold" /> {t("ready_to_approve", "Tất cả phòng đã được gán. Bạn có thể duyệt tour ngay.")}
                  </p>
               )}
            </Card>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 mb-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-indigo-100 rounded-xl">
                <Bed size={24} weight="bold" className="text-indigo-600 shrink-0" />
              </div>
              <span className="break-words leading-tight">{t("accommodation_requirements", "Yêu cầu lưu trú")}</span>
            </h2>
          </div>
          
          {groupedAccommodationDays.length === 0 ? (
            <Card className="p-12 text-center text-slate-500 rounded-[2rem] border border-slate-200/50 border-dashed bg-slate-50">
              <Bed size={48} className="mx-auto mb-4 text-slate-300" weight="light" />
              {t("no_accommodation_requirements", "Không có yêu cầu lưu trú nào cho tour này.")}
            </Card>
          ) : (
            groupedAccommodationDays.map((dayGroup) => (
              <div key={dayGroup.dayId} className="flex flex-col gap-6 mb-8">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col justify-center items-center bg-indigo-50 border border-indigo-100 rounded-xl p-3 min-w-[80px]">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Ngày</span>
                      <span className="text-2xl font-black text-indigo-700">{dayGroup.dayNumber}</span>
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-slate-800">{formatDate(dayGroup.date, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
                     <p className="text-sm text-slate-500">{dayGroup.activities.length} hoạt động lưu trú</p>
                   </div>
                </div>
                
                {dayGroup.activities.map((act) => {
              const state = assignments[act.activityId];
              // ✅ Phòng được coi là "đã gán đủ" chỉ khi roomBlocksTotal >= quantity (hard block tồn tại)
              const roomBlocks = act.accommodation?.roomBlocksTotal ?? 0;
              const requiredQty = act.accommodation?.quantity ?? 0;
              const isFullyBlocked = (requiredQty > 0 && roomBlocks >= requiredQty) || (requiredQty === 0 && roomBlocks > 0);
              // roomType đã được chọn (form đã điền) nhưng chưa chắc đã block đủ
              const hasRoomTypeSet = !!act.accommodation?.roomType;

              // Số phòng thực sự còn có thể gán cho activity này (loại trừ block của chính nó)
              const effectiveAvail = state
                ? getEffectiveAvailable(act.date, state.roomType, roomBlocks)
                : null;

              return (
                <Card
                  key={act.activityId}
                  className={`flex flex-col gap-4 p-6 lg:p-8 rounded-[2rem] border shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] sm:flex-row sm:items-start sm:justify-between transition-all duration-300 ${
                    isFullyBlocked
                      ? "ring-1 ring-emerald-200 border-emerald-200 bg-emerald-50/20"
                      : "border-slate-200/50 bg-white hover:border-slate-300/80 hover:shadow-md"
                  }`}
                >
                  {/* ── LEFT: Activity info ── */}
                  <div className="flex-1 min-w-0">
                    <div className="mb-1 flex items-center gap-2 flex-wrap">
                      <Badge className="bg-slate-200 text-slate-700 px-2.5 py-0.5 text-xs">Ngày {act.dayNumber}</Badge>
                      <span className="text-sm font-medium text-slate-500">{formatDate(act.date, { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                      {/* Trạng thái block */}
                      {isFullyBlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
                          <Check size={12} weight="bold" /> Đã gán đủ {roomBlocks}/{requiredQty} phòng
                        </span>
                      ) : hasRoomTypeSet ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20">
                          Mới gán {roomBlocks}/{requiredQty} phòng — chưa đủ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          Chưa gán phòng
                        </span>
                      )}
                    </div>

                    <h4 className="text-xl font-bold tracking-tight text-slate-800 leading-tight mt-1">{act.title}</h4>
                    <div className="mt-1 h-stack items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600">{(act.price || 0).toLocaleString("vi-VN")} đ</span>
                        <span className="text-xs text-slate-400 font-medium tracking-tight">giá dịch vụ</span>
                    </div>
                    {act.description && (
                      <p className="mt-2 text-sm text-slate-500 leading-relaxed line-clamp-2">{act.description}</p>
                    )}

                    {/* Current assignment summary */}
                    {hasRoomTypeSet && (
                      <div className="mt-4 flex gap-3 text-sm flex-wrap">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-3.5 py-2">
                          <Bed size={16} className="text-slate-400" />
                          <span className="text-slate-500 font-medium">Loại:</span>
                          <span className="font-bold text-slate-800">{act.accommodation?.roomType}</span>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-3.5 py-2">
                          <span className="text-slate-500 font-medium">Yêu cầu:</span>
                          <span className="font-bold text-slate-800">{requiredQty} phòng</span>
                        </div>
                        <div className={`inline-flex items-center gap-2 rounded-xl border shadow-sm px-3.5 py-2 ${
                          isFullyBlocked
                            ? "bg-emerald-50 border-emerald-200"
                            : "bg-amber-50 border-amber-200"
                        }`}>
                          <span className={`${isFullyBlocked ? "text-emerald-700/80" : "text-amber-700/80"} font-medium`}>Đã block:</span>
                          <span className={`font-bold ${
                            isFullyBlocked ? "text-emerald-800" : "text-amber-800"
                          }`}>
                            {roomBlocks} / {requiredQty}
                          </span>
                        </div>
                        {act.accommodation?.supplierApprovalStatus && (
                          <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 shadow-sm px-3.5 py-2">
                            <span className="text-slate-500 font-medium">Duyệt:</span>
                            <span className="font-bold text-slate-800">{getStatusLabel(act.accommodation?.supplierApprovalStatus)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── RIGHT: Assignment form ── */}
                  {state && !!props.instanceId && (
                    <div className="flex flex-col gap-3 sm:w-[300px] sm:flex-none">
                      {/* Tour Operator View */}
                          {act.accommodation?.supplierApprovalStatus === "Approved" ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                              <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                                <Check size={14} weight="bold" /> Yêu cầu đã được duyệt
                              </p>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-slate-500">Loại:</span>
                                <span className="font-semibold text-slate-800">{act.accommodation?.roomType}</span>
                                <span className="mx-1 text-slate-300">•</span>
                                <span className="text-slate-500">Yêu cầu:</span>
                                <span className="font-semibold text-emerald-700">{requiredQty} phòng</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col gap-3">
                                <div>
                                  <Select
                                    label="Khách sạn / Nhà cung cấp (Tùy chọn)"
                                    placeholder="Chọn khách sạn/nhà cung cấp..."
                                    options={[
                                      { value: "", label: "Chưa chọn (Chỉ đặt phòng)" },
                                      ...hotelSuppliers.map((s) => ({ value: s.id, label: s.name }))
                                    ]}
                                    value={state.supplierId}
                                    onChange={(e) => handleAssignmentChange(act.activityId, "supplierId", e.target.value)}
                                  />
                                </div>
                                <div className="flex items-end gap-3">
                                  <div className="flex-1">
                                    <Select
                                      label="Loại phòng"
                                      placeholder="Chọn loại phòng..."
                                      options={state.supplierId ? [
                                        { value: "", label: "Chọn loại phòng..." },
                                        ...(accommodationsBySupplier[state.supplierId] || []).map((a: any) => ({
                                          value: a.roomType,
                                          label: `${a.name || a.roomType} (${a.totalRooms} phòng)`,
                                        }))
                                      ] : [
                                        { value: "", label: "Chọn loại phòng cơ bản..." },
                                        { value: "Single", label: "Single (Phòng đơn)" },
                                        { value: "Double", label: "Double (Phòng đôi 1 giường to)" },
                                        { value: "Twin", label: "Twin (Phòng đôi 2 giường đơn)" },
                                        { value: "Triple", label: "Triple (Phòng 3 giường)" },
                                        { value: "Quad", label: "Quad (Phòng 4 giường)" },
                                        { value: "Family", label: "Family (Phòng gia đình)" },
                                        { value: "Suite", label: "Suite (Phòng cao cấp)" },
                                        { value: "Dormitory", label: "Dormitory (Phòng tập thể)" },
                                        { value: "Standard", label: "Standard (Phòng tiêu chuẩn)" },
                                        { value: "Deluxe", label: "Deluxe (Phòng sang trọng)" }
                                      ]}
                                      value={state.roomType}
                                      onChange={(e) => handleAssignmentChange(act.activityId, "roomType", e.target.value)}
                                    />
                                  </div>
                                  <div className="w-24">
                                    <TextInput
                                      label="Số phòng"
                                      placeholder="Số phòng..."
                                      type="number"
                                      min={1}
                                      value={state.roomCount.toString()}
                                      onChange={(e) => handleAssignmentChange(act.activityId, "roomCount", parseInt(e.target.value) || 1)}
                                    />
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="primary"
                                className="w-full justify-center !bg-amber-500 hover:!bg-amber-600 !text-white rounded-xl active:scale-[0.98] transition-all duration-200 border-none shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] font-semibold mt-1"
                                onClick={() => handleSetRequirements(act.activityId)}
                                disabled={state.isSubmitting || !state.roomType}
                              >
                                {state.isSubmitting ? "Đang lưu..." : "Lưu yêu cầu phòng"}
                              </Button>
                            </>
                          )}
                    </div>
                  )}
                </Card>
              );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmationDialog
        active={isApproveModalOpen}
        title={t("approve_tour", { defaultValue: "Approve Tour" })}
        message={t("approve_tour_confirm", {
          defaultValue:
            "Are you sure you want to approve this tour? Make sure all room assignments are correct before approving.",
        })}
        confirmLabel={t("approve", { defaultValue: "Approve" })}
        cancelLabel={t("cancel", { defaultValue: "Cancel" })}
        onConfirm={handleApprove}
        onClose={() => setIsApproveModalOpen(false)}
        isDestructive={false}
      >
        <div className="mt-4">
          <Textarea
            label={t("note_optional", { defaultValue: "Note (Optional)" })}
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
            placeholder="Add any internal notes..."
            row={3}
          />
        </div>
      </ConfirmationDialog>

      <ConfirmationDialog
        active={isDeclineModalOpen}
        title={t("decline_tour", { defaultValue: "Decline Tour" })}
        message={t("decline_tour_confirm", {
          defaultValue:
            "Are you sure you want to decline this tour? This will notify the tour manager and they will have to find another provider.",
        })}
        confirmLabel={t("decline", { defaultValue: "Decline" })}
        cancelLabel={t("cancel", { defaultValue: "Cancel" })}
        onConfirm={handleDecline}
        onClose={() => setIsDeclineModalOpen(false)}
        isDestructive={true}
      >
        <div className="mt-4">
          <Textarea
            label={t("reason_required", { defaultValue: "Reason (Required)" })}
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
            placeholder="Please provide a reason for declining..."
            row={3}
          />
        </div>
      </ConfirmationDialog>
    </div>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
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

interface RoomAssignmentForm {
  [activityId: string]: {
    roomType: string;
    roomCount: number;
    isSubmitting: boolean;
  };
}

export default function HotelTourAssignmentPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const instanceId = params.id as string;

  const [instance, setInstance] = useState<TourInstanceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<RoomAssignmentForm>({});
  const [inventory, setInventory] = useState<AccommodationItem[]>([]);
  const [availability, setAvailability] = useState<RoomAvailability[]>([]);

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
      const data = await tourInstanceService.getMyAssignedInstanceDetail(instanceId);
      if (data) {
        setInstance(data);
        let canonicalRoomOptions = buildProviderRoomOptions([]);
        
        try {
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

        // Initialize form state out of currently assigned accommodations
        const tempAssigns: RoomAssignmentForm = {};
        data.days?.forEach((day) => {
          day.activities?.forEach((act) => {
            if (act.activityType === "8") {
              tempAssigns[act.id] = {
                roomType:
                  act.accommodation?.roomType ??
                  canonicalRoomOptions[0]?.roomType ??
                  "",
                roomCount:
                  act.accommodation?.quantity ??
                  Math.ceil(data.currentParticipation / 2),
                isSubmitting: false,
              };
            }
          });
        });
        setAssignments(tempAssigns);
      }
    } catch (error) {
      toast.error(t("failed_to_load_details") || "Failed to load tour details");
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
      accommodation: any;
    }> = [];

    instance.days.forEach((day) => {
      day.activities?.forEach((act) => {
        if (act.activityType === "8") { // Accommodation
          acts.push({
            dayId: day.id,
            dayNumber: day.instanceDayNumber,
            date: day.actualDate,
            activityId: act.id,
            title: act.title,
            description: act.description,
            accommodation: act.accommodation,
          });
        }
      });
    });

    return acts;
  }, [instance]);

  const inventorySummary = useMemo(() => {
    return providerRoomOptions.map((item) => {
      const itemAvailabilities = availability.filter(a => a.roomType === item.roomType);
      const minAvailable = itemAvailabilities.length > 0 
        ? Math.min(...itemAvailabilities.map(a => a.availableRooms))
        : item.totalRooms;
        
      const percentage = (minAvailable / item.totalRooms) * 100;
      let statusColor = "bg-success-100 text-success-800";
      if (percentage < 10) statusColor = "bg-danger-100 text-danger-800";
      else if (percentage <= 50) statusColor = "bg-warning-100 text-warning-800";
      
      return {
        ...item,
        minAvailable,
        statusColor
      };
    });
  }, [availability, providerRoomOptions]);

  const { totalAccoms, assignedAccoms } = useMemo(() => {
    let total = 0;
    let assigned = 0;
    accommodationActivities.forEach(act => {
      total++;
      if (act.accommodation) {
        const blocks = act.accommodation.roomBlocksTotal ?? 0;
        if (blocks >= act.accommodation.quantity) {
          assigned++;
        }
      }
    });
    return { totalAccoms: total, assignedAccoms: assigned };
  }, [accommodationActivities]);

  const progressPercent = totalAccoms > 0 ? (assignedAccoms / totalAccoms) * 100 : 0;

  const handleAssignmentChange = (activityId: string, field: "roomType" | "roomCount", value: string | number) => {
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
      const msg = error?.response?.data?.title || t("failed_to_assign_room");
      toast.error(msg);
    } finally {
      setAssignments((prev) => ({
        ...prev,
        [activityId]: { ...prev[activityId], isSubmitting: false },
      }));
    }
  };

  const handleApprove = async () => {
    setIsApprovalActionLoading(true);
    try {
      await tourInstanceService.hotelApprove(instanceId, true, approvalNote);
      toast.success(t("tour_approved") || "Tour approved successfully");
      setIsApproveModalOpen(false);
      setApprovalNote("");
      await fetchDetail();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.response?.data?.title || t("failed_to_approve");
      toast.error(msg);
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setIsApprovalActionLoading(true);
    try {
      await tourInstanceService.hotelApprove(instanceId, false, approvalNote);
      toast.success(t("tour_declined") || "Tour declined successfully");
      setIsDeclineModalOpen(false);
      setApprovalNote("");
      await fetchDetail();
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.response?.data?.title || t("failed_to_decline");
      toast.error(msg);
    } finally {
      setIsApprovalActionLoading(false);
    }
  };

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
        <p className="mb-4 text-slate-500">{t("tour_not_found") || "Tour not found"}</p>
        <Button variant="outline" onClick={() => router.push("/hotel/tour-approvals")}>
          <ArrowLeft className="mr-2" /> {t("back_to_list") || "Back to list"}
        </Button>
      </div>
    );
  }

  const isApproved = instance.hotelApprovalStatus === 2; // Assuming 1 = Pending, 2 = Approved, 3 = Rejected

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/hotel/tour-approvals")} className="-ml-3">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{instance.title}</h1>
            <p className="text-sm text-slate-500">
              {instance.tourInstanceCode} • {format(new Date(instance.startDate), "MMM dd, yyyy")} - {format(new Date(instance.endDate), "MMM dd, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {instance.hotelApprovalStatus === 1 && (
            <Badge className="bg-warning-500 text-white px-2.5 py-0.5 text-xs">{t("pending_approval") || "Pending Approval"}</Badge>
          )}
          {instance.hotelApprovalStatus === 2 && (
            <Badge className="bg-success-500 text-white px-2.5 py-0.5 text-xs">{t("approved") || "Approved"}</Badge>
          )}
          {instance.hotelApprovalStatus === 3 && (
            <Badge className="bg-danger-500 text-white px-2.5 py-0.5 text-xs">{t("rejected") || "Rejected"}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Info Column */}
        <div className="space-y-6 md:col-span-1">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-slate-800">{t("tour_summary") || "Tour Summary"}</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">{t("participants") || "Participants"}</dt>
                <dd className="font-medium">{instance.currentParticipation} / {instance.maxParticipation}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">{t("duration") || "Duration"}</dt>
                <dd className="font-medium">{instance.durationDays} {t("days", { count: instance.durationDays })}</dd>
              </div>
            </dl>
          </Card>

          {/* Action Card */}
          {instance.hotelApprovalStatus === 1 && (
            <Card className="p-5">
              <h3 className="mb-4 font-semibold text-slate-800">{t("action_required") || "Action Required"}</h3>
              <p className="mb-4 text-sm text-slate-600">
                {t("review_rooms_desc") || "Please assign room availability for each accommodation requirement before approving this tour."}
              </p>
              <div className="flex flex-col gap-3">
                <Button variant="primary" className="w-full justify-center" onClick={() => setIsApproveModalOpen(true)}>
                  <Check className="mr-2" /> {t("approve_assignment") || "Approve Tour"}
                </Button>
                <Button variant="outline" className="w-full justify-center text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setIsDeclineModalOpen(true)}>
                  <X className="mr-2" /> {t("decline_tour") || "Decline Tour"}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Accommodation Activities Column */}
        <div className="space-y-6 md:col-span-2">
          {/* Inventory Summary Table */}
          {inventory.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-4 font-semibold text-slate-800">{t("inventory_summary") || "Room Inventory Summary"}</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-3">Room Type</th>
                      <th className="px-4 py-3 text-center">Total</th>
                      <th className="px-4 py-3 text-center">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {inventorySummary.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-slate-700">{item.roomType}</td>
                        <td className="px-4 py-3 text-center">{item.totalRooms}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.statusColor}`}>
                            {item.minAvailable} / {item.totalRooms}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Progress Bar */}
          <Card className="p-5">
             <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-800">{t("assignment_progress") || "Assignment Progress"}</h3>
                <span className="text-sm font-medium text-slate-600">{assignedAccoms} / {totalAccoms} {t("assigned") || "Assigned"}</span>
             </div>
             <div className="w-full bg-slate-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-success-500' : 'bg-primary'}`} 
                  style={{ width: `${progressPercent}%` }}
                ></div>
             </div>
             {progressPercent === 100 && instance.hotelApprovalStatus === 1 && (
                <p className="mt-3 text-sm text-success-600 flex items-center gap-1.5 font-medium">
                  <Check size={16} weight="bold" /> {t("ready_to_approve") || "All rooms are assigned. You can now approve the tour."}
                </p>
             )}
          </Card>

          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Bed size={24} className="text-primary-600" />
            {t("accommodation_requirements") || "Accommodation Requirements"}
          </h2>
          
          {accommodationActivities.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              {t("no_accommodation_requirements") || "No accommodation requirements for this tour."}
            </Card>
          ) : (
            accommodationActivities.map((act) => {
              const state = assignments[act.activityId];
              const isAssigned = !!act.accommodation?.roomType;

              return (
                <Card key={act.activityId} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge className="bg-slate-200 text-slate-700 px-2.5 py-0.5 text-xs">Day {act.dayNumber}</Badge>
                      <span className="text-sm font-medium text-slate-500">{format(new Date(act.date), "EEE, MMM dd, yyyy")}</span>
                    </div>
                    <h4 className="font-semibold text-slate-800">{act.title}</h4>
                    {act.description && (
                      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{act.description}</p>
                    )}
                    
                    {isAssigned && (
                      <div className="mt-3 flex gap-4 text-sm flex-wrap">
                        <div className="rounded-md bg-slate-50 px-3 py-1.5">
                          <span className="text-slate-500 mr-2">Assigned Room:</span>
                          <span className="font-medium text-slate-800">{act.accommodation.roomType}</span>
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-1.5">
                          <span className="text-slate-500 mr-2">Qty:</span>
                          <span className="font-medium text-slate-800">{act.accommodation.quantity}</span>
                        </div>
                        <div className="rounded-md bg-slate-50 px-3 py-1.5">
                          <span className="text-slate-500 mr-2">Blocks:</span>
                          <span className={`font-medium ${act.accommodation.roomBlocksTotal && act.accommodation.roomBlocksTotal >= act.accommodation.quantity ? 'text-success-600' : 'text-danger-600'}`}>
                              {act.accommodation.roomBlocksTotal ?? 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {instance.hotelApprovalStatus === 1 && state && (
                    <div className="flex flex-col gap-3 sm:w-[320px] sm:flex-none">
                      {/* Availability Badge */}
                      {(() => {
                        const actDateStr = format(new Date(act.date), "yyyy-MM-dd");
                        const availItem = availability.find(
                          (a) =>
                            a.date.startsWith(actDateStr) &&
                            a.roomType === state.roomType
                        );
                        if (availItem) {
                          const isError = availItem.availableRooms === 0;
                          const isWarn = availItem.availableRooms > 0 && availItem.availableRooms < state.roomCount;
                          return (
                            <div className="flex justify-end">
                              <Badge className={`px-2 py-0.5 text-xs ${isError ? 'bg-danger-100 text-danger-700' : isWarn ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700'}`}>
                                {isError 
                                  ? "Hết phòng" 
                                  : isWarn 
                                  ? `⚠️ Chỉ còn ${availItem.availableRooms}/${availItem.totalRooms}` 
                                  : `Còn ${availItem.availableRooms}/${availItem.totalRooms} phòng`}
                              </Badge>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      <div className="flex items-end gap-3 flex-1">
                        <div className="flex-1">
                          <Select
                            label="Room Type"
                            options={roomTypeOptions}
                            value={state.roomType}
                            onChange={(e) => handleAssignmentChange(act.activityId, "roomType", e.target.value)}
                          />
                        </div>
                        <div className="w-20">
                          <TextInput
                            label="Qty"
                            type="number"
                            min={1}
                            value={state.roomCount.toString()}
                            onChange={(e) => handleAssignmentChange(act.activityId, "roomCount", parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <Button 
                          variant={isAssigned ? "outline" : "primary"}
                          onClick={() => handleAssignRoom(act.activityId)}
                          disabled={state.isSubmitting}
                        >
                          {isAssigned ? "Update" : "Assign"}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>

      <ConfirmationDialog
        active={isApproveModalOpen}
        title={t("approve_tour") || "Approve Tour"}
        message={t("approve_tour_confirm") || "Are you sure you want to approve this tour? Make sure all room assignments are correct before approving."}
        confirmLabel={t("approve") || "Approve"}
        cancelLabel={t("cancel") || "Cancel"}
        onConfirm={handleApprove}
        onClose={() => setIsApproveModalOpen(false)}
        isDestructive={false}
      >
        <div className="mt-4">
          <Textarea
            label={t("note_optional") || "Note (Optional)"}
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
            placeholder="Add any internal notes..."
            row={3}
          />
        </div>
      </ConfirmationDialog>

      <ConfirmationDialog
        active={isDeclineModalOpen}
        title={t("decline_tour") || "Decline Tour"}
        message={t("decline_tour_confirm") || "Are you sure you want to decline this tour? This will notify the tour manager and they will have to find another provider."}
        confirmLabel={t("decline") || "Decline"}
        cancelLabel={t("cancel") || "Cancel"}
        onConfirm={handleDecline}
        onClose={() => setIsDeclineModalOpen(false)}
        isDestructive={true}
      >
        <div className="mt-4">
          <Textarea
            label={t("reason_required") || "Reason (Required)"}
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

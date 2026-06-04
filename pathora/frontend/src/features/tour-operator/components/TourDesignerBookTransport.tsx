"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Bus, MapPin, Clock, Users, Star, Ticket, WarningCircle, ShieldCheck } from "@phosphor-icons/react";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService, AdminBookingListResponse } from "@/api/services/bookingService";
import { NormalizedTourInstanceDto, TourInstanceDayActivityDto } from "@/types/tour";
import { isQualifiedBooking, calculateBookingPax, getFulfillmentActivities, isActivityExternalTransport } from "../utils/fulfillmentHelpers";
import ExternalTicketAssignmentPanel from "@/features/dashboard/components/ExternalTicketAssignmentPanel";
import SupplierReassignmentModal from "@/features/dashboard/components/SupplierReassignmentModal";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export function TourOperatorBookTransport({ instanceId, backUrl }: { instanceId: string; backUrl?: string }) {
  const { t } = useTranslation();
  const [instance, setInstance] = useState<NormalizedTourInstanceDto | null>(null);
  const [bookings, setBookings] = useState<AdminBookingListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reassignActivity, setReassignActivity] = useState<TourInstanceDayActivityDto | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [instanceData, bookingsData] = await Promise.all([
          tourInstanceService.getInstanceDetail(instanceId),
          bookingService.getBookingsByTourInstance(instanceId)
        ]);
        
        if (isMounted) {
          setInstance(instanceData as any);
          setBookings(bookingsData.filter(isQualifiedBooking));
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError(t("failed_load_transport", "Failed to load transportation details"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [instanceId, refreshKey, t]);

  if (loading) return <div className="min-h-screen bg-[#f9fafb] p-8 max-w-[1200px] mx-auto"><SkeletonCard /></div>;
  if (error || !instance) return <div className="min-h-screen bg-[#f9fafb] p-8 text-rose-500 font-medium center">{error || t("instance_not_found", "Tour instance not found")}</div>;

  const { transportActivities } = getFulfillmentActivities(instance);
  
  const externalTransports = transportActivities.filter(isActivityExternalTransport);
  const groundTransports = transportActivities.filter(a => !isActivityExternalTransport(a));

  const totalPax = bookings.reduce((sum, b) => sum + calculateBookingPax(b), 0);

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <Link
          href={backUrl || `/tour-operator/tour-instances/${instanceId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          {t("back_to_tour_instance", "Back to Tour Details")}
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100/50 backdrop-blur-sm">
              <Bus weight="bold" className="size-4" />
              {t("transportation_label", "Transportation")}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              {t("transport_fulfillment", "Transportation Fulfillment")}
            </h1>
            <p className="text-slate-500 mt-3 font-medium">
              {t("tour_label", { name: instance.tourName })} &bull; {t("required_pax_label", { count: totalPax })}
            </p>
          </div>
        </div>

        {transportActivities.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-200/50 p-16 center text-slate-500 font-semibold shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] text-center">
            {t("no_transportation_activities", "No transportation activities are planned for this tour.")}
          </div>
        ) : (
          <div className="space-y-12">
            {externalTransports.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Ticket weight="bold" className="text-blue-500 size-5" />
                  {t("external_tickets_section", "External Tickets (Flight, Train, Ferry)")}
                </h3>
                {externalTransports.map((act: any, idx: number) => (
                  <ExternalTicketAssignmentPanel
                    key={(act as any).id || `ext-${idx}`}
                    activityId={(act as any).id}
                    instanceId={instanceId}
                    activityTitle={act.title}
                    transportType={(act.transportationType ?? act.transportationName ?? "Other") as any}
                    bookings={bookings}
                    activityDate={act.actualDate || instance.startDate} // Pass relevant date
                    activityStartTime={act.startTime}
                    activityEndTime={act.endTime}
                    onSave={async (entry) => {
                      await tourInstanceService.saveBookingTicket(instanceId, (act as any).id, {
                        bookingId: entry.bookingId,
                        flightNumber: entry.flightNumber,
                        departureAt: entry.departureAt ? new Date(entry.departureAt).toISOString() : null,
                        arrivalAt: entry.arrivalAt ? new Date(entry.arrivalAt).toISOString() : null,
                        seatNumbers: entry.seatNumbers,
                        eTicketNumbers: entry.eTicketNumbers,
                        seatClass: entry.seatClass,
                        note: entry.note,
                      });
                      console.info("[PrivateTour] Ticket saved for booking", entry.bookingId, "activity", (act as any).id);
                      setRefreshKey(prev => prev + 1);
                    }}
                    onConfirmAll={async (dep, arr) => {
                      await tourInstanceService.confirmExternalTransport(instanceId, (act as any).id, true, dep, arr);
                      setRefreshKey(prev => prev + 1);
                    }}
                  />
                ))}
              </div>
            )}

            {groundTransports.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Bus weight="bold" className="text-emerald-500 size-5" />
                  {t("ground_transport_section", "Ground Transport (Bus, Taxi)")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {groundTransports.map((act: any, idx: number) => (
                    <div key={(act as any).id || `gnd-${idx}`} className="bg-white rounded-[2rem] border border-slate-200/50 p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:border-slate-300/80 hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 leading-snug">{act.title}</h4>
                          <p className="text-sm font-medium text-slate-500 mt-1">{act.transportationName}</p>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${
                          act.transportationApprovalStatus === 'Approved' 
                            ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50' 
                            : 'bg-amber-50/80 text-amber-700 border-amber-200/50'
                        }`}>
                          {act.transportationApprovalStatus === 'Approved' ? t("transportation_approved", "Approved") : t("transport_pending", "Pending")}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6 py-5 border-y border-slate-100/80">
                        <div>
                          <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-bold">{t("supplier_label_short", "Supplier")}</p>
                          <p className="text-sm font-bold text-slate-800 leading-tight">{act.transportSupplierName || t("transport_not_assigned", "Not Assigned")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-bold">{t("driver_vehicle_label", "Driver/Vehicle")}</p>
                          <p className="text-sm font-bold text-slate-800 leading-tight">
                            {act.assignedDriverName || t("transport_pending", "Pending")} / {act.assignedVehicleName || t("transport_pending", "Pending")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        {!act.transportSupplierId && (
                          <div className="bg-amber-50/60 backdrop-blur-sm text-amber-800 p-4 rounded-2xl flex items-start gap-3 text-sm font-semibold border border-amber-200/50 shadow-sm">
                            <WarningCircle weight="fill" className="size-5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{t("pending_supplier_warning", "Ground transport is awaiting supplier assignment.")}</span>
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setReassignActivity(act)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 !bg-amber-500 hover:!bg-amber-600 text-white text-sm font-bold rounded-xl active:scale-[0.98] transition-all duration-200 border-none shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] shadow-md hover:shadow-lg"
                          >
                            <Bus weight="bold" className="size-4 text-white" />
                            {t("assign_supplier_button", "Assign Supplier")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {reassignActivity && (
        <SupplierReassignmentModal
          open={!!reassignActivity}
          onClose={() => setReassignActivity(null)}
          activity={reassignActivity}
          activityType="Transportation"
          tourInstanceId={instanceId}
          minRequiredSeats={instance?.maxParticipation || totalPax}
          onSuccess={() => {
            setReassignActivity(null);
            setRefreshKey(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}

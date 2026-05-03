const fs = require('fs');
const content = `"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bus, MapPin, Clock, Users, Star, Ticket, WarningCircle, ShieldCheck } from "@phosphor-icons/react";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService, AdminBookingListResponse } from "@/api/services/bookingService";
import { NormalizedTourInstanceDto, TourInstanceDayActivityDto } from "@/types/tour";
import { isQualifiedBooking, calculateBookingPax, getFulfillmentActivities, isActivityExternalTransport } from "../utils/fulfillmentHelpers";
import ExternalTicketAssignmentPanel from "@/features/dashboard/components/ExternalTicketAssignmentPanel";
import { SkeletonCard } from "@/features/dashboard/components/TourInstanceDetailPage";

export function TourOperatorBookTransport({ instanceId, backUrl }: { instanceId: string; backUrl?: string }) {
  const [instance, setInstance] = useState<NormalizedTourInstanceDto | null>(null);
  const [bookings, setBookings] = useState<AdminBookingListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (isMounted) setError("Failed to load transport details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [instanceId]);

  if (loading) return <div className="min-h-screen bg-[#f9fafb] p-8 max-w-[1200px] mx-auto"><SkeletonCard /></div>;
  if (error || !instance) return <div className="min-h-screen bg-[#f9fafb] p-8 text-rose-500 font-medium center">{error || "Instance not found"}</div>;

  const { transportActivities } = getFulfillmentActivities(instance);
  
  const externalTransports = transportActivities.filter(isActivityExternalTransport);
  const groundTransports = transportActivities.filter(a => !isActivityExternalTransport(a));

  const totalPax = bookings.reduce((sum, b) => sum + calculateBookingPax(b), 0);

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        <Link
          href={backUrl || \`/tour-operator/tour-instances/\${instanceId}\`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          Back to Tour Instance
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">
              <Bus weight="bold" className="size-4" />
              Transportation
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Transport Fulfillment
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Tour: {instance.tourName} &bull; Required Pax: {totalPax}
            </p>
          </div>
        </div>

        {transportActivities.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] border border-slate-200/50 p-12 center text-slate-500 font-medium">
            No transportation activities planned for this tour instance.
          </div>
        ) : (
          <div className="space-y-12">
            {externalTransports.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Ticket weight="bold" className="text-blue-500" />
                  External Tickets (Flight, Train, Boat)
                </h3>
                {externalTransports.map(act => (
                  <ExternalTicketAssignmentPanel
                    key={act.activityId}
                    activityId={act.activityId}
                    instanceId={instanceId}
                    activityTitle={act.title}
                    transportType={act.transportationType ?? act.transportationName ?? "Other"}
                    bookings={bookings}
                    activityDate={instance.startDate} // Pass relevant date
                  />
                ))}
              </div>
            )}

            {groundTransports.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  <Bus weight="bold" className="text-emerald-500" />
                  Ground Transport (Bus, Taxi)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groundTransports.map(act => (
                    <div key={act.activityId} className="bg-white rounded-[1.5rem] border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900">{act.title}</h4>
                          <p className="text-sm text-slate-500">{act.transportationName}</p>
                        </div>
                        <span className={\`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md \${act.transportationApprovalStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}\`}>
                          {act.transportationApprovalStatus || 'Pending'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest font-bold">Supplier</p>
                          <p className="text-sm font-medium text-slate-900">{act.transportSupplierName || 'Not Assigned'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest font-bold">Driver/Vehicle</p>
                          <p className="text-sm font-medium text-slate-900">{act.assignedDriverName || 'Pending'} / {act.assignedVehicleName || 'Pending'}</p>
                        </div>
                      </div>

                      {!act.transportSupplierId && (
                        <div className="mt-2 bg-amber-50 text-amber-700 p-3 rounded-xl flex items-center gap-2 text-sm font-medium border border-amber-100">
                          <WarningCircle weight="fill" className="size-5 shrink-0" />
                          Ground transport is handled by Transport Operators.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
`;
fs.writeFileSync('pathora/frontend/src/features/tour-operator/components/TourDesignerBookTransport.tsx', content);

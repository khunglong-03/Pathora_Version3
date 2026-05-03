"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BuildingOffice, Bed, MapPin, Clock, Users, Star, CheckCircle, WarningCircle, LockKey } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService, AdminBookingListResponse } from "@/api/services/bookingService";
import { NormalizedTourInstanceDto, TourInstanceDayActivityDto } from "@/types/tour";
import { isQualifiedBooking, calculateBookingPax, getFulfillmentActivities } from "../utils/fulfillmentHelpers";
import PublicTourBookingAssignmentPanel from "@/features/dashboard/components/PublicTourBookingAssignmentPanel";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

export function TourDesignerBookAccommodation({ instanceId, backUrl }: { instanceId: string; backUrl?: string }) {
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
        if (isMounted) setError("Failed to load accommodation details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [instanceId]);

  if (loading) return <div className="min-h-screen bg-[#f9fafb] p-8 max-w-[1200px] mx-auto"><SkeletonCard /></div>;
  if (error || !instance) return <div className="min-h-screen bg-[#f9fafb] p-8 text-rose-500 font-medium center">{error || "Instance not found"}</div>;

  const { accommodationActivities } = getFulfillmentActivities(instance);
  const totalPax = bookings.reduce((sum, b) => sum + calculateBookingPax(b), 0);

  return (
    <div className="min-h-screen bg-[#f9fafb] pt-8 pb-20">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8">
        {/* Navigation */}
        <Link
          href={backUrl || `/tour-operator/tour-instances/${instanceId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-8"
        >
          <ArrowLeft weight="bold" className="size-4" />
          Back to Tour Instance
        </Link>

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 text-xs font-bold uppercase tracking-widest mb-4 border border-purple-100">
              <BuildingOffice weight="bold" className="size-4" />
              Accommodation
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Assign Rooms
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Tour: {instance.tourName} &bull; Total Pax: {totalPax}
            </p>
          </div>
        </div>

        {accommodationActivities.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] border border-slate-200/50 p-12 flex items-center justify-center text-slate-500 font-medium">
            No accommodation activities planned for this tour instance.
          </div>
        ) : (
          <div className="space-y-8">
            {accommodationActivities.map((act) => {
              const isApproved = act.accommodation?.supplierApprovalStatus === "Approved";
              const hasSupplier = Boolean(act.accommodation?.supplierId || act.accommodation?.supplierName);
              
              return (
                <div key={(act as any).activityId} className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
                  {/* Header */}
                  <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold tracking-tight text-slate-900">{act.title}</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {act.accommodation?.supplierApprovalStatus || 'Pending'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                          <BuildingOffice weight="bold" className="size-4" />
                          {act.accommodation?.supplierName || "No Supplier Assigned"}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Room Setup</p>
                          <p className="text-sm font-medium text-slate-900">
                            {act.accommodation?.roomType || "Standard"} &times; {(act.accommodation as any)?.roomQuantity || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body: Assignments or Locked State */}
                  <div className="p-6 md:p-8">
                    {!hasSupplier ? (
                      <div className="bg-rose-50 text-rose-600 p-6 rounded-xl flex items-center justify-center gap-3 font-medium border border-rose-100">
                        <WarningCircle weight="bold" className="size-5" />
                        A supplier must be assigned to this activity before room allocation.
                      </div>
                    ) : !isApproved ? (
                      <div className="bg-amber-50 text-amber-700 p-8 rounded-xl flex flex-col items-center justify-center gap-3 font-medium border border-amber-100 text-center">
                        <LockKey weight="bold" className="size-8 text-amber-500 mb-2" />
                        <p>Accommodation is currently <strong>{act.accommodation?.supplierApprovalStatus}</strong>.</p>
                        <p className="text-sm text-amber-600/80">Room assignment is locked until the supplier confirms the booking.</p>
                      </div>
                    ) : (
                      (() => {
                        const PanelAny = PublicTourBookingAssignmentPanel as any;
                        return (
                          <PanelAny
                            activity={{
                              activityId: (act as any).activityId,
                              title: act.title,
                              roomQuantity: (act.accommodation as any)?.roomQuantity || 0,
                              supplierName: act.accommodation?.supplierName || "",
                              supplierApprovalStatus: act.accommodation?.supplierApprovalStatus || "",
                              dateIndex: 1,
                            }}
                            instanceId={instanceId}
                            bookings={bookings}
                          />
                        );
                      })()
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

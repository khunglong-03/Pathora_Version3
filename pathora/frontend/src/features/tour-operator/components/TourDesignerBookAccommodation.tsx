"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "@phosphor-icons/react";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { bookingService, AdminBookingListResponse } from "@/api/services/bookingService";
import { NormalizedTourInstanceDto, isExternalOnlyTransportation } from "@/types/tour";
import { isQualifiedBooking, calculateBookingPax } from "../utils/fulfillmentHelpers";
import PublicTourBookingAssignmentPanel from "@/features/dashboard/components/PublicTourBookingAssignmentPanel";
import { SkeletonCard } from "@/components/ui/SkeletonCard";

const isTransportationActivity = (activityType?: string | number | null) => {
  const n = String(activityType ?? "").trim().toLowerCase();
  return n === "transportation" || n === "7" || n === "1";
};

const isAccommodationActivity = (activityType?: string | number | null) => {
  const n = String(activityType ?? "").trim().toLowerCase();
  return n === "accommodation" || n === "8" || n === "2";
};

export function TourDesignerBookAccommodation({ instanceId, backUrl }: { instanceId: string; backUrl?: string }) {
  const [instance, setInstance] = useState<NormalizedTourInstanceDto | null>(null);
  const [bookings, setBookings] = useState<AdminBookingListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [instanceData, bookingsData] = await Promise.all([
        tourInstanceService.getInstanceDetail(instanceId),
        bookingService.getBookingsByTourInstance(instanceId)
      ]);
      
      setInstance(instanceData as any);
      setBookings(bookingsData.filter(isQualifiedBooking));
      setError(null);
    } catch (err) {
      setError("Failed to load details");
    } finally {
      setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) return <div className="min-h-screen bg-[#f9fafb] p-8 max-w-[1200px] mx-auto"><SkeletonCard /></div>;
  if (error || !instance) return <div className="min-h-screen bg-[#f9fafb] p-8 text-rose-500 font-medium flex items-center justify-center">{error || "Instance not found"}</div>;

  const totalPax = bookings.reduce((sum, b) => sum + calculateBookingPax(b), 0);
  const allActivities = (instance.days ?? []).flatMap((d: any) => d.activities ?? []);

  // Accommodation activities assigned to a hotel supplier
  const accomActivities = allActivities
    .filter((a: any) => isAccommodationActivity(a.activityType) && !!a.accommodation?.supplierId)
    .map((a: any) => {
      const day = instance.days?.find((d: any) => d.activities?.some((x: any) => x.id === a.id));
      return {
        activityId: a.id,
        title: a.title,
        date: day?.actualDate ?? "",
        dayNumber: day?.instanceDayNumber ?? 0,
        roomBlocksTotal: a.accommodation?.roomBlocksTotal ?? 0,
        quantity: a.accommodation?.quantity ?? 0,
        roomType: a.accommodation?.roomType ?? null,
        supplierName: a.accommodation?.supplierName ?? null,
        supplierApprovalStatus: a.accommodation?.supplierApprovalStatus ?? null,
      };
    });

  // External transport activities (Flight/Train/Boat)
  const externalActivities = allActivities
    .filter((a: any) => isTransportationActivity(a.activityType) && isExternalOnlyTransportation(a.transportationType ?? a.transportationName))
    .map((a: any) => {
      const day = instance.days?.find((d: any) => d.activities?.some((x: any) => x.id === a.id));
      const rawType = String(a.transportationType ?? a.transportationName ?? "");
      const transportType: "Flight" | "Train" | "Boat" =
        rawType.toLowerCase().includes("flight") || rawType === "3" ? "Flight"
        : rawType.toLowerCase().includes("boat") || rawType === "4" ? "Boat"
        : "Train";
      return {
        activityId: a.id,
        title: a.title,
        date: day?.actualDate ?? "",
        dayNumber: day?.instanceDayNumber ?? 0,
        transportType,
        confirmed: a.externalTransportConfirmed ?? false,
      };
    });

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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">
              <MapPin weight="bold" className="size-4" />
              Accommodations
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-none">
              Assign Rooms
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Tour: {instance.tourName} &bull; Total Pax: {totalPax}
            </p>
          </div>
        </div>

        {accomActivities.length === 0 && externalActivities.length === 0 ? (
          <div className="bg-white rounded-[1.5rem] border border-slate-200/50 p-12 flex items-center justify-center text-slate-500 font-medium">
            No accommodation or external transport activities planned for this tour instance.
          </div>
        ) : (
          <PublicTourBookingAssignmentPanel
            instanceId={instance.id}
            instanceType={instance.instanceType ?? "private"}
            bookings={bookings}
            bookingsLoading={loading}
            accommodationActivities={accomActivities}
            externalTransportActivities={[]}
            onSaveTicket={async (activityId, entry) => {
              await tourInstanceService.saveBookingTicket(instance.id, activityId, {
                bookingId: entry.bookingId,
                flightNumber: entry.flightNumber,
                departureAt: entry.departureAt ? new Date(entry.departureAt).toISOString() : null,
                arrivalAt: entry.arrivalAt ? new Date(entry.arrivalAt).toISOString() : null,
                seatNumbers: entry.seatNumbers,
                eTicketNumbers: entry.eTicketNumbers,
                seatClass: entry.seatClass,
                note: entry.note,
              });
            }}
            onConfirmExternalTransport={async (activityId) => {
              await tourInstanceService.confirmExternalTransport(instance.id, activityId, true);
              void loadData();
            }}
            onSaveRoomAssignment={async (activityId, payload) => {
              await tourInstanceService.saveBookingRoomAssignment(instance.id, activityId, payload);
            }}
            onLoadRoomAssignments={async (activityId) =>
              tourInstanceService.getBookingRoomAssignments(instance.id, activityId)
            }
          />
        )}
      </div>
    </div>
  );
}

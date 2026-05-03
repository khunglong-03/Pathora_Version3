import { NormalizedTourInstanceDto, TourInstanceDayActivityDto, isExternalOnlyTransportation } from "@/types/tour";

// 2.1 Add typed helpers for qualified booking detection
export const isQualifiedBooking = (booking: any): boolean => {
  if (!booking || typeof booking.status !== "string") return false;
  const s = booking.status.toLowerCase();
  return s === "deposited" || s === "paid" || s === "completed";
};

// 2.2 Add helper to calculate booking pax
export const calculateBookingPax = (booking: any): number => {
  if (!booking) return 0;
  return (booking.numberAdult || 0) + (booking.numberChild || 0) + (booking.numberInfant || 0);
};

// 2.3 Add helper to flatten tour instance days into transportation and accommodation activity collections
export const getFulfillmentActivities = (instance: NormalizedTourInstanceDto | any) => {
  const allActivities: TourInstanceDayActivityDto[] = (instance?.days || []).flatMap((d: any) => d.activities || []);
  
  const transportActivities = allActivities.filter((a: any) => a.activityType === "Transportation" || a.activityType === 1);
  const accommodationActivities = allActivities.filter((a: any) => a.activityType === "Accommodation" || a.activityType === 2);
  
  return { transportActivities, accommodationActivities };
};

// 2.4 Add helper to classify external-only transport
export const isActivityExternalTransport = (activity: TourInstanceDayActivityDto | any): boolean => {
  return isExternalOnlyTransportation(activity.transportationType ?? activity.transportationName);
};

// 2.5 Add safe mapper from NormalizedTourInstanceDto to UpdateTourInstancePayload
export const mapInstanceToUpdatePayload = (instance: NormalizedTourInstanceDto | any): any => {
  return {
    id: instance.id,
    tourId: instance.tourId,
    startDate: instance.startDate,
    endDate: instance.endDate,
    status: instance.status,
    basePrice: instance.basePrice,
    salePrice: instance.salePrice,
    maxCapacity: instance.maxCapacity,
    minCapacity: instance.minCapacity,
    isPrivateCustom: instance.isPrivateCustom,
    managerNote: instance.managerNote,
    images: instance.images || [],
    managerUserIds: (instance.managers || [])
      .filter((m: any) => m.role === "Manager")
      .map((m: any) => m.userId),
    guideUserIds: (instance.managers || [])
      .filter((m: any) => m.role === "Guide")
      .map((m: any) => m.userId),
    operatorUserIds: (instance.managers || [])
      .filter((m: any) => m.role === "Operator")
      .map((m: any) => m.userId),
    days: instance.days || [],
    policies: instance.policies || [],
    dynamicPricings: instance.dynamicPricings || [],
  };
};

// 2.6 Typed DTOs for booking ticket responses (Task 2.6)
export interface BookingTicketDto {
  id: string;
  bookingId: string;
  activityId: string;
  ticketFileUrl: string | null;
  ticketNumber: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMetadata {
  passengerName?: string;
  seatNumber?: string;
  [key: string]: any;
}

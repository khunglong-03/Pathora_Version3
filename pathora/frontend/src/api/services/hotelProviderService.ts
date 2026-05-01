// Hotel Service Provider Portal API Service
// All endpoints are scoped to the current user's hotel via backend ownership scoping

import { api } from "@/api/axiosInstance";
import { extractResult } from "@/utils/apiResponse";
import type { ServiceResponse } from "@/types/api";

// ─── Supplier Info ────────────────────────────────────────────────

export interface HotelSupplierInfo {
  id: string;
  supplierCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
}

export interface UpdateSupplierInfoDto {
  supplierId?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface CreateSupplierInfoDto {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

// ─── Room Availability ─────────────────────────────────────────────

export interface RoomAvailability {
  date: string;
  roomType: string;
  totalRooms: number;
  blockedCount: number;
  availableRooms: number;
}

// ─── Guest Arrivals ────────────────────────────────────────────────

export type GuestStayStatus = "Pending" | "CheckedIn" | "CheckedOut" | "NoShow";
export type GuestArrivalSubmissionStatus = "Draft" | "Submitted" | "Approved" | "Rejected";

export interface GuestArrivalItem {
  id: string;
  bookingAccommodationDetailId: string;
  accommodationName: string | null;
  status: GuestStayStatus;
  checkInDate: string | null;
  checkOutDate: string | null;
  participantCount: number;
  submittedAt: string | null;
  submissionStatus: GuestArrivalSubmissionStatus;
}

export interface GuestArrivalParticipant {
  id: string;
  fullName: string;
  passportNumber: string;
  status: GuestStayStatus;
}

export interface GuestArrivalDetail {
  id: string;
  bookingAccommodationDetailId: string;
  accommodationName: string | null;
  status: GuestStayStatus;
  checkInDate: string | null;
  checkOutDate: string | null;
  participantCount: number;
  submittedAt: string | null;
  submissionStatus: GuestArrivalSubmissionStatus;
  participants: GuestArrivalParticipant[];
  note: string | null;
}

export interface SubmitGuestArrivalDto {
  bookingAccommodationDetailId: string;
  participantIds: string[];
  note?: string;
}

export interface UpdateGuestArrivalDto {
  checkedInByUserId?: string;
  checkedOutByUserId?: string;
  status?: GuestStayStatus;
  submissionStatus?: GuestArrivalSubmissionStatus;
  note?: string;
}

// ─── Hotel Accommodations ────────────────────────────────────────────

export interface ImageDto {
  fileId: string;
  originalFileName: string;
  fileName: string;
  publicURL: string;
}

export interface AccommodationItem {
  id: string;
  supplierId: string;
  roomType: string;
  totalRooms: number;
  name: string | null;
  address: string | null;
  locationArea: string | null;
  operatingCountries: string | null;
  thumbnail: ImageDto | null;
  images: ImageDto[] | null;
  notes: string | null;
}

export interface CreateAccommodationDto {
  roomType: string;
  totalRooms: number;
  name?: string;
  address?: string;
  thumbnail?: ImageDto | null;
  images?: ImageDto[] | null;
  notes?: string;
}

export interface UpdateAccommodationDto {
  roomType?: string;
  totalRooms?: number;
  name?: string;
  address?: string;
  operatingCountries?: string;
  thumbnail?: ImageDto | null;
  images?: ImageDto[] | null;
  notes?: string;
}

// ─── Filter Params ────────────────────────────────────────────────

export interface ArrivalFilterParams {
  status?: GuestStayStatus;
  dateFrom?: string;
  dateTo?: string;
}

// ─── Service ─────────────────────────────────────────────────────

export const hotelProviderService = {
  // Hotel Accommodations (existing scoped endpoint)
  getAccommodations: async (): Promise<AccommodationItem[]> => {
    const response = await api.get<ServiceResponse<AccommodationItem[]>>(
      "/hotel-provider/accommodations",
    );
    return extractResult<AccommodationItem[]>(response.data) ?? [];
  },

  createAccommodation: async (
    data: CreateAccommodationDto,
  ): Promise<AccommodationItem> => {
    const response = await api.post<ServiceResponse<AccommodationItem>>(
      "/hotel-provider/accommodations",
      data,
    );
    return extractResult<AccommodationItem>(
      response.data,
    ) as AccommodationItem;
  },

  updateAccommodation: async (
    id: string,
    data: UpdateAccommodationDto,
  ): Promise<AccommodationItem> => {
    const response = await api.put<ServiceResponse<AccommodationItem>>(
      `/hotel-provider/accommodations/${id}`,
      data,
    );
    return extractResult<AccommodationItem>(
      response.data,
    ) as AccommodationItem;
  },

  deleteAccommodation: async (id: string): Promise<void> => {
    await api.delete(`/hotel-provider/accommodations/${id}`);
  },

  // Room Availability
  getRoomAvailability: async (
    fromDate: string,
    toDate: string,
  ): Promise<RoomAvailability[]> => {
    const response = await api.get<ServiceResponse<RoomAvailability[]>>(
      "/hotel-room-availability",
      { params: { fromDate, toDate } },
    );
    return extractResult<RoomAvailability[]>(response.data) ?? [];
  },

  // Guest Arrivals (scoped via backend ownership)
  getGuestArrivals: async (
    params: ArrivalFilterParams = {},
  ): Promise<GuestArrivalItem[]> => {
    const response = await api.get<ServiceResponse<GuestArrivalItem[]>>(
      "/guest-arrivals",
      { params },
    );
    return extractResult<GuestArrivalItem[]>(response.data) ?? [];
  },

  getGuestArrivalDetail: async (
    accommodationDetailId: string,
  ): Promise<GuestArrivalDetail> => {
    const response = await api.get<ServiceResponse<GuestArrivalDetail>>(
      `/guest-arrivals/accommodation/${accommodationDetailId}`,
    );
    return extractResult<GuestArrivalDetail>(
      response.data,
    ) as GuestArrivalDetail;
  },

  submitGuestArrival: async (
    data: SubmitGuestArrivalDto,
  ): Promise<GuestArrivalItem> => {
    const response = await api.post<ServiceResponse<GuestArrivalItem>>(
      "/guest-arrivals",
      data,
    );
    return extractResult<GuestArrivalItem>(
      response.data,
    ) as GuestArrivalItem;
  },

  updateGuestArrival: async (
    id: string,
    data: UpdateGuestArrivalDto,
  ): Promise<GuestArrivalItem> => {
    const response = await api.put<ServiceResponse<GuestArrivalItem>>(
      `/guest-arrivals/${id}`,
      data,
    );
    return extractResult<GuestArrivalItem>(
      response.data,
    ) as GuestArrivalItem;
  },

  // Supplier Info
  getSupplierInfo: async (): Promise<HotelSupplierInfo[]> => {
    try {
      const response = await api.get<ServiceResponse<HotelSupplierInfo[]>>("/api/hotel-supplier");
      return extractResult<HotelSupplierInfo[]>(response.data) ?? [];
    } catch (error) {
      return [];
    }
  },

  createSupplierInfo: async (
    data: CreateSupplierInfoDto,
  ): Promise<HotelSupplierInfo> => {
    const response = await api.post<ServiceResponse<HotelSupplierInfo>>(
      "/api/hotel-supplier",
      data,
    );
    return extractResult<HotelSupplierInfo>(response.data) as HotelSupplierInfo;
  },

  updateSupplierInfo: async (
    id: string,
    data: UpdateSupplierInfoDto,
  ): Promise<HotelSupplierInfo> => {
    const response = await api.put<ServiceResponse<HotelSupplierInfo>>(
      "/api/hotel-supplier/info",
      {
        ...data,
        supplierId: id,
      },
    );
    return extractResult<HotelSupplierInfo>(response.data) as HotelSupplierInfo;
  },
};

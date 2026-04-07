// Hotel Service Provider Portal API Service
// All endpoints are scoped to the current user's hotel via backend ownership scoping

import { api } from "@/api/axiosInstance";
import { extractResult } from "@/utils/apiResponse";
import type { ApiResponse } from "@/types/home";

// ─── Room Inventory ──────────────────────────────────────────────

export interface RoomInventoryItem {
  id: string;
  supplierId: string;
  supplierName: string | null;
  roomType: string;
  totalRooms: number;
  name: string | null;
  address: string | null;
  locationArea: string | null;
  operatingCountries: string | null;
  imageUrls: string | null;
  notes: string | null;
}

export interface CreateRoomInventoryDto {
  supplierId: string;
  roomType: string;
  totalRooms: number;
}

export interface UpdateRoomInventoryDto {
  totalRooms: number;
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

// ─── Hotel Accommodations (existing scoped endpoint) ───────────────────

export interface AccommodationItem {
  id: string;
  supplierId: string;
  roomType: string;
  totalRooms: number;
  name: string | null;
  address: string | null;
  locationArea: string | null;
  operatingCountries: string | null;
  imageUrls: string | null;
  notes: string | null;
}

export interface CreateAccommodationDto {
  roomType: string;
  totalRooms: number;
  name?: string;
  address?: string;
}

export interface UpdateAccommodationDto {
  roomType?: string;
  totalRooms?: number;
  name?: string;
  address?: string;
  operatingCountries?: string;
  imageUrls?: string;
  notes?: string;
}

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
  name: string;
  phone?: string;
  email?: string;
  address?: string;
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
  // Room Inventory (scoped via backend ownership)
  getRoomInventory: async (): Promise<RoomInventoryItem[]> => {
    const response = await api.get<ApiResponse<RoomInventoryItem[]>>(
      "/api/hotel-room-inventory",
    );
    return extractResult<RoomInventoryItem[]>(response.data) ?? [];
  },

  getRoomAvailability: async (
    fromDate: string,
    toDate: string,
  ): Promise<RoomAvailability[]> => {
    const response = await api.get<ApiResponse<RoomAvailability[]>>(
      "/api/hotel-room-availability",
      { params: { fromDate, toDate } },
    );
    return extractResult<RoomAvailability[]>(response.data) ?? [];
  },

  createRoomInventory: async (
    data: CreateRoomInventoryDto,
  ): Promise<RoomInventoryItem> => {
    const response = await api.post<ApiResponse<RoomInventoryItem>>(
      "/api/hotel-room-inventory",
      data,
    );
    return extractResult<RoomInventoryItem>(response.data) as RoomInventoryItem;
  },

  updateRoomInventory: async (
    id: string,
    data: UpdateRoomInventoryDto,
  ): Promise<RoomInventoryItem> => {
    const response = await api.put<ApiResponse<RoomInventoryItem>>(
      `/api/hotel-room-inventory/${id}`,
      data,
    );
    return extractResult<RoomInventoryItem>(response.data) as RoomInventoryItem;
  },

  deleteRoomInventory: async (id: string): Promise<void> => {
    await api.delete(`/api/hotel-room-inventory/${id}`);
  },

  // Hotel Accommodations (existing scoped endpoint)
  getAccommodations: async (): Promise<AccommodationItem[]> => {
    const response = await api.get<ApiResponse<AccommodationItem[]>>(
      "/hotel-provider/accommodations",
    );
    return extractResult<AccommodationItem[]>(response.data) ?? [];
  },

  getAccommodationById: async (
    id: string,
  ): Promise<AccommodationItem> => {
    const response = await api.get<ApiResponse<AccommodationItem>>(
      `/hotel-provider/accommodations/${id}`,
    );
    return extractResult<AccommodationItem>(
      response.data,
    ) as AccommodationItem;
  },

  createAccommodation: async (
    data: CreateAccommodationDto,
  ): Promise<AccommodationItem> => {
    const response = await api.post<ApiResponse<AccommodationItem>>(
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
    const response = await api.put<ApiResponse<AccommodationItem>>(
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

  // Guest Arrivals (scoped via backend ownership)
  getGuestArrivals: async (
    params: ArrivalFilterParams = {},
  ): Promise<GuestArrivalItem[]> => {
    const response = await api.get<ApiResponse<GuestArrivalItem[]>>(
      "/api/guest-arrivals",
      { params },
    );
    return extractResult<GuestArrivalItem[]>(response.data) ?? [];
  },

  getGuestArrivalDetail: async (
    accommodationDetailId: string,
  ): Promise<GuestArrivalDetail> => {
    const response = await api.get<ApiResponse<GuestArrivalDetail>>(
      `/api/guest-arrivals/accommodation/${accommodationDetailId}`,
    );
    return extractResult<GuestArrivalDetail>(
      response.data,
    ) as GuestArrivalDetail;
  },

  submitGuestArrival: async (
    data: SubmitGuestArrivalDto,
  ): Promise<GuestArrivalItem> => {
    const response = await api.post<ApiResponse<GuestArrivalItem>>(
      "/api/guest-arrivals",
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
    const response = await api.put<ApiResponse<GuestArrivalItem>>(
      `/api/guest-arrivals/${id}`,
      data,
    );
    return extractResult<GuestArrivalItem>(
      response.data,
    ) as GuestArrivalItem;
  },

  // Supplier Info — use the scoped accommodations endpoint to get supplier info
  getSupplierInfo: async (): Promise<HotelSupplierInfo | null> => {
    const accommodations = await hotelProviderService.getAccommodations();
    if (accommodations.length === 0) return null;
    // Return a minimal supplier info from first accommodation
    const first = accommodations[0];
    return {
      id: first.supplierId,
      supplierCode: "",
      name: first.name ?? "",
      phone: null,
      email: null,
      address: first.address,
      notes: first.notes,
    };
  },

  updateSupplierInfo: async (
    _id: string,
    _data: UpdateSupplierInfoDto,
  ): Promise<HotelSupplierInfo> => {
    throw new Error("Update supplier info not yet implemented");
  },
};

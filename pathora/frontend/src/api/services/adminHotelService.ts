// Admin Hotel Management API Service

import { api } from "@/api/axiosInstance";
import { ADMIN_HOTEL } from "@/api/endpoints/adminHotel";
import type { ApiResponse } from "@/types/home";
import { extractData, extractResult } from "@/utils/apiResponse";

// ─── Hotel Supplier ────────────────────────────────────────────────

export interface HotelSupplierItem {
  id: string;
  supplierCode: string;
  supplierName: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  primaryContinent: string | null;
  continents: string[];
  accommodationCount: number;
  roomCount: number;
  createdOnUtc: string | null;
}

export interface HotelSupplierDetail {
  id: string;
  supplierCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  accommodations: HotelAccommodationItem[];
}

export interface HotelAccommodationItem {
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

// ─── Room Inventory ────────────────────────────────────────────────

export interface RoomInventoryItem {
  id: string;
  accommodationId: string;
  accommodationName: string | null;
  supplierId: string;
  supplierName: string | null;
  roomType: string;
  totalRooms: number;
  availableRooms: number;
  blockedRooms: number;
  date: string;
}

export interface RoomInventoryDetail {
  id: string;
  accommodationId: string;
  accommodationName: string | null;
  supplierId: string;
  supplierName: string | null;
  roomType: string;
  totalRooms: number;
  availableRooms: number;
  blockedRooms: number;
  date: string;
  blocks: RoomBlockItem[];
}

export interface CreateRoomInventoryDto {
  accommodationId: string;
  roomType: string;
  totalRooms: number;
  date: string;
}

export interface UpdateRoomInventoryDto {
  totalRooms?: number;
}

// ─── Room Blocks ───────────────────────────────────────────────────

export interface RoomBlockItem {
  id: string;
  inventoryId: string;
  accommodationId: string;
  accommodationName: string | null;
  supplierId: string;
  supplierName: string | null;
  roomType: string;
  startDate: string;
  endDate: string;
  roomCount: number;
  reason: string | null;
  createdAt: string | null;
}

export interface CreateRoomBlockDto {
  accommodationId: string;
  inventoryId: string;
  startDate: string;
  endDate: string;
  roomCount: number;
  reason?: string;
}

export interface UpdateRoomBlockDto {
  startDate?: string;
  endDate?: string;
  roomCount?: number;
  reason?: string;
}

// ─── Booking Accommodation Details ─────────────────────────────────

export interface BookingAccommodationDetailItem {
  id: string;
  bookingId: string;
  orderNumber: string | null;
  accommodationId: string;
  accommodationName: string | null;
  supplierId: string;
  supplierName: string | null;
  roomType: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  roomCount: number;
  guestCount: number;
  status: string;
  createdAt: string | null;
}

export interface BookingAccommodationDetailFull {
  id: string;
  bookingId: string;
  orderNumber: string | null;
  accommodationId: string;
  accommodationName: string | null;
  supplierId: string;
  supplierName: string | null;
  roomType: string;
  checkInDate: string | null;
  checkOutDate: string | null;
  roomCount: number;
  guestCount: number;
  status: string;
  guestDetails: BookingGuestDetail[];
  notes: string | null;
  createdAt: string | null;
}

export interface BookingGuestDetail {
  id: string;
  fullName: string;
  passportNumber: string | null;
  nationality: string | null;
  status: string;
}

// ─── Filter Params ────────────────────────────────────────────────

export interface HotelSupplierFilterParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  continents?: string[];
}

export interface RoomInventoryFilterParams {
  page?: number;
  limit?: number;
  supplierId?: string;
  accommodationId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface RoomBlockFilterParams {
  page?: number;
  limit?: number;
  supplierId?: string;
  accommodationId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface BookingAccommodationFilterParams {
  page?: number;
  limit?: number;
  supplierId?: string;
  accommodationId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ─── Paginated List ────────────────────────────────────────────────

export interface PaginatedHotelList<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Service ─────────────────────────────────────────────────────

export const adminHotelService = {
  // Hotel Suppliers
  getSuppliers: async (params: HotelSupplierFilterParams = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.set("pageNumber", String(params.page ?? 1));
    queryParams.set("pageSize", String(params.limit ?? 12));

    if (params.search) {
      queryParams.set("search", params.search);
    }

    if (params.status) {
      queryParams.set("status", params.status);
    }

    params.continents?.forEach((continent) => {
      queryParams.append("continents", continent);
    });

    const response = await api.get<ApiResponse<PaginatedHotelList<HotelSupplierItem>>>(
      ADMIN_HOTEL.GET_SUPPLIERS,
      { params: queryParams },
    );
    return extractResult<PaginatedHotelList<HotelSupplierItem>>(response.data);
  },

  getSupplierDetail: async (id: string) => {
    const response = await api.get<ApiResponse<HotelSupplierDetail>>(
      ADMIN_HOTEL.GET_SUPPLIER_DETAIL(id),
    );
    return extractResult<HotelSupplierDetail>(response.data);
  },

  // Room Inventory
  getRoomInventory: async (params: RoomInventoryFilterParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedHotelList<RoomInventoryItem>>>(
      ADMIN_HOTEL.GET_ROOM_INVENTORY,
      { params: { page: 1, limit: 20, ...params } },
    );
    return extractResult<PaginatedHotelList<RoomInventoryItem>>(response.data);
  },

  getRoomInventoryDetail: async (id: string) => {
    const response = await api.get<ApiResponse<RoomInventoryDetail>>(
      ADMIN_HOTEL.GET_ROOM_INVENTORY_DETAIL(id),
    );
    return extractResult<RoomInventoryDetail>(response.data);
  },

  createRoomInventory: async (data: CreateRoomInventoryDto) => {
    const response = await api.post<ApiResponse<RoomInventoryItem>>(
      ADMIN_HOTEL.CREATE_ROOM_INVENTORY,
      data,
    );
    return extractResult<RoomInventoryItem>(response.data);
  },

  updateRoomInventory: async (id: string, data: UpdateRoomInventoryDto) => {
    const response = await api.put<ApiResponse<RoomInventoryItem>>(
      ADMIN_HOTEL.UPDATE_ROOM_INVENTORY(id),
      data,
    );
    return extractResult<RoomInventoryItem>(response.data);
  },

  deleteRoomInventory: async (id: string) => {
    const response = await api.delete(ADMIN_HOTEL.DELETE_ROOM_INVENTORY(id));
    return extractData(response.data);
  },

  // Room Blocks
  getRoomBlocks: async (params: RoomBlockFilterParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedHotelList<RoomBlockItem>>>(
      ADMIN_HOTEL.GET_ROOM_BLOCKS,
      { params: { page: 1, limit: 20, ...params } },
    );
    return extractResult<PaginatedHotelList<RoomBlockItem>>(response.data);
  },

  getRoomBlockDetail: async (id: string) => {
    const response = await api.get<ApiResponse<RoomBlockItem>>(
      ADMIN_HOTEL.GET_ROOM_BLOCK_DETAIL(id),
    );
    return extractResult<RoomBlockItem>(response.data);
  },

  createRoomBlock: async (data: CreateRoomBlockDto) => {
    const response = await api.post<ApiResponse<RoomBlockItem>>(
      ADMIN_HOTEL.CREATE_ROOM_BLOCK,
      data,
    );
    return extractResult<RoomBlockItem>(response.data);
  },

  updateRoomBlock: async (id: string, data: UpdateRoomBlockDto) => {
    const response = await api.put<ApiResponse<RoomBlockItem>>(
      ADMIN_HOTEL.UPDATE_ROOM_BLOCK(id),
      data,
    );
    return extractResult<RoomBlockItem>(response.data);
  },

  deleteRoomBlock: async (id: string) => {
    const response = await api.delete(ADMIN_HOTEL.DELETE_ROOM_BLOCK(id));
    return extractData(response.data);
  },

  // Booking Accommodation Details
  getBookingAccommodationDetails: async (params: BookingAccommodationFilterParams = {}) => {
    const response = await api.get<ApiResponse<PaginatedHotelList<BookingAccommodationDetailItem>>>(
      ADMIN_HOTEL.GET_BOOKING_ACCOMMODATION_DETAILS,
      { params: { page: 1, limit: 20, ...params } },
    );
    return extractResult<PaginatedHotelList<BookingAccommodationDetailItem>>(response.data);
  },

  getBookingAccommodationDetail: async (id: string) => {
    const response = await api.get<ApiResponse<BookingAccommodationDetailFull>>(
      ADMIN_HOTEL.GET_BOOKING_ACCOMMODATION_DETAIL(id),
    );
    return extractResult<BookingAccommodationDetailFull>(response.data);
  },
};

// Admin Hotel Management API Endpoints

export interface AdminHotelEndpoints {
  GET_SUPPLIERS: string;
  GET_SUPPLIER_DETAIL: (id: string) => string;
  GET_ROOM_INVENTORY: string;
  GET_ROOM_INVENTORY_DETAIL: (id: string) => string;
  CREATE_ROOM_INVENTORY: string;
  UPDATE_ROOM_INVENTORY: (id: string) => string;
  DELETE_ROOM_INVENTORY: (id: string) => string;
  GET_ROOM_BLOCKS: string;
  GET_ROOM_BLOCK_DETAIL: (id: string) => string;
  CREATE_ROOM_BLOCK: string;
  UPDATE_ROOM_BLOCK: (id: string) => string;
  DELETE_ROOM_BLOCK: (id: string) => string;
  GET_BOOKING_ACCOMMODATION_DETAILS: string;
  GET_BOOKING_ACCOMMODATION_DETAIL: (id: string) => string;
}

export const ADMIN_HOTEL: AdminHotelEndpoints = {
  GET_SUPPLIERS: "/api/manager/hotel-providers",
  GET_SUPPLIER_DETAIL: (id: string): string => `/api/manager/hotel-providers/${id}`,
  GET_ROOM_INVENTORY: "/api/admin/hotel-room-inventory",
  GET_ROOM_INVENTORY_DETAIL: (id: string): string => `/api/admin/hotel-room-inventory/${id}`,
  CREATE_ROOM_INVENTORY: "/api/admin/hotel-room-inventory",
  UPDATE_ROOM_INVENTORY: (id: string): string => `/api/admin/hotel-room-inventory/${id}`,
  DELETE_ROOM_INVENTORY: (id: string): string => `/api/admin/hotel-room-inventory/${id}`,
  GET_ROOM_BLOCKS: "/api/admin/room-blocks",
  GET_ROOM_BLOCK_DETAIL: (id: string): string => `/api/admin/room-blocks/${id}`,
  CREATE_ROOM_BLOCK: "/api/admin/room-blocks",
  UPDATE_ROOM_BLOCK: (id: string): string => `/api/admin/room-blocks/${id}`,
  DELETE_ROOM_BLOCK: (id: string): string => `/api/admin/room-blocks/${id}`,
  GET_BOOKING_ACCOMMODATION_DETAILS: "/api/admin/booking-accommodation-details",
  GET_BOOKING_ACCOMMODATION_DETAIL: (id: string): string => `/api/admin/booking-accommodation-details/${id}`,
};

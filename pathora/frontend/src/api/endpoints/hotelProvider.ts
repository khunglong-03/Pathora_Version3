export interface HotelProviderEndpoints {
  GET_ROOM_INVENTORY: string;
  GET_ROOM_AVAILABILITY: string;
}

export const HOTEL_PROVIDER: HotelProviderEndpoints = {
  GET_ROOM_INVENTORY: "/api/hotel-room-inventory",
  GET_ROOM_AVAILABILITY: "/api/hotel-room-availability",
};

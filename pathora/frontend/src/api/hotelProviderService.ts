import api from "./axiosInstance";
import { API_ENDPOINTS } from "./endpoints";
import { ApiResponse } from "@/types/home";
import { extractData } from "@/utils/apiResponse";

export interface HotelRoomInventory {
  id: string;
  roomType: number;
  totalRooms: number;
}

export const hotelProviderService = {
  getInventory: async (): Promise<HotelRoomInventory[]> => {
    try {
      const response = await api.get<ApiResponse<HotelRoomInventory[]>>(API_ENDPOINTS.HOTEL_PROVIDER.GET_ROOM_INVENTORY);
      return extractData(response);
    } catch {
      return [];
    }
  },
};

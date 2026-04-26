import axiosInstance from "@/api/axiosInstance";
import { extractData, extractItems, extractResult, handleApiError } from "@/utils/apiResponse";

export interface Vehicle {
  id: string;
  vehicleType: string;
  brand?: string;
  model?: string;
  seatCapacity: number;
  quantity: number;
  locationArea?: string;
  operatingCountries?: string;
  vehicleImageUrls?: string[];
  isActive: boolean;
  isDeleted: boolean;
  notes?: string;
  createdOnUtc: string;
}

/**
 * Vehicle with real-time availability for a specific date.
 * Uses `Pick<Vehicle, ...>` plus the computed `availableQuantity` field.
 *
 * @example
 * ```ts
 * const available = await transportProviderService.getAvailableVehicles("2026-05-01");
 * available?.forEach(v => console.log(`${v.brand} ${v.model}: ${v.availableQuantity}/${v.quantity} free`));
 * ```
 */
export type AvailableVehicle = Pick<Vehicle, "id" | "vehicleType" | "brand" | "model" | "seatCapacity" | "quantity" | "notes"> & {
  /** How many units are currently free on the queried date. */
  availableQuantity: number;
};

/**
 * A single vehicle-block entry for the schedule dashboard calendar.
 */
export interface VehicleScheduleItem {
  blockId: string;
  vehicleId: string;
  vehicleType: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  seatCapacity: number;
  blockedDate: string;
  holdStatus: string;
  tourInstanceName?: string;
  tourInstanceCode?: string;
  activityTitle?: string;
  fromLocationName?: string;
  toLocationName?: string;
}

export interface Driver {
  id: string;
  fullName: string;
  licenseNumber: string;
  licenseType: string;
  phoneNumber: string;
  avatarUrl?: string;
  isActive: boolean;
  notes?: string;
  createdOnUtc: string;
}

export interface CreateVehicleDto {
  vehicleType: number;
  brand?: string;
  model?: string;
  seatCapacity: number;
  quantity?: number;
  locationArea?: number;
  operatingCountries?: string;
  vehicleImageUrls?: string[];
  notes?: string;
}

export interface UpdateVehicleDto {
  vehicleType: number;
  brand?: string;
  model?: string;
  seatCapacity?: number;
  quantity?: number;
  locationArea?: number;
  operatingCountries?: string;
  vehicleImageUrls?: string[];
  notes?: string;
}

export interface CreateDriverDto {
  fullName: string;
  licenseNumber: string;
  licenseType: number;
  phoneNumber: string;
  avatarUrl?: string;
  notes?: string;
}

export interface UpdateDriverDto {
  fullName?: string;
  licenseNumber?: string;
  licenseType?: number;
  phoneNumber?: string;
  avatarUrl?: string;
  notes?: string;
}

// Trip Assignment types
export type TripStatus = "Pending" | "InProgress" | "Completed" | "Rejected" | "Cancelled";

export interface TripAssignment {
  id: string;
  bookingReference: string;
  route: string;
  tripDate: string;
  vehicleType: string;
  driverName: string;
  status: TripStatus;
  createdOnUtc: string;
}

export interface TripAssignmentDetail extends TripAssignment {
  vehicleType: string;
  vehicleCapacity: number;
  driverPhone: string;
  driverLicense: string;
  notes: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Revenue types
export interface RevenueSummary {
  totalRevenue: number;
  completedTrips: number;
  avgRevenuePerTrip: number;
  monthlyBreakdown: MonthlyRevenue[];
}

export interface MonthlyRevenue {
  month: number;
  year: number;
  revenue: number;
  trips: number;
}

export interface TripHistoryItem {
  id: string;
  bookingReference: string;
  route: string;
  completedDate: string;
  driverName: string;
  revenue: number;
}

// Company Profile types
export interface TransportCompanyProfile {
  userId: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
}

export interface UpdateCompanyProfileDto {
  companyName?: string;
  address?: string;
  phone?: string;
  email?: string;
}

class TransportProviderService {
  // Vehicles
  async getVehicles(
    pageNumber: number = 1,
    pageSize: number = 50,
    isActive?: boolean,
    locationArea?: number,
    isDeleted: boolean = false
  ): Promise<PaginatedResponse<Vehicle> | null> {
    try {
      const params: any = { pageNumber, pageSize, isDeleted };
      if (locationArea !== undefined) params.locationArea = locationArea;
      if (isActive !== undefined) params.isActive = isActive;
      const response = await axiosInstance.get<PaginatedResponse<Vehicle>>("/transport-provider/vehicles", { params });
      return extractResult(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async getVehicleById(id: string): Promise<Vehicle | null> {
    try {
      const response = await axiosInstance.get<Vehicle>(`/transport-provider/vehicles/${id}`);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async createVehicle(data: CreateVehicleDto): Promise<Vehicle | null> {
    try {
      const response = await axiosInstance.post<Vehicle>("/transport-provider/vehicles", data);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async updateVehicle(id: string, data: UpdateVehicleDto): Promise<Vehicle | null> {
    try {
      const response = await axiosInstance.put<Vehicle>(`/transport-provider/vehicles/${id}`, data);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async deleteVehicle(id: string): Promise<boolean> {
    try {
      await axiosInstance.delete(`/transport-provider/vehicles/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  }

  /**
   * Returns vehicles with real-time available quantity for a specific date.
   * Use this for the approve form to show "Còn trống X/Y" per vehicle.
   *
   * **Note:** `getVehicles` returns the full paginated fleet inventory;
   * this endpoint only returns vehicles with `availableQuantity > 0`.
   *
   * @param date      ISO date string, e.g. "2026-05-01"
   * @param vehicleType  Numeric enum value (0=Bus, 1=Coach, etc.)
   * @param excludeActivityId  Pass during re-approval so the current vehicle still shows as available
   *
   * @example
   * ```ts
   * const available = await transportProviderService.getAvailableVehicles("2026-05-01", 0);
   * // → [{ id: "...", brand: "Hyundai", availableQuantity: 3, quantity: 5, ... }]
   * ```
   */
  async getAvailableVehicles(
    date: string,
    vehicleType?: number,
    excludeActivityId?: string
  ): Promise<AvailableVehicle[] | null> {
    try {
      const params: Record<string, string | number> = { date };
      if (vehicleType !== undefined) params.vehicleType = vehicleType;
      if (excludeActivityId) params.excludeActivityId = excludeActivityId;
      const response = await axiosInstance.get<AvailableVehicle[]>(
        "/transport-provider/vehicles/available",
        { params }
      );
      return extractItems<AvailableVehicle>(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  /**
   * Returns vehicle block schedule for the calendar dashboard.
   *
   * @param fromDate  ISO date string, e.g. "2026-05-01"
   * @param toDate    ISO date string, e.g. "2026-05-31"
   * @param vehicleId Filter to a single vehicle (optional)
   *
   * @example
   * ```ts
   * const schedule = await transportProviderService.getVehicleSchedule("2026-05-01", "2026-05-31");
   * // → [{ blockId: "...", blockedDate: "2026-05-03", holdStatus: "Hard", ... }]
   * ```
   */
  async getVehicleSchedule(
    fromDate: string,
    toDate: string,
    vehicleId?: string
  ): Promise<VehicleScheduleItem[] | null> {
    try {
      const params: Record<string, string> = { from: fromDate, to: toDate };
      if (vehicleId) params.vehicleId = vehicleId;
      const response = await axiosInstance.get<VehicleScheduleItem[]>(
        "/transport-provider/vehicles/schedule",
        { params }
      );
      return extractItems<VehicleScheduleItem>(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  // Drivers
  async getDrivers(
    pageNumber: number = 1,
    pageSize: number = 50,
    isActive?: boolean
  ): Promise<PaginatedResponse<Driver> | null> {
    try {
      const params: any = { pageNumber, pageSize };
      if (isActive !== undefined) params.isActive = isActive;
      const response = await axiosInstance.get<PaginatedResponse<Driver>>("/transport-provider/drivers", { params });
      return extractResult(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async getDriverById(id: string): Promise<Driver | null> {
    try {
      const response = await axiosInstance.get<Driver>(`/transport-provider/drivers/${id}`);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async createDriver(data: CreateDriverDto): Promise<Driver | null> {
    try {
      const response = await axiosInstance.post<Driver>("/transport-provider/drivers", data);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async updateDriver(id: string, data: UpdateDriverDto): Promise<Driver | null> {
    try {
      const response = await axiosInstance.put<Driver>(`/transport-provider/drivers/${id}`, data);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async deleteDriver(id: string): Promise<boolean> {
    try {
      await axiosInstance.delete(`/transport-provider/drivers/${id}`);
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  }

  // Trip Assignments
  async getTripAssignments(status?: TripStatus): Promise<TripAssignment[]> {
    try {
      const params = status !== undefined ? { status } : {};
      const response = await axiosInstance.get<TripAssignment[]>("/transport-provider/trip-assignments", { params });
      return extractItems(response.data);
    } catch (error) {
      handleApiError(error);
      return [];
    }
  }

  async getTripAssignmentDetail(id: string): Promise<TripAssignmentDetail | null> {
    try {
      const response = await axiosInstance.get<TripAssignmentDetail>(`/transport-provider/trip-assignments/${id}`);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async acceptTripAssignment(id: string): Promise<boolean> {
    try {
      await axiosInstance.put(`/transport-provider/trip-assignments/${id}/accept`);
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  }

  async rejectTripAssignment(id: string, reason?: string): Promise<boolean> {
    try {
      await axiosInstance.put(`/transport-provider/trip-assignments/${id}/reject`, { Reason: reason });
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  }

  async updateTripStatus(id: string, status: TripStatus): Promise<boolean> {
    try {
      await axiosInstance.patch(`/transport-provider/trip-assignments/${id}/status`, { status });
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  }

  // Revenue
  async getRevenueSummary(year: number, quarter?: number): Promise<RevenueSummary | null> {
    try {
      const params: Record<string, number> = { year };
      if (quarter !== undefined) params.quarter = quarter;
      const response = await axiosInstance.get<RevenueSummary>("/transport-provider/revenue/summary", { params });
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async getTripHistory(page: number, pageSize: number, year?: number, quarter?: number): Promise<PaginatedResponse<TripHistoryItem> | null> {
    try {
      const params: Record<string, number> = { page, pageSize };
      if (year !== undefined) params.year = year;
      if (quarter !== undefined) params.quarter = quarter;
      const response = await axiosInstance.get<PaginatedResponse<TripHistoryItem>>("/transport-provider/revenue/history", { params });
      return extractResult(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  // Company Profile
  async getCompanyProfile(): Promise<TransportCompanyProfile | null> {
    try {
      const response = await axiosInstance.get<TransportCompanyProfile>("/transport-provider/company");
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async updateCompanyProfile(data: UpdateCompanyProfileDto): Promise<TransportCompanyProfile | null> {
    try {
      const response = await axiosInstance.put<TransportCompanyProfile>("/transport-provider/company", data);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }
}

export const transportProviderService = new TransportProviderService();

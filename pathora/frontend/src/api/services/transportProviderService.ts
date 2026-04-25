import axiosInstance from "@/api/axiosInstance";
import { extractData, extractItems, extractResult, handleApiError } from "@/utils/apiResponse";

export interface Vehicle {
  id: string;
  vehiclePlate: string;
  vehicleType: string;
  brand?: string;
  model?: string;
  seatCapacity: number;
  locationArea?: string;
  operatingCountries?: string;
  vehicleImageUrls?: string[];
  isActive: boolean;
  notes?: string;
  createdOnUtc: string;
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
  vehiclePlate: string;
  vehicleType: number;
  brand?: string;
  model?: string;
  seatCapacity: number;
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
  vehiclePlate: string;
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
  vehiclePlate: string;
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
    locationArea?: number
  ): Promise<PaginatedResponse<Vehicle> | null> {
    try {
      const params: any = { pageNumber, pageSize };
      if (locationArea !== undefined) params.locationArea = locationArea;
      if (isActive !== undefined) params.isActive = isActive;
      const response = await axiosInstance.get<PaginatedResponse<Vehicle>>("/transport-provider/vehicles", { params });
      return extractResult(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async getVehicleByPlate(plate: string): Promise<Vehicle | null> {
    try {
      const response = await axiosInstance.get<Vehicle>(`/transport-provider/vehicles/${plate}`);
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

  async updateVehicle(plate: string, data: UpdateVehicleDto): Promise<Vehicle | null> {
    try {
      const response = await axiosInstance.put<Vehicle>(`/transport-provider/vehicles/${plate}`, data);
      return extractData(response.data);
    } catch (error) {
      handleApiError(error);
      return null;
    }
  }

  async deleteVehicle(plate: string): Promise<boolean> {
    try {
      await axiosInstance.delete(`/transport-provider/vehicles/${plate}`);
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
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

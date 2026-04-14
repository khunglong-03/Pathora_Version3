import { api } from "@/api/axiosInstance";
import type { ApiResponse } from "@/types/home";
import { extractResult } from "@/utils/apiResponse";

export interface SupplierItem {
  id: string;
  supplierCode: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  continents?: string[];
  createdAt: string | null;
}

export const supplierService = {
  getSuppliers: async (supplierType?: number) => {
    const params = new URLSearchParams();
    if (supplierType !== undefined) {
      params.append("supplierType", supplierType.toString());
    }

    const response = await api.get<ApiResponse<SupplierItem[]>>(
      `/api/suppliers?${params.toString()}`,
    );
    return extractResult<SupplierItem[]>(response.data);
  },
};

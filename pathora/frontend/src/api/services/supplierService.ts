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
  supplierType: string;
  note: string | null;
  isActive: boolean;
}

/** Raw shape from backend — `supplierId` instead of `id` */
interface SupplierRaw {
  supplierId: string;
  supplierCode: string;
  supplierType: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  isActive: boolean;
}

export const supplierService = {
  /**
   * @param supplierType  Backend enum name: "Accommodation", "Transport", etc.
   */
  getSuppliers: async (supplierType?: string) => {
    const params = new URLSearchParams();
    if (supplierType) {
      params.append("supplierType", supplierType);
    }

    const response = await api.get<ApiResponse<SupplierRaw[]>>(
      `/api/suppliers?${params.toString()}`,
    );
    const raw = extractResult<SupplierRaw[]>(response.data) ?? [];

    // Normalise: backend returns `supplierId`, frontend expects `id`
    return raw.map((s): SupplierItem => ({
      id: s.supplierId,
      supplierCode: s.supplierCode,
      name: s.name,
      phone: s.phone,
      email: s.email,
      address: s.address,
      supplierType: s.supplierType,
      note: s.note,
      isActive: s.isActive,
    }));
  },
};

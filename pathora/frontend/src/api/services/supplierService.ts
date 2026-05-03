import { api } from "@/api/axiosInstance";
import type { ServiceResponse } from "@/types/api";
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
   * @param continent Backend Continent enum value.
   */
  getSuppliers: async (supplierType?: string, continent?: number | null) => {
    const params = new URLSearchParams();
    if (supplierType) {
      params.append("supplierType", supplierType);
    }
    if (continent !== undefined && continent !== null) {
      params.append("continent", continent.toString());
    }

    const response = await api.get<ServiceResponse<SupplierRaw[]>>(
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

  getSupplierAccommodations: async (supplierId: string) => {
    const response = await api.get<ServiceResponse<any[]>>(
      `/api/suppliers/${supplierId}/accommodations`
    );
    return extractResult<any[]>(response.data) ?? [];
  },
};

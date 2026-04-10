import { api } from "@/api/axiosInstance";

export type SupplierType = "Transport" | "Accommodation" | "Activity";

export interface CreateSupplierPayload {
  /** User email — the owner account to create */
  ownerEmail: string;
  /** User full name — the owner account to create */
  ownerFullName: string;
  /** Supplier code (unique) */
  supplierCode: string;
  /** Supplier type: Transport or Accommodation */
  supplierType: SupplierType;
  /** Supplier name */
  supplierName: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
}

export interface CreateSupplierResponse {
  /** User ID of the newly created owner account */
  userId: string;
  /** Supplier ID of the newly created supplier */
  supplierId: string;
}

/** POST /api/suppliers/with-owner — Admin-only. Creates User + Supplier atomically. */
export async function createSupplierWithOwner(
  payload: CreateSupplierPayload
): Promise<CreateSupplierResponse> {
  const response = await api.post<CreateSupplierResponse>(
    "/api/suppliers/with-owner",
    payload
  );
  return response.data;
}

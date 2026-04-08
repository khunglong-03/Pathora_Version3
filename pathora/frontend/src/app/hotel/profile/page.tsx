"use client";

import React, { useEffect, useState } from "react";
import { Pencil } from "@phosphor-icons/react";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type { AccommodationItem, HotelSupplierInfo } from "@/api/services/hotelProviderService";
import {
  AdminPageHeader,
  AdminErrorCard,
} from "@/features/dashboard/components";
import HotelProfileForm from "@/components/hotel/HotelProfileForm";

export default function HotelProfilePage() {
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [supplierInfo, setSupplierInfo] = useState<HotelSupplierInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [accData, infoData] = await Promise.all([
        hotelProviderService.getAccommodations(),
        hotelProviderService.getSupplierInfo(),
      ]);
      setAccommodations(accData);
      setSupplierInfo(infoData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSave = async (data: { name: string; address?: string; phone?: string; email?: string; notes?: string }) => {
    if (!supplierInfo) return;
    await hotelProviderService.updateSupplierInfo(supplierInfo.id, {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      notes: data.notes,
    });
    setIsEditing(false);
    await loadData();
  };

  const totalRooms = accommodations.reduce(
    (sum, acc) => sum + acc.totalRooms,
    0,
  );

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Thông tin khách sạn"
        subtitle="Thông tin cơ bản của khách sạn"
        onRefresh={() => void loadData()}
      />

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#6366F1", borderTopColor: "transparent" }} />
        </div>
      )}

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadData()} />
      )}

      {!error && !isLoading && supplierInfo && (
        <>
          {/* Edit Button */}
          {!isEditing && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#6366F1" }}
              >
                <Pencil size={14} />
                Chỉnh sửa
              </button>
            </div>
          )}

          {isEditing ? (
            <HotelProfileForm
              data={supplierInfo}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <>
              {/* Supplier Info Display */}
              <div
                className="rounded-xl p-6 mb-4"
                style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
              >
                <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Tên khách sạn</p>
                    <p className="font-medium">{supplierInfo.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Địa chỉ</p>
                    <p className="font-medium">{supplierInfo.address ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Số điện thoại</p>
                    <p className="font-medium">{supplierInfo.phone ?? "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Email</p>
                    <p className="font-medium">{supplierInfo.email ?? "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Ghi chú</p>
                    <p className="font-medium">{supplierInfo.notes ?? "-"}</p>
                  </div>
                </div>
              </div>

              {/* Room Info */}
              <div
                className="rounded-xl p-6"
                style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
              >
                <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Thông tin phòng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Tổng số loại phòng</p>
                    <p className="text-lg font-semibold">{accommodations.length}</p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Tổng số phòng</p>
                    <p className="text-lg font-semibold">{totalRooms}</p>
                  </div>
                </div>

                {accommodations.length > 0 && (
                  <>
                    <h4 className="text-xs font-semibold mt-6 mb-2" style={{ color: "#9CA3AF" }}>
                      CÁC LOẠI PHÒNG
                    </h4>
                    <div className="space-y-2">
                      {accommodations.map((acc) => (
                        <div
                          key={acc.id}
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ backgroundColor: "#F8FAFC" }}
                        >
                          <div>
                            <p className="text-sm font-medium">{acc.roomType}</p>
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>
                              {acc.name ?? acc.address ?? "-"}
                            </p>
                          </div>
                          <span className="text-sm font-semibold">{acc.totalRooms} phòng</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {accommodations.length === 0 && (
                  <p className="text-sm mt-4" style={{ color: "#9CA3AF" }}>
                    Chưa có loại phòng nào.
                  </p>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

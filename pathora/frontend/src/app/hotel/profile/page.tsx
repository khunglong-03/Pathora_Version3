"use client";

import React, { useEffect, useState } from "react";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type { AccommodationItem } from "@/api/services/hotelProviderService";
import { AdminPageHeader } from "@/features/dashboard/components";

export default function HotelProfilePage() {
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hotelProviderService
      .getAccommodations()
      .then((data) => {
        setAccommodations(data);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const totalRooms = accommodations.reduce(
    (sum, acc) => sum + acc.totalRooms,
    0,
  );

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Thông tin khách sạn"
        subtitle="Thông tin cơ bản của khách sạn"
        onRefresh={() => window.location.reload()}
      />

      {error && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}
        >
          {error}
        </div>
      )}

      {!error && !isLoading && (
        <div
          className="rounded-xl p-6 mt-4"
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
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              Chưa có loại phòng nào.
            </p>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <p className="text-sm" style={{ color: "#9CA3AF" }}>Đang tải...</p>
        </div>
      )}
    </div>
  );
}

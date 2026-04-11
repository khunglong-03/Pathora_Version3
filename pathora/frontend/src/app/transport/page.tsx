"use client";

import React, { useEffect, useState } from "react";
import { Truck, Clock, MapPin, CurrencyDollar } from "@phosphor-icons/react";
import {
  AdminPageHeader,
  AdminKpiStrip,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";

export default function TransportDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Placeholder: load real data when API is ready
    setIsLoading(false);
  }, []);

  const kpis = [
    {
      label: "Phương tiện",
      value: "-",
      icon: "Truck",
      accent: "#6366F1",
    },
    {
      label: "Chuyến đi hôm nay",
      value: "-",
      icon: "Clock",
      accent: "#F59E0B",
    },
    {
      label: "Tuyến đường",
      value: "-",
      icon: "MapPin",
      accent: "#22C55E",
    },
    {
      label: "Doanh thu tháng",
      value: "-",
      icon: "CurrencyDollar",
      accent: "#EF4444",
    },
  ];

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Nhà cung cấp vận tải"
        subtitle="Quản lý phương tiện & chuyến đi"
      />

      <AdminKpiStrip kpis={kpis} />

      {error && (
        <AdminErrorCard message={error} onRetry={() => setIsLoading(false)} />
      )}

      {!error && !isLoading && (
        <AdminEmptyState
          icon="Truck"
          heading="Chưa có dữ liệu"
          description="Các tính năng quản lý vận tải sẽ sớm được cập nhật."
        />
      )}
    </div>
  );
}
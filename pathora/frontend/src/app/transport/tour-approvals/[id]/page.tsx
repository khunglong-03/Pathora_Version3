"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import { TourInstanceDto, TourInstancePlanRouteDto } from "@/types/tour";

export default function TransportTourApprovalDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [tour, setTour] = useState<TourInstanceDto | null>(null);
  const [savingRouteId, setSavingRouteId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const detail = await tourInstanceService.getInstanceDetail(params.id);
      setTour(detail);
    })();
  }, [params.id]);

  const routes = useMemo(
    () => tour?.days?.flatMap((day) => day.activities.flatMap((activity) => activity.routes)) ?? [],
    [tour],
  );

  const handleAssign = async (route: TourInstancePlanRouteDto) => {
    if (!selectedVehicleId || !selectedDriverId) return;
    setSavingRouteId(route.id);
    setMessage("");
    try {
      await tourInstanceService.assignVehicleToRoute(params.id, route.id, {
        vehicleId: selectedVehicleId,
        driverId: selectedDriverId,
      });
      setMessage("Đã gán xe và tài xế thành công.");
      const updated = await tourInstanceService.getInstanceDetail(params.id);
      setTour(updated);
    } finally {
      setSavingRouteId(null);
    }
  };

  if (!tour) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => router.back()} className="text-sm text-blue-600">← Quay lại</button>
      <h1 className="text-2xl font-bold">{tour.title}</h1>
      <p>{tour.tourCode}</p>
      {message && <div className="rounded bg-green-50 p-3 text-green-700">{message}</div>}
      <div className="space-y-4">
        {routes.map((route) => (
          <div key={route.id} className="rounded border p-4 space-y-3">
            <div>{route.pickupLocation} → {route.dropoffLocation}</div>
            <div className="flex gap-3">
              <input
                className="border px-3 py-2"
                placeholder="Vehicle ID"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
              />
              <input
                className="border px-3 py-2"
                placeholder="Driver ID"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              />
              <button
                onClick={() => void handleAssign(route)}
                disabled={savingRouteId === route.id}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                {savingRouteId === route.id ? "Đang lưu..." : "Gán"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

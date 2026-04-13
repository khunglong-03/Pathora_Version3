"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { transportProviderService } from "@/api/services/transportProviderService";
import type {
  TripAssignment,
  TripAssignmentDetail,
  TripStatus,
} from "@/api/services/transportProviderService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import { toast } from "react-toastify";

type StatusFilter = "all" | "pending" | "inprogress" | "completed" | "rejected" | "cancelled";

const TRIP_STATUS_COLOR: Record<string, string> = {
  Pending: "#C9873A",
  InProgress: "#3B82F6",
  Completed: "#22C55E",
  Rejected: "#EF4444",
  Cancelled: "#9CA3AF",
};

const TRIP_STATUS_LABEL: Record<string, string> = {
  Pending: "Chờ xác nhận",
  InProgress: "Đang thực hiện",
  Completed: "Hoàn thành",
  Rejected: "Từ chối",
  Cancelled: "Đã hủy",
};

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "pending", label: "Chờ xác nhận" },
  { key: "inprogress", label: "Đang thực hiện" },
  { key: "completed", label: "Hoàn thành" },
  { key: "rejected", label: "Từ chối" },
  { key: "cancelled", label: "Đã hủy" },
];

export default function TransportTripsPage() {
  const [trips, setTrips] = useState<TripAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedTrip, setSelectedTrip] = useState<TripAssignmentDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadTrips = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transportProviderService.getTripAssignments();
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách chuyến");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTrips();
  }, [loadTrips]);

  const loadTripDetail = async (id: string) => {
    setIsDetailLoading(true);
    try {
      const detail = await transportProviderService.getTripAssignmentDetail(id);
      setSelectedTrip(detail);
    } catch {
      toast.error("Không thể tải chi tiết chuyến");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleRowClick = (trip: TripAssignment) => {
    void loadTripDetail(trip.id);
  };

  const handleAction = async (
    id: string,
    action: "accept" | "reject" | "complete" | "cancel",
    reason?: string,
  ) => {
    setIsActionLoading(true);
    try {
      let success = false;
      if (action === "accept") {
        success = await transportProviderService.acceptTripAssignment(id);
      } else if (action === "reject") {
        success = await transportProviderService.rejectTripAssignment(id, reason);
      } else if (action === "complete") {
        success = await transportProviderService.updateTripStatus(id, "Completed");
      } else if (action === "cancel") {
        success = await transportProviderService.updateTripStatus(id, "Cancelled");
      }
      if (success) {
        toast.success(
          action === "accept"
            ? "Đã nhận chuyến"
            : action === "reject"
            ? "Đã từ chối chuyến"
            : action === "complete"
            ? "Đã hoàn thành chuyến"
            : "Đã hủy chuyến",
        );
        setSelectedTrip(null);
        void loadTrips();
      } else {
        toast.error("Thao tác thất bại. Vui lòng thử lại.");
      }
    } catch {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (filter === "all") return true;
    if (filter === "pending") return t.status === "Pending";
    if (filter === "inprogress") return t.status === "InProgress";
    if (filter === "completed") return t.status === "Completed";
    if (filter === "rejected") return t.status === "Rejected";
    if (filter === "cancelled") return t.status === "Cancelled";
    return true;
  });

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const pendingCount = trips.filter((t) => t.status === "Pending").length;

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Phân công chuyến"
        subtitle={pendingCount > 0 ? `${pendingCount} chuyến chờ xác nhận` : `${trips.length} chuyến`}
        onRefresh={() => void loadTrips()}
      />

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {FILTER_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? trips.length
              : tab.key === "pending"
              ? trips.filter((t) => t.status === "Pending").length
              : tab.key === "inprogress"
              ? trips.filter((t) => t.status === "InProgress").length
              : tab.key === "completed"
              ? trips.filter((t) => t.status === "Completed").length
              : tab.key === "rejected"
              ? trips.filter((t) => t.status === "Rejected").length
              : trips.filter((t) => t.status === "Cancelled").length;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                filter === tab.key ? "text-white" : "border"
              }`}
              style={
                filter === tab.key
                  ? { backgroundColor: "#6366F1" }
                  : { borderColor: "var(--border)", color: "var(--text-secondary)" }
              }
              aria-pressed={filter === tab.key}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadTrips()} />
      )}

      {!error && !isLoading && filteredTrips.length === 0 && (
        <AdminEmptyState
          icon="heroicons:clipboard-document-list"
          heading="Không có chuyến nào"
          description="Chưa có chuyến phân công nào."
        />
      )}

      {!error && !isLoading && filteredTrips.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
        >
          <table className="w-full text-sm" role="table" aria-label="Danh sách phân công chuyến">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
              >
                <th className="px-4 py-3 font-medium">Mã chuyến</th>
                <th className="px-4 py-3 font-medium">Tuyến đường</th>
                <th className="px-4 py-3 font-medium">Ngày</th>
                <th className="px-4 py-3 font-medium">Xe</th>
                <th className="px-4 py-3 font-medium">Tài xế</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrips.map((trip) => (
                <tr
                  key={trip.id}
                  className="border-t transition-colors duration-150 hover:bg-gray-50"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3 font-mono text-xs">{trip.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 font-medium">{trip.route ?? "-"}</td>
                  <td className="px-4 py-3">{formatDate(trip.tripDate)}</td>
                  <td className="px-4 py-3">{trip.vehiclePlate ?? "-"}</td>
                  <td className="px-4 py-3">{trip.driverName ?? "-"}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${TRIP_STATUS_COLOR[trip.status] ?? "#9CA3AF"}20`,
                        color: TRIP_STATUS_COLOR[trip.status] ?? "#9CA3AF",
                      }}
                      role="status"
                    >
                      {TRIP_STATUS_LABEL[trip.status] ?? trip.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleRowClick(trip)}
                        className="p-2 rounded-lg transition-colors duration-150 hover:bg-gray-100"
                        style={{ color: "#6B7280" }}
                        aria-label={`Xem chi tiết chuyến ${trip.id}`}
                      >
                        <EyeIcon size={16} />
                      </button>
                      {trip.status === "Pending" && (
                        <>
                          <button
                            onClick={() => void handleAction(trip.id, "accept")}
                            disabled={isActionLoading}
                            className="p-2 rounded-lg transition-colors duration-150 hover:bg-green-50 disabled:opacity-50"
                            style={{ color: "#22C55E" }}
                            aria-label="Nhận chuyến"
                          >
                            <CheckCircleIcon size={16} />
                          </button>
                          <button
                            onClick={() => void handleAction(trip.id, "reject")}
                            disabled={isActionLoading}
                            className="p-2 rounded-lg transition-colors duration-150 hover:bg-red-50 disabled:opacity-50"
                            style={{ color: "#EF4444" }}
                            aria-label="Từ chối chuyến"
                          >
                            <XCircleIcon size={16} />
                          </button>
                        </>
                      )}
                      {trip.status === "InProgress" && (
                        <>
                          <button
                            onClick={() => void handleAction(trip.id, "complete")}
                            disabled={isActionLoading}
                            className="p-2 rounded-lg transition-colors duration-150 hover:bg-green-50 disabled:opacity-50"
                            style={{ color: "#22C55E" }}
                            aria-label="Hoàn thành chuyến"
                          >
                            <CheckCircleIcon size={16} />
                          </button>
                          <button
                            onClick={() => void handleAction(trip.id, "cancel")}
                            disabled={isActionLoading}
                            className="p-2 rounded-lg transition-colors duration-150 hover:bg-red-50 disabled:opacity-50"
                            style={{ color: "#EF4444" }}
                            aria-label="Hủy chuyến"
                          >
                            <XIcon size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Trip Detail Modal */}
      {selectedTrip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedTrip(null)}
          />
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <h2 className="text-lg font-semibold" style={{ color: "#111827" }}>
                  Chi tiết chuyến
                </h2>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>
                  Mã chuyến: {selectedTrip.id.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-2 rounded-lg transition-colors duration-150 hover:bg-gray-100"
                aria-label="Đóng"
              >
                <XIcon size={20} style={{ color: "#6B7280" }} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${TRIP_STATUS_COLOR[selectedTrip.status] ?? "#9CA3AF"}20`,
                    color: TRIP_STATUS_COLOR[selectedTrip.status] ?? "#9CA3AF",
                  }}
                  role="status"
                >
                  {TRIP_STATUS_LABEL[selectedTrip.status] ?? selectedTrip.status}
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Booking</p>
                  <p className="font-medium">{selectedTrip.bookingReference ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Ngày tạo</p>
                  <p className="font-medium">{selectedTrip.createdOnUtc ? new Date(selectedTrip.createdOnUtc).toLocaleDateString("vi-VN") : "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Ngày</p>
                  <p className="font-medium">{formatDate(selectedTrip.tripDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tuyến đường</p>
                  <p className="font-medium">{selectedTrip.route ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Xe</p>
                  <p className="font-medium">{selectedTrip.vehiclePlate ?? "-"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    {selectedTrip.vehicleType ?? ""} · {selectedTrip.vehicleCapacity ? `${selectedTrip.vehicleCapacity} chỗ` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tài xế</p>
                  <p className="font-medium">{selectedTrip.driverName ?? "-"}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    {selectedTrip.driverPhone ?? ""} · {selectedTrip.driverLicense ?? ""}
                  </p>
                </div>
                {selectedTrip.notes && (
                  <div className="col-span-2">
                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Ghi chú</p>
                    <p>{selectedTrip.notes}</p>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4"
              style={{ borderTop: "1px solid var(--border)", backgroundColor: "#F8FAFC" }}
            >
              {selectedTrip.status === "Pending" && (
                <>
                  <button
                    onClick={() => void handleAction(selectedTrip.id, "reject")}
                    disabled={isActionLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#EF4444" }}
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => void handleAction(selectedTrip.id, "accept")}
                    disabled={isActionLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#22C55E" }}
                  >
                    Nhận chuyến
                  </button>
                </>
              )}
              {selectedTrip.status === "InProgress" && (
                <>
                  <button
                    onClick={() => void handleAction(selectedTrip.id, "cancel")}
                    disabled={isActionLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#9CA3AF" }}
                  >
                    Hủy chuyến
                  </button>
                  <button
                    onClick={() => void handleAction(selectedTrip.id, "complete")}
                    disabled={isActionLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: "#22C55E" }}
                  >
                    Hoàn thành
                  </button>
                </>
              )}
              {(selectedTrip.status === "Completed" ||
                selectedTrip.status === "Rejected" ||
                selectedTrip.status === "Cancelled") && (
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 hover:opacity-80"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Đóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

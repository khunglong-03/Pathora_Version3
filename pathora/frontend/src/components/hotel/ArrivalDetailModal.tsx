"use client";

import React, { useEffect, useState } from "react";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type {
  GuestArrivalItem,
  GuestArrivalDetail,
  GuestStayStatus,
} from "@/api/services/hotelProviderService";
import Modal from "@/components/ui/Modal";

const STATUS_CONFIG: Record<
  GuestStayStatus,
  { label: string; color: string; bg: string }
> = {
  Pending: { label: "Chờ", color: "#C9873A", bg: "#FEF3C7" },
  CheckedIn: { label: "Đã check-in", color: "#22C55E", bg: "#DCFCE7" },
  CheckedOut: { label: "Đã check-out", color: "#3B82F6", bg: "#DBEAFE" },
  NoShow: { label: "Không đến", color: "#EF4444", bg: "#FEE2E2" },
};

interface ArrivalDetailModalProps {
  arrival: GuestArrivalItem;
  onClose: () => void;
  onRefresh: () => void;
}

export default function ArrivalDetailModal({
  arrival,
  onClose,
  onRefresh,
}: ArrivalDetailModalProps) {
  const [detail, setDetail] = useState<GuestArrivalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showNoShowConfirm, setShowNoShowConfirm] = useState(false);

  useEffect(() => {
    hotelProviderService
      .getGuestArrivalDetail(arrival.bookingAccommodationDetailId)
      .then((data) => {
        setDetail(data);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [arrival.bookingAccommodationDetailId]);

  const handleAction = async (status: GuestStayStatus) => {
    if (status === "NoShow" && !showNoShowConfirm) {
      setShowNoShowConfirm(true);
      return;
    }
    setIsUpdating(true);
    setUpdateError(null);
    try {
      await hotelProviderService.updateGuestArrival(arrival.id, { status });
      setShowNoShowConfirm(false);
      onRefresh();
      onClose();
    } catch (err) {
      setUpdateError(
        err instanceof Error ? err.message : "Cập nhật thất bại",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const maskPassport = (passport: string) => {
    if (passport.length <= 4) return passport;
    return passport.slice(0, 2) + "****" + passport.slice(-2);
  };

  const cfg = STATUS_CONFIG[arrival.status];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Chi tiết check-in"
      className="max-w-2xl"
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 rounded animate-pulse" style={{ backgroundColor: "#F0F0F0" }} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {updateError && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
              {updateError}
            </div>
          )}

          {/* Booking Info */}
          <div
            className="rounded-xl p-4"
            style={{ border: "1px solid var(--border)", backgroundColor: "#F8FAFC" }}
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Booking ID</p>
                <p className="font-mono font-medium">
                  {arrival.bookingAccommodationDetailId.slice(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Khách sạn</p>
                <p className="font-medium">{arrival.accommodationName ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Check-in</p>
                <p className="font-medium">{formatDate(arrival.checkInDate)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Check-out</p>
                <p className="font-medium">{formatDate(arrival.checkOutDate)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Trạng thái</p>
                <span
                  className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
              <div>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Số khách</p>
                <p className="font-medium">{arrival.participantCount}</p>
              </div>
            </div>
            {detail?.note && (
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs" style={{ color: "#9CA3AF" }}>Ghi chú</p>
                <p className="text-sm">{detail.note}</p>
              </div>
            )}
          </div>

          {/* Participant List */}
          {detail && detail.participants.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3">Danh sách khách</h4>
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border)" }}
              >
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
                    >
                      <th className="px-4 py-2 text-left text-xs font-medium">Họ tên</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Passport</th>
                      <th className="px-4 py-2 text-left text-xs font-medium">Trạng thái</th>
                      <th className="px-4 py-2 text-right text-xs font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.participants.map((p) => {
                      const pCfg = STATUS_CONFIG[p.status];
                      return (
                        <tr
                          key={p.id}
                          className="border-t"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <td className="px-4 py-3">{p.fullName}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {maskPassport(p.passportNumber)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: pCfg.bg, color: pCfg.color }}
                            >
                              {pCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.status === "Pending" && (
                              <button
                                onClick={() => handleAction("CheckedIn")}
                                disabled={isUpdating}
                                className="px-2 py-1 rounded text-xs text-white"
                                style={{ backgroundColor: "#22C55E" }}
                              >
                                {isUpdating ? "..." : "Check-in"}
                              </button>
                            )}
                            {p.status === "CheckedIn" && (
                              <button
                                onClick={() => handleAction("CheckedOut")}
                                disabled={isUpdating}
                                className="px-2 py-1 rounded text-xs text-white"
                                style={{ backgroundColor: "#3B82F6" }}
                              >
                                {isUpdating ? "..." : "Check-out"}
                              </button>
                            )}
                            {(p.status === "CheckedOut" || p.status === "NoShow") && (
                              <span className="text-xs" style={{ color: "#9CA3AF" }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {(arrival.status === "Pending" || arrival.status === "CheckedIn") && (
                <button
                  onClick={() => handleAction("NoShow")}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg text-sm border transition-all"
                  style={{ borderColor: "#EF4444", color: "#EF4444" }}
                >
                  {isUpdating ? "..." : "Không đến (NoShow)"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {arrival.status === "Pending" && (
                <button
                  onClick={() => handleAction("CheckedIn")}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg text-sm text-white"
                  style={{ backgroundColor: "#22C55E" }}
                >
                  {isUpdating ? "..." : "Check-in"}
                </button>
              )}
              {arrival.status === "CheckedIn" && (
                <button
                  onClick={() => handleAction("CheckedOut")}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-lg text-sm text-white"
                  style={{ backgroundColor: "#3B82F6" }}
                >
                  {isUpdating ? "..." : "Check-out"}
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm border"
                style={{ borderColor: "var(--border)" }}
              >
                Đóng
              </button>
            </div>
          </div>

          {/* NoShow Confirmation */}
          {showNoShowConfirm && (
            <div
              className="p-4 rounded-xl"
              style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA" }}
            >
              <p className="text-sm font-medium mb-3" style={{ color: "#DC2626" }}>
                Xác nhận đánh dấu không đến?
              </p>
              <p className="text-xs mb-3" style={{ color: "#991B1B" }}>
                Hành động này sẽ đánh dấu toàn bộ booking là &quot;Không đến&quot;.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNoShowConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs border"
                  style={{ borderColor: "#FECACA" }}
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleAction("NoShow")}
                  disabled={isUpdating}
                  className="px-3 py-1.5 rounded-lg text-xs text-white"
                  style={{ backgroundColor: "#EF4444" }}
                >
                  {isUpdating ? "..." : "Xác nhận"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

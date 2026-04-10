"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash, Eye } from "@phosphor-icons/react";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import type {
  AccommodationItem,
  RoomAvailability,
} from "@/api/services/hotelProviderService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import Modal from "@/components/ui/Modal";

const ROOM_TYPE_LABELS: Record<string, string> = {
  Standard: "Phòng Standard",
  Deluxe: "Phòng Deluxe",
  Suite: "Phòng Suite",
  VIP: "Phòng VIP",
  Family: "Phòng Gia đình",
  Single: "Phòng Đơn",
  Double: "Phòng Đôi",
  Twin: "Phòng Twin",
  Triple: "Phòng Ba",
  Quad: "Phòng Bốn",
};

export default function RoomsPage() {
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [availability, setAvailability] = useState<RoomAvailability[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calFromDate, setCalFromDate] = useState("");
  const [calToDate, setCalToDate] = useState("");
  const [loadingCal, setLoadingCal] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [createRoomType, setCreateRoomType] = useState("Standard");
  const [createTotal, setCreateTotal] = useState(1);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTotal, setEditTotal] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadAccommodations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await hotelProviderService.getAccommodations();
      setAccommodations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rooms");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccommodations();
  }, [loadAccommodations]);

  const handleCreate = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      await hotelProviderService.createAccommodation({
        roomType: createRoomType,
        totalRooms: createTotal,
      });
      setShowCreate(false);
      setCreateTotal(1);
      setCreateRoomType("Standard");
      await loadAccommodations();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Tạo phòng thất bại");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const originalTotal = accommodations.find(a => a.id === editingId)?.totalRooms;
    setSaving(true);
    setSaveError(null);
    try {
      await hotelProviderService.updateAccommodation(editingId, {
        totalRooms: editTotal,
      });
      setEditingId(null);
      await loadAccommodations();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Cập nhật thất bại");
      setEditTotal(originalTotal ?? 0);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await hotelProviderService.deleteAccommodation(deleteId);
      setDeleteId(null);
      await loadAccommodations();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Xóa phòng thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const handleViewAvailability = async () => {
    if (!calFromDate || !calToDate) return;
    setLoadingCal(true);
    try {
      const data = await hotelProviderService.getRoomAvailability(
        calFromDate,
        calToDate,
      );
      setAvailability(data);
    } catch {
      setAvailability([]);
    } finally {
      setLoadingCal(false);
    }
  };

  const availabilityByType: Record<string, RoomAvailability[]> = {};
  for (const item of availability) {
    if (!availabilityByType[item.roomType]) {
      availabilityByType[item.roomType] = [];
    }
    availabilityByType[item.roomType]!.push(item);
  }

  const uniqueDates = [...new Set(availability.map((a) => a.date))].sort();

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  return (
    <div className="p-6" data-testid="rooms-page">
      <AdminPageHeader
        title="Quản lý phòng"
        subtitle="Các loại phòng của khách sạn"
        onRefresh={() => void loadAccommodations()}
      />

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setShowCalendar(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
          style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          <Eye size={16} />
          Xem tình trạng phòng
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "#6366F1" }}
        >
          <Plus size={16} />
          Thêm loại phòng
        </button>
      </div>

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadAccommodations()} />
      )}

      {!error && !isLoading && accommodations.length === 0 && (
        <AdminEmptyState
          icon="Bed"
          heading="Chưa có loại phòng nào"
          description="Thêm loại phòng để bắt đầu quản lý."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white text-sm"
              style={{ backgroundColor: "#6366F1" }}
            >
              <Plus size={16} />
              Thêm loại phòng
            </button>
          }
        />
      )}

      {!error && !isLoading && accommodations.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left text-xs uppercase tracking-wider"
                style={{ color: "#9CA3AF", backgroundColor: "#F8FAFC" }}
              >
                <th className="px-4 py-3 font-medium">Loại phòng</th>
                <th className="px-4 py-3 font-medium">Tổng</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ghi chú</th>
                <th className="px-4 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {accommodations.map((acc) => (
                <tr
                  key={acc.id}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3 font-medium">
                    {ROOM_TYPE_LABELS[acc.roomType] ?? acc.roomType}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === acc.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          value={editTotal}
                          onChange={(e) => setEditTotal(parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 rounded border text-sm"
                          style={{ borderColor: "var(--border)" }}
                        />
                        <button
                          onClick={() => void handleSaveEdit()}
                          disabled={saving}
                          className="px-2 py-1 rounded text-xs text-white"
                          style={{ backgroundColor: "#22C55E" }}
                        >
                          {saving ? "..." : "OK"}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 rounded text-xs border text-sm"
                          style={{ borderColor: "var(--border)" }}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{acc.totalRooms}</span>
                        <button
                          onClick={() => {
                            setEditingId(acc.id);
                            setEditTotal(acc.totalRooms);
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Sửa số phòng"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: "#22C55E20", color: "#22C55E" }}
                    >
                      Hoạt động
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {acc.notes ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteId(acc.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500"
                      title="Xóa"
                    >
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg animate-pulse" style={{ backgroundColor: "var(--border)" }} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => { setShowCreate(false); setCreateError(null); }}
        title="Thêm loại phòng"
        className="max-w-md"
      >
        <div className="space-y-4">
          {createError && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
              {createError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Loại phòng</label>
            <select
              value={createRoomType}
              onChange={(e) => setCreateRoomType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)" }}
            >
              {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Số phòng</label>
            <input
              type="number"
              min={1}
              value={createTotal}
              onChange={(e) => setCreateTotal(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--border)" }}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => { setShowCreate(false); setCreateError(null); }}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: "var(--border)" }}
            >
              Hủy
            </button>
            <button
              onClick={() => void handleCreate()}
              disabled={creating}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: "#6366F1" }}
            >
              {creating ? "Đang thêm..." : "Thêm"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Save Error Toast (inline) */}
      {saveError && (
        <div className="fixed bottom-4 right-4 p-4 rounded-xl shadow-lg max-w-sm z-50" style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}>
          <p className="text-sm font-medium">{saveError}</p>
          <button
            onClick={() => setSaveError(null)}
            className="mt-2 text-xs underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={deleteId !== null}
        onClose={() => { setDeleteId(null); setDeleteError(null); }}
        title="Xác nhận xóa"
        className="max-w-sm"
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}>
              {deleteError}
            </div>
          )}
          <p className="text-sm">Bạn có chắc muốn xóa loại phòng này?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setDeleteId(null); setDeleteError(null); }}
              className="px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: "var(--border)" }}
            >
              Hủy
            </button>
            <button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm text-white bg-red-500"
            >
              {deleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Availability Calendar Modal */}
      <Modal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        title="Tình trạng phòng"
        className="max-w-4xl"
      >
        <div className="space-y-4">
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Từ ngày</label>
              <input
                type="date"
                value={calFromDate}
                onChange={(e) => setCalFromDate(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Đến ngày</label>
              <input
                type="date"
                value={calToDate}
                onChange={(e) => setCalToDate(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
            <button
              onClick={() => void handleViewAvailability()}
              disabled={loadingCal || !calFromDate || !calToDate}
              className="px-4 py-2 rounded-lg text-sm text-white"
              style={{ backgroundColor: "#6366F1" }}
            >
              {loadingCal ? "..." : "Xem"}
            </button>
          </div>

          {availability.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC" }}>
                    <th
                      className="px-2 py-2 text-left font-medium border"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Loại phòng
                    </th>
                    {uniqueDates.map((d) => (
                      <th
                        key={d}
                        className="px-2 py-2 text-center font-medium border min-w-[50px]"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {formatDate(d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(availabilityByType).map(([roomType, items]) => (
                    <tr key={roomType}>
                      <td
                        className="px-2 py-2 font-medium border"
                        style={{ borderColor: "var(--border)" }}
                      >
                        {ROOM_TYPE_LABELS[roomType] ?? roomType}
                      </td>
                      {uniqueDates.map((d) => {
                        const item = items.find((i) => i.date === d);
                        const available = item?.availableRooms ?? 0;
                        const isLow = available === 0;
                        return (
                          <td
                            key={d}
                            className="px-2 py-2 text-center border"
                            style={{
                              borderColor: "var(--border)",
                              backgroundColor: isLow ? "#FEE2E2" : undefined,
                              color: isLow ? "#EF4444" : undefined,
                            }}
                          >
                            {available}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {availability.length === 0 && !loadingCal && calFromDate && (
            <p className="text-sm text-gray-500">
              Không có dữ liệu cho khoảng ngày này.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

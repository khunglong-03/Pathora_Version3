"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  PencilSimple,
  Trash,
  CarProfile,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  Car
} from "@phosphor-icons/react";
import { transportProviderService } from "@/api/services/transportProviderService";
import type { Vehicle, CreateVehicleDto, UpdateVehicleDto } from "@/api/services/transportProviderService";
import {
  AdminErrorCard,
} from "@/features/dashboard/components";
import { Pagination } from "@/components/ui";
import VehicleForm from "@/components/transport/VehicleForm";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

// Backend returns numeric VehicleType (1=Car, 2=Bus, 3=Minibus, 4=Van, 5=Coach, 6=Motorbike)
const VEHICLE_TYPE_LABELS: Record<number, string> = {
  1: "Xe 4 chỗ",
  2: "Xe buýt",
  3: "Xe 12-29 chỗ",
  4: "Xe van",
  5: "Xe coach",
  6: "Xe máy",
};

function getVehicleTypeLabel(type: string | number | undefined): string {
  if (!type) return "-";
  const num = typeof type === 'string' ? parseInt(type, 10) : type;
  return !isNaN(num) && VEHICLE_TYPE_LABELS[num] ? VEHICLE_TYPE_LABELS[num] : String(type);
}

type StatusFilter = "all" | "active" | "deleted";

const FILTER_TABS: { key: StatusFilter; label: string; icon: React.ReactNode; color: string; bg: string }[] = [
  { key: "all", label: "Tổng số xe", icon: <CarProfile size={24} weight="fill" />, color: "text-[#6366F1]", bg: "bg-[#6366F1]/10" },
  { key: "active", label: "Đang hoạt động", icon: <CheckCircle size={24} weight="fill" />, color: "text-[#10B981]", bg: "bg-[#10B981]/10" },
  { key: "deleted", label: "Tạm ngưng (Đã xoá)", icon: <Trash size={24} weight="fill" />, color: "text-[#F43F5E]", bg: "bg-[#F43F5E]/10" },
];

export default function TransportVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, deleted: 0 });
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isActiveFilter = filter === "all" || filter === "deleted" ? undefined : filter === "active";
      const isDeletedFilter = filter === "deleted";

      // Parallel fetch to ensure KPI cards always have global data
      const [listData, allCount, activeCount, deletedCount] = await Promise.all([
        transportProviderService.getVehicles(page, pageSize, isActiveFilter, undefined, isDeletedFilter),
        transportProviderService.getVehicles(1, 1, undefined, undefined, false),
        transportProviderService.getVehicles(1, 1, true, undefined, false),
        transportProviderService.getVehicles(1, 1, undefined, undefined, true)
      ]);
      
      setVehicles(listData?.items || []);
      setCounts({
        all: allCount?.total || 0,
        active: activeCount?.total || 0,
        deleted: deletedCount?.total || 0
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách xe");
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const handleAdd = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Xóa xe "${id}"?`)) return;
    setIsDeleting(id);
    try {
      const success = await transportProviderService.deleteVehicle(id);
      if (success) {
        toast.success("Xóa xe thành công");
        void loadVehicles();
      } else {
        toast.error("Xóa xe thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFormSave = async (data: CreateVehicleDto | UpdateVehicleDto) => {
    if (editingVehicle) {
      const result = await transportProviderService.updateVehicle(editingVehicle.id, data as UpdateVehicleDto);
      if (result) {
        toast.success("Cập nhật xe thành công");
        setIsFormOpen(false);
        void loadVehicles();
      } else {
        toast.error("Cập nhật xe thất bại. Vui lòng thử lại.");
      }
    } else {
      const result = await transportProviderService.createVehicle(data as CreateVehicleDto);
      if (result) {
        toast.success("Thêm xe thành công");
        setIsFormOpen(false);
        void loadVehicles();
      } else {
        toast.error("Thêm xe thất bại. Vui lòng thử lại.");
      }
    }
  };

  const filteredAndSearchedVehicles = vehicles.filter(v => 
    v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (v.brand && v.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-[#FAFAFA] min-h-screen font-sans text-[#0F172A]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Quản lý Xe</h1>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">
            Quản lý đội xe, thông tin kỹ thuật, và tình trạng hoạt động của các phương tiện.
          </p>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={handleAdd}
          className="group relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-white shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] transition-all duration-300 bg-gradient-to-r from-[#6366F1] to-[#818CF8] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:scale-105 active:scale-95"
        >
          <Plus size={18} weight="bold" />
          <span>Thêm Xe</span>
        </motion.button>
      </div>

      {/* KPI / Filter Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {FILTER_TABS.map((tab, idx) => {
          const isActive = filter === tab.key;
          const displayCount = counts[tab.key];
          return (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              key={tab.key}
              onClick={() => { setFilter(tab.key); setPage(1); }}
              className={`relative flex items-center gap-4 p-5 rounded-[1.5rem] border backdrop-blur-xl transition-all duration-300 text-left cursor-pointer overflow-hidden group
                ${isActive 
                  ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-[#6366F1]/20' 
                  : 'bg-white/60 border-white/40 hover:bg-white hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)]'
                }
              `}
              aria-pressed={isActive}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-[1.5rem] border-2 border-[#6366F1] pointer-events-none"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              
              <div className={`p-3.5 rounded-[1rem] transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,1)] ${isActive ? tab.bg + " " + tab.color : 'bg-slate-50 text-slate-400 border border-slate-100 group-hover:scale-105'}`}>
                {tab.icon}
              </div>
              <div className="flex-1">
                <p className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{tab.label}</p>
                <p className={`text-3xl font-black tracking-tight ${isActive ? 'text-[#0F172A]' : 'text-slate-700'}`}>
                  {!isLoading ? displayCount : <span className="text-slate-300 animate-pulse">--</span>}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {error ? (
        <AdminErrorCard message={error} onRetry={() => void loadVehicles()} />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col overflow-hidden transition-all duration-300"
        >
          {/* Table Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlass className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm biển số, hãng xe, dòng xe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-11 pr-4 py-2.5 border border-slate-200/60 rounded-[1rem] text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all bg-slate-50/50 hover:bg-slate-50 focus:bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
              />
            </div>
            
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100/50">
              Đang hiển thị <span className="font-bold text-[#0F172A]">{filteredAndSearchedVehicles.length}</span> / {counts[filter]}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 space-y-4">
                <div className="w-10 h-10 border-4 border-[#6366F1]/20 border-t-[#6366F1] rounded-full animate-spin"></div>
                <p className="text-sm font-bold uppercase tracking-wider animate-pulse text-[#6366F1]">Đang tải dữ liệu xe...</p>
              </div>
            ) : filteredAndSearchedVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center px-4 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border border-indigo-100 shadow-inner">
                  <Car size={36} weight="duotone" className="text-[#6366F1]" />
                </div>
                <h3 className="text-xl font-extrabold text-[#0F172A] mb-2 tracking-tight">Không tìm thấy phương tiện</h3>
                <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
                  {searchQuery 
                    ? "Không có xe nào khớp với từ khóa tìm kiếm. Thử lại với từ khóa khác." 
                    : "Chưa có phương tiện trong hệ thống. Hãy thêm xe đầu tiên ngay bây giờ."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleAdd}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-full font-bold shadow-lg shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={18} weight="bold" />
                    Thêm xe ngay
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-500 font-bold sticky top-0 z-10 uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-[2rem]">ID</th>
                    <th className="px-6 py-4">Thông tin xe</th>
                    <th className="px-6 py-4">Sức chứa</th>
                    <th className="px-6 py-4">Số lượng</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4">Ngày Tạo</th>
                    <th className="px-6 py-4 text-right rounded-tr-[2rem]">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  <AnimatePresence>
                    {filteredAndSearchedVehicles.map((vehicle) => {
                      const isActive = vehicle.isActive;
                      return (
                        <motion.tr
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={vehicle.id}
                          className="group hover:bg-[#F8FAFC] transition-colors duration-200"
                        >
                          {/* ID */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-50 flex items-center justify-center text-[#6366F1] flex-shrink-0 border border-white shadow-[0_2px_8px_rgba(99,102,241,0.15)]">
                                <Car size={20} weight="fill" />
                              </div>
                              <span className="font-extrabold font-mono text-[#0F172A] text-[13px] tracking-tight group-hover:text-[#6366F1] transition-colors bg-slate-100/50 px-2.5 py-1 rounded-lg border border-slate-200/50 shadow-sm truncate max-w-[120px]" title={vehicle.id}>
                                {vehicle.id.split('-')[0]}...
                              </span>
                            </div>
                          </td>

                          {/* Thông tin xe */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-[#0F172A] font-bold tracking-tight">
                                {vehicle.brand || "Chưa cập nhật"} {vehicle.model ? `- ${vehicle.model}` : ""}
                              </span>
                              <span className="text-[10px] font-black tracking-widest text-[#6366F1] uppercase mt-1">
                                {getVehicleTypeLabel(vehicle.vehicleType)}
                              </span>
                            </div>
                          </td>

                          {/* Sức chứa */}
                          <td className="px-6 py-4">
                            <div className="text-[#0F172A] font-bold">
                              {vehicle.seatCapacity ? `${vehicle.seatCapacity} người` : "-"}
                            </div>
                          </td>

                          {/* Số lượng */}
                          <td className="px-6 py-4">
                            <div className="text-[#0F172A] font-bold">
                              {vehicle.quantity ?? 1}
                            </div>
                          </td>

                          {/* Trạng thái */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                vehicle.isDeleted
                                  ? "bg-rose-50 text-rose-700 border-rose-200/50"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-[0_2px_10px_rgba(16,185,129,0.1)]"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${vehicle.isDeleted ? "bg-rose-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"}`}></span>
                              {vehicle.isDeleted ? "Tạm ngưng" : "Hoạt động"}
                            </span>
                          </td>

                          {/* Ngày tạo */}
                          <td className="px-6 py-4">
                            <span className="text-slate-500 font-medium text-[13px]">
                              {vehicle.createdOnUtc ? new Date(vehicle.createdOnUtc).toLocaleDateString("vi-VN", {
                                day: '2-digit', month: '2-digit', year: 'numeric'
                              }) : "-"}
                            </span>
                          </td>

                          {/* Thao tác */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              {!vehicle.isDeleted && (
                                <button
                                  onClick={() => handleEdit(vehicle)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-[#6366F1] hover:bg-indigo-50 transition-all hover:scale-110 active:scale-95"
                                  title="Chỉnh sửa"
                                >
                                  <PencilSimple size={18} weight="bold" />
                                </button>
                              )}
                              {!vehicle.isDeleted && (
                                <button
                                  onClick={() => handleDelete(vehicle.id)}
                                  disabled={isDeleting === vehicle.id}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:scale-100 disabled:hover:text-slate-400"
                                  title="Xóa xe"
                                >
                                  <Trash size={18} weight="bold" />
                                </button>
                              )}
                            </div>
                            {/* Fallback for mobile */}
                            <div className="flex lg:hidden items-center justify-end gap-1.5">
                              {!vehicle.isDeleted && <button onClick={() => handleEdit(vehicle)} className="p-2 text-[#6366F1] bg-indigo-50 rounded-lg"><PencilSimple size={16} weight="bold" /></button>}
                              {!vehicle.isDeleted && <button onClick={() => handleDelete(vehicle.id)} disabled={isDeleting === vehicle.id} className="p-2 text-rose-600 bg-rose-50 rounded-lg disabled:opacity-30"><Trash size={16} weight="bold" /></button>}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!isLoading && counts[filter] > pageSize && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(counts[filter] / pageSize)}
                handlePageChange={setPage}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Slide-over Form */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end" aria-modal="true" role="dialog">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsFormOpen(false)}
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-full max-w-md h-full bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] flex flex-col"
            >
              <div className="flex-1 h-full overflow-y-auto">
                <VehicleForm
                  vehicle={editingVehicle ?? undefined}
                  onSave={handleFormSave}
                  onCancel={() => setIsFormOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

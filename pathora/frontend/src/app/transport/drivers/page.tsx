"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  PencilSimple,
  Trash,
  UsersThree,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  UserFocus
} from "@phosphor-icons/react";
import { transportProviderService } from "@/api/services/transportProviderService";
import type { Driver, CreateDriverDto, UpdateDriverDto } from "@/api/services/transportProviderService";
import {
  AdminErrorCard,
} from "@/features/dashboard/components";
import { Pagination } from "@/components/ui";
import DriverForm from "@/components/transport/DriverForm";
import { toast } from "react-toastify";

const DRIVER_LICENSE_LABELS: Record<number, string> = {
  1: "Bằng B1",
  2: "Bằng B2",
  3: "Bằng C",
  4: "Bằng D",
  5: "Bằng E",
  6: "Bằng F",
  7: "Khác",
};
function getLicenseDisplay(licenseType: string | undefined): string {
  if (!licenseType) return "-";
  const num = parseInt(licenseType, 10);
  return !isNaN(num) && DRIVER_LICENSE_LABELS[num] ? DRIVER_LICENSE_LABELS[num] : licenseType;
}

type StatusFilter = "all" | "ready" | "inactive";

const FILTER_TABS: { key: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "all", label: "Tổng số tài xế", icon: <UsersThree size={24} weight="fill" />, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { key: "ready", label: "Sẵn sàng hoạt động", icon: <CheckCircle size={24} weight="fill" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { key: "inactive", label: "Đã vô hiệu hóa", icon: <XCircle size={24} weight="fill" />, color: "text-rose-600 bg-rose-50 border-rose-200" },
];

export default function TransportDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const loadDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let isActiveFilter: boolean | undefined = undefined;
      if (filter === "ready") isActiveFilter = true;
      if (filter === "inactive") isActiveFilter = false;

      const data = await transportProviderService.getDrivers(page, pageSize, isActiveFilter);
      setDrivers(data?.items || []);
      setTotalDrivers(data?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách tài xế");
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const handleAdd = () => {
    setEditingDriver(null);
    setIsFormOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn vô hiệu hóa tài xế ${name}?`)) return;
    setIsDeleting(id);
    try {
      const success = await transportProviderService.deleteDriver(id);
      if (success) {
        toast.success("Vô hiệu hóa tài xế thành công");
        void loadDrivers();
      } else {
        toast.error("Vô hiệu hóa tài xế thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsDeleting(null);
    }
  };

  const handleFormSave = async (data: CreateDriverDto | UpdateDriverDto) => {
    if (editingDriver) {
      const result = await transportProviderService.updateDriver(editingDriver.id, data as UpdateDriverDto);
      if (result) {
        toast.success("Cập nhật tài xế thành công");
        setIsFormOpen(false);
        void loadDrivers();
      } else {
        toast.error("Cập nhật tài xế thất bại. Vui lòng thử lại.");
      }
    } else {
      const result = await transportProviderService.createDriver(data as CreateDriverDto);
      if (result) {
        toast.success("Thêm tài xế thành công");
        setIsFormOpen(false);
        void loadDrivers();
      } else {
        toast.error("Thêm tài xế thất bại. Vui lòng thử lại.");
      }
    }
  };

  const filteredAndSearchedDrivers = drivers.filter(d => 
    d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (d.phoneNumber && d.phoneNumber.includes(searchQuery)) ||
    (d.licenseNumber && d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-[#F8FAFC] min-h-screen font-sans text-[#1E1B4B]">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E1B4B]">Quản lý Tài xế</h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            Quản lý danh sách, thông tin bằng lái và trạng thái hoạt động của các tài xế.
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="group relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-[#6366F1] hover:bg-[#4F46E5] active:scale-95"
        >
          <Plus size={18} weight="bold" />
          <span>Thêm tài xế mới</span>
        </button>
      </div>

      {/* KPI / Filter Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FILTER_TABS.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setPage(1); }}
              className={`relative flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 text-left cursor-pointer overflow-hidden group
                ${isActive 
                  ? 'bg-white shadow-md border-[#6366F1] ring-1 ring-[#6366F1]/50' 
                  : 'bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm'
                }
              `}
              aria-pressed={isActive}
            >
              {/* Background accent line */}
              <div className={`absolute top-0 left-0 w-1 h-full transition-colors duration-300 ${isActive ? tab.color.split(' ')[0].replace('text-', 'bg-') : 'bg-transparent group-hover:bg-slate-200'}`} />
              
              <div className={`p-3 rounded-xl transition-all duration-300 shadow-sm ${isActive ? tab.color : 'bg-slate-50 text-slate-400 border border-slate-100 group-hover:scale-105 group-hover:text-slate-500'}`}>
                {tab.icon}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isActive ? 'text-[#1E1B4B]' : 'text-slate-500'}`}>{tab.label}</p>
                <p className={`text-2xl font-bold tracking-tight font-mono ${isActive ? 'text-[#1E1B4B]' : 'text-slate-700'}`}>
                  {tab.key === filter && !isLoading ? totalDrivers : '--'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {error ? (
        <AdminErrorCard message={error} onRetry={() => void loadDrivers()} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MagnifyingGlass className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, SĐT, hoặc bằng lái..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all bg-slate-50/50 focus:bg-white"
              />
            </div>
            
            <div className="text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
              Đang hiển thị <span className="font-semibold text-[#1E1B4B]">{filteredAndSearchedDrivers.length}</span> / {totalDrivers}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 space-y-4">
                <div className="w-10 h-10 border-4 border-[#6366F1]/20 border-t-[#6366F1] rounded-full animate-spin"></div>
                <p className="text-sm font-medium animate-pulse">Đang tải dữ liệu tài xế...</p>
              </div>
            ) : filteredAndSearchedDrivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center px-4 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-5 border border-indigo-100">
                  <UserFocus size={36} weight="duotone" className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-[#1E1B4B] mb-2">Không tìm thấy tài xế</h3>
                <p className="text-slate-500 max-w-sm leading-relaxed">
                  {searchQuery 
                    ? "Không có tài xế nào khớp với từ khóa tìm kiếm của bạn. Thử thay đổi từ khóa xem sao." 
                    : "Chưa có dữ liệu tài xế trong hệ thống. Hãy thêm tài xế đầu tiên của bạn ngay bây giờ!"}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleAdd}
                    className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#6366F1]/10 text-[#6366F1] rounded-xl font-semibold hover:bg-[#6366F1]/20 transition-all active:scale-95"
                  >
                    <Plus size={18} weight="bold" />
                    Thêm tài xế ngay
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold sticky top-0 z-10 uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-2xl">Thông tin tài xế</th>
                    <th className="px-6 py-4">Liên Hệ</th>
                    <th className="px-6 py-4">Giấy phép</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4">Ngày Tạo</th>
                    <th className="px-6 py-4 text-right rounded-tr-2xl">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSearchedDrivers.map((driver) => {
                    const isActive = driver.isActive;
                    return (
                      <tr
                        key={driver.id}
                        className="group hover:bg-[#F5F3FF]/60 transition-colors duration-200"
                      >
                        {/* Name & Avatar mockup */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0 border border-indigo-200/50 shadow-sm">
                              {driver.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#1E1B4B] text-[15px]">{driver.fullName}</span>
                              <span className="text-xs text-slate-500 max-w-[180px] truncate mt-0.5" title={driver.notes || ""}>{driver.notes || "Không có ghi chú"}</span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="text-[#1E1B4B] font-medium font-mono bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100">{driver.phoneNumber ?? "-"}</div>
                        </td>

                        {/* License */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-[#1E1B4B] font-semibold font-mono">{driver.licenseNumber ?? "-"}</span>
                            <span className="text-[11px] font-semibold text-indigo-600 uppercase mt-0.5">{getLicenseDisplay(driver.licenseType)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></span>
                            {isActive ? "Sẵn sàng" : "Ngừng hoạt động"}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4">
                          <span className="text-slate-500 text-[13px]">
                            {driver.createdOnUtc ? new Date(driver.createdOnUtc).toLocaleDateString("vi-VN", {
                              day: '2-digit', month: '2-digit', year: 'numeric'
                            }) : "-"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={() => handleEdit(driver)}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-[#6366F1] hover:bg-indigo-100/50 transition-all hover:scale-105 active:scale-95"
                              title="Chỉnh sửa"
                            >
                              <PencilSimple size={18} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleDelete(driver.id, driver.fullName)}
                              disabled={isDeleting === driver.id || !driver.isActive}
                              className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:scale-100 disabled:hover:text-slate-400"
                              title={driver.isActive ? "Vô hiệu hóa" : "Đã vô hiệu hóa"}
                            >
                              <Trash size={18} weight="bold" />
                            </button>
                          </div>
                          {/* Fallback for mobile where hover doesn't work */}
                          <div className="flex lg:hidden items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(driver)}
                              className="p-2 text-[#6366F1] bg-indigo-50 rounded-lg"
                            >
                              <PencilSimple size={16} weight="bold" />
                            </button>
                            <button
                              onClick={() => handleDelete(driver.id, driver.fullName)}
                              disabled={isDeleting === driver.id || !driver.isActive}
                              className="p-2 text-rose-600 bg-rose-50 rounded-lg disabled:opacity-30"
                            >
                              <Trash size={16} weight="bold" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          {!isLoading && totalDrivers > pageSize && (
            <div className="p-4 border-t border-slate-100 bg-[#F8FAFC] flex justify-center shadow-[inset_0_4px_6px_-6px_rgba(0,0,0,0.05)]">
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(totalDrivers / pageSize)}
                handlePageChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Slide-over Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end" aria-modal="true" role="dialog">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFormOpen(false)}
          />
          
          {/* Panel */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300">
            <div className="flex-1 h-full overflow-y-auto">
              <DriverForm
                driver={editingDriver ?? undefined}
                onSave={handleFormSave}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

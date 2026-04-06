"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { tourManagerAssignmentService, type TourManagerSummary } from "@/api/services/tourManagerAssignmentService";

export default function TourManagersPage() {
  const [managers, setManagers] = useState<TourManagerSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setIsError(false);
      setErrorMessage(null);

      const result = await tourManagerAssignmentService.getAll();

      if (!active) return;

      if (result.success && result.data) {
        setManagers(result.data);
      } else {
        setIsError(true);
        setErrorMessage(result.error?.message ?? "Không thể tải danh sách Tour Manager.");
      }
      setIsLoading(false);
    };

    void load();
    return () => { active = false; };
  }, [reloadToken]);

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Quản lý Tour Manager
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Danh sách và phân công nhân viên cho Tour Manager
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setReloadToken((v) => v + 1)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Làm mới
          </button>
          <Link
            href="/admin/tour-managers/create"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            + Thêm Tour Manager
          </Link>
        </div>
      </div>

      {/* Data table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={5} />
      ) : isError ? (
        <div className="bg-white border border-red-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700">
              {errorMessage ?? "Đã xảy ra lỗi khi tải dữ liệu."}
            </p>
            <button
              onClick={() => setReloadToken((v) => v + 1)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : managers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-sm"
        >
          <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
            <Icon icon="heroicons:user-group" className="size-7 text-stone-400" />
          </div>
          <h3 className="text-base font-semibold text-stone-700 mt-4">
            Chưa có Tour Manager nào
          </h3>
          <p className="text-sm text-stone-400 mt-1">
            Tạo tài khoản và phân công đội ngũ cho Tour Manager đầu tiên.
          </p>
          <Link
            href="/admin/tour-managers/create"
            className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            Thêm Tour Manager
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200">
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    Tên
                  </th>
                  <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-center px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    Tour Designers
                  </th>
                  <th className="text-center px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    Tour Guides
                  </th>
                  <th className="text-center px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    Tours
                  </th>
                  <th className="text-center px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {managers.map((manager) => {
                  const initials = manager.managerName
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr
                      key={manager.managerId}
                      className="hover:bg-stone-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">
                            {initials}
                          </div>
                          <span className="text-sm font-medium text-stone-900">
                            {manager.managerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-stone-600">
                          {manager.managerEmail}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
                          {manager.designerCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                          {manager.guideCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex min-w-[2rem] justify-center rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                          {manager.tourCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/admin/tour-managers/${manager.managerId}/edit`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                        >
                          <Icon icon="heroicons:pencil" className="size-3.5" />
                          Chỉnh sửa
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

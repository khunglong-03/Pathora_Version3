"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Icon from "@/components/ui/Icon";
import { userService } from "@/api/services/userService";
import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import type { UserInfo } from "@/store/domain/auth";

type TourDesignerUser = UserInfo & {
  roleIds?: number[];
};

interface CreateDesignerRequest {
  email: string;
  fullName: string;
  roleIds: number[];
  departments: never[];
  avatar: string;
}

interface DesignerDataState {
  state: "loading" | "ready" | "empty" | "error";
  errorMessage: string | null;
}

const TOUR_DESIGNER_ROLE_ID = 4;

export default function TourDesignersPage() {
  const { t } = useTranslation();
  const [designers, setDesigners] = useState<TourDesignerUser[]>([]);
  const [dataState, setDataState] = useState<DesignerDataState["state"]>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const loadDesigners = async () => {
    setDataState("loading");
    setErrorMessage(null);
    try {
      const allUsers = await userService.getAll(undefined, 1, 100);
      const filtered = allUsers
        .filter((user) => {
          const u = user as TourDesignerUser;
          return u.roles?.some((r) => r.name === "TourDesigner" || r.id === "4" || r.type === 4);
        })
        .map((user) => user as TourDesignerUser);
      setDesigners(filtered);
      setDataState(filtered.length === 0 ? "empty" : "ready");
    } catch (err) {
      setDataState("error");
      setErrorMessage("Không thể tải danh sách Tour Designer.");
    }
  };

  useEffect(() => {
    void loadDesigners();
  }, [reloadToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createFullName.trim()) {
      setCreateError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(false);
    try {
      const payload: CreateDesignerRequest = {
        email: createEmail.trim(),
        fullName: createFullName.trim(),
        roleIds: [TOUR_DESIGNER_ROLE_ID],
        departments: [],
        avatar: "",
      };
      await api.post(API_ENDPOINTS.USER.GET_ALL, payload);
      setCreateSuccess(true);
      setCreateEmail("");
      setCreateFullName("");
      setReloadToken((v) => v + 1);
    } catch (err) {
      setCreateError("Không thể tạo tài khoản. Email có thể đã tồn tại.");
    } finally {
      setIsCreating(false);
    }
  };

  const isLoading = dataState === "loading";
  const isError = dataState === "error";
  const isEmpty = dataState === "empty";
  const canShowData = dataState === "ready" || isEmpty;

  return (
    <div className="p-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Quản lý Tour Designer
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Tạo và quản lý tài khoản Tour Designer
          </p>
        </div>
        <button
          onClick={() => setReloadToken((v) => v + 1)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Create form */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm"
      >
        <h2 className="text-base font-semibold text-stone-800 mb-4">
          Tạo tài khoản Tour Designer mới
        </h2>
        {createSuccess && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            Tạo tài khoản thành công!
          </div>
        )}
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-600">Email</label>
            <input
              type="email"
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="email@example.com"
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-stone-600">Họ và tên</label>
            <input
              type="text"
              value={createFullName}
              onChange={(e) => setCreateFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
          >
            {isCreating ? "Đang tạo..." : "Tạo mới"}
          </button>
        </form>
        {createError && (
          <p className="mt-3 text-sm text-red-600">{createError}</p>
        )}
      </motion.div>

      {/* Data table */}
      {isLoading ? (
        <SkeletonTable rows={5} columns={4} />
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
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm"
        >
          {isEmpty ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto">
                <Icon icon="heroicons:user-group" className="size-7 text-stone-400" />
              </div>
              <h3 className="text-base font-semibold text-stone-700 mt-4">
                Chưa có tài khoản Tour Designer
              </h3>
              <p className="text-sm text-stone-400 mt-1">
                Tạo tài khoản đầu tiên bằng biểu mẫu phía trên.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200">
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                      Người dùng
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                      Vai trò
                    </th>
                    <th className="text-center px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wide">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {designers.map((designer) => {
                    const initials = designer.fullName
                      ? designer.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                      : "TD";
                    return (
                      <tr
                        key={designer.id}
                        className="hover:bg-stone-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center text-sm font-bold text-amber-700">
                              {initials}
                            </div>
                            <span className="text-sm font-medium text-stone-900">
                              {designer.fullName ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-stone-600">
                            {designer.email ?? "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Tour Designer
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-stone-400 italic">—</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

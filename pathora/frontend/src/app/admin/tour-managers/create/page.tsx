"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";
import { api } from "@/api/axiosInstance";
import { API_ENDPOINTS } from "@/api/endpoints";

interface CreateManagerRequest {
  email: string;
  fullName: string;
  roleIds: number[];
  departments: never[];
  avatar: string;
}

const MANAGER_ROLE_ID = 2;

export default function CreateTourManagerPage() {
  const router = useRouter();

  // Manager account fields
  const [managerEmail, setManagerEmail] = useState("");
  const [managerFullName, setManagerFullName] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managerEmail.trim() || !managerFullName.trim()) {
      setAccountError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    setIsCreatingAccount(true);
    setAccountError(null);
    try {
      const payload: CreateManagerRequest = {
        email: managerEmail.trim(),
        fullName: managerFullName.trim(),
        roleIds: [MANAGER_ROLE_ID],
        departments: [],
        avatar: "",
      };
      await api.post(API_ENDPOINTS.USER.GET_ALL, payload);
      
      router.push("/admin/tour-managers");
    } catch {
      setAccountError("Không thể tạo tài khoản. Email có thể đã tồn tại.");
      setIsCreatingAccount(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">
          Thêm Tour Manager
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Tạo tài khoản Tour Manager mới cho hệ thống
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-stone-200 rounded-2xl p-6 mb-6 shadow-sm"
      >
        <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-stone-600">Email</label>
            <input
              type="email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              placeholder="manager@example.com"
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium text-stone-600">Họ và tên</label>
            <input
              type="text"
              value={managerFullName}
              onChange={(e) => setManagerFullName(e.target.value)}
              placeholder="Nguyễn Văn B"
              className="px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          
          {accountError && (
            <p className="text-sm text-red-600">{accountError}</p>
          )}

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => router.push("/admin/tour-managers")}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreatingAccount || !managerEmail.trim() || !managerFullName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isCreatingAccount ? (
                <>Đang tạo...</>
              ) : (
                <>
                  <Icon icon="heroicons:plus" className="size-4" />
                  Tạo Tour Manager
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

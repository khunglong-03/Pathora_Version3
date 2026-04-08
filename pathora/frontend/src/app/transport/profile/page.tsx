"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Buildings } from "@phosphor-icons/react";
import { transportProviderService } from "@/api/services/transportProviderService";
import type {
  TransportCompanyProfile,
  UpdateCompanyProfileDto,
} from "@/api/services/transportProviderService";
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminErrorCard,
} from "@/features/dashboard/components";
import { toast } from "react-toastify";

export default function TransportProfilePage() {
  const [profile, setProfile] = useState<TransportCompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateCompanyProfileDto>({});

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await transportProviderService.getCompanyProfile();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông tin công ty");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleEdit = () => {
    if (!profile) return;
    setFormData({
      companyName: profile.companyName,
      address: profile.address,
      phone: profile.phone,
      email: profile.email,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await transportProviderService.updateCompanyProfile(formData);
      if (result) {
        setProfile(result);
        setIsEditing(false);
        toast.success("Cập nhật thông tin công ty thành công");
      } else {
        toast.error("Cập nhật thông tin công ty thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || undefined }));
  };

  return (
    <div className="p-6">
      <AdminPageHeader
        title="Công ty vận tải"
        subtitle="Thông tin công ty"
        onRefresh={() => void loadProfile()}
        actionButtons={
          !isEditing && profile && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: "#6366F1" }}
            >
              <Pencil size={14} />
              Chỉnh sửa
            </button>
          )
        }
      />

      {error && (
        <AdminErrorCard message={error} onRetry={() => void loadProfile()} />
      )}

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "#6366F1", borderTopColor: "transparent" }}
          />
        </div>
      )}

      {!error && !isLoading && !profile && (
        <AdminEmptyState
          icon="Buildings"
          heading="Chưa có thông tin công ty"
          description="Vui lòng liên hệ quản trị viên để được cấp quyền truy cập."
        />
      )}

      {!error && !isLoading && profile && (
        <>
          {isEditing ? (
            /* Edit Form */
            <div
              className="rounded-xl p-6"
              style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
            >
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Thông tin công ty
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <label htmlFor="companyName" className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
                    Tên công ty
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName ?? ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="address" className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
                    Địa chỉ
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address ?? ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
                    Số điện thoại
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone ?? ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-xs font-medium mb-1.5" style={{ color: "#374151" }}>
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email ?? ""}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border border-gray-200 outline-none focus:border-indigo-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium border transition-all duration-150 hover:opacity-80"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Hủy
                </button>
                <button
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#6366F1" }}
                >
                  {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <div
              className="rounded-xl p-6"
              style={{ border: "1px solid var(--border)", backgroundColor: "white" }}
            >
              <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Thông tin công ty
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="col-span-2">
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Tên công ty</p>
                  <p className="font-medium">{profile.companyName ?? "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Địa chỉ</p>
                  <p className="font-medium">{profile.address ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Số điện thoại</p>
                  <p className="font-medium">{profile.phone ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Email</p>
                  <p className="font-medium">{profile.email ?? "-"}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

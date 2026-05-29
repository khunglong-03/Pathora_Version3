"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { featureFlags } from "@/configs/featureFlags";
import { tourGuideManifestService } from "@/api/services/tourGuideManifestService";
import type { TourGuideManifestDto } from "@/types/tour";
import { AdminPageHeader } from "@/features/dashboard/components";
import {
  CaretLeftIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  WarningCircleIcon,
  UsersThreeIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react";

const Watermark = ({ text }: { text: string }) => {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden opacity-[0.02] select-none flex flex-wrap gap-16 p-8 justify-center items-center print:hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="text-slate-900 font-extrabold text-sm tracking-wider uppercase rotate-[-25deg] whitespace-nowrap"
        >
          {text}
        </span>
      ))}
    </div>
  );
};

export default function TourGuideManifestPage() {
  // 1. Kiểm tra Feature Flag ở mức đầu tiên
  if (!featureFlags.enableGuideManifest) {
    notFound();
  }

  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const tourInstanceId = params.id as string;

  const user = useSelector((state: RootState) => state.auth.user);

  const [manifest, setManifest] = useState<TourGuideManifestDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [watermarkText, setWatermarkText] = useState("");

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sinh watermark text dựa trên thông tin Hướng dẫn viên và thời gian hiện tại
  useEffect(() => {
    if (user?.fullName) {
      const now = new Date();
      const formattedDate = now.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setWatermarkText(`${user.fullName} | ${formattedDate}`);
    }
  }, [user]);

  // Fetch dữ liệu từ API
  useEffect(() => {
    let isMounted = true;

    const fetchManifest = async () => {
      try {
        setIsLoading(true);
        const data = await tourGuideManifestService.getManifest(tourInstanceId);
        if (!isMounted) return;
        setManifest(data);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Failed to load manifest", err);
        const status = err?.response?.status || 500;
        setErrorStatus(status);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (tourInstanceId) {
      void fetchManifest();
    }

    return () => {
      isMounted = false;
    };
  }, [tourInstanceId]);

  // Xử lý in ấn
  const handlePrint = () => {
    window.print();
  };

  // Lọc danh sách khách hàng dựa trên từ khoá tìm kiếm
  const filteredBookings =
    manifest?.bookings
      .map((booking) => {
        const isReferenceMatch = booking.reference
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());
        const matchingParticipants = booking.participants.filter(
          (p) =>
            isReferenceMatch ||
            p.fullName.toLowerCase().includes(debouncedSearch.toLowerCase())
        );

        return {
          ...booking,
          participants: matchingParticipants,
        };
      })
      .filter((booking) => booking.participants.length > 0) || [];

  // Tính toán tổng số lượng hành khách thực tế hiển thị
  const totalDisplayParticipants = filteredBookings.reduce(
    (sum, b) => sum + b.participants.length,
    0
  );

  // Xử lý lỗi phân quyền
  if (errorStatus === 403) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 font-sans">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors w-fit"
        >
          <CaretLeftIcon weight="bold" className="size-4" />
          {t("tourGuide.operations.backToOperations", { defaultValue: "Quay lại" })}
        </button>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto w-full mt-10">
          <div className="size-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
            <WarningCircleIcon size={36} weight="fill" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {t("tourGuide.operations.accessDenied", { defaultValue: "Từ chối truy cập" })}
          </h3>
          <p className="text-slate-500 max-w-md">
            {t("tourGuide.operations.notAuthorized", {
              defaultValue:
                "Bạn không có quyền xem danh sách hành khách của tour này. Quyền truy cập chỉ dành cho hướng dẫn viên được chỉ định, quản lý hoặc quản trị viên.",
            })}
          </p>
        </div>
      </div>
    );
  }

  // Xử lý các lỗi khác
  if (errorStatus && errorStatus !== 403) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 font-sans">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors w-fit"
        >
          <CaretLeftIcon weight="bold" className="size-4" />
          {t("tourGuide.operations.backToOperations", { defaultValue: "Quay lại" })}
        </button>
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto w-full mt-10">
          <div className="size-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
            <WarningCircleIcon size={36} weight="fill" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Đã xảy ra lỗi
          </h3>
          <p className="text-slate-500">
            Không thể tải dữ liệu hành khách. Vui lòng kiểm tra lại kết nối hoặc liên hệ quản lý.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-x-hidden">
      {/* Watermark bảo mật */}
      {watermarkText && <Watermark text={watermarkText} />}

      {/* Header */}
      <div className="p-4 md:p-6 pb-0 print:hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 font-medium transition-colors w-fit"
        >
          <CaretLeftIcon weight="bold" className="size-4" />
          Danh sách hoạt động
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <AdminPageHeader
            title={t("tourGuide.operations.passengerManifest", {
              defaultValue: "Danh sách hành khách",
            })}
            subtitle="Danh sách hành khách tham gia chuyến đi được đồng bộ trực tiếp từ các đơn đặt tour đã xác nhận"
          />

          <button
            onClick={handlePrint}
            disabled={isLoading || filteredBookings.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer w-full md:w-auto"
          >
            <PrinterIcon weight="fill" className="size-5" />
            In danh sách (PDF)
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full pb-24 print:p-0 print:max-w-none print:bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            <p className="text-slate-500 font-medium mt-4">Đang tải dữ liệu hành khách...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search and stats bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200 print:hidden">
              <div className="relative w-full sm:max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MagnifyingGlassIcon size={18} />
                </span>
                <input
                  type="text"
                  placeholder={t("tourGuide.operations.searchPlaceholder", {
                    defaultValue: "Tìm theo tên hành khách hoặc mã booking...",
                  })}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-400 focus:bg-white rounded-xl text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0 text-slate-700">
                <div className="size-9 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                  <UsersThreeIcon size={18} className="text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold leading-none uppercase">Hành khách hiển thị</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-1">
                    {totalDisplayParticipants} hành khách
                  </p>
                </div>
              </div>
            </div>

            {/* Print Header Info */}
            <div className="hidden print:block mb-8 border-b border-slate-200 pb-4">
              <h1 className="text-2xl font-bold text-center uppercase tracking-wider mb-2">
                DANH SÁCH HÀNH KHÁCH CHUYẾN ĐI
              </h1>
              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <p><strong>Ngày in:</strong> {new Date().toLocaleString("vi-VN")}</p>
                <p className="text-right"><strong>Người xuất:</strong> {user?.fullName || "N/A"}</p>
              </div>
            </div>

            {/* Manifest List */}
            {filteredBookings.length > 0 ? (
              <div className="space-y-6">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.bookingId}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none"
                  >
                    {/* Booking Header */}
                    <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:bg-white print:border-b-2 print:border-slate-800 print:px-0">
                      <div className="flex items-center gap-3">
                        <div className="size-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center print:hidden">
                          <IdentificationCardIcon size={22} weight="bold" />
                        </div>
                        <div>
                          <span className="text-xs text-slate-400 font-bold leading-none uppercase print:hidden">
                            {t("tourGuide.operations.bookingRef", { defaultValue: "Mã đặt tour" })}
                          </span>
                          <h4 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5 print:text-lg">
                            {booking.reference}
                          </h4>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 print:text-black">
                        <span className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 print:border-none print:px-0">
                          {booking.adults} {t("tourGuide.operations.adults", { defaultValue: "Người lớn" })}
                        </span>
                        {booking.children > 0 && (
                          <span className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 print:border-none print:px-0">
                            · {booking.children} {t("tourGuide.operations.children", { defaultValue: "Trẻ em" })}
                          </span>
                        )}
                        {booking.infants > 0 && (
                          <span className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 print:border-none print:px-0">
                            · {booking.infants} {t("tourGuide.operations.infants", { defaultValue: "Em bé" })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Booking Participants Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-50/30 text-slate-400 font-bold text-xs uppercase border-b border-slate-100 print:bg-white print:border-b-2 print:border-slate-400 print:text-black">
                            <th className="py-3 px-6 w-12 text-center">STT</th>
                            <th className="py-3 px-6">
                              {t("tourGuide.operations.fullName", { defaultValue: "Họ và tên" })}
                            </th>
                            <th className="py-3 px-6">
                              {t("tourGuide.operations.passengerType", { defaultValue: "Phân loại" })}
                            </th>
                            <th className="py-3 px-6">
                              {t("tourGuide.operations.gender", { defaultValue: "Giới tính" })}
                            </th>
                            <th className="py-3 px-6">
                              {t("tourGuide.operations.nationality", { defaultValue: "Quốc tịch" })}
                            </th>
                            <th className="py-3 px-6">
                              {t("tourGuide.operations.dateOfBirth", { defaultValue: "Ngày sinh" })}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700 print:divide-y-2 print:divide-slate-300">
                          {booking.participants.map((p, index) => (
                            <tr
                              key={p.participantId}
                              className="hover:bg-slate-50/50 transition-colors duration-150 print:hover:bg-white"
                            >
                              <td className="py-3.5 px-6 font-bold text-slate-400 text-center w-12 print:text-black">
                                {index + 1}
                              </td>
                              <td className="py-3.5 px-6 font-extrabold text-slate-900 print:text-black">
                                {p.fullName}
                              </td>
                              <td className="py-3.5 px-6">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-md text-xs font-bold print:px-0 print:text-black ${
                                    p.participantType === "Adult"
                                      ? "bg-slate-100 text-slate-800"
                                      : p.participantType === "Child"
                                      ? "bg-blue-50 text-blue-800"
                                      : "bg-emerald-50 text-emerald-800"
                                  }`}
                                >
                                  {p.participantType}
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                {p.gender || <span className="text-slate-400 italic">N/A</span>}
                              </td>
                              <td className="py-3.5 px-6">
                                {p.nationality || <span className="text-slate-400 italic">N/A</span>}
                              </td>
                              <td className="py-3.5 px-6">
                                {p.dateOfBirth ? (
                                  new Date(p.dateOfBirth).toLocaleDateString("vi-VN")
                                ) : (
                                  <span className="text-slate-400 italic">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="size-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  {t("tourGuide.operations.noParticipants", { defaultValue: "Không tìm thấy hành khách" })}
                </h3>
                <p className="text-sm text-slate-400 max-w-sm">
                  Thử tìm kiếm với từ khoá khác hoặc kiểm tra lại mã booking.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

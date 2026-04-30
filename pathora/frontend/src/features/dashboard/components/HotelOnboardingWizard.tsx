"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BuildingOfficeIcon,
  DoorOpenIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import { fileService } from "@/api/services/fileService";
import { toast } from "react-toastify";
import TourImageUpload from "@/components/ui/TourImageUpload";

interface HotelOnboardingWizardProps {
  onComplete: () => void;
}

const T = {
  bg: "#F8F8F6",
  cardBg: "#FFFFFF",
  border: "rgba(0, 0, 0, 0.06)",
  text: "#1A1A1A",
  textMuted: "#737373",
  blue: "#3B82F6",
  accent: "#10B981",
  radius: "24px",
  shadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
};

const ROOM_TYPES = [
  "Standard",
  "Deluxe",
  "Suite",
  "VIP",
  "Family",
  "Single",
  "Double",
  "Twin",
  "Triple",
  "Quad",
];

export default function HotelOnboardingWizard({ onComplete }: HotelOnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  // Step 1 State: Hotel Info
  const [hotelData, setHotelData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  // Step 2 State: First Room Type
  const [roomData, setRoomData] = useState({
    roomType: "Standard",
    totalRooms: 1,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [images, setImages] = useState<File[]>([]);

  const handleCreateHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelData.name) {
      toast.error("Vui lòng nhập tên khách sạn");
      return;
    }
    setIsLoading(true);
    try {
      const result = await hotelProviderService.createSupplierInfo(hotelData);
      setSupplierId(result.id);
      setStep(2);
      toast.success("Đã tạo thông tin khách sạn!");
    } catch (error) {
      toast.error("Không thể tạo khách sạn. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let thumbnailRes = null;
      if (thumbnail) {
        const meta = await fileService.uploadFile(thumbnail);
        thumbnailRes = { fileId: meta.id, publicURL: meta.url, fileName: meta.name, originalFileName: meta.name };
      }
      
      const imagesRes: any[] = [];
      if (images.length > 0) {
        const metas = await Promise.all(images.map(f => fileService.uploadFile(f)));
        metas.forEach(meta => {
          imagesRes.push({ fileId: meta.id, publicURL: meta.url, fileName: meta.name, originalFileName: meta.name });
        });
      }

      await hotelProviderService.createAccommodation({
        roomType: roomData.roomType,
        totalRooms: roomData.totalRooms,
        thumbnail: thumbnailRes,
        images: imagesRes.length > 0 ? imagesRes : null,
      });
      setStep(3);
      toast.success("Đã thiết lập phòng đầu tiên!");
    } catch (error) {
      toast.error("Không thể tạo phòng. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          maxWidth: "600px",
          width: "100%",
          backgroundColor: T.cardBg,
          borderRadius: T.radius,
          padding: "40px",
          boxShadow: T.shadow,
          border: `1px solid ${T.border}`,
        }}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <BuildingOfficeIcon size={28} weight="duotone" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Chào mừng đến với Pathora!</h2>
                  <p className="text-slate-500">Hãy bắt đầu bằng việc thiết lập khách sạn của bạn.</p>
                </div>
              </div>

              <form onSubmit={handleCreateHotel} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tên khách sạn *</label>
                  <input
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="VD: Grand Hotel Da Nang"
                    value={hotelData.name}
                    onChange={(e) => setHotelData({ ...hotelData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Địa chỉ</label>
                  <input
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Địa chỉ chi tiết"
                    value={hotelData.address}
                    onChange={(e) => setHotelData({ ...hotelData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Số điện thoại</label>
                    <input
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Số điện thoại"
                      value={hotelData.phone}
                      onChange={(e) => setHotelData({ ...hotelData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Email</label>
                    <input
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Email liên hệ"
                      value={hotelData.email}
                      onChange={(e) => setHotelData({ ...hotelData, email: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 mt-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                >
                  {isLoading ? "Đang xử lý..." : "Tiếp theo"}
                  <ArrowRightIcon size={20} weight="bold" />
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <DoorOpenIcon size={28} weight="duotone" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Thêm loại phòng đầu tiên</h2>
                  <p className="text-slate-500">Thiết lập loại phòng và số lượng phòng hiện có.</p>
                </div>
              </div>

              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Loại phòng</label>
                  <select
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
                    value={roomData.roomType}
                    onChange={(e) => setRoomData({ ...roomData, roomType: e.target.value })}
                  >
                    {ROOM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">Tổng số phòng hiện có</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={roomData.totalRooms}
                    onChange={(e) => setRoomData({ ...roomData, totalRooms: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="space-y-2">
                  <TourImageUpload
                    thumbnail={thumbnail}
                    setThumbnail={setThumbnail}
                    images={images}
                    setImages={setImages}
                    t={(key, fb) => fb}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                >
                  {isLoading ? "Đang xử lý..." : "Hoàn tất thiết lập"}
                  <CheckCircleIcon size={20} weight="bold" />
                </button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <CheckCircleIcon size={48} weight="fill" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Tuyệt vời!</h2>
              <p className="text-slate-500 mb-8">
                Khách sạn của bạn đã sẵn sàng để hoạt động trên Pathora.
              </p>
              <button
                onClick={onComplete}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all"
              >
                Vào trang quản trị
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

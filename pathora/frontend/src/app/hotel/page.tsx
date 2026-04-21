"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  BedIcon,
  CalendarCheckIcon,
  ClockCountdownIcon,
  DoorOpenIcon,
  ListChecksIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  WarningCircleIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { hotelProviderService } from "@/api/services/hotelProviderService";
import { tourInstanceService } from "@/api/services/tourInstanceService";
import type {
  AccommodationItem,
  GuestArrivalItem,
  GuestStayStatus,
  HotelSupplierInfo,
} from "@/api/services/hotelProviderService";
import type { NormalizedTourInstanceVm } from "@/types/tour";
import UpcomingToursSection from "@/features/dashboard/components/UpcomingToursSection";
import dayjs from "dayjs";

type CreatePropertyDraft = {
  name: string;
  address: string;
  phone: string;
  email: string;
  notes: string;
};

// --- Design Tokens (Taste Frontend) ---
const T = {
  bg: "#F8F8F6",
  cardBg: "#FFFFFF",
  border: "rgba(0, 0, 0, 0.06)",
  text: "#1A1A1A",
  textMuted: "#737373",
  accent: "#10B981", // Emerald
  accentSoft: "rgba(16, 185, 129, 0.08)",
  blue: "#3B82F6",
  blueSoft: "rgba(59, 130, 246, 0.08)",
  orange: "#F59E0B",
  orangeSoft: "rgba(245, 158, 11, 0.08)",
  red: "#EF4444",
  redSoft: "rgba(239, 68, 68, 0.08)",
  shadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
  radius: "24px",
};

const STATUS_CONFIG: Record<GuestStayStatus, { label: string; color: string; bg: string }> = {
  Pending: { label: "Pending", color: T.orange, bg: T.orangeSoft },
  CheckedIn: { label: "Checked In", color: T.accent, bg: T.accentSoft },
  CheckedOut: { label: "Checked Out", color: T.blue, bg: T.blueSoft },
  NoShow: { label: "No Show", color: T.red, bg: T.redSoft },
};

// --- Framer Motion Config ---
const containerVariants: Variants = {
  animate: { transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 28 },
  },
};

// --- Sub-components ---
function AnimatedNum({ value }: { value: number | string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ display: "inline-block" }}
    >
      {value}
    </motion.span>
  );
}

function PulseDot({ color }: { color: string }) {
  return (
    <div style={{ position: "relative", width: 8, height: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div
        animate={{ scale: [1, 2], opacity: [0.8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        style={{
          position: "absolute",
          width: 8, height: 8, borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: color, position: "relative", zIndex: 1 }} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, span = 1 }: any) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }}
      style={{
        gridColumn: `span ${span}`,
        backgroundColor: T.cardBg,
        borderRadius: T.radius,
        padding: "24px",
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "160px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: "14px",
            backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={22} weight="bold" color={color} />
        </div>
        {(label === "Check-in hôm nay" || label === "Chờ check-in") && value !== "0" && (
          <PulseDot color={color} />
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "16px" }}>
        <div style={{ fontSize: "36px", fontWeight: 700, color: T.text, lineHeight: 1, letterSpacing: "-0.02em" }}>
          <AnimatedNum value={value} />
        </div>
        <div style={{ fontSize: "14px", fontWeight: 500, color: T.textMuted, marginTop: "8px" }}>
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function OccupancyHeroCard({ total, available }: { total: number; available: number }) {
  const percentage = total > 0 ? ((total - available) / total) * 100 : 0;

  return (
    <motion.div
      variants={itemVariants}
      style={{
        gridColumn: "span 2",
        backgroundColor: T.cardBg,
        borderRadius: T.radius,
        padding: "32px",
        border: `1px solid ${T.border}`,
        boxShadow: T.shadow,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative Background Blob */}
      <div style={{
        position: "absolute", top: -50, right: -50, width: 250, height: 250,
        background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, rgba(255,255,255,0) 70%)",
        borderRadius: "50%", pointerEvents: "none"
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: "16px", backgroundColor: T.blueSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BuildingOfficeIcon size={24} weight="duotone" color={T.blue} />
          </div>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: T.text, margin: 0 }}>Tổng quan phòng</h3>
            <p style={{ fontSize: "13px", color: T.textMuted, margin: 0, marginTop: 2 }}>Trạng thái quỹ phòng hôm nay</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "32px", fontWeight: 700, color: T.text }}>{Math.round(percentage)}%</span>
          <span style={{ fontSize: "14px", fontWeight: 500, color: T.textMuted, display: "block" }}>Tỷ lệ lấp đầy</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "24px", marginTop: "auto" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: T.textMuted }}>Đang sử dụng</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>{total - available}</span>
          </div>
          <div style={{ height: 6, backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, type: "spring", damping: 30 }}
              style={{ height: "100%", backgroundColor: T.blue, borderRadius: 4 }}
            />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: T.textMuted }}>Còn trống</span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: T.text }}>{available < 0 ? "-" : available}</span>
          </div>
          <div style={{ height: 6, backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 4, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? (available / total) * 100 : 0}%` }}
              transition={{ duration: 1.5, type: "spring", damping: 30, delay: 0.1 }}
              style={{ height: "100%", backgroundColor: T.accent, borderRadius: 4 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Page ---
export default function HotelDashboardPage() {
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [suppliers, setSuppliers] = useState<HotelSupplierInfo[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [recentArrivals, setRecentArrivals] = useState<GuestArrivalItem[]>([]);
  const [availableRooms, setAvailableRooms] = useState<number>(-1);
  const [upcomingTours, setUpcomingTours] = useState<NormalizedTourInstanceVm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatePropertyOpen, setIsCreatePropertyOpen] = useState(false);
  const [isCreatingProperty, setIsCreatingProperty] = useState(false);
  const [createPropertyError, setCreatePropertyError] = useState<string | null>(null);
  const [createPropertyDraft, setCreatePropertyDraft] = useState<CreatePropertyDraft>({
    name: "",
    address: "",
    phone: "",
    email: "",
    notes: "",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [accommodationsData, arrivalsData, availabilityData, supplierData] = await Promise.all([
        hotelProviderService.getAccommodations(),
        hotelProviderService.getGuestArrivals({}),
        hotelProviderService.getRoomAvailability(today, today),
        hotelProviderService.getSupplierInfo(),
      ]);
      setAccommodations(accommodationsData);
      setSuppliers(supplierData);
      setSelectedSupplierId((current) =>
        current && supplierData.some((supplier) => supplier.id === current)
          ? current
          : (supplierData[0]?.id ?? "")
      );
      setAvailableRooms(
        availabilityData.reduce((sum, a) => sum + a.availableRooms, 0)
      );
      setRecentArrivals(
        arrivalsData
          .sort((a, b) => new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime())
          .slice(0, 8)
      );

      // Fetch upcoming tours separately to avoid cascading failures
      try {
        const tourResult = await tourInstanceService.getProviderAssigned(1, 50);
        const todayDate = dayjs().startOf("day");
        const upcoming = (tourResult?.data ?? [])
          .filter(i => {
            const tourStart = dayjs(i.startDate).startOf("day");
            return tourStart.isAfter(todayDate) || tourStart.isSame(todayDate, "day");
          })
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        setUpcomingTours(upcoming);
      } catch {
        // Silently fail — upcoming tours is supplementary, not critical
        setUpcomingTours([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedSupplier = suppliers.find((supplier) => supplier.id === selectedSupplierId) ?? null;
  const visibleAccommodations = selectedSupplier
    ? accommodations.filter((acc) => acc.supplierId === selectedSupplier.id)
    : accommodations;
  const totalRooms = visibleAccommodations.reduce((sum, acc) => sum + acc.totalRooms, 0);
  const pendingArrivals = recentArrivals.filter((a) => a.status === "Pending").length;
  const today = new Date().toISOString().split("T")[0];
  const todayCheckins = recentArrivals.filter((a) => a.checkInDate?.startsWith(today) && a.status === "Pending").length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      month: "short", day: "numeric", year: "numeric",
    });
  };

  const resetCreatePropertyForm = () => {
    setCreatePropertyDraft({
      name: "",
      address: "",
      phone: "",
      email: "",
      notes: "",
    });
    setCreatePropertyError(null);
    setIsCreatePropertyOpen(false);
  };

  const handleCreateProperty = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = createPropertyDraft.name.trim();
    if (!trimmedName) {
      setCreatePropertyError("Tên cơ sở là bắt buộc.");
      return;
    }

    setIsCreatingProperty(true);
    setCreatePropertyError(null);
    try {
      const createdSupplier = await hotelProviderService.createSupplierInfo({
        name: trimmedName,
        address: createPropertyDraft.address.trim() || undefined,
        phone: createPropertyDraft.phone.trim() || undefined,
        email: createPropertyDraft.email.trim() || undefined,
        notes: createPropertyDraft.notes.trim() || undefined,
      });
      await loadData();
      setSelectedSupplierId(createdSupplier.id);
      resetCreatePropertyForm();
    } catch (err) {
      setCreatePropertyError(err instanceof Error ? err.message : "Không thể tạo cơ sở mới.");
    } finally {
      setIsCreatingProperty(false);
    }
  };

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100dvh", padding: "40px", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
      <div style={{ width: "100%" }}>
        {suppliers.length > 1 && (
          <div style={{ marginBottom: "24px", backgroundColor: T.cardBg, border: `1px solid ${T.border}`, borderRadius: "16px", padding: "20px", boxShadow: T.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "16px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: T.text }}>Danh sách cơ sở</div>
                <div style={{ fontSize: "13px", color: T.textMuted, marginTop: "4px" }}>Chọn property để xem tồn phòng và khách đến theo từng cơ sở.</div>
              </div>
              <div style={{ fontSize: "13px", color: T.textMuted }}>
                {suppliers.length} cơ sở
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {suppliers.map((supplier) => {
                const isSelected = supplier.id === selectedSupplierId;
                const propertyAccommodations = accommodations.filter((acc) => acc.supplierId === supplier.id);
                const propertyRooms = propertyAccommodations.reduce((sum, acc) => sum + acc.totalRooms, 0);

                return (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => setSelectedSupplierId(supplier.id)}
                    style={{
                      textAlign: "left",
                      borderRadius: "16px",
                      padding: "16px",
                      border: isSelected ? `1px solid ${T.blue}` : `1px solid ${T.border}`,
                      backgroundColor: isSelected ? "rgba(59,130,246,0.06)" : "#fff",
                      boxShadow: isSelected ? "0 10px 24px rgba(59,130,246,0.12)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "15px", fontWeight: 700, color: T.text }}>{supplier.name}</div>
                    <div style={{ fontSize: "12px", color: T.textMuted, marginTop: "6px", minHeight: "32px" }}>
                      {supplier.address ?? "Chưa có địa chỉ"}
                    </div>
                    <div style={{ display: "flex", gap: "16px", marginTop: "14px", fontSize: "12px", color: T.textMuted }}>
                      <span>{propertyAccommodations.length} loại phòng</span>
                      <span>{propertyRooms} phòng</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Header Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: T.text, margin: 0, letterSpacing: "-0.03em" }}>Khách sạn của tôi</h1>
            <p style={{ fontSize: "15px", color: T.textMuted, margin: 0, marginTop: 4 }}>Tổng quan hoạt động và lượng khách đến</p>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <motion.button
              type="button"
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setCreatePropertyError(null);
                setIsCreatePropertyOpen((current) => !current);
              }}
              style={{
                height: 44, padding: "0 20px", display: "flex", alignItems: "center", gap: 8,
                backgroundColor: T.cardBg, color: T.text, borderRadius: "12px",
                border: `1px solid ${T.border}`, fontWeight: 600, fontSize: "14px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)", cursor: "pointer"
              }}
            >
              <BuildingOfficeIcon size={18} />
              Thêm cơ sở mới
            </motion.button>
            <Link href="/hotel/rooms">
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 44, padding: "0 20px", display: "flex", alignItems: "center", gap: 8,
                  backgroundColor: T.cardBg, color: T.text, borderRadius: "12px",
                  border: `1px solid ${T.border}`, fontWeight: 600, fontSize: "14px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
                }}
              >
                <DoorOpenIcon size={18} />
                Quản lý phòng
              </motion.button>
            </Link>
            <Link href="/hotel/arrivals">
              <motion.button
                whileHover={{ y: -2, scale: 1.02, backgroundColor: "#2563EB" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  height: 44, padding: "0 20px", display: "flex", alignItems: "center", gap: 8,
                  backgroundColor: T.blue, color: "#fff", borderRadius: "12px",
                  border: "none", fontWeight: 600, fontSize: "14px",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                  cursor: "pointer"
                }}
              >
                <ListChecksIcon size={18} />
                Check-in khách
              </motion.button>
            </Link>
          </div>
        </div>

        {isCreatePropertyOpen && (
          <motion.form
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleCreateProperty}
            style={{
              marginBottom: "24px",
              backgroundColor: T.cardBg,
              border: `1px solid ${T.border}`,
              borderRadius: T.radius,
              boxShadow: T.shadow,
              padding: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: T.text }}>Thêm property mới</div>
              <div style={{ fontSize: "13px", color: T.textMuted, marginTop: "4px" }}>
                Tạo thêm một cơ sở khách sạn để quản lý riêng phòng và phê duyệt.
              </div>
            </div>

            {[
              { key: "name", label: "Tên cơ sở", required: true, type: "text" },
              { key: "address", label: "Địa chỉ", required: false, type: "text" },
              { key: "phone", label: "Số điện thoại", required: false, type: "text" },
              { key: "email", label: "Email", required: false, type: "email" },
            ].map((field) => (
              <label key={field.key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: T.text }}>
                  {field.label}
                  {field.required ? " *" : ""}
                </span>
                <input
                  type={field.type}
                  value={createPropertyDraft[field.key as keyof CreatePropertyDraft]}
                  onChange={(event) =>
                    setCreatePropertyDraft((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  style={{
                    height: 44,
                    borderRadius: "12px",
                    border: `1px solid ${T.border}`,
                    padding: "0 14px",
                    fontSize: "14px",
                    color: T.text,
                    backgroundColor: "#fff",
                  }}
                />
              </label>
            ))}

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "1 / -1" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: T.text }}>Ghi chú</span>
              <textarea
                value={createPropertyDraft.notes}
                onChange={(event) =>
                  setCreatePropertyDraft((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                rows={4}
                style={{
                  borderRadius: "12px",
                  border: `1px solid ${T.border}`,
                  padding: "12px 14px",
                  fontSize: "14px",
                  color: T.text,
                  backgroundColor: "#fff",
                  resize: "vertical",
                }}
              />
            </label>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ fontSize: "13px", color: createPropertyError ? T.red : T.textMuted }}>
                {createPropertyError ?? "Property mới sẽ được gắn vào chính tài khoản chủ khách sạn hiện tại."}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={resetCreatePropertyForm}
                  style={{
                    height: 42,
                    padding: "0 18px",
                    borderRadius: "12px",
                    border: `1px solid ${T.border}`,
                    backgroundColor: "#fff",
                    color: T.text,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProperty}
                  style={{
                    height: 42,
                    padding: "0 18px",
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: T.blue,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: isCreatingProperty ? "wait" : "pointer",
                    opacity: isCreatingProperty ? 0.7 : 1,
                  }}
                >
                  {isCreatingProperty ? "Đang tạo..." : "Lưu property"}
                </button>
              </div>
            </div>
          </motion.form>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: "160px", backgroundColor: "rgba(0,0,0,0.03)", borderRadius: T.radius, animation: "pulse 2s infinite" }} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
           <div style={{ padding: "32px", backgroundColor: T.redSoft, borderRadius: T.radius, border: `1px solid rgba(239, 68, 68, 0.2)` }}>
             <WarningCircleIcon size={32} color={T.red} style={{ marginBottom: 16 }} />
             <h3 style={{ color: T.red, fontWeight: 600, fontSize: "18px", margin: 0 }}>Lỗi tải dữ liệu</h3>
             <p style={{ color: "rgba(239, 68, 68, 0.8)", fontSize: "14px", margin: "8px 0 0 0" }}>{error}</p>
             <button onClick={loadData} style={{ marginTop: 16, padding: "8px 16px", backgroundColor: T.red, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 500, cursor: "pointer" }}>
               Thử lại
             </button>
           </div>
        )}

        {/* Main Dashboard Content */}
        {!isLoading && !error && (
          <motion.div variants={containerVariants} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Upper Grid (4 Columns) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
              <OccupancyHeroCard total={totalRooms} available={availableRooms} />
              
              <StatCard
                label="Check-in hôm nay"
                value={todayCheckins}
                icon={CalendarCheckIcon}
                color={T.orange}
                bg={T.orangeSoft}
              />
              <StatCard
                label="Đang chờ check-in"
                value={pendingArrivals}
                icon={ClockCountdownIcon}
                color={T.blue}
                bg={T.blueSoft}
              />
            </div>

            {/* Lower Grid (Arrivals Table) */}
            <motion.div
              variants={itemVariants}
              style={{
                backgroundColor: T.cardBg,
                borderRadius: T.radius,
                padding: "32px",
                border: `1px solid ${T.border}`,
                boxShadow: T.shadow,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: T.text, margin: 0 }}>Lịch trình khách đến</h3>
                  <p style={{ fontSize: "14px", color: T.textMuted, margin: 0, marginTop: 4 }}>Danh sách các nhóm khách gần nhất</p>
                </div>
                <Link href="/hotel/arrivals" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "14px", fontWeight: 600, color: T.blue, textDecoration: "none" }}>
                  Xem tất cả
                  <ArrowRightIcon weight="bold" />
                </Link>
              </div>

              {recentArrivals.length === 0 ? (
                <div style={{ padding: "64px 0", textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, backgroundColor: "rgba(0,0,0,0.03)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                    <BedIcon size={32} color={T.textMuted} />
                  </div>
                  <h4 style={{ fontSize: "16px", fontWeight: 600, color: T.text, margin: 0 }}>Không có khách chờ</h4>
                  <p style={{ fontSize: "14px", color: T.textMuted, marginTop: 8 }}>Khách sạn chưa có thông tin check-in nào sắp tới.</p>
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                    <thead>
                      <tr style={{ color: T.textMuted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "left" }}>
                        <th style={{ padding: "0 16px 8px 16px" }}>Booking ID</th>
                        <th style={{ padding: "0 16px 8px 16px" }}>Phòng / Căn hộ</th>
                        <th style={{ padding: "0 16px 8px 16px" }}>Check-in</th>
                        <th style={{ padding: "0 16px 8px 16px" }}>Check-out</th>
                        <th style={{ padding: "0 16px 8px 16px", textAlign: "right" }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {recentArrivals.map((arrival, index) => {
                          const statusConf = STATUS_CONFIG[arrival.status] || STATUS_CONFIG.Pending;
                          return (
                            <motion.tr
                              key={arrival.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              whileHover={{ scale: 0.995, backgroundColor: "rgba(0,0,0,0.01)" }}
                              style={{ cursor: "default" }}
                            >
                              <td style={{ padding: "16px", borderRadius: "12px 0 0 12px", border: `1px solid ${T.border}`, borderRight: "none", fontSize: "13px", fontFamily: "monospace", color: T.textMuted }}>
                                {arrival.bookingAccommodationDetailId.slice(0, 8)}...
                              </td>
                              <td style={{ padding: "16px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, fontSize: "14px", fontWeight: 500, color: T.text }}>
                                {arrival.accommodationName ?? "Chưa rõ"}
                              </td>
                              <td style={{ padding: "16px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, fontSize: "14px", color: T.text }}>
                                {formatDate(arrival.checkInDate)}
                              </td>
                              <td style={{ padding: "16px", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, fontSize: "14px", color: T.textMuted }}>
                                {formatDate(arrival.checkOutDate)}
                              </td>
                              <td style={{ padding: "16px", borderRadius: "0 12px 12px 0", border: `1px solid ${T.border}`, borderLeft: "none", textAlign: "right" }}>
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 6,
                                  padding: "4px 10px", borderRadius: "100px",
                                  backgroundColor: statusConf.bg, color: statusConf.color,
                                  fontSize: "12px", fontWeight: 600, letterSpacing: "-0.01em"
                                }}>
                                  {arrival.status === "Pending" && <ClockCountdownIcon weight="bold" />}
                                  {arrival.status === "CheckedIn" && <CheckCircleIcon weight="bold" />}
                                  {statusConf.label}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            <UpcomingToursSection
              tours={upcomingTours}
              providerType="hotel"
              viewAllHref="/hotel/tour-approvals"
              itemVariants={itemVariants}
              tokens={T}
            />

          </motion.div>
        )}
      </div>
      
      {/* Global reset for next.js global styles if table acts weird */}
      <style dangerouslySetInnerHTML={{__html: `
        table { text-indent: initial; }
      `}} />
    </div>
  );
}

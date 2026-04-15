"use client";

import React from "react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { CalendarIcon, UsersIcon } from "@phosphor-icons/react";
import { NormalizedTourInstanceVm } from "@/types/tour";
import dayjs from "dayjs";

interface DesignTokens {
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  blue: string;
  orange: string;
  red: string;
  shadow: string;
  radius: string;
}

interface UpcomingToursSectionProps {
  tours: NormalizedTourInstanceVm[];
  providerType: "hotel" | "transport";
  viewAllHref: string;
  itemVariants: Variants;
  tokens: DesignTokens;
}

export default function UpcomingToursSection({
  tours,
  providerType,
  viewAllHref,
  itemVariants,
  tokens,
}: UpcomingToursSectionProps) {
  const getApprovalStatus = (tour: NormalizedTourInstanceVm) => {
    const status =
      providerType === "hotel"
        ? tour.hotelApprovalStatus
        : tour.transportApprovalStatus;

    if (status === 1) return { label: "Đang chờ duyệt", color: tokens.orange, bg: `rgba(245, 158, 11, 0.08)` };
    if (status === 2) return { label: "Đã duyệt", color: tokens.accent, bg: `rgba(16, 185, 129, 0.08)` };
    if (status === 3) return { label: "Từ chối", color: tokens.red, bg: `rgba(239, 68, 68, 0.08)` };
    return { label: "Chờ xác nhận", color: tokens.textMuted, bg: `rgba(0,0,0,0.04)` };
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = dayjs(start).format("DD/MM/YYYY");
    const endDate = dayjs(end).format("DD/MM/YYYY");
    return `${startDate} – ${endDate}`;
  };

  return (
    <motion.div variants={itemVariants}>
      <div
        style={{
          backgroundColor: tokens.cardBg,
          borderRadius: tokens.radius,
          padding: "32px",
          border: `1px solid ${tokens.border}`,
          boxShadow: tokens.shadow,
        }}
      >
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: tokens.text,
                margin: 0,
              }}
            >
              Đợt tour sắp tới
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: tokens.textMuted,
                margin: 0,
                marginTop: 4,
              }}
            >
              {providerType === "hotel"
                ? "Các đợt tour sắp diễn ra tại khách sạn của bạn"
                : "Các đợt tour cần phục vụ vận tải của bạn"}
            </p>
          </div>
          <Link
            href={viewAllHref}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "14px",
              fontWeight: 600,
              color: tokens.blue,
              textDecoration: "none",
            }}
          >
            Xem tất cả
            <span>→</span>
          </Link>
        </div>

        {/* Empty State */}
        {tours.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <div
              style={{
                width: 64,
                height: 64,
                backgroundColor: "rgba(0,0,0,0.03)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CalendarIcon size={32} color={tokens.textMuted} />
            </div>
            <h4
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: tokens.text,
                margin: 0,
              }}
            >
              Không có đợt tour nào sắp tới
            </h4>
            <p
              style={{
                fontSize: "14px",
                color: tokens.textMuted,
                marginTop: 8,
              }}
            >
              Hiện tại không có tour nào được chỉ định cho bạn trong thời gian sắp tới.
            </p>
          </div>
        ) : (
          /* Tour Cards Grid */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            <AnimatePresence>
              {tours.map((tour, index) => {
                const status = getApprovalStatus(tour);
                return (
                  <motion.div
                    key={tour.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    style={{
                      backgroundColor: tokens.cardBg,
                      border: `1px solid ${tokens.border}`,
                      borderRadius: "16px",
                      padding: "16px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    {/* Tour Name Badge */}
                    <div style={{ marginBottom: "12px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          backgroundColor: tokens.blue + "14",
                          color: tokens.blue,
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {tour.tourName}
                      </span>
                    </div>

                    {/* Tour Title */}
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: tokens.text,
                        margin: 0,
                        marginBottom: "8px",
                        lineClamp: 2,
                      }}
                    >
                      {tour.title}
                    </h4>

                    {/* Dates */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "13px",
                        color: tokens.textMuted,
                        marginBottom: "12px",
                      }}
                    >
                      <CalendarIcon size={14} />
                      {formatDateRange(tour.startDate, tour.endDate)}
                    </div>

                    {/* Participants */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: "13px",
                        color: tokens.textMuted,
                        marginBottom: "12px",
                      }}
                    >
                      <UsersIcon size={14} />
                      {tour.currentParticipation} / {tour.maxParticipation} người
                    </div>

                    {/* Status Badge */}
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${tokens.border}` }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: "100px",
                          backgroundColor: status.bg,
                          color: status.color,
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {status.label}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

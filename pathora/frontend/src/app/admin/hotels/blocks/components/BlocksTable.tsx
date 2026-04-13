import React from "react";
import { BedIcon } from "@phosphor-icons/react";
import { formatDate } from "@/utils/format";
import type { RoomBlockItem } from "@/api/services/adminHotelService";

interface BlocksTableProps {
  blocks: RoomBlockItem[];
  onDeleteBlock: (id: string) => void;
}

export function BlocksTable({ blocks, onDeleteBlock }: BlocksTableProps) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden" style={{ boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}>
      <table className="w-full">
        <thead>
          <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Khách sạn</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Loại phòng</th>
            <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Từ ngày</th>
            <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Đến ngày</th>
            <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Số phòng</th>
            <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Lý do</th>
            <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6B7280" }}>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {blocks.map((block, idx) => {
            const today = new Date().toISOString().split("T")[0];
            // isActive was evaluated by looking at today's date
            return (
              <tr
                key={block.id}
                className="transition-colors duration-150 hover:bg-stone-50"
                style={{ borderBottom: idx < blocks.length - 1 ? "1px solid #F3F4F6" : undefined }}
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "#FFEDD5" }}
                    >
                      <BedIcon size={18} weight="fill" style={{ color: "#EA580C" }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#111827" }}>
                        {block.supplierName ?? block.accommodationName ?? "—"}
                      </p>
                      {block.accommodationName && (
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>{block.accommodationName}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: "#374151" }}>{block.roomType}</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-sm" style={{ color: "#374151" }}>{formatDate(block.startDate)}</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span className="text-sm" style={{ color: "#374151" }}>{formatDate(block.endDate)}</span>
                </td>
                <td className="px-5 py-4 text-center">
                  <span
                    className="inline-flex min-w-[2rem] justify-center rounded-full px-2 py-0.5 text-sm font-semibold"
                    style={{ backgroundColor: "#FEE2E2", color: "#DC2626" }}
                  >
                    {block.roomCount}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: block.reason ? "#374151" : "#9CA3AF" }}>
                    {block.reason ?? "—"}
                  </span>
                </td>
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => onDeleteBlock(block.id)}
                    className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors duration-200"
                    style={{ color: "#DC2626", backgroundColor: "#FEF2F2" }}
                    title="Xóa chặn phòng"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

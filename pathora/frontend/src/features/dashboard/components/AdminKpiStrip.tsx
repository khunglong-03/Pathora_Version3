"use client";

import React from "react";
import { motion } from "framer-motion";
import Icon from "@/components/ui/Icon";

export interface AdminKpi {
  label: string;
  value: string;
  icon: string;
  accent: string;
  subtext?: string;
}

interface AdminKpiStripProps {
  kpis: AdminKpi[];
}

export function AdminKpiStrip({ kpis }: AdminKpiStripProps) {
  if (!kpis.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <motion.div
          key={kpi.label}
          data-testid={`kpi-card-${index}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.3,
            delay: index * 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="bg-white rounded-xl border border-[#E5E7EB] p-5 min-h-[120px] flex flex-col justify-between"
          style={{
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                {kpi.label}
              </span>
            </div>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-2"
              style={{ backgroundColor: `${kpi.accent}12` }}
            >
              <Icon icon={kpi.icon} className="size-4" style={{ color: kpi.accent }} />
            </div>
          </div>

          <div className="flex flex-col mt-2">
            <span
              className="text-[1.875rem] font-bold tracking-tight leading-none"
              style={{ color: "#111827", letterSpacing: "-0.03em" }}
            >
              {kpi.value}
            </span>
            {kpi.subtext && (
              <span className="text-xs mt-1.5" style={{ color: "#9CA3AF" }}>
                {kpi.subtext}
              </span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

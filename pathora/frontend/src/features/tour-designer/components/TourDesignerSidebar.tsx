"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Compass, House, Plus, Gear } from "@phosphor-icons/react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  {
    labelKey: "tourDesigner.myTours",
    href: "/tour-designer/tours",
    icon: House,
  },
  {
    labelKey: "tourDesigner.createTour",
    href: "/tour-designer/tours/create",
    icon: Plus,
  },
];

export function TourDesignerSidebar({}: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo + Title */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Compass size={24} style={{ color: "#6366F1" }} />
          <div>
            <div className="font-semibold text-sm">Pathora</div>
            <div className="text-xs text-gray-500">Tour Designer</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-all ${
                isActive
                  ? "bg-indigo-50 text-indigo-600"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon size={18} />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
          <Gear size={18} />
          {t("tourDesigner.settings", "Settings")}
        </button>
      </div>
    </aside>
  );
}
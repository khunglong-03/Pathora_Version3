"use client";

import { motion } from "framer-motion";
import { springTransition } from "./springTransition";

export interface SettingsTabMeta {
  id: string;
  label: string;
}

interface SettingsNavProps {
  tabs: SettingsTabMeta[];
  activeTab: string;
  onTabClick: (tabId: string) => void;
}

function NavTabButton({
  tab,
  isActive,
  onClick,
  index,
}: {
  tab: SettingsTabMeta;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      key={tab.id}
      type="button"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springTransition, delay: index * 0.03 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
        isActive
          ? "bg-primary text-white"
          : "text-stone-500 hover:text-stone-800 hover:bg-stone-100 active:scale-[0.98]"
      }`}
    >
      {isActive ? (
        <motion.div
          layoutId="settings-nav-indicator"
          className="min-w-[18px] h-[18px] px-2 shrink-0 flex items-center justify-center rounded-full bg-white/20"
          transition={springTransition}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-white" />
        </motion.div>
      ) : null}
      <span className="truncate">{tab.label}</span>
    </motion.button>
  );
}

export function SettingsNav({ tabs, activeTab, onTabClick }: SettingsNavProps) {
  return (
    <>
      {/* Mobile: horizontal scroll tabs with fade edges */}
      <div className="lg:hidden mb-4">
        <div
          className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
            maskImage: "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
          }}
        >
          <div className="flex gap-2 min-w-max px-2 py-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={`mobile-${tab.id}`}
                  type="button"
                  onClick={() => onTabClick(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                    isActive
                      ? "bg-primary text-white"
                      : "bg-white text-stone-600 border border-border hover:bg-stone-50"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop: sidebar nav */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-[2rem] border border-border shadow-card p-2">
          <nav className="space-y-0.5">
            {tabs.map((tab, index) => (
              <NavTabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => onTabClick(tab.id)}
                index={index}
              />
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

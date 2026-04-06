"use client";

import { motion } from "framer-motion";
import { springTransition } from "./springTransition";

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: () => void;
  disabled?: boolean;
  "aria-label"?: string;
}

export function ToggleSwitch({ enabled, onChange, disabled = false, "aria-label": ariaLabel }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      onClick={onChange}
      disabled={disabled}
      className={`relative w-10 h-5.5 rounded-full transition-colors duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${enabled ? "bg-primary" : "bg-stone-200"}`}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm"
        animate={{ x: enabled ? 18 : 0 }}
        transition={springTransition}
      />
    </button>
  );
}

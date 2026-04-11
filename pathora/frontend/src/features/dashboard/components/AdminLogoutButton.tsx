"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SignOut } from "@phosphor-icons/react";
import { useLogoutMutation } from "@/store/api/auth/authApiSlice";

export function AdminLogoutButton() {
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    // Clear cookies immediately so no more authenticated requests fire
    if (typeof document !== "undefined") {
      ["access_token", "refresh_token", "auth_status", "auth_portal", "auth_roles"].forEach((name) => {
        document.cookie =
          `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
      });
    }

    // Portal-aware redirect: admin portal → /, user portal → /
    const portal =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((c) => c.startsWith("auth_portal="))
            ?.split("=")[1]
        : undefined;

    // Wait for server-side revocation to ensure HttpOnly cookies are cleared
    try {
      await logout({ refreshToken: "" }).unwrap();
    } catch {
      // intentionally ignored — client state is already clean or cleared in onQueryStarted
    }

    router.push("/");
  };

  return (
    <motion.button
      type="button"
      onClick={() => {
        void handleLogout();
      }}
      disabled={isLoading}
      whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ color: "rgba(255,255,255,0.4)" }}
    >
      {/* Hover fill */}
      <span
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
        style={{ backgroundColor: "rgba(239, 68, 68, 0.08)" }}
      />

      {/* Icon */}
      <span className="relative z-10">
        <SignOut
          size={18}
          weight="regular"
          className="transition-transform duration-200 hover:translate-x-0.5"
        />
      </span>

      {/* Label */}
      <span className="relative z-10 transition-colors duration-200 hover:text-red-400">
        {isLoading ? "Logging out..." : "Sign out"}
      </span>
    </motion.button>
  );
}

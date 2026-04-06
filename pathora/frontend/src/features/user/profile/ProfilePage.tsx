"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FiLock, FiSettings, FiUser } from "react-icons/fi";
import { LandingHeader } from "@/features/shared/components";
import { extractResult } from "@/utils/apiResponse";
import { useChangePasswordMutation, useGetUserInfoQuery, useUpdateUserMutation } from "@/store/api/auth/authApiSlice";
import type { UserInfo } from "@/store/domain/auth";
import type { ProfileTabType } from "./types";
import { ProfileTab } from "./components/ProfileTab";
import { PasswordTab } from "./components/PasswordTab";
import { SettingsTab } from "./components/SettingsTab";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const CSS = {
  background:   "var(--background)",
  surface:      "var(--surface)",
  accent:       "var(--accent)",
  accentMuted:  "var(--accent-muted)",
  border:       "var(--border)",
  borderSub:    "var(--border-subtle)",
  textPrimary:  "var(--text-primary)",
  textSecondary:"var(--text-secondary)",
  textMuted:    "var(--text-muted)",
  success:      "var(--success)",
  successMuted: "var(--success-muted)",
  danger:       "var(--danger)",
  dangerMuted:  "var(--danger-muted)",
  warning:      "var(--warning)",
  warningMuted: "var(--warning-muted)",
  shadowCard:   "var(--shadow-card)",
} as const;

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

const VALID_TABS: ProfileTabType[] = ["profile", "password", "settings"];

export function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get("tab") as ProfileTabType | null;

  const activeTab: ProfileTabType = queryTab && VALID_TABS.includes(queryTab) ? queryTab : "profile";

  const { data: userInfoResponse, isLoading: isUserLoading } = useGetUserInfoQuery();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation();


  const user = useMemo(() => extractResult<UserInfo>(userInfoResponse), [userInfoResponse]);

  const tabs = [
    { id: "profile" as const, label: t("common.profile") || "Thông tin cá nhân", icon: FiUser },
    { id: "password" as const, label: t("common.changePassword") || "Đổi mật khẩu", icon: FiLock },
    { id: "settings" as const, label: t("common.settings") || "Cài đặt", icon: FiSettings },
  ];

  const headerConfig: Record<ProfileTabType, { icon: typeof FiUser; title: string; subtitle: string }> = {
    profile: {
      icon: FiUser,
      title: t("common.profilePage.pageTitle") || "Tài khoản của tôi",
      subtitle: t("common.profilePage.pageSubtitle") || "Quản lý thông tin cá nhân của bạn",
    },
    password: {
      icon: FiLock,
      title: t("common.profilePage.passwordTitle") || "Đổi mật khẩu",
      subtitle: t("common.profilePage.passwordSubtitle") || "Cập nhật mật khẩu để bảo mật tài khoản",
    },
    settings: {
      icon: FiSettings,
      title: t("common.profilePage.settingsTitle") || "Cài đặt",
      subtitle: t("common.profilePage.settingsSubtitle") || "Tùy chỉnh thông báo và tùy chọn cá nhân",
    },
  };

  const currentHeader = headerConfig[activeTab];
  const HeaderIcon = currentHeader.icon;

  return (
    <>
      <LandingHeader variant="solid" />
      <div style={{ backgroundColor: CSS.background }} className="min-h-screen pt-20">
        <div className="max-w-4xl mx-auto px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            style={{ backgroundColor: CSS.surface, boxShadow: CSS.shadowCard }}
            className="rounded-2xl overflow-hidden"
          >
            {/* Accent bar header */}
            <div
              style={{ backgroundColor: CSS.accentMuted, borderTop: `3px solid ${CSS.accent}` }}
              className="px-6 py-8 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${CSS.accent} 15%, transparent)` }}>
                  <HeaderIcon style={{ color: CSS.accent }} className="w-5 h-5" />
                </div>
                <div>
                  <h1 style={{ color: CSS.textPrimary, fontFamily: "var(--font-display)" }} className="text-2xl font-bold">{currentHeader.title}</h1>
                  <p style={{ color: CSS.textSecondary }} className="mt-0.5 text-sm">{currentHeader.subtitle}</p>
                </div>
              </div>
              {user?.email && <p style={{ color: CSS.textMuted }} className="text-xs mt-3 ml-[52px]">{user.email}</p>}
            </div>

            {/* Tab navigation */}
            <div style={{ borderBottom: `1px solid ${CSS.border}` }}>
              <nav className="flex">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("tab", tab.id);
                        router.replace(`?${params.toString()}`);
                      }}
                      style={{
                        color: isActive ? CSS.accent : CSS.textSecondary,
                      }}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative hover:opacity-80 ${
                        isActive ? "" : "hover:!text-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                      {isActive && (
                        <motion.span
                          layoutId="tab-indicator"
                          style={{ backgroundColor: CSS.accent }}
                          className="absolute bottom-0 left-0 right-0 h-0.5"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab content with stagger animation */}
            <div className="p-6">
              <motion.div
                key={activeTab}
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {activeTab === "profile" ? (
                  <motion.div variants={itemVariants}>
                    <ProfileTab
                      user={user ?? null}
                      isLoading={isUserLoading}
                      isUpdating={isUpdatingUser}
                      onUpdate={async (payload) => {
                        await updateUser(payload).unwrap();
                      }}
                    />
                  </motion.div>
                ) : null}

                {activeTab === "password" ? (
                  <motion.div variants={itemVariants}>
                    <PasswordTab
                      isUpdating={isChangingPassword}
                      onChangePassword={async (payload) => {
                        await changePassword(payload).unwrap();
                      }}
                    />
                  </motion.div>
                ) : null}

                {activeTab === "settings" ? (
                  <motion.div variants={itemVariants}>
                    <SettingsTab user={user ?? null} />
                  </motion.div>
                ) : null}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}

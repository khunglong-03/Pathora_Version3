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

// Using Tailwind directly to match the-hieu-design.md
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
      
      <div className="min-h-screen py-8 md:py-10 bg-slate-50/30">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-200/50 rounded-[1.5rem] overflow-hidden"
          >            {/* Accent bar header */}
            <div
              className="px-6 md:px-8 py-8 bg-slate-50/50 border-t-[3px] border-t-slate-900"
              
            >
              <div className="h-stack items-center gap-3">
                <div className="size-10 rounded-full center bg-slate-100">
                  <HeaderIcon className="size-5 text-slate-700" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{currentHeader.title}</h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">{currentHeader.subtitle}</p>
                </div>
              </div>
              {user?.email && <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-4 ml-[52px]">{user.email}</p>}
            </div>

            {/* Tab navigation */}
            <div className="border-b border-slate-200">
              <nav className="flex overflow-x-auto scrollbar-hide">
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
                      
                      className={`h-stack items-center gap-2 px-6 py-4 text-sm font-bold transition-all shrink-0 relative hover:bg-slate-50 ${isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
                    >
                      <Icon className="size-4" />
                      {tab.label}
                      {isActive && (
                        <motion.span
                          layoutId="tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab content with stagger animation */}
            <div className="p-6 md:p-8">
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

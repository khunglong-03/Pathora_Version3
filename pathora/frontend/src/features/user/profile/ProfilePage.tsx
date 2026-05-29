"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { FiLock, FiUser, FiShield } from "react-icons/fi";
import { extractResult } from "@/utils/apiResponse";
import { useChangePasswordMutation, useGetUserInfoQuery, useUpdateUserMutation } from "@/store/api/auth/authApiSlice";
import type { UserInfo } from "@/store/domain/auth";
import type { ProfileTabType } from "./types";
import { ProfileTab } from "./components/ProfileTab";
import { PasswordTab } from "./components/PasswordTab";

const SPRING = { type: "spring" as const, stiffness: 100, damping: 20 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

const VALID_TABS: ProfileTabType[] = ["profile", "password"];

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
  };

  const currentHeader = headerConfig[activeTab];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 lg:p-8 space-y-6 pb-20">
      <motion.div
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        variants={itemVariants}
        initial="hidden"
        animate="show"
      >
        <div className="pl-px">
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">
            {currentHeader.title}
          </h1>
          <p className="text-sm text-stone-500 mt-1.5">
            {currentHeader.subtitle}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="show"
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8"
      >
        {/* Sidebar / Tabs */}
        <motion.div variants={itemVariants} className="flex flex-col gap-1">
          <div className="bg-white border border-stone-200/60 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-2">
            <nav className="flex flex-col space-y-1">
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
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all outline-none ${
                      isActive 
                        ? "bg-stone-900 text-white shadow-md shadow-stone-900/20" 
                        : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                    }`}
                  >
                    <Icon className="size-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Info Card underneath tabs */}
          {user && (
            <div className="mt-4 bg-stone-50 border border-stone-200/60 rounded-[1.5rem] p-5 text-center">
              <div className="size-16 mx-auto rounded-full bg-stone-200 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
                 {user.avatar ? (
                   <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                   <span className="text-xl font-bold text-stone-500">{user.fullName?.[0] || "U"}</span>
                 )}
              </div>
              <h3 className="mt-3 text-sm font-bold text-stone-900 truncate px-2">{user.fullName || "User"}</h3>
              <p className="text-xs font-medium text-stone-500 truncate px-2">{user.email}</p>
              
              <div className="mt-4 pt-4 border-t border-stone-200/60 flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg py-1.5 px-3">
                <FiShield className="size-3.5" />
                <span>Verified Account</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="bg-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-stone-200/60 rounded-[2rem] overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10">
            {activeTab === "profile" ? (
              <ProfileTab
                user={user ?? null}
                isLoading={isUserLoading}
                isUpdating={isUpdatingUser}
                onUpdate={async (payload) => {
                  await updateUser(payload).unwrap();
                }}
              />
            ) : null}

            {activeTab === "password" ? (
              <PasswordTab
                isUpdating={isChangingPassword}
                onChangePassword={async (payload) => {
                  await changePassword(payload).unwrap();
                }}
              />
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

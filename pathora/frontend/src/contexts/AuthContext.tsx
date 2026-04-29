"use client";

import type { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logOut } from "@/store/infrastructure/authSlice";
import type { RootState, AppDispatch } from "@/store";
import type { UserInfo } from "@/types";
import { useLogoutMutation } from "@/store/api/auth/authApiSlice";
import { clearAuthSession } from "@/utils/authSession";

type LoginRequest = Record<string, unknown>;
type RegisterRequest = Record<string, unknown>;

const REFRESH_TOKEN_COOKIE_KEY = "refresh_token=";

const extractRefreshToken = (cookieSource: string): string => {
  const tokenValue = cookieSource
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(REFRESH_TOKEN_COOKIE_KEY))
    ?.slice(REFRESH_TOKEN_COOKIE_KEY.length);

  if (!tokenValue) {
    return "";
  }

  try {
    return decodeURIComponent(tokenValue);
  } catch {
    return tokenValue;
  }
};

export interface AuthContextValue {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

export const useAuth = (): AuthContextValue => {
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);
  const [logoutMutation] = useLogoutMutation();

  const logout = () => {
    const refreshToken = extractRefreshToken(
      typeof document === "undefined" ? "" : document.cookie,
    );

    // Always clear client state (optimistic) regardless of API result
    clearAuthSession();
    dispatch(logOut());

    // Call API to revoke token server-side
    logoutMutation({ refreshToken }).catch((error) => {
      console.warn("Logout API call failed:", error);
    });
  };

  return {
    user: authState?.user ?? null,
    isAuthenticated: !!authState?.isAuth,
    isLoading: false,
    login: async () => {
      throw new Error("useAuth.login is not implemented.");
    },
    register: async () => {
      throw new Error("useAuth.register is not implemented.");
    },
    logout,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return children;
};

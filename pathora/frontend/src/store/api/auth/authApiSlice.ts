import { apiSlice } from "../apiSlice";
import { setUser, setToken, logOut } from "../../infrastructure/authSlice";
import type { UserInfo } from "../../domain/auth";
import type { ApiSharedResponse } from "@/types";
import { isAdminPortal } from "@/utils/authRouting";
import i18next from "i18next";

// ─── Cookie helpers ────────────────────────────────────────────────────────

const DAY_SECONDS = 60 * 60 * 24;

const isProduction = process.env.NODE_ENV === "production";
const setCookie = (name: string, value: string, maxAge = DAY_SECONDS): void => {
  const secure = isProduction ? "; Secure" : "";
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
};

const removeCookie = (name: string): void => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
};

const setAuthSessionCookies = (portal: string | null): void => {
  setCookie("auth_status", "1", DAY_SECONDS * 7);
  setCookie("auth_portal", isAdminPortal(portal) ? "admin" : "user", DAY_SECONDS * 7);
};

const setAuthRolesCookie = (roleNames: string[]): void => {
  const encoded = encodeURIComponent(JSON.stringify(roleNames));
  setCookie("auth_roles", encoded, DAY_SECONDS * 7);
};

const clearAuthSessionCookies = (): void => {
  removeCookie("auth_status");
  removeCookie("auth_portal");
  removeCookie("auth_roles");
};

// ─── Request / Response shapes ─────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

interface TokenData {
  accessToken: string;
  refreshToken: string;
  portal: string | null;
  defaultPath: string | null;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

export interface UserSettingsData {
  preferredLanguage: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  notificationPush: boolean;
  theme: string;
}

export interface UpdateUserSettingsRequest {
  preferredLanguage?: string;
  notificationEmail?: boolean;
  notificationSms?: boolean;
  notificationPush?: boolean;
  theme?: string;
}

// ─── RTK Query endpoints ───────────────────────────────────────────────────

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * POST /api/auth/register
     * Register a new user account.
     */
    register: builder.mutation<ApiSharedResponse<string>, RegisterRequest>({
      query: (body) => ({
        url: "/api/auth/register",
        method: "POST",
        body,
      }),
    }),

    /**
     * POST /api/auth/login
     * On success: stores tokens in cookies, fetches user info, updates Redux.
     */
    login: builder.mutation<ApiSharedResponse<TokenData>, LoginRequest>({
      query: (credentials) => ({
        url: "/api/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const tokens = data.data;
          if (!tokens) return;

          // Cookies (access_token, refresh_token, auth_status, auth_portal) 
          // are automatically set by the browser via backend's Set-Cookie headers.
          // Redundant JS setting removed to prevent HttpOnly conflicts.
          dispatch(setToken(tokens.accessToken));

          // Fetch user info right after login to populate Redux
          const result = await dispatch(
            authApiSlice.endpoints.getUserInfo.initiate(undefined, {
              forceRefetch: true,
            }),
          );
          if ("data" in result && result.data?.data) {
            dispatch(setUser(result.data.data));

            // auth_roles is not set as a cookie by the backend; we manage it here
            const roleNames = result.data.data.roles.map((r) => r.name);
            setAuthRolesCookie(roleNames);

            // Sync i18n language on login
            const preferredLang = result.data.data.preferredLanguage;
            if (preferredLang) {
              if (i18next.isInitialized) {
                if (i18next.language !== preferredLang) {
                  void i18next.changeLanguage(preferredLang);
                }
              } else {
                i18next.on("initialized", () => {
                  if (i18next.language !== preferredLang) {
                    void i18next.changeLanguage(preferredLang);
                  }
                });
              }
            }
          }
        } catch {
          // errors are handled by axiosInstance / apiSlice globally
          dispatch(logOut());
        }
      },
    }),

    /**
     * GET /api/auth/me
     * Returns current user info and syncs it to Redux auth state + i18n language.
     */
    getUserInfo: builder.query<ApiSharedResponse<UserInfo>, void>({
      query: () => "/api/auth/me",
      providesTags: ["Auth"],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.data) {
            dispatch(setUser(data.data));

            // Set auth_roles cookie for middleware role-based routing
            const roleNames = data.data.roles.map((r) => r.name);
            setAuthRolesCookie(roleNames);

            // Sync i18n language from user settings (Task 5.6: race condition fix)
            const preferredLang = data.data.preferredLanguage;
            if (preferredLang) {
              if (i18next.isInitialized) {
                if (i18next.language !== preferredLang) {
                  void i18next.changeLanguage(preferredLang);
                }
              } else {
                // Defer until i18n initializes
                i18next.on("initialized", () => {
                  if (i18next.language !== preferredLang) {
                    void i18next.changeLanguage(preferredLang);
                  }
                });
              }
            }
          }
        } catch {
          // unauthenticated — leave state as-is
        }
      },
    }),

    /**
     * POST /api/auth/refresh
     * Rotates the access/refresh token pair and updates cookies + Redux.
     */
    refreshToken: builder.mutation<
      ApiSharedResponse<TokenData>,
      RefreshRequest
    >({
      query: (body) => ({
        url: "/api/auth/refresh",
        method: "POST",
        body,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const tokens = data.data;
          if (!tokens) return;

          // Cookies (access_token, refresh_token, auth_status, auth_portal) 
          // are automatically set by the browser via backend's Set-Cookie headers.
          // Redundant JS setting removed to prevent HttpOnly conflicts.
          dispatch(setToken(tokens.accessToken));

          // Re-fetch user info to sync roles cookie after token refresh
          const userResult = await dispatch(
            authApiSlice.endpoints.getUserInfo.initiate(undefined, {
              forceRefetch: true,
            }),
          );
          if ("data" in userResult && userResult.data?.data) {
            const roleNames = userResult.data.data.roles.map((r) => r.name);
            setAuthRolesCookie(roleNames);
          }
        } catch {
          // token expired — force logout
          // Let the error flow clear what it can
          removeCookie("access_token");
          removeCookie("refresh_token");
          clearAuthSessionCookies();
          dispatch(logOut());
        }
      },
    }),

    /**
     * POST /api/auth/logout
     * Revokes the refresh token on the server and clears client state.
     */
    logout: builder.mutation<ApiSharedResponse<unknown>, LogoutRequest>({
      query: (body) => ({
        url: "/api/auth/logout",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth"],
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        // Clear client state immediately (optimistic), regardless of server result
        removeCookie("access_token");
        removeCookie("refresh_token");
        clearAuthSessionCookies();
        dispatch(logOut());
        try {
          await queryFulfilled;
        } catch {
          // server-side revocation failed but client is already logged out
        }
      },
    }),

    /**
     * PUT /api/user/change-password
     * Change user password.
     */
    changePassword: builder.mutation<ApiSharedResponse<void>, { oldPassword: string; newPassword: string }>({
      query: (body) => ({
        url: "/api/auth/change-password",
        method: "PUT",
        body,
      }),
    }),

    /**
     * PUT /api/auth/me
     * Update current user profile.
     */
    updateUser: builder.mutation<ApiSharedResponse<void>, { fullName?: string; phoneNumber?: string; address?: string; avatar?: string }>({
      query: (body) => ({
        url: "/api/auth/me",
        method: "PUT",
        body: { request: body },
      }),
      invalidatesTags: ["Auth"],
    }),

    /**
     * GET /api/auth/me/settings
     * Get user settings (language, notifications, theme).
     */
    getUserSettings: builder.query<ApiSharedResponse<UserSettingsData>, void>({
      query: () => "/api/auth/me/settings",
      providesTags: ["Auth"],
    }),

    /**
     * PUT /api/auth/me/settings
     * Update user settings (partial update — only non-null fields are applied).
     */
    updateUserSettings: builder.mutation<ApiSharedResponse<void>, UpdateUserSettingsRequest>({
      query: (body) => ({
        url: "/api/auth/me/settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
  overrideExisting: (process.env.NODE_ENV !== "production"),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetUserInfoQuery,
  useRefreshTokenMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useUpdateUserMutation,
  useGetUserSettingsQuery,
  useUpdateUserSettingsMutation,
} = authApiSlice;

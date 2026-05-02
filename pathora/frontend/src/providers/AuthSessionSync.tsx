"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/store";
import { logOut } from "@/store/infrastructure/authSlice";
import { getValidAccessToken } from "@/utils/authSession";
import { getCookie } from "@/utils/cookie";

export default function AuthSessionSync() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);

  useEffect(() => {
    if (!isAuth) {
      return;
    }

    if (getValidAccessToken()) {
      return;
    }

    // Match authSlice: auth_status (7d) outlives a short-lived access JWT. If we log out
    // here as soon as the JWT is missing/expired, long flows (payment, redirects) force
    // a full logout before axios can POST /api/auth/refresh on the next 401.
    if (getCookie("auth_status")) {
      return;
    }

    dispatch(logOut());
  }, [dispatch, isAuth]);

  return null;
}

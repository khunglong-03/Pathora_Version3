"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "@/store";
import { logOut } from "@/store/infrastructure/authSlice";
import { getValidAccessToken } from "@/utils/authSession";

export default function AuthSessionSync() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuth = useSelector((state: RootState) => state.auth.isAuth);

  useEffect(() => {
    if (!isAuth) {
      return;
    }

    if (!getValidAccessToken()) {
      dispatch(logOut());
    }
  }, [dispatch, isAuth]);

  return null;
}

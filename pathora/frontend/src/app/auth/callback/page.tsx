"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logOut, setUser } from "@/store/infrastructure/authSlice";
import { authApiSlice } from "@/store/api/auth/authApiSlice";
import type { AppDispatch, RootState } from "@/store";
import { resolveRoleDefaultPath } from "@/utils/authRouting";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const cancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  useEffect(() => {
    const error = searchParams.get("error");

    if (error) {
      if (cancelledRef.current) return;
      dispatch(logOut());
      router.replace("/");
      return;
    }

    // Use Redux store first (populated by login mutation)
    if (user?.roles && user.roles.length > 0) {
      if (cancelledRef.current) return;
      router.replace(resolveRoleDefaultPath(user.roles));
      return;
    }

    // Fallback: fetch user info if Redux is empty
    dispatch(
      authApiSlice.endpoints.getUserInfo.initiate(undefined, {
        forceRefetch: true,
      }),
    ).then((result) => {
      if (cancelledRef.current) return;
      if ("data" in result && result.data?.data) {
        const userInfo = result.data.data;
        dispatch(setUser(userInfo));
        router.replace(resolveRoleDefaultPath(userInfo.roles));
      } else {
        dispatch(logOut());
        router.replace("/home");
      }
    });
  }, [searchParams, dispatch, router, user]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}

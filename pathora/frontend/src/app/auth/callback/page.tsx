"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
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
    const returnUrl = searchParams.get("returnUrl");

    if (error) {
      if (cancelledRef.current) return;
      dispatch(logOut());
      
      // Handle different error types with appropriate messages
      switch (error) {
        case "google_auth_not_configured":
          toast.error("Google authentication is not configured on the server.");
          break;
        case "google_auth_failed":
          toast.error("Google authentication failed. Please try again.");
          break;
        case "missing_claims":
          toast.error("Missing required information from Google profile.");
          break;
        case "login_failed":
          toast.error("Failed to log in with Google. Please try another method.");
          break;
        default:
          toast.error(`Authentication error: ${error}`);
      }
      
      router.replace("/");
      return;
    }

    // Use Redux store first (populated by login mutation)
    if (user?.roles && user.roles.length > 0) {
      if (cancelledRef.current) return;
      if (returnUrl) {
        router.replace(returnUrl);
      } else {
        router.replace(resolveRoleDefaultPath(user.roles));
      }
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
        toast.success("Successfully logged in with Google!");
        if (returnUrl) {
          router.replace(returnUrl);
        } else {
          router.replace(resolveRoleDefaultPath(userInfo.roles));
        }
      } else {
        dispatch(logOut());
        router.replace("/");
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

"use client";
import React, { useSyncExternalStore } from "react";
import Logo from "@/assets/images/logo/pathora-logo.svg";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const emptySubscribe = () => () => {};

const Loading = () => {
  const { isAuth } = useSelector((state: RootState) => state.auth);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Show consistent loading state during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className="app_height flex flex-col items-center justify-center"
        suppressHydrationWarning
      >
        <div className="mb-3">
          <img src={Logo.src} alt="Logo" />
        </div>
        <svg
          className="h-12 w-12 animate-spin ltr:mr-3 ltr:-ml-1 rtl:-mr-1 rtl:ml-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="app_height flex flex-col items-center justify-center">
      {!isAuth && (
        <div className="mb-3">
          <img src={Logo.src} alt="Logo" />
        </div>
      )}
      <svg
        className={`animate-spin ltr:mr-3 ltr:-ml-1 rtl:-mr-1 rtl:ml-3 ${
          isAuth ? "h-6 w-6" : "h-12 w-12"
        } `}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {isAuth && (
        <span className="mt-1 inline-block text-sm font-medium">
          {" "}
          Loading ...
        </span>
      )}
    </div>
  );
};

export default Loading;

"use client";
import React, { useEffect, useState, createContext, useContext } from "react";
import { I18nextProvider } from "react-i18next";
import StoreProvider from "./StoreProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "simplebar-react/dist/simplebar.min.css";
import "flatpickr/dist/themes/light.css";
import "../assets/css/app.css";
import i18n from "@/i18n/config";

// Context to force re-render when language changes
const I18nContext = createContext<{ refresh: number }>({ refresh: 0 });

export const useI18nRefresh = () => useContext(I18nContext);

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    // Force re-render after language change
    const handleLanguageChanged = (lng: string) => {
      console.log("[i18n] Language changed to:", lng);
      setRefresh((r) => r + 1);
    };

    i18n.on("languageChanged", handleLanguageChanged);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <I18nContext.Provider value={{ refresh }}>
        <StoreProvider>
          {children}
          <ToastContainer />
        </StoreProvider>
      </I18nContext.Provider>
    </I18nextProvider>
  );
}

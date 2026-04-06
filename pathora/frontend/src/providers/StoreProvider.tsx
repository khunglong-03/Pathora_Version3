"use client";
import { Provider } from "react-redux";
import { useEffect, useRef } from "react";
import store from "../store";
import { getValidAccessToken } from "../utils/authSession";
import { authApiSlice } from "../store/api/auth/authApiSlice";

/** Restores auth session from cookies on app mount */
function AuthSessionInitializer() {
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const token = getValidAccessToken();
    if (token) {
      // Kick off getUserInfo — it syncs to Redux via its onQueryStarted hook
      store.dispatch(authApiSlice.endpoints.getUserInfo.initiate(undefined, { forceRefetch: true }));
    }
  }, []);
  return null;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <AuthSessionInitializer />
      {children}
    </Provider>
  );
}

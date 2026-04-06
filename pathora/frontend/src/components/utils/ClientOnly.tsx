"use client";
import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

const getServerSnapshot = () => true;
const getClientSnapshot = () => true;

export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  return mounted ? <>{children}</> : <>{fallback}</>;
}

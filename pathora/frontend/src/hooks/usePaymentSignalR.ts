"use client";
import { useEffect, useRef, useState } from "react";
import { signalRService, type PaymentUpdate } from "@/api/services/signalRService";
import { paymentService, type NormalizedPaymentStatus } from "@/api/services/paymentService";

const TERMINAL_STATUSES: NormalizedPaymentStatus[] = [
  "paid",
  "cancelled",
  "expired",
  "failed",
];

const POLL_CONNECTED_MS = 15_000;
const POLL_DISCONNECTED_MS = 5_000;

function isTerminalStatus(status: NormalizedPaymentStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function usePaymentSignalR(transactionCode: string) {
  const [status, setStatus] = useState<NormalizedPaymentStatus>("pending");
  const [isConnected, setIsConnected] = useState(signalRService.isConnected);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (!transactionCode || transactionCode === "null" || transactionCode === "undefined") return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const applyStatus = (next: NormalizedPaymentStatus) => {
      if (cancelled || isTerminalStatus(statusRef.current)) return;
      if (next !== statusRef.current) {
        statusRef.current = next;
        setStatus(next);
      }
    };

    const pollOnce = async () => {
      if (cancelled || isTerminalStatus(statusRef.current)) return;
      try {
        const snapshot = await paymentService.checkPayment(transactionCode);
        applyStatus(snapshot.normalizedStatus);
      } catch {
        // Ignore transient network errors; next poll retries.
      }
    };

    const schedulePoll = (connected: boolean) => {
      if (pollTimer) clearInterval(pollTimer);
      const intervalMs = connected ? POLL_CONNECTED_MS : POLL_DISCONNECTED_MS;
      pollTimer = setInterval(() => {
        void pollOnce();
      }, intervalMs);
    };

    const initSignalR = async () => {
      try {
        await signalRService.connect();
        if (cancelled) return;
        await signalRService.invoke("JoinTransactionGroup", transactionCode);
      } catch (err) {
        console.error("[usePaymentSignalR] init failed:", err);
      }
    };

    void initSignalR();
    void pollOnce();
    schedulePoll(signalRService.isConnected);

    const unsubPayment = signalRService.onPaymentUpdate((update: PaymentUpdate) => {
      if (update.transactionCode === transactionCode) {
        applyStatus(update.normalizedStatus);
      }
    });

    const unsubConnected = signalRService.onConnected(() => {
      setIsConnected(true);
      schedulePoll(true);
      signalRService.invoke("JoinTransactionGroup", transactionCode).catch(() => {});
    });

    const unsubDisconnected = signalRService.onDisconnected(() => {
      setIsConnected(false);
      schedulePoll(false);
    });

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      signalRService.invoke("LeaveTransactionGroup", transactionCode).catch(() => {});
      unsubPayment();
      unsubConnected();
      unsubDisconnected();
    };
  }, [transactionCode]);

  return { status, isConnected };
}

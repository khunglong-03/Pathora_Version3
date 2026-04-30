"use client";
import { useEffect, useState } from "react";
import { signalRService, type PaymentUpdate } from "@/api/services/signalRService";
import { type NormalizedPaymentStatus } from "@/api/services/paymentService";

export function usePaymentSignalR(transactionCode: string) {
  const [status, setStatus] = useState<NormalizedPaymentStatus>("pending");
  const [isConnected, setIsConnected] = useState(signalRService.isConnected);

  useEffect(() => {
    if (!transactionCode || transactionCode === "null" || transactionCode === "undefined") return;

    let cancelled = false;

    const init = async () => {
      try {
        await signalRService.connect();
        if (cancelled) return;
        await signalRService.invoke("JoinTransactionGroup", transactionCode);
      } catch (err) {
        console.error("[usePaymentSignalR] init failed:", err);
      }
    };

    init();

    const unsubPayment = signalRService.onPaymentUpdate((update: PaymentUpdate) => {
      if (update.transactionCode === transactionCode) {
        setStatus(update.normalizedStatus);
      }
    });

    const unsubConnected = signalRService.onConnected(() => {
      setIsConnected(true);
      signalRService.invoke("JoinTransactionGroup", transactionCode).catch(() => {});
    });

    const unsubDisconnected = signalRService.onDisconnected(() => {
      setIsConnected(false);
    });

    return () => {
      cancelled = true;
      signalRService.invoke("LeaveTransactionGroup", transactionCode).catch(() => {});
      unsubPayment();
      unsubConnected();
      unsubDisconnected();
    };
  }, [transactionCode]);

  return { status, isConnected };
}

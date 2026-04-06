"use client";
import { useEffect, useState, useCallback } from "react";
import { signalRService, type PaymentUpdate } from "@/api/services/signalRService";
import { paymentService, type NormalizedPaymentStatus } from "@/api/services/paymentService";

export function usePaymentSignalR(transactionCode: string) {
  const [status, setStatus] = useState<NormalizedPaymentStatus>("pending");
  const [isConnected, setIsConnected] = useState(signalRService.isConnected);

  // Subscribe to SignalR payment updates
  useEffect(() => {
    const unsubPayment = signalRService.onPaymentUpdate((update: PaymentUpdate) => {
      if (update.transactionCode === transactionCode) {
        setStatus(update.normalizedStatus);
      }
    });

    const unsubConnected = signalRService.onConnected(() => {
      setIsConnected(true);
    });

    const unsubDisconnected = signalRService.onDisconnected(() => {
      setIsConnected(false);
    });

    return () => {
      unsubPayment();
      unsubConnected();
      unsubDisconnected();
    };
  }, [transactionCode]);

  return { status, isConnected };
}

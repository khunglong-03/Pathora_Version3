"use client";

import { useEffect, useState, useCallback } from "react";
import { signalRService, type Notification, type BookingUpdate, type TourInstanceUpdate, type PaymentUpdate, type ItineraryFeedbackEvent } from "@/api/services/signalRService";

interface UseSignalROptions {
  autoConnect?: boolean;
}

interface SignalREvents {
  onNotification: (handler: (notification: Notification) => void) => () => void;
  onBookingUpdate: (handler: (update: BookingUpdate) => void) => () => void;
  onTourInstanceUpdate: (handler: (update: TourInstanceUpdate) => void) => () => void;
  onPaymentUpdate: (handler: (update: PaymentUpdate) => void) => () => void; // Task 4.3.2
  onItineraryFeedbackEvent: (handler: (event: ItineraryFeedbackEvent) => void) => () => void;
  onConnected: (handler: () => void) => () => void;
  onDisconnected: (handler: () => void) => () => void;
}

export function useSignalR(options: UseSignalROptions = {}): {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  events: SignalREvents;
} {
  const { autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);

  const handleConnected = useCallback(() => {
    setIsConnected(true);
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
  }, []);

  useEffect(() => {
    // Subscribe to connection state changes
    const unsubConnected = signalRService.onConnected(handleConnected);
    const unsubDisconnected = signalRService.onDisconnected(handleDisconnected);

    // Auto-connect if enabled
    if (autoConnect) {
      signalRService.connect();
    }

    return () => {
      unsubConnected();
      unsubDisconnected();
    };
  }, [autoConnect, handleConnected, handleDisconnected]);

  const connect = useCallback(async () => {
    await signalRService.connect();
  }, []);

  const disconnect = useCallback(async () => {
    await signalRService.disconnect();
  }, []);

  const events: SignalREvents = {
    onNotification: signalRService.onNotification.bind(signalRService),
    onBookingUpdate: signalRService.onBookingUpdate.bind(signalRService),
    onTourInstanceUpdate: signalRService.onTourInstanceUpdate.bind(signalRService),
    onPaymentUpdate: signalRService.onPaymentUpdate.bind(signalRService), // Task 4.3.2
    onItineraryFeedbackEvent: signalRService.onItineraryFeedbackEvent.bind(signalRService),
    onConnected: signalRService.onConnected.bind(signalRService),
    onDisconnected: signalRService.onDisconnected.bind(signalRService),
  };

  return {
    isConnected,
    connect,
    disconnect,
    events,
  };
}

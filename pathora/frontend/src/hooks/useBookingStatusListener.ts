import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { apiSlice } from "@/store/api/apiSlice";
import { signalRService, type BookingStatusChangedEvent } from "@/api/services/signalRService";

/**
 * Listens for SignalR `BookingStatusChanged` events and invalidates
 * RTK Query caches so booking lists/details refresh automatically.
 */
export function useBookingStatusListener(onStatusChanged?: (event: BookingStatusChangedEvent) => void) {
  const dispatch = useDispatch();

  useEffect(() => {
    signalRService.connect().catch((error) => {
      console.error("[useBookingStatusListener] SignalR connect failed:", error);
    });

    const unsubscribe = signalRService.onBookingStatusChanged((event) => {
      dispatch(apiSlice.util.invalidateTags(["Orders"]));
      onStatusChanged?.(event);
    });
    return unsubscribe;
  }, [dispatch, onStatusChanged]);
}

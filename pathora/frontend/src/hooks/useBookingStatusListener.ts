import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { apiSlice } from "@/store/api/apiSlice";
import { signalRService } from "@/api/services/signalRService";

/**
 * Listens for SignalR `BookingStatusChanged` events and invalidates
 * RTK Query caches so booking lists/details refresh automatically.
 */
export function useBookingStatusListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = signalRService.onBookingStatusChanged(() => {
      dispatch(apiSlice.util.invalidateTags(["Orders"]));
    });
    return unsubscribe;
  }, [dispatch]);
}

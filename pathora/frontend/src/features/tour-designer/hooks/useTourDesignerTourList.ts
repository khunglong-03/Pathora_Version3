import { useCallback, useEffect, useState } from "react";
import { tourService } from "@/api/services/tourService";
import type { TourVm } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";

export type TourListState = "loading" | "ready" | "empty" | "error";

interface UseTourDesignerTourListOptions {
  searchText?: string;
  statusFilter?: string;
  pageNumber?: number;
  pageSize?: number;
}

interface UseTourDesignerTourListResult {
  tours: TourVm[];
  total: number;
  state: TourListState;
  errorMessage: string | null;
  refetch: () => void;
}

export function useTourDesignerTourList(
  options: UseTourDesignerTourListOptions = {},
): UseTourDesignerTourListResult {
  const {
    searchText = "",
    statusFilter = "all",
    pageNumber = 1,
    pageSize = 10,
  } = options;

  const [tours, setTours] = useState<TourVm[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<TourListState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const doFetch = async () => {
      try {
        setState("loading");
        setErrorMessage(null);
        const effectiveStatus =
          statusFilter === "all" ? undefined : statusFilter;
        const result = await tourService.getAllToursAdmin(
          searchText || undefined,
          effectiveStatus,
          pageNumber,
          pageSize,
        );
        if (!active) return;
        setTours(result?.data ?? []);
        setTotal(result?.total ?? 0);
        setState(!result?.data?.length ? "empty" : "ready");
      } catch (error: unknown) {
        if (!active) return;
        setState("error");
        setErrorMessage(handleApiError(error));
      }
    };

    void doFetch();
    return () => {
      active = false;
    };
  }, [searchText, statusFilter, pageNumber, pageSize, reloadToken]);

  return { tours, total, state, errorMessage, refetch };
}

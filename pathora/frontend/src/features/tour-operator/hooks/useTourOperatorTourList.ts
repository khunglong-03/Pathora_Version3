import { useCallback, useEffect, useState } from "react";
import { tourService } from "@/api/services/tourService";
import type { TourVm } from "@/types/tour";
import { handleApiError } from "@/utils/apiResponse";

export type TourListState = "loading" | "ready" | "empty" | "error";

interface UseTourOperatorTourListOptions {
  searchText?: string;
  statusFilter?: string;
  tourScope?: string;
  continent?: string;
  pageNumber?: number;
  pageSize?: number;
}

interface UseTourOperatorTourListResult {
  tours: TourVm[];
  total: number;
  state: TourListState;
  errorMessage: string | null;
  refetch: () => void;
}

export function useTourOperatorTourList(
  options: UseTourOperatorTourListOptions = {},
): UseTourOperatorTourListResult {
  const {
    searchText = "",
    statusFilter = "all",
    tourScope = "all",
    continent = "all",
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
        const effectiveTourScope =
          tourScope === "all" ? undefined : tourScope;
        const effectiveContinent =
          continent === "all" ? undefined : continent;
        const result = await tourService.getMyTours(
          searchText || undefined,
          effectiveStatus,
          effectiveTourScope,
          effectiveContinent,
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
        setErrorMessage(handleApiError(error).message);
      }
    };

    void doFetch();
    return () => {
      active = false;
    };
  }, [searchText, statusFilter, tourScope, continent, pageNumber, pageSize, reloadToken]);

  return { tours, total, state, errorMessage, refetch };
}

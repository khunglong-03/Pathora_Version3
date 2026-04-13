import { useState, useEffect, useCallback } from "react";

import { managerService } from "@/api/services/managerService";
import type { ManagerDashboardReport } from "@/types/manager";
import { handleApiError } from "@/utils/apiResponse";

export interface UseManagerDashboardDataReturn {
  data: ManagerDashboardReport | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useManagerDashboardData(): UseManagerDashboardDataReturn {
  const [data, setData] = useState<ManagerDashboardReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await managerService.getDashboard();
      if (result === null) {
        setData(null);
        setError("Failed to load manager dashboard data.");
      } else {
        setData(result);
        setError(null);
      }
    } catch (err) {
      setData(null);
      setError(handleApiError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, refetch: load };
}

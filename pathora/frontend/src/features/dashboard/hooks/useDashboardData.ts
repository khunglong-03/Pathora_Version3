import { useState, useEffect, useCallback } from "react";

import { adminService } from "@/api/services/adminService";
import type { AdminDashboard } from "@/types/admin";
import { extractResult, handleApiError } from "@/utils/apiResponse";

export interface UseDashboardDataReturn {
  data: AdminDashboard | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminService.getDashboard();
      const extracted = extractResult<AdminDashboard>(result);
      if (extracted === null) {
        setData(null);
        setError("Failed to load dashboard data.");
      } else {
        setData(extracted);
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

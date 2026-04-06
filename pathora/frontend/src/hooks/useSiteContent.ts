import { useState, useEffect, useCallback } from "react";
import { api } from "@/api/axiosInstance";
import API_ENDPOINTS from "@/api/endpoints";
import type { AxiosError } from "axios";

export interface SiteContent {
  [key: string]: unknown;
}

interface UseSiteContentResult {
  content: SiteContent | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSiteContent(pageKey: string): UseSiteContentResult {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    if (!pageKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<{ items: SiteContent }>(
        API_ENDPOINTS.SITE_CONTENT.GET_BY_PAGE(pageKey)
      );

      if (response.data?.items) {
        setContent(response.data.items);
      } else {
        setContent({});
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error("Error fetching site content:", axiosError);
      const errorMessage =
        axiosError.response?.status === 404
          ? "Content not found"
          : axiosError.message || "Unknown error";
      setError(errorMessage);
      setContent(null);
    } finally {
      setLoading(false);
    }
  }, [pageKey]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return { content, loading, error, refetch: fetchContent };
}

export default useSiteContent;

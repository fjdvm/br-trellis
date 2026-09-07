import { useState, useEffect, useCallback } from "react";
import { templatesApi } from "@/features/campaigns/services/campaigns-api";
import { Template } from "@/features/campaigns/types";

export function useTemplates(channel?: string) {
  const [data, setData] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const templates = await templatesApi.list(channel);
      setData(templates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load templates"));
    } finally {
      setIsLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTemplates,
  };
}

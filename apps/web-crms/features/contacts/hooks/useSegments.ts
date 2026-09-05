import { useState, useEffect, useCallback } from "react";
import { crmClient } from "@/lib/api/crm-client";
import type { SegmentListItem } from "@/features/contacts/types";

export function useSegments() {
  const [data, setData] = useState<SegmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSegments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmClient.segments.list();
      setData(res ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load segments"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  return { data, isLoading, error, refetch: fetchSegments };
}

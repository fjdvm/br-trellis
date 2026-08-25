import { useState, useEffect, useCallback } from "react";
import { crmClient } from "@/lib/api/crm-client";
import { Campaign } from "@/types/campaign";

export function useCampaign(id: string | null) {
  const [data, setData] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!id) {
      setData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await crmClient.campaigns.getById(id);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load campaign detail"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return { data, isLoading, error, refetch: fetchCampaign };
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";
import { CampaignListItem } from "@/features/campaigns/types";

export function useCampaigns(status?: string) {
  const { data: session } = useSession();
  const [data, setData] = useState<CampaignListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await campaignsApi.list(status);
      setData(res ?? []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load campaigns"));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns, session?.accessToken]);

  return { data, isLoading, error, refetch: fetchCampaigns };
}

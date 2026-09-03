import { useState, useEffect, useCallback } from "react";
import { crmClient } from "@/lib/api/crm-client";
import { Template } from "@/types/campaign";

export function useTemplates(channel?: string) {
  const [data, setData] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [legacyRes, blockRes] = await Promise.all([
        crmClient.templates.list(channel).catch(() => []),
        crmClient.blockTemplates.list(channel).catch(() => []),
      ]);

      const blockTemplatesAsTemplates: Template[] = (blockRes ?? []).map((bt) => ({
        id: bt.id,
        name: bt.name,
        description: bt.description,
        content: JSON.stringify(bt.blocks),
        format: "Blocks",
        channel: bt.channel,
        createdAt: bt.createdAt,
      }));

      setData([...(legacyRes ?? []), ...blockTemplatesAsTemplates]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load templates"));
    } finally {
      setIsLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { data, isLoading, error, refetch: fetchTemplates };
}

import { useState, useEffect, useCallback } from "react";
import { templatesApi, blockTemplatesApi } from "@/features/campaigns/services/campaigns-api";
import { Template, BlockTemplate } from "@/features/campaigns/types";

export function useTemplates(channel?: string) {
  const [predefinedTemplates, setPredefinedTemplates] = useState<Template[]>([]);
  const [blockTemplatesAsTemplates, setBlockTemplatesAsTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [legacyRes, blockRes] = await Promise.all([
        templatesApi.list(channel).catch(() => []),
        blockTemplatesApi.list(channel).catch(() => []),
      ]);

      setPredefinedTemplates(legacyRes ?? []);
      setBlockTemplatesAsTemplates(
        (blockRes ?? []).map((bt: BlockTemplate) => ({
          id: bt.id,
          name: bt.name,
          description: bt.description,
          content: JSON.stringify(bt.blocks),
          format: "Blocks",
          channel: bt.channel,
          createdAt: bt.createdAt,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load templates"));
    } finally {
      setIsLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const data = [...predefinedTemplates, ...blockTemplatesAsTemplates];

  return {
    data,
    predefinedTemplates,
    blockTemplates: blockTemplatesAsTemplates,
    isLoading,
    error,
    refetch: fetchTemplates,
  };
}

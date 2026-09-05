"use client";

import { useState, useEffect } from "react";
import { segmentsApi } from "@/features/contacts/services/segments-api";

export interface AudienceCounts {
  all: number;
  contacts: number;
  companies: number;
  ecommerce: number;
}

export function useAudienceCounts() {
  const [data, setData] = useState<AudienceCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    segmentsApi
      .getAudienceCounts()
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((err) => {
        if (mounted) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { data, isLoading, isError, error };
}

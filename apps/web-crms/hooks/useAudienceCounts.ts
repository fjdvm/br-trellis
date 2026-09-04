"use client";

import { useState, useEffect } from "react";
import { crmClient } from "@/lib/api/crm-client";

export interface AudienceCounts {
  all: number;
  contacts: number;
  companies: number;
  ecommerce: number;
}

export function useAudienceCounts() {
  const [data, setData] = useState<AudienceCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (crmClient.segments?.getAudienceCounts) {
      crmClient.segments
        .getAudienceCounts()
        .then((res) => {
          if (mounted) setData(res);
        })
        .catch(() => {
          // silently fall back
        })
        .finally(() => {
          if (mounted) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    return () => {
      mounted = false;
    };
  }, []);

  return { data, isLoading };
}

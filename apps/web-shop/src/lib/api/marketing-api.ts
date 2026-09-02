import { apiClient } from "@/lib/api/api-client";
import type { ActiveContent } from "@/types/marketing";

// api-oos returns 204 (empty body) when nothing is active; apiClient maps that
// to `{}`, so treat a payload without a `channel` as "no active content".
function normalize(payload: ActiveContent | Record<string, never>): ActiveContent | null {
  return payload && "channel" in payload ? (payload as ActiveContent) : null;
}

export const marketingApi = {
  getActiveBanner: async (): Promise<ActiveContent | null> =>
    normalize(await apiClient.get<ActiveContent | Record<string, never>>("/banner/active")),

  getActivePopup: async (): Promise<ActiveContent | null> =>
    normalize(await apiClient.get<ActiveContent | Record<string, never>>("/popup/active")),
};

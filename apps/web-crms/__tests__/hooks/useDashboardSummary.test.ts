import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboardSummary";
import { aiClient } from "@/lib/api/ai-client";

jest.mock("@/lib/api/ai-client", () => ({
  aiClient: {
    dashboard: {
      getSummary: jest.fn(),
    },
  },
}));

describe("useDashboardSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads summary metrics on mount", async () => {
    const mockSummary = {
      churnRate: { value: 2.4, delta: -0.2, trend: "down" },
      averageClv: { value: 4250, delta: 350, trend: "up" },
      customerSatisfaction: { value: 4.5, delta: 0.1, trend: "up" },
      averageResolutionHours: { value: 8.5, delta: -1.2, trend: "down" },
      activeTickets: { value: 12, delta: 2, trend: "up" },
      activeCampaigns: { value: 3, delta: 0, trend: "flat" },
    };
    (aiClient.dashboard.getSummary as jest.Mock).mockResolvedValue(mockSummary);

    const { result } = renderHook(() => useDashboardSummary("2026-01-01", "2026-06-30"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockSummary);
    expect(aiClient.dashboard.getSummary).toHaveBeenCalledWith("2026-01-01", "2026-06-30");
  });
});

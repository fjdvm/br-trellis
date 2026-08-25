import { renderHook, waitFor } from "@testing-library/react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    campaigns: {
      list: jest.fn(),
    },
  },
}));

describe("useCampaigns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads campaigns on mount", async () => {
    const mockData = [
      { id: "1", title: "Campaign 1", channels: ["Email"], status: "Active", createdAt: "2026-01-01" },
    ];
    (crmClient.campaigns.list as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useCampaigns("Active"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(crmClient.campaigns.list).toHaveBeenCalledWith("Active");
  });
});

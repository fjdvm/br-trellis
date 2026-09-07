import { renderHook, waitFor } from "@testing-library/react";
import { useCampaigns } from "@/features/campaigns";
import { campaignsApi } from "@/features/campaigns";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({ data: null, status: "unauthenticated" })),
}));

jest.mock("@/features/campaigns", () => ({
  campaignsApi: {
      list: jest.fn(),
    }
}));

describe("useCampaigns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads campaigns on mount", async () => {
    const mockData = [
      { id: "1", title: "Campaign 1", channels: ["Email"], status: "Active", createdAt: "2026-01-01" },
    ];
    (campaignsApi.list as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useCampaigns("Active"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(mockData);
    expect(campaignsApi.list).toHaveBeenCalledWith("Active");
  });
});

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Campaigns } from "@/features/campaigns/components/campaigns";
import { useCampaigns } from "@/features/campaigns/hooks/useCampaigns";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";
import type { CampaignListItem } from "@/features/campaigns/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/features/campaigns/hooks/useCampaigns", () => ({ useCampaigns: jest.fn() }));
jest.mock("@/features/campaigns/services/campaigns-api", () => ({
  campaignsApi: { campaigns: { getEngagementMetrics: jest.fn() }, getEngagementMetrics: jest.fn() },
}));

const draft: CampaignListItem = {
  id: "c-draft",
  title: "Draft blast",
  channels: ["Email"],
  status: "Draft",
  createdAt: "2026-01-01T00:00:00Z",
};
const active: CampaignListItem = {
  id: "c-active",
  title: "Live promo",
  channels: ["Banner"],
  status: "Active",
  createdAt: "2026-01-02T00:00:00Z",
};

describe("Campaigns list", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useCampaigns as jest.Mock).mockReturnValue({
      data: [draft, active],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (campaignsApi.getEngagementMetrics as jest.Mock).mockResolvedValue([]);
  });

  it("renders the real lifecycle status tabs (All/Draft/Active/Ended) and no legacy tabs", () => {
    render(<Campaigns />);
    expect(screen.getByRole("tab", { name: /all/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /draft/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /^active$/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /ended/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /scheduled|sent|in-?app/i })).not.toBeInTheDocument();
  });

  it("shows all campaigns with their channel and status on the All tab", () => {
    render(<Campaigns />);
    expect(screen.getByText("Draft blast")).toBeInTheDocument();
    expect(screen.getByText("Live promo")).toBeInTheDocument();
    // Channel + status badges live inside the table cells (the tab labels also
    // contain "Draft"/"Active", so scope the assertion to the table).
    const table = screen.getByRole("table");
    expect(within(table).getByText("Email")).toBeInTheDocument();
    expect(within(table).getByText("Banner")).toBeInTheDocument();
    expect(within(table).getByText("Draft")).toBeInTheDocument();
    expect(within(table).getByText("Active")).toBeInTheDocument();
  });

  it("filters to only Draft campaigns on the Draft tab", async () => {
    const user = userEvent.setup();
    render(<Campaigns />);
    await user.click(screen.getByRole("tab", { name: /draft/i }));
    await waitFor(() => expect(screen.getByText("Draft blast")).toBeInTheDocument());
    expect(screen.queryByText("Live promo")).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no campaigns", () => {
    (useCampaigns as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<Campaigns />);
    expect(screen.getByText(/no campaigns/i)).toBeInTheDocument();
  });

  it("calls getEngagementMetrics for displayed campaigns", async () => {
    (campaignsApi.getEngagementMetrics as jest.Mock).mockResolvedValue([
      { campaignId: "c-draft", sentCount: 4, openedCount: 2, clickedCount: 1, openRate: 50, clickRate: 25 },
    ]);
    render(<Campaigns />);

    await waitFor(() =>
      expect(campaignsApi.getEngagementMetrics).toHaveBeenCalledWith(["c-draft", "c-active"])
    );
  });
});

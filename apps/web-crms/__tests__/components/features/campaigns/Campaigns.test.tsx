import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Campaigns } from "@/components/features/campaigns/Campaigns";
import { CampaignTable } from "@/components/features/campaigns/CampaignTable";
import { useCampaigns } from "@/hooks/useCampaigns";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/hooks/useCampaigns", () => ({ useCampaigns: jest.fn() }));
jest.mock("@/lib/api/crm-client", () => ({
  crmClient: { campaigns: { getEngagementMetrics: jest.fn() } },
}));

describe("Campaigns", () => {
  const activeScheduledCampaign = {
    id: "campaign-1",
    title: "Upcoming offer",
    channels: ["Email"],
    status: "Active" as const,
    createdAt: "2026-01-01T00:00:00Z",
    schedule: { scheduleType: "Scheduled" as const, startDate: "2026-12-25T10:30:00Z" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCampaigns as jest.Mock).mockReturnValue({
      data: [activeScheduledCampaign], isLoading: false, refetch: jest.fn(),
    });
    (crmClient.campaigns.getEngagementMetrics as jest.Mock).mockResolvedValue([]);
  });

  it("renders only real lifecycle status tabs and keeps a future schedule inline", async () => {
    render(<Campaigns />);

    expect(screen.getByRole("tab", { name: "All Campaigns" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Draft" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ended" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /scheduled|sent/i })).not.toBeInTheDocument();
    expect(await screen.findByText(/scheduled for/i)).toBeInTheDocument();
  });

  it("loads and renders metrics only for the visible page and uses dashes where a rate cannot exist", async () => {
    (crmClient.campaigns.getEngagementMetrics as jest.Mock).mockResolvedValue([
      { campaignId: "email", sentCount: 4, openedCount: 2, clickedCount: 1, openRate: 50, clickRate: 25 },
    ]);

    render(
      <CampaignTable
        campaigns={[
          { id: "email", title: "Email campaign", channels: ["Email"], status: "Active", createdAt: "2026-01-01" },
          { id: "draft", title: "Draft email", channels: ["Email"], status: "Draft", createdAt: "2026-01-01" },
          { id: "in-app", title: "In-app campaign", channels: ["InApp"], status: "Active", createdAt: "2026-01-01" },
        ]}
        isLoading={false}
        onRefresh={jest.fn()}
        onShowToast={jest.fn()}
      />
    );

    expect(screen.getByRole("columnheader", { name: "Open Rate" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Click Rate" })).toBeInTheDocument();
    await waitFor(() => expect(crmClient.campaigns.getEngagementMetrics).toHaveBeenCalledWith(["email", "draft", "in-app"]));
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(4);
  });
});

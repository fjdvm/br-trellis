import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignDetail } from "@/features/campaigns/components/campaign-detail";
import { useCampaign } from "@/features/campaigns/hooks/useCampaign";
import { crmClient } from "@/lib/api/crm-client";
import type { Campaign } from "@/features/campaigns/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/features/campaigns/hooks/useCampaign", () => ({ useCampaign: jest.fn() }));
jest.mock("@/features/contacts/hooks/useSegments", () => ({ useSegments: jest.fn(() => ({ data: [], isLoading: false })) }));
jest.mock("@/lib/api/crm-client", () => ({
  crmClient: { campaigns: { updateStatus: jest.fn(), getAnalytics: jest.fn() } },
}));

const campaign: Campaign = {
  id: "c1",
  title: "Spring Sale",
  channels: ["Email"],
  status: "Draft",
  createdAt: "2026-01-01T00:00:00Z",
  targetAudience: "seg-123",
  targetEmails: ["partner@x.io"],
  channelContents: [
    {
      channel: "Email",
      subject: "Big Spring news",
      body: "Come shop our sale",
      templateId: "tpl-1",
      imageUrl: "/img.png",
    },
  ],
};

describe("CampaignDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (crmClient.campaigns.getAnalytics as jest.Mock).mockResolvedValue(null);
  });

  it("shows the campaign title, status and channels", () => {
    (useCampaign as jest.Mock).mockReturnValue({ data: campaign, isLoading: false, error: null, refetch: jest.fn() });
    render(<CampaignDetail id="c1" />);
    expect(screen.getByText("Spring Sale")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getAllByText("Email").length).toBeGreaterThan(0);
  });

  it("shows the Email content (subject and body) and audience reference", () => {
    (useCampaign as jest.Mock).mockReturnValue({ data: campaign, isLoading: false, error: null, refetch: jest.fn() });
    render(<CampaignDetail id="c1" />);
    expect(screen.getByText("Big Spring news")).toBeInTheDocument();
    expect(screen.getByText(/come shop our sale/i)).toBeInTheDocument();
    expect(screen.getByText(/partner@x.io/i)).toBeInTheDocument();
  });

  it("shows a loading state while fetching", () => {
    (useCampaign as jest.Mock).mockReturnValue({ data: null, isLoading: true, error: null, refetch: jest.fn() });
    render(<CampaignDetail id="c1" />);
    expect(screen.getByTestId("campaign-detail-loading")).toBeInTheDocument();
  });

  it("shows a not-found message when the campaign is missing", () => {
    (useCampaign as jest.Mock).mockReturnValue({ data: null, isLoading: false, error: null, refetch: jest.fn() });
    render(<CampaignDetail id="c1" />);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it("shows a Launch button for a Draft campaign and calls updateStatus(Active) on click", async () => {
    const refetch = jest.fn();
    (useCampaign as jest.Mock).mockReturnValue({ data: campaign, isLoading: false, error: null, refetch });
    (crmClient.campaigns.updateStatus as jest.Mock).mockResolvedValue({ id: "c1", status: "Active" });
    const user = userEvent.setup({ delay: null });
    render(<CampaignDetail id="c1" />);

    const launch = screen.getByRole("button", { name: /launch/i });
    await user.click(launch);
    await waitFor(() =>
      expect(crmClient.campaigns.updateStatus).toHaveBeenCalledWith("c1", "Active")
    );
  });

  it("hides the Launch button for a non-Draft campaign", () => {
    (useCampaign as jest.Mock).mockReturnValue({
      data: { ...campaign, status: "Active" },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<CampaignDetail id="c1" />);
    expect(screen.queryByRole("button", { name: /launch/i })).not.toBeInTheDocument();
  });

  it("shows the dispatch result (sent/failed counts) when the email has been dispatched", () => {
    (useCampaign as jest.Mock).mockReturnValue({
      data: {
        ...campaign,
        status: "Active",
        dispatchResult: { totalRecipients: 3, sentCount: 2, failedCount: 1, errors: ["bad@x.io: bounced"] },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<CampaignDetail id="c1" />);
    expect(screen.getByText(/dispatch result/i)).toBeInTheDocument();
    expect(screen.getByText("Sent:")).toBeInTheDocument();
    expect(screen.getByText("Failed:")).toBeInTheDocument();
    expect(screen.getByText(/bad@x.io: bounced/)).toBeInTheDocument();
  });

  it("shows open/click analytics for a dispatched Email campaign", async () => {
    (useCampaign as jest.Mock).mockReturnValue({
      data: {
        ...campaign,
        status: "Active",
        dispatchResult: { totalRecipients: 4, sentCount: 4, failedCount: 0, errors: [] },
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    (crmClient.campaigns.getAnalytics as jest.Mock).mockResolvedValue({
      sentCount: 4,
      openedCount: 2,
      clickedCount: 1,
      openRate: 50,
      clickRate: 25,
      engagementByDay: [],
      linkPerformance: [{ destinationUrl: "https://shop/sale", totalClicks: 1, uniqueClicks: 1, shareOfTotalClicks: 100 }],
    });

    render(<CampaignDetail id="c1" />);

    expect(await screen.findByText(/analytics/i)).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument(); // open rate
    expect(screen.getByText("25%")).toBeInTheDocument(); // click rate
    expect(screen.getByText("https://shop/sale")).toBeInTheDocument();
  });
});

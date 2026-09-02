import React from "react";
import { render, screen } from "@testing-library/react";
import { CampaignDetail } from "@/components/features/campaigns/CampaignDetail";
import { useCampaign } from "@/hooks/useCampaign";
import type { Campaign } from "@/types/campaign";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/useCampaign", () => ({ useCampaign: jest.fn() }));

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
});

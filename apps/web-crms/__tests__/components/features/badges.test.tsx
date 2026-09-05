import React from "react";
import { render, screen } from "@testing-library/react";
import { CampaignChannelBadge } from "@/features/campaigns/components/campaign-channel-badge";
import { CampaignStatusBadge } from "@/features/campaigns/components/campaign-status-badge";

describe("Campaign badge components", () => {
  it("renders CampaignChannelBadge for Email, Banner and Popup", () => {
    const { rerender } = render(<CampaignChannelBadge channel="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();

    rerender(<CampaignChannelBadge channel="Banner" />);
    expect(screen.getByText("Banner")).toBeInTheDocument();

    rerender(<CampaignChannelBadge channel="Popup" />);
    expect(screen.getByText("Popup")).toBeInTheDocument();
  });

  it("renders CampaignStatusBadge for Draft, Active and Ended", () => {
    const { rerender } = render(<CampaignStatusBadge status="Draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();

    rerender(<CampaignStatusBadge status="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();

    rerender(<CampaignStatusBadge status="Ended" />);
    expect(screen.getByText("Ended")).toBeInTheDocument();
  });
});

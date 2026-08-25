import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { CampaignAnalyticsTab } from "@/components/features/campaigns/CampaignAnalyticsTab";
import { CampaignDetail } from "@/components/features/campaigns/CampaignDetail";
import { useCampaign } from "@/hooks/useCampaign";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/hooks/useCampaign", () => ({ useCampaign: jest.fn() }));
jest.mock("recharts", () => {
  const ResponsiveContainer = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const LineChart = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const Line = () => null;
  const XAxis = () => null;
  const YAxis = () => null;
  const Tooltip = () => null;
  ResponsiveContainer.displayName = "ResponsiveContainer";
  LineChart.displayName = "LineChart";
  Line.displayName = "Line";
  XAxis.displayName = "XAxis";
  YAxis.displayName = "YAxis";
  Tooltip.displayName = "Tooltip";
  return { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip };
});
jest.mock("@/lib/api/crm-client", () => ({ crmClient: { campaigns: { getAnalytics: jest.fn(), updateStatus: jest.fn(), send: jest.fn() } } }));
jest.mock("next/link", () => function MockLink({ children }: { children: React.ReactNode }) { return <>{children}</>; });

describe("CampaignDetail", () => {
  beforeEach(() => {
    (useCampaign as jest.Mock).mockReturnValue({ data: { id: "campaign-1", title: "Summer deal", subject: "Save", description: "Details", channels: ["Email"], targetAudience: "All", status: "Active" }, isLoading: false, refetch: jest.fn() });
    (crmClient.campaigns.getAnalytics as jest.Mock).mockResolvedValue({ openRate: 50, clickRate: 25, engagementByDay: [], linkPerformance: [{ destinationUrl: "https://example.com", totalClicks: 2, uniqueClicks: 1, shareOfTotalClicks: 100 }] });
  });

  it("shows overview actions and tracked email analytics without a bounce metric", async () => {
    render(<CampaignDetail campaignId="campaign-1" />);
    expect(screen.getByRole("tab", { name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Analytics" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send email now/i })).toBeInTheDocument();
    render(<CampaignAnalyticsTab campaignId="campaign-1" />);
    await waitFor(() => expect(screen.getByText("Link Performance")).toBeInTheDocument());
    expect(screen.getByText("In-App analytics coming soon")).toBeInTheDocument();
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
    expect(screen.queryByText(/bounce rate/i)).not.toBeInTheDocument();
  });
});

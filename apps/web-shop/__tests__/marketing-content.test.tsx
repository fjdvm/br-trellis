import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MarketingContent } from "@/components/features/home/MarketingContent";
import { marketingApi } from "@/lib/api/marketing-api";
import type { ActiveContent } from "@/types/marketing";

jest.mock("@/lib/api/marketing-api", () => ({
  marketingApi: {
    getActiveBanner: jest.fn(),
    getActivePopup: jest.fn(),
  },
}));

const banner: ActiveContent = {
  campaignId: "b1",
  channel: "Banner",
  body: "Free shipping this week!",
  linkUrl: "/products",
  dismissible: true,
  heading: null,
  imageUrl: null,
  ctaText: null,
  ctaUrl: null,
};

const popup: ActiveContent = {
  campaignId: "p1",
  channel: "Popup",
  heading: "Welcome!",
  body: "Get 10% off your first order.",
  imageUrl: null,
  ctaText: "Shop now",
  ctaUrl: "/products",
  linkUrl: null,
  dismissible: true,
};

describe("MarketingContent (web-shop storefront delivery)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (marketingApi.getActiveBanner as jest.Mock).mockResolvedValue(null);
    (marketingApi.getActivePopup as jest.Mock).mockResolvedValue(null);
  });

  it("renders nothing when there is no active banner or popup", async () => {
    const { container } = render(<MarketingContent />);
    await waitFor(() => expect(marketingApi.getActiveBanner).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the active banner strip when one is active", async () => {
    (marketingApi.getActiveBanner as jest.Mock).mockResolvedValue(banner);
    render(<MarketingContent />);
    expect(await screen.findByText("Free shipping this week!")).toBeInTheDocument();
  });

  it("renders the active popup and lets the shopper dismiss it", async () => {
    (marketingApi.getActivePopup as jest.Mock).mockResolvedValue(popup);
    render(<MarketingContent />);

    expect(await screen.findByText("Welcome!")).toBeInTheDocument();
    expect(screen.getByText("Get 10% off your first order.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close|dismiss/i }));
    await waitFor(() => expect(screen.queryByText("Welcome!")).not.toBeInTheDocument());
  });
});

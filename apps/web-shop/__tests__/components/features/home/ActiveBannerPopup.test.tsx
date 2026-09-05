import React from "react";
import { render, screen } from "@testing-library/react";
import { ActiveBanner } from "@/components/features/home/ActiveBanner";
import { ActivePopup } from "@/components/features/home/ActivePopup";
import type { ActiveContent } from "@/types/marketing";

// Root cause #3: before the fix, api-crms handed web-shop the raw JSON that
// web-crms's ChannelContentForm persists for a Block-template Banner/Popup,
// and these components printed it verbatim (`{content.body}`) — a real
// customer would see the literal JSON dict on the live storefront. api-crms's
// GetActiveChannelContentAsync now renders that JSON to real HTML via
// EmailBodyRenderer before it ever reaches web-shop; these components render
// that HTML instead of interpolating it as text.

describe("ActiveBanner renders real formatted content, not raw JSON", () => {
  it("renders the pre-rendered HTML as real elements", () => {
    const content: ActiveContent = {
      campaignId: "c1",
      channel: "Banner",
      body: '<h2 style="font-size:20px;">Big <strong>Sale</strong> Event</h2><div><a href="https://shop.example.com">Shop Now</a></div>',
      linkUrl: null,
      dismissible: false,
    };

    render(<ActiveBanner content={content} />);

    // Rendered as a real DOM element, not literal text.
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Big Sale Event");
    expect(screen.getByText("Sale").tagName).toBe("STRONG");
    expect(screen.getByRole("link", { name: "Shop Now" })).toHaveAttribute(
      "href",
      "https://shop.example.com"
    );

    // The raw markup/JSON must never be visible as literal text on the page.
    expect(screen.queryByText(/<h2/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"type"/)).not.toBeInTheDocument();
  });
});

describe("ActivePopup renders real formatted content, not raw JSON", () => {
  it("renders the pre-rendered HTML as real elements", () => {
    const content: ActiveContent = {
      campaignId: "c2",
      channel: "Popup",
      heading: "Special Announcement",
      body: '<p>Everything is <em>on sale</em> this week only.</p>',
      ctaText: "Shop Now",
      ctaUrl: "https://shop.example.com",
      dismissible: true,
    };

    render(<ActivePopup content={content} />);

    expect(screen.getByText("Special Announcement")).toBeInTheDocument();
    expect(screen.getByText("on sale").tagName).toBe("EM");
    expect(screen.getByRole("link", { name: "Shop Now" })).toHaveAttribute(
      "href",
      "https://shop.example.com"
    );

    expect(screen.queryByText(/<p>/)).not.toBeInTheDocument();
    expect(screen.queryByText(/"type"/)).not.toBeInTheDocument();
  });
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignWizard } from "@/components/features/campaigns/CampaignWizard";
import { useTemplates } from "@/hooks/useTemplates";
import { useSegments } from "@/hooks/useSegments";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@/hooks/useTemplates", () => ({ useTemplates: jest.fn() }));
jest.mock("@/hooks/useSegments", () => ({ useSegments: jest.fn() }));
jest.mock("@/lib/api/crm-client", () => ({
  crmClient: { campaigns: { create: jest.fn() } },
}));

describe("CampaignWizard — Banner & Popup channels (#160)", () => {
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplates as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    (useSegments as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    (crmClient.campaigns.create as jest.Mock).mockResolvedValue({ id: "new" });
  });

  it("skips the Audience step when Email is not among the selected channels", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);

    await user.type(screen.getByLabelText(/campaign title/i), "Banner promo");
    await user.click(screen.getByRole("checkbox", { name: "Banner" }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Next goes straight to Content (no Audience step) because Email isn't selected.
    await waitFor(() => expect(screen.getByTestId("wizard-step-title")).toHaveTextContent("Content"));
    expect(screen.getByText("Banner Content")).toBeInTheDocument();
    expect(screen.queryByLabelText(/additional emails/i)).not.toBeInTheDocument();
  });

  it("renders independent per-channel content fields for a Banner + Popup campaign", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);

    await user.type(screen.getByLabelText(/campaign title/i), "Multi promo");
    await user.click(screen.getByRole("checkbox", { name: "Banner" }));
    await user.click(screen.getByRole("checkbox", { name: "Popup" }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => expect(screen.getByText("Banner Content")).toBeInTheDocument());
    expect(screen.getByText("Popup Content")).toBeInTheDocument();
    // Banner-specific and Popup-specific fields are present and distinct.
    expect(screen.getByLabelText("Link URL")).toBeInTheDocument(); // Banner
    expect(screen.getByLabelText("Heading")).toBeInTheDocument(); // Popup
    expect(screen.getByLabelText("CTA Text")).toBeInTheDocument(); // Popup
  });

  it("retains independent content per channel and submits both in the payload", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);

    await user.type(screen.getByLabelText(/campaign title/i), "Multi promo");
    await user.click(screen.getByRole("checkbox", { name: "Banner" }));
    await user.click(screen.getByRole("checkbox", { name: "Popup" }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => expect(screen.getByText("Banner Content")).toBeInTheDocument());
    // Fill Banner message + Popup heading — each must stay independent.
    const bannerMessage = screen.getAllByLabelText("Message")[0];
    await user.type(bannerMessage, "Free shipping today");
    await user.type(screen.getByLabelText("Heading"), "Welcome!");

    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => expect(crmClient.campaigns.create).toHaveBeenCalled());
    const payload = (crmClient.campaigns.create as jest.Mock).mock.calls[0][0];
    expect(payload.channels.sort()).toEqual(["Banner", "Popup"]);
    const banner = payload.channelContents.find((c: { channel: string }) => c.channel === "Banner");
    const popup = payload.channelContents.find((c: { channel: string }) => c.channel === "Popup");
    expect(banner.body).toBe("Free shipping today");
    expect(popup.heading).toBe("Welcome!");
    // Banner content did not leak into Popup.
    expect(popup.body ?? "").not.toBe("Free shipping today");
  });
});

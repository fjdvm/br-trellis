import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignWizard } from "@/features/campaigns";
import { useTemplates } from "@/features/campaigns";
import { useSegments } from "@/features/segments/hooks/useSegments";
import { campaignsApi } from "@/features/campaigns";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock("@/features/campaigns", () => ({ useTemplates: jest.fn() }));
jest.mock("@/features/segments/hooks/useSegments", () => ({ useSegments: jest.fn() }));
jest.mock("@/features/campaigns", () => ({
  campaignsApi: { create: jest.fn() }
}));

describe("CampaignWizard — Banner & Popup channels (#160)", () => {
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplates as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });
    (useSegments as jest.Mock).mockReturnValue({ data: [], isLoading: false, error: null });
    (campaignsApi.create as jest.Mock).mockResolvedValue({ id: "new" });
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

    await waitFor(() => expect(screen.getAllByText("Banner Content").length).toBeGreaterThan(0));
    expect(screen.getAllByText("Popup Content").length).toBeGreaterThan(0);
    // Banner-specific and Popup-specific fields are present and distinct.
    expect(screen.getByLabelText("Link URL")).toBeInTheDocument(); // Banner
    await user.click(screen.getByRole("tab", { name: "Popup Content" }));
    expect(screen.getByLabelText(/heading/i)).toBeInTheDocument(); // Popup
    expect(screen.getByLabelText("CTA Text")).toBeInTheDocument(); // Popup
  });

  it("retains independent content per channel and submits both in the payload", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);

    await user.type(screen.getByLabelText(/campaign title/i), "Multi promo");
    await user.click(screen.getByRole("checkbox", { name: "Banner" }));
    await user.click(screen.getByRole("checkbox", { name: "Popup" }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => expect(screen.getByRole("tab", { name: "Banner Content" })).toBeInTheDocument());
    // Fill Banner message + Popup heading — each must stay independent.
    const bannerMessage = screen.getAllByLabelText("Message")[0];
    await user.type(bannerMessage, "Free shipping today");
    await user.click(screen.getByRole("tab", { name: "Popup Content" }));
    await user.type(screen.getByLabelText(/heading/i), "Welcome!");

    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByTestId("wizard-step-title")).toHaveTextContent("Schedule"));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => expect(campaignsApi.create).toHaveBeenCalled());
    const payload = (campaignsApi.create as jest.Mock).mock.calls[0][0];
    expect(payload.channels.sort()).toEqual(["Banner", "Popup"]);
    const banner = payload.channelContents.find((c: { channel: string }) => c.channel === "Banner");
    const popup = payload.channelContents.find((c: { channel: string }) => c.channel === "Popup");
    expect(banner.body).toBe("Free shipping today");
    expect(popup.heading).toBe("Welcome!");
    // Banner content did not leak into Popup.
    expect(popup.body ?? "").not.toBe("Free shipping today");
  });
});

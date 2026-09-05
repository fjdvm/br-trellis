import { renderHook } from "@testing-library/react";
import { useCampaignWizardState } from "@/features/campaigns/hooks/use-campaign-wizard-state";
import type { Campaign } from "@/features/campaigns/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("useCampaignWizardState reload hydration", () => {
  it("restores a carousel block's slides, in order, from a saved campaign's body JSON", () => {
    const slides = [
      { imageUrl: "https://cdn.example.com/a.jpg", caption: "First", linkUrl: "https://a.example.com" },
      { imageUrl: "https://cdn.example.com/b.jpg", caption: "Second", linkUrl: "https://b.example.com" },
    ];
    const blockValues = {
      "block-0": slides,
      "block-1": "Some heading text",
    };

    const existing: Campaign = {
      id: "camp-1",
      title: "Reload Test",
      channels: ["Email"],
      status: "Draft",
      createdAt: "2026-01-01T00:00:00Z",
      channelContents: [
        {
          channel: "Email",
          templateId: "tpl-block-1",
          body: JSON.stringify(blockValues),
        },
      ],
    };

    const { result } = renderHook(() => useCampaignWizardState(existing));

    const emailContent = result.current.contents["Email"];
    expect(emailContent.templateId).toBe("tpl-block-1");
    expect(emailContent.blockValues?.["block-0"]).toEqual(slides);
    expect(emailContent.blockValues?.["block-1"]).toBe("Some heading text");
  });

  it("leaves a plain string body untouched for non-block-template content", () => {
    const existing: Campaign = {
      id: "camp-2",
      title: "Plain Body Test",
      channels: ["Banner"],
      status: "Draft",
      createdAt: "2026-01-01T00:00:00Z",
      channelContents: [
        {
          channel: "Banner",
          body: "Free shipping this week only",
        },
      ],
    };

    const { result } = renderHook(() => useCampaignWizardState(existing));

    const bannerContent = result.current.contents["Banner"];
    expect(bannerContent.body).toBe("Free shipping this week only");
    expect(bannerContent.blockValues).toBeUndefined();
  });
});

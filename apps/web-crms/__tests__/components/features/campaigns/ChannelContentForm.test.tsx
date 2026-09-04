import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChannelContentForm } from "@/components/features/campaigns/ChannelContentForm";
import { useTemplates } from "@/hooks/useTemplates";

jest.mock("@/hooks/useTemplates", () => ({
  useTemplates: jest.fn(),
}));

describe("ChannelContentForm with BlockTemplate", () => {
  const blockTemplate = {
    id: "bt-1",
    name: "Promo Block Layout",
    channel: "Email" as const,
    format: "Blocks" as const,
    content: JSON.stringify([
      { id: "b1", type: "text", label: "Main Body Text", order: 1 },
      { id: "b2", type: "button", label: "Primary Action Button", order: 2 },
      { id: "b3", type: "image", label: "Image Block", order: 3 },
      { id: "b4", type: "link", label: "Link Block", order: 4 },
      { id: "b5", type: "carousel", label: "Product Showcase", order: 5 },
    ]),
    createdAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplates as jest.Mock).mockReturnValue({
      data: [blockTemplate],
      isLoading: false,
      error: null,
    });
  });

  it("renders distinct input controls per block instead of raw JSON string when a BlockTemplate is selected", () => {
    const handleChange = jest.fn();
    const state = {
      templateId: "bt-1",
      blockValues: {
        b1: "Hello world",
        b2: { text: "Click Here", url: "https://example.com" },
        b3: { url: "https://example.com/img.png", alt: "Banner" },
      },
    };

    render(<ChannelContentForm channel="Email" value={state} onChange={handleChange} />);

    // Must show block labels as form headers/labels, NOT raw JSON string
    expect(screen.getByLabelText("Main Body Text")).toBeInTheDocument();
    expect(screen.getByText("Primary Action Button")).toBeInTheDocument();
    expect(screen.getByLabelText("Button Text")).toBeInTheDocument();
    expect(screen.getByLabelText("Button Link URL")).toBeInTheDocument();
    expect(screen.getByText("Image Block")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Image URL").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Alt Text")).toBeInTheDocument();
    expect(screen.getByText("Product Showcase")).toBeInTheDocument();
  });
});

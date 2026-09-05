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

    // Blocks are numbered — labels include the position prefix
    expect(screen.getByLabelText("1. Main Body Text")).toBeInTheDocument();
    // Button, image, link, carousel are inside BlockGroup wrappers
    expect(screen.getByText(/Primary Action Button/)).toBeInTheDocument();
    expect(screen.getByLabelText("Button Text")).toBeInTheDocument();
    expect(screen.getByLabelText("Button Link URL")).toBeInTheDocument();
    expect(screen.getByText(/Image Block/)).toBeInTheDocument();
    expect(screen.getAllByLabelText("Image URL").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Alt Text")).toBeInTheDocument();
    expect(screen.getAllByText(/Product Showcase/).length).toBeGreaterThan(0);
  });

  it("shows field count summary equal to the number of blocks in the template", () => {
    render(
      <ChannelContentForm
        channel="Email"
        value={{ templateId: "bt-1", blockValues: {} }}
        onChange={jest.fn()}
      />
    );
    // 5 blocks → "5 fields from template"
    expect(screen.getByText(/5 fields/i)).toBeInTheDocument();
  });

  it("labels all fields as optional", () => {
    render(
      <ChannelContentForm
        channel="Email"
        value={{ templateId: "bt-1", blockValues: {} }}
        onChange={jest.fn()}
      />
    );
    // Each field renders an "optional" hint
    const optionalHints = screen.getAllByText(/optional/i);
    expect(optionalHints.length).toBeGreaterThan(0);
  });

  it("renders one separate input for each block even when multiple blocks share the same type", () => {
    const multiHeadingTemplate = {
      id: "bt-multi",
      name: "Multi-Heading Layout",
      channel: "Email" as const,
      format: "Blocks" as const,
      content: JSON.stringify([
        { id: "h1", type: "heading", label: "Hero Title", order: 1 },
        { id: "h2", type: "heading", label: "Section Title", order: 2 },
        { id: "h3", type: "heading", label: "Sub Title", order: 3 },
        { id: "t1", type: "text", label: "Intro Text", order: 4 },
      ]),
      createdAt: "2026-01-01T00:00:00Z",
    };

    (useTemplates as jest.Mock).mockReturnValue({
      data: [multiHeadingTemplate],
      isLoading: false,
      error: null,
    });

    render(
      <ChannelContentForm
        channel="Email"
        value={{ templateId: "bt-multi", blockValues: {} }}
        onChange={jest.fn()}
      />
    );

    // 4 blocks total → "4 fields"
    expect(screen.getByText(/4 fields/i)).toBeInTheDocument();

    // Each heading gets its own numbered label
    expect(screen.getByLabelText("1. Hero Title")).toBeInTheDocument();
    expect(screen.getByLabelText("2. Section Title")).toBeInTheDocument();
    expect(screen.getByLabelText("3. Sub Title")).toBeInTheDocument();
    expect(screen.getByLabelText("4. Intro Text")).toBeInTheDocument();
  });

  it("renders carousel with Add Slide button and respects 3-slide limit", () => {
    const carouselTemplate = {
      id: "bt-carousel",
      name: "Carousel Layout",
      channel: "Email" as const,
      format: "Blocks" as const,
      content: JSON.stringify([
        { id: "c1", type: "carousel", label: "Product Gallery", order: 1 },
      ]),
      createdAt: "2026-01-01T00:00:00Z",
    };

    (useTemplates as jest.Mock).mockReturnValue({
      data: [carouselTemplate],
      isLoading: false,
      error: null,
    });

    render(
      <ChannelContentForm
        channel="Email"
        value={{
          templateId: "bt-carousel",
          blockValues: { c1: [{ imageUrl: "", caption: "", linkUrl: "" }] },
        }}
        onChange={jest.fn()}
      />
    );

    expect(screen.getAllByText(/Product Gallery/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /add slide/i })).toBeInTheDocument();
    expect(screen.getByText(/1 of 3 slides/i)).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {  TemplatesGallery  } from "@/features/campaigns/components/templates-gallery";
import { useTemplates } from "@/features/campaigns/hooks/useTemplates";
import type { Template } from "@/features/campaigns/types";

jest.mock("@/features/campaigns/hooks/useTemplates", () => ({ useTemplates: jest.fn() }));

const templates: Template[] = [
  {
    id: "e1",
    name: "Simple Announcement",
    description: "A clean single-column email.",
    channel: "Email",
    content: "<h1>{{subject}}</h1><p>{{body}}</p>",
    format: "Html",
    thumbnailUrl: "/t/e1.png",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "b1",
    name: "Top Strip Banner",
    description: "A slim full-width strip.",
    channel: "Banner",
    content: "<div>{{message}}</div>",
    format: "Html",
    thumbnailUrl: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "p1",
    name: "Centered Modal Popup",
    description: "A centered dismissible modal.",
    channel: "Popup",
    content: "<div>{{heading}}</div>",
    format: "Html",
    thumbnailUrl: null,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

describe("TemplatesGallery", () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplates as jest.Mock).mockReturnValue({
      data: templates,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
  });

  it("renders a per-channel tab set for Email, Banner and Popup", () => {
    render(<TemplatesGallery />);
    expect(screen.getByRole("tab", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /banner/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /popup/i })).toBeInTheDocument();
  });

  it("shows the Email templates and a preview of their content by default", () => {
    render(<TemplatesGallery />);
    expect(screen.getByText("Simple Announcement")).toBeInTheDocument();
    // The preview renders the template's content (as text or markup).
    expect(screen.getByTestId("template-preview-e1")).toBeInTheDocument();
    // Banner/Popup templates are not shown on the default (Email) tab.
    expect(screen.queryByText("Top Strip Banner")).not.toBeInTheDocument();
  });

  it("switches to the Banner tab and shows only Banner templates", async () => {
    const user = userEvent.setup();
    render(<TemplatesGallery />);
    await user.click(screen.getByRole("tab", { name: /banner/i }));
    await waitFor(() => expect(screen.getByText("Top Strip Banner")).toBeInTheDocument());
    expect(screen.queryByText("Simple Announcement")).not.toBeInTheDocument();
  });

  it("shows a loading skeleton while templates load", () => {
    (useTemplates as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    render(<TemplatesGallery />);
    expect(screen.getByTestId("templates-gallery-loading")).toBeInTheDocument();
  });
});

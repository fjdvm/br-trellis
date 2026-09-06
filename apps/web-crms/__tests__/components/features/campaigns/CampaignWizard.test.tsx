import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CampaignWizard } from "@/features/campaigns/components/campaign-wizard";
import { useSearchParams } from "next/navigation";
import { useTemplates } from "@/features/campaigns/hooks/useTemplates";
import { useSegments } from "@/features/contacts/hooks/useSegments";
import { campaignsApi } from "@/features/campaigns/services/campaigns-api";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));
jest.mock("@/features/campaigns/hooks/useTemplates", () => ({ useTemplates: jest.fn() }));
jest.mock("@/features/contacts/hooks/useSegments", () => ({ useSegments: jest.fn() }));
jest.mock("@/features/campaigns/services/campaigns-api", () => ({
  campaignsApi: { create: jest.fn(), renderPreview: jest.fn().mockResolvedValue({ html: "" }) },
  blockTemplatesApi: { getById: jest.fn().mockResolvedValue({ theme: "VioletToLight" }) },
}));

const emailTemplate = {
  id: "tpl-email-1",
  name: "Simple Announcement",
  channel: "Email",
  content: "<h1>{{subject}}</h1>",
  format: "Html",
  createdAt: "2026-01-01T00:00:00Z",
};
const segment = {
  id: "seg-1",
  name: "VIP Customers",
  type: "Static",
  isSystemDefined: false,
  rule: null,
  memberCount: 12,
};

describe("CampaignWizard (Email only, #159)", () => {
  // These RTL flows drive several async re-renders (templates + segments per
  // step); allow extra headroom under parallel-suite CPU contention.
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (useTemplates as jest.Mock).mockReturnValue({
      data: [emailTemplate],
      predefinedTemplates: [emailTemplate],
      blockTemplates: [],
      isLoading: false,
      error: null,
    });
    (useSegments as jest.Mock).mockReturnValue({ data: [segment], isLoading: false, error: null });
    (campaignsApi.create as jest.Mock).mockResolvedValue({ id: "new-campaign" });
  });

  it("starts on the Platform step and lets the user select Email", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);
    expect(screen.getByTestId("wizard-step-title")).toBeInTheDocument();
    const email = screen.getByRole("checkbox", { name: "Email" });
    await user.click(email);
    expect(email).toHaveAttribute("aria-checked", "true");
  });

  it("walks Platform -> Audience -> Content and retains selections across steps", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);

    // Platform: title + select Email
    await user.type(screen.getByLabelText(/campaign title/i), "Spring Blast");
    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Audience step — select the "All" preset segment so canProceedAudience is satisfied
    await waitFor(() => expect(screen.getByTestId("wizard-step-title")).toHaveTextContent("Audience"));
    await user.type(screen.getByLabelText(/additional emails/i), "partner@x.io");
    // Confirm the email with Enter so it is committed to parent state
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Content step
    await waitFor(() => expect(screen.getByLabelText("Subject")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Subject"), "Big news");

    // Going back to Audience retains the entered email
    await user.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() =>
      expect(screen.queryByText("partner@x.io")).toBeInTheDocument()
    );
  });

  it("submits a Draft campaign with the email channel content on Save Draft", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);

    await user.type(screen.getByLabelText(/campaign title/i), "Spring Blast");
    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Audience step — add an email address and confirm it so canProceedAudience is true
    await waitFor(() => expect(screen.getByTestId("wizard-step-title")).toHaveTextContent("Audience"));
    await user.type(screen.getByLabelText(/additional emails/i), "test@example.com");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => expect(screen.getByLabelText("Subject")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Subject"), "Big news");
    await user.type(screen.getByLabelText("Body"), "Come shop");
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Schedule step -> Next
    await waitFor(() => expect(screen.getByTestId("wizard-step-title")).toHaveTextContent("Schedule"));
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Review step -> Save Draft
    await waitFor(() => expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => expect(campaignsApi.create).toHaveBeenCalled());
    const payload = (campaignsApi.create as jest.Mock).mock.calls[0][0];
    expect(payload.title).toBe("Spring Blast");
    expect(payload.channels).toEqual(["Email"]);
    const emailContent = payload.channelContents.find((c: { channel: string }) => c.channel === "Email");
    expect(emailContent.subject).toBe("Big news");
    expect(emailContent.body).toBe("Come shop");
  });

  it("pre-selects the channel and template carried in ?templateId=&channel= from the Use Template hand-off", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ templateId: "tpl-email-1", channel: "Email" })
    );
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);

    const email = screen.getByRole("checkbox", { name: "Email" });
    expect(email).toHaveAttribute("aria-checked", "true");

    await user.type(screen.getByLabelText(/campaign title/i), "From Template");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByTestId("wizard-step-title")).toHaveTextContent("Audience"));
    await user.type(screen.getByLabelText(/additional emails/i), "vip@x.io");
    await user.keyboard("{Enter}");
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => expect(screen.getByLabelText("Subject")).toHaveValue("Simple Announcement"));
  });
});

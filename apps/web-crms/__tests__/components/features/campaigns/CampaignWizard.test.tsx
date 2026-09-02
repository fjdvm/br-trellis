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
    (useTemplates as jest.Mock).mockReturnValue({ data: [emailTemplate], isLoading: false, error: null });
    (useSegments as jest.Mock).mockReturnValue({ data: [segment], isLoading: false, error: null });
    (crmClient.campaigns.create as jest.Mock).mockResolvedValue({ id: "new-campaign" });
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

    // Audience step appears because Email is selected
    await waitFor(() => expect(screen.getByTestId("wizard-step-title")).toHaveTextContent("Audience"));
    await user.type(screen.getByLabelText(/additional emails/i), "partner@x.io");
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Content step
    await waitFor(() => expect(screen.getByLabelText("Subject")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Subject"), "Big news");

    // Going back to Audience retains the entered email
    await user.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() =>
      expect((screen.getByLabelText(/additional emails/i) as HTMLInputElement).value).toContain(
        "partner@x.io"
      )
    );
  });

  it("submits a Draft campaign with the email channel content on Save Draft", async () => {
    const user = userEvent.setup({ delay: null });
    render(<CampaignWizard />);

    await user.type(screen.getByLabelText(/campaign title/i), "Spring Blast");
    await user.click(screen.getByRole("checkbox", { name: "Email" }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => expect(screen.getByTestId("wizard-step-title")).toHaveTextContent("Audience"));
    await user.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => expect(screen.getByLabelText("Subject")).toBeInTheDocument());
    await user.type(screen.getByLabelText("Subject"), "Big news");
    await user.type(screen.getByLabelText("Body"), "Come shop");
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Review step -> Save Draft
    await waitFor(() => expect(screen.getByRole("button", { name: /save draft/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /save draft/i }));

    await waitFor(() => expect(crmClient.campaigns.create).toHaveBeenCalled());
    const payload = (crmClient.campaigns.create as jest.Mock).mock.calls[0][0];
    expect(payload.title).toBe("Spring Blast");
    expect(payload.channels).toEqual(["Email"]);
    const emailContent = payload.channelContents.find((c: { channel: string }) => c.channel === "Email");
    expect(emailContent.subject).toBe("Big news");
    expect(emailContent.body).toBe("Come shop");
  });
});

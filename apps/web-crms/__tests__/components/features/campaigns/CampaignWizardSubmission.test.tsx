import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CampaignWizard } from "@/components/features/campaigns/CampaignWizard";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/hooks/useCampaign", () => ({ useCampaign: () => ({ data: null }) }));
jest.mock("@/hooks/useTemplates", () => ({ useTemplates: () => ({ data: [] }) }));
jest.mock("@/lib/api/crm-client", () => ({ crmClient: { campaigns: { create: jest.fn(), update: jest.fn() } } }));

describe("CampaignWizard submission", () => {
  it("submits independent channel content and the complete recurring schedule", async () => {
    (crmClient.campaigns.create as jest.Mock).mockResolvedValue({ id: "campaign-1" });
    render(<CampaignWizard />);

    fireEvent.change(screen.getByLabelText("Campaign name"), { target: { value: "Autumn launch" } });
    fireEvent.click(screen.getByRole("button", { name: "Platform" }));
    fireEvent.click(screen.getByRole("button", { name: "In-App" }));
    fireEvent.click(screen.getByRole("button", { name: "Content" }));
    fireEvent.change(screen.getByLabelText("Email subject"), { target: { value: "Inbox offer" } });
    fireEvent.change(screen.getByLabelText("In-App subject"), { target: { value: "App offer" } });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Schedule for Later" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Recurring" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Recurring" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Tue" }));
    fireEvent.click(screen.getByRole("button", { name: "Launch Campaign" }));

    await waitFor(() => expect(crmClient.campaigns.create).toHaveBeenCalledWith(expect.objectContaining({
      scheduleType: "Recurring",
      recurrenceDays: ["Tuesday"],
      channelContents: expect.objectContaining({
        Email: expect.objectContaining({ subject: "Inbox offer" }),
        InApp: expect.objectContaining({ subject: "App offer" }),
      }),
    })));
  }, 15_000);
});

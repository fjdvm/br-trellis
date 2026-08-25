import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CampaignWizard } from "@/components/features/campaigns/CampaignWizard";
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

describe("CampaignWizard", () => {
  it("shows all steps and preserves setup values while moving between setup and platform", () => {
    render(<CampaignWizard />);

    expect(screen.getByRole("heading", { name: "Setup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A/B Test — Coming soon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Automated — Coming soon" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Audience" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Content" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Review" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Campaign name"), { target: { value: "Autumn launch" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to Platform" }));

    expect(screen.getByRole("heading", { name: "Platform" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "In-App" }));
    expect(screen.getByRole("button", { name: "Email" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "In-App" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Back to Setup" }));
    expect(screen.getByLabelText("Campaign name")).toHaveValue("Autumn launch");
    expect(screen.getByRole("button", { name: "Regular" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the review placeholder reachable from the progress indicator", () => {
    render(<CampaignWizard />);

    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByText("Confirm the campaign before it is launched.")).toBeInTheDocument();
  });
});

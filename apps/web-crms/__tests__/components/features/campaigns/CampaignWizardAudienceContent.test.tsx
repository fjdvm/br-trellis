import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { CampaignWizard } from "@/components/features/campaigns/CampaignWizard";
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("@/hooks/useCustomers", () => ({
  useCustomers: () => ({
    customers: [
      { id: "contact-1", displayName: "Alice Smith", email: "alice@example.com" },
      { id: "contact-2", displayName: "Bob Jones", email: "bob@example.com" },
    ],
    isLoading: false,
  }),
}));

jest.mock("@/hooks/useTemplates", () => ({
  useTemplates: () => ({ data: [{ id: "template-1", name: "Launch", channel: "Email" }] }),
}));

describe("CampaignWizard audience and content", () => {
  it("retains specific audience selection and email content while navigating steps", () => {
    render(<CampaignWizard />);

    fireEvent.click(screen.getByRole("button", { name: "Audience" }));
    fireEvent.change(screen.getByLabelText("Target Audience"), { target: { value: "Specific" } });
    fireEvent.click(screen.getByRole("checkbox", { name: /Alice Smith/ }));
    fireEvent.change(screen.getByPlaceholderText(/enter emails separated/i), { target: { value: "partner@example.com" } });

    fireEvent.click(screen.getByRole("button", { name: "Content" }));
    fireEvent.change(screen.getByLabelText("Email subject"), { target: { value: "Your autumn offer" } });
    fireEvent.change(screen.getByLabelText("Email description"), { target: { value: "Campaign details" } });
    expect(screen.queryByLabelText("In-App subject")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Audience" }));
    expect(screen.getByRole("checkbox", { name: /Alice Smith/ })).toBeChecked();
    expect(screen.getByPlaceholderText(/enter emails separated/i)).toHaveValue("partner@example.com");

    fireEvent.click(screen.getByRole("button", { name: "Content" }));
    expect(screen.getByLabelText("Email subject")).toHaveValue("Your autumn offer");
    expect(screen.getByLabelText("Email description")).toHaveValue("Campaign details");
  });

  it("shows independent content fields for email and in-app when both platforms are selected", () => {
    render(<CampaignWizard />);

    fireEvent.click(screen.getByRole("button", { name: "Platform" }));
    fireEvent.click(screen.getByRole("button", { name: "In-App" }));
    fireEvent.click(screen.getByRole("button", { name: "Content" }));

    fireEvent.change(screen.getByLabelText("Email subject"), { target: { value: "Email offer" } });
    fireEvent.change(screen.getByLabelText("In-App subject"), { target: { value: "In-app offer" } });

    expect(screen.getByLabelText("Email subject")).toHaveValue("Email offer");
    expect(screen.getByLabelText("In-App subject")).toHaveValue("In-app offer");
    expect(screen.getAllByLabelText(/template/i)).toHaveLength(2);
    expect(screen.getAllByLabelText(/banner image/i)).toHaveLength(2);
  });
});

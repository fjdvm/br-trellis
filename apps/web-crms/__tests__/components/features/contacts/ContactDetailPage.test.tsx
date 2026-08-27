import { render, screen } from "@testing-library/react";
import { ContactDetailPage } from "@/components/features/contacts/ContactDetailPage";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    contacts: {
      getById: jest.fn(),
    },
    companies: {
      list: jest.fn().mockResolvedValue([]),
    },
  },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("ContactDetailPage", () => {
  it("renders core fields, company, and timeline entries", async () => {
    jest.mocked(crmClient.contacts.getById).mockResolvedValue({
      id: "contact-1",
      name: "Maya Chen",
      email: "maya@example.com",
      phone: "5550100",
      sentimentScore: 0.75,
      company: { id: "company-1", name: "Acme Corp" },
      sourceReferences: [
        { sourceSystem: "pos", sourceId: "pos-100" },
      ],
      customFields: [
        {
          definitionId: "def-1",
          name: "Tier",
          fieldType: "Text",
          textValue: "Gold",
          numberValue: null,
          dateValue: null,
          boolValue: null,
          selectedOption: null,
        },
      ],
      timelineEntries: [
        {
          id: "entry-1",
          sourceModule: "Ecommerce",
          entryType: "Order",
          summary: "Placed order #123",
          occurredAt: "2026-01-15T10:00:00Z",
        },
      ],
    });

    render(<ContactDetailPage contactId="contact-1" />);

    // Name appears in heading
    expect(await screen.findByRole("heading", { name: "Maya Chen" })).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Gold")).toBeInTheDocument();
    expect(screen.getByText("Placed order #123")).toBeInTheDocument();
    expect(screen.getByText("pos · pos-100")).toBeInTheDocument();
  });

  it("renders empty state when no timeline entries exist", async () => {
    jest.mocked(crmClient.contacts.getById).mockResolvedValue({
      id: "contact-2",
      name: "Bob Smith",
      email: "bob@example.com",
      phone: null,
      sentimentScore: null,
      company: null,
      sourceReferences: [],
      customFields: [],
      timelineEntries: [],
    });

    render(<ContactDetailPage contactId="contact-2" />);

    expect(await screen.findByRole("heading", { name: "Bob Smith" })).toBeInTheDocument();
    expect(
      screen.getByText("No activity recorded yet. Events from connected modules will appear here.")
    ).toBeInTheDocument();
  });

  it("renders company absence gracefully", async () => {
    jest.mocked(crmClient.contacts.getById).mockResolvedValue({
      id: "contact-3",
      name: "NoCompany Contact",
      email: null,
      phone: null,
      sentimentScore: null,
      company: null,
      sourceReferences: [],
      customFields: [],
      timelineEntries: [],
    });

    render(<ContactDetailPage contactId="contact-3" />);

    expect(await screen.findByRole("heading", { name: "Nocompany Contact" })).toBeInTheDocument();
    // Company section should not be present
    expect(screen.queryByText("Company:")).not.toBeInTheDocument();
  });
});

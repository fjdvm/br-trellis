import { render, screen } from "@testing-library/react";
import { CompanyDetailPage } from "@/features/contacts/components/company-detail-page";
import { contactsApi } from "@/features/contacts/services/contacts-api";
import { companiesApi } from "@/features/contacts/services/companies-api";

jest.mock("@/features/contacts/services/companies-api", () => ({
  companiesApi: {
      getById: jest.fn(),
    }
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("CompanyDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders company detail with name, buyer type, and member contacts", async () => {
    jest.mocked(companiesApi.getById).mockResolvedValue({
      id: "co-1",
      name: "Acme Corp",
      buyerType: "Institutional",
      primaryContactId: null,
      primaryContact: null,
      createdAt: "2025-01-15T00:00:00Z",
      deletedAt: null,
      contacts: [
        {
          id: "ct-1",
          name: "Alice",
          email: "alice@acme.com",
          phone: "+1 555-0101",
          lifetimeValue: 1500,
        },
        {
          id: "ct-2",
          name: "Bob",
          email: "bob@acme.com",
          phone: null,
          lifetimeValue: 800,
        },
      ],
    });

    render(<CompanyDetailPage companyId="co-1" />);

    expect(await screen.findByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Institutional")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("alice@acme.com")).toBeInTheDocument();
    expect(screen.getByText("Contacts (2)")).toBeInTheDocument();
  });

  it("renders primary contact when present", async () => {
    jest.mocked(companiesApi.getById).mockResolvedValue({
      id: "co-1",
      name: "Test Co",
      buyerType: "Individual",
      primaryContactId: "ct-1",
      primaryContact: {
        id: "ct-1",
        name: "Primary Person",
        email: "primary@test.co",
        phone: null,
        lifetimeValue: 500,
      },
      createdAt: "2025-01-15T00:00:00Z",
      deletedAt: null,
      contacts: [],
    });

    render(<CompanyDetailPage companyId="co-1" />);

    expect(await screen.findByText("Primary Contact")).toBeInTheDocument();
    expect(screen.getByText("Primary Person")).toBeInTheDocument();
    expect(screen.getByText("primary@test.co")).toBeInTheDocument();
  });

  it("shows archived indicator for archived company", async () => {
    jest.mocked(companiesApi.getById).mockResolvedValue({
      id: "co-1",
      name: "Archived Co",
      buyerType: "Institutional",
      primaryContactId: null,
      primaryContact: null,
      createdAt: "2025-01-15T00:00:00Z",
      deletedAt: "2025-06-01T00:00:00Z",
      contacts: [],
    });

    render(<CompanyDetailPage companyId="co-1" />);

    expect(await screen.findByText("Archived")).toBeInTheDocument();
    // Edit and Archive buttons should not be present
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Archive")).not.toBeInTheDocument();
  });
});

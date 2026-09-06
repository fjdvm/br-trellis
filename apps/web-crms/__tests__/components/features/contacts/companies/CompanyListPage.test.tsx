import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CompanyListPage } from "@/features/contacts/companies/components/company-list-page";
import { contactsApi } from "@/features/contacts/contacts/services/contacts-api";
import { companiesApi } from "@/features/contacts/companies/services/companies-api";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/features/contacts/companies/services/companies-api", () => ({
  companiesApi: {
      list: jest.fn(),
      create: jest.fn(),
    }
}));

// Radix Select/Sheet rely on pointer-capture APIs jsdom lacks.
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

describe("CompanyListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders companies with name, buyer type, member count, and created date", async () => {
    jest.mocked(companiesApi.list).mockResolvedValue([
      {
        id: "co-1",
        name: "Acme Corp",
        buyerType: "Institutional",
        memberCount: 3,
        createdAt: "2025-01-15T00:00:00Z",
      },
      {
        id: "co-2",
        name: "Solo Buyer",
        buyerType: "Individual",
        memberCount: 1,
        createdAt: "2025-02-01T00:00:00Z",
      },
    ]);

    render(<CompanyListPage />);

    expect(await screen.findByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Solo Buyer")).toBeInTheDocument();
    expect(screen.getByText("Institutional")).toBeInTheDocument();
    expect(screen.getByText("Individual")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("hides archived companies by default", async () => {
    jest.mocked(companiesApi.list).mockResolvedValue([
      {
        id: "co-1",
        name: "Active Co",
        buyerType: "Institutional",
        memberCount: 2,
        createdAt: "2025-01-15T00:00:00Z",
      },
    ]);

    render(<CompanyListPage />);

    await screen.findByText("Active Co");
    expect(companiesApi.list).toHaveBeenCalledWith(false);
  });

  it("toggles archived companies when Show Archived button is clicked", async () => {
    jest.mocked(companiesApi.list).mockResolvedValue([]);

    render(<CompanyListPage />);

    await waitFor(() => {
      expect(companiesApi.list).toHaveBeenCalledWith(false);
    });

    const toggleButton = screen.getByText("Show Archived");
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(companiesApi.list).toHaveBeenCalledWith(true);
    });
  });

  it("shows empty state when no companies", async () => {
    jest.mocked(companiesApi.list).mockResolvedValue([]);

    render(<CompanyListPage />);

    expect(await screen.findByText("No companies found.")).toBeInTheDocument();
  });

  it("creates a company via the Add Company sheet and refetches the list", async () => {
    jest.mocked(companiesApi.list).mockResolvedValue([]);
    jest.mocked(companiesApi.create).mockResolvedValue({
      id: "co-new",
      name: "New Co",
      buyerType: "Institutional",
      primaryContactId: null,
      primaryContact: null,
      createdAt: "2025-03-01T00:00:00Z",
      deletedAt: null,
      contacts: [],
    });

    render(<CompanyListPage />);
    await waitFor(() =>
      expect(companiesApi.list).toHaveBeenCalledTimes(1)
    );

    // Open the sheet.
    fireEvent.click(screen.getByRole("button", { name: /Add Company/i }));

    // Fill the required name and submit.
    fireEvent.change(await screen.findByLabelText(/Name/i), {
      target: { value: "New Co" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Company/i }));

    await waitFor(() =>
      expect(companiesApi.create).toHaveBeenCalledWith({
        name: "New Co",
        buyerType: "Institutional",
      })
    );
    // List refetched after creation (initial + post-create).
    await waitFor(() =>
      expect(companiesApi.list).toHaveBeenCalledTimes(2)
    );
  });

  it("does not submit the Add Company sheet without a name", async () => {
    jest.mocked(companiesApi.list).mockResolvedValue([]);

    render(<CompanyListPage />);
    await waitFor(() =>
      expect(companiesApi.list).toHaveBeenCalledTimes(1)
    );

    fireEvent.click(screen.getByRole("button", { name: /Add Company/i }));
    fireEvent.click(await screen.findByRole("button", { name: /Create Company/i }));

    expect(await screen.findByText("Company name is required.")).toBeInTheDocument();
    expect(companiesApi.create).not.toHaveBeenCalled();
  });
});

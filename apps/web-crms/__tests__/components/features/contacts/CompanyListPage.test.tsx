import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CompanyListPage } from "@/components/features/contacts/CompanyListPage";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    companies: {
      list: jest.fn(),
    },
  },
}));

describe("CompanyListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders companies with name, buyer type, member count, and created date", async () => {
    jest.mocked(crmClient.companies.list).mockResolvedValue([
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
    jest.mocked(crmClient.companies.list).mockResolvedValue([
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
    expect(crmClient.companies.list).toHaveBeenCalledWith(false);
  });

  it("toggles archived companies when Show Archived button is clicked", async () => {
    jest.mocked(crmClient.companies.list).mockResolvedValue([]);

    render(<CompanyListPage />);

    await waitFor(() => {
      expect(crmClient.companies.list).toHaveBeenCalledWith(false);
    });

    const toggleButton = screen.getByText("Show Archived");
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(crmClient.companies.list).toHaveBeenCalledWith(true);
    });
  });

  it("shows empty state when no companies", async () => {
    jest.mocked(crmClient.companies.list).mockResolvedValue([]);

    render(<CompanyListPage />);

    expect(await screen.findByText("No companies found.")).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { ContactListTable } from "@/components/features/contacts/ContactListTable";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    contacts: {
      list: jest.fn(),
    },
  },
}));

describe("ContactListTable", () => {
  it("displays each contact's linked source references", async () => {
    jest.mocked(crmClient.contacts.list).mockResolvedValue([
      {
        id: "contact-1",
        name: "Maya Chen",
        email: "maya@example.com",
        phone: "5550100",
        companyName: "Acme Corp",
        sourceReferences: [
          { sourceSystem: "pos", sourceId: "pos-100" },
          { sourceSystem: "ecommerce", sourceId: "shop-200" },
        ],
      },
    ]);

    render(<ContactListTable />);

    expect(await screen.findByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("pos · pos-100")).toBeInTheDocument();
    expect(screen.getByText("ecommerce · shop-200")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });
});

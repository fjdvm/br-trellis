import { render, screen } from "@testing-library/react";
import { ContactListTable } from "@/features/contacts/components/contact-list-table";
import type { ContactListItem } from "@/features/contacts/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("ContactListTable", () => {
  it("displays each contact's linked source references", () => {
    const contacts: ContactListItem[] = [
      {
        id: "contact-1",
        name: "Maya Chen",
        email: "maya@example.com",
        phone: "5550100",
        companyName: "Acme Corp",
        lifetimeValue: 0,
        sourceReferences: [
          { sourceSystem: "pos", sourceId: "pos-100" },
          { sourceSystem: "ecommerce", sourceId: "shop-200" },
        ],
      },
    ];

    render(<ContactListTable contacts={contacts} />);

    expect(screen.getByText("Maya Chen")).toBeInTheDocument();
    expect(screen.getByText("pos · pos-100")).toBeInTheDocument();
    expect(screen.getByText("ecommerce · shop-200")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });
});

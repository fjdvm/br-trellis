import { render, screen } from "@testing-library/react";
import { ContactListPage } from "@/components/features/contacts/ContactListPage";
import { crmClient } from "@/lib/api/crm-client";
import type { ContactListItem } from "@/types/contact";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    contacts: {
      list: jest.fn(),
    },
  },
}));

function makeContact(overrides: Partial<ContactListItem> = {}): ContactListItem {
  return {
    id: "c-1",
    name: "Unnamed",
    email: null,
    phone: null,
    companyName: null,
    lifetimeValue: 0,
    sourceReferences: [],
    ...overrides,
  };
}

const noLink = makeContact({ id: "c-none", name: "No Link Nadia" });
const posOnly = makeContact({
  id: "c-pos",
  name: "Pos Only Pat",
  sourceReferences: [{ sourceSystem: "pos", sourceId: "pos-1" }],
});
const ecomOnly = makeContact({
  id: "c-ecom",
  name: "Ecom Only Erin",
  sourceReferences: [{ sourceSystem: "ecommerce", sourceId: "shop-1" }],
});
const bothLinks = makeContact({
  id: "c-both",
  name: "Merged Morgan",
  sourceReferences: [
    { sourceSystem: "pos", sourceId: "pos-2" },
    { sourceSystem: "ecommerce", sourceId: "shop-2" },
  ],
});

/** The exact prop set the /contacts/ecommerce page wrapper passes. */
const ecommerceProps = {
  heading: "Ecommerce Contacts",
  description: "Contacts with at least one confirmed ecommerce link.",
  sourceFilter: "ecommerce" as const,
  filterIndicatorLabel: "Source: Ecommerce",
  showAddButton: false,
};

describe("Ecommerce Contacts view (/contacts/ecommerce props)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(crmClient.contacts.list)
      .mockResolvedValue([noLink, posOnly, ecomOnly, bothLinks]);
  });

  it("renders the Ecommerce Contacts heading", async () => {
    render(<ContactListPage {...ecommerceProps} />);
    expect(
      await screen.findByRole("heading", { name: "Ecommerce Contacts" })
    ).toBeInTheDocument();
  });

  it("renders the filter indicator", async () => {
    render(<ContactListPage {...ecommerceProps} />);
    await screen.findByRole("heading", { name: "Ecommerce Contacts" });
    expect(screen.getByTestId("contact-filter-indicator")).toHaveTextContent(
      "Source: Ecommerce"
    );
  });

  it("does not render the Add Contact button", async () => {
    render(<ContactListPage {...ecommerceProps} />);
    await screen.findByRole("heading", { name: "Ecommerce Contacts" });
    expect(
      screen.queryByRole("button", { name: /Add Contact/i })
    ).not.toBeInTheDocument();
  });

  it("shows every contact with at least one confirmed ecommerce link", async () => {
    render(<ContactListPage {...ecommerceProps} />);
    expect(await screen.findByText("Ecom Only Erin")).toBeInTheDocument();
    expect(screen.getByText("Merged Morgan")).toBeInTheDocument();
  });

  it("includes the POS+ecommerce merge-case contact and excludes non-ecommerce contacts", async () => {
    render(<ContactListPage {...ecommerceProps} />);
    expect(await screen.findByText("Merged Morgan")).toBeInTheDocument();
    expect(screen.queryByText("No Link Nadia")).not.toBeInTheDocument();
    expect(screen.queryByText("Pos Only Pat")).not.toBeInTheDocument();
  });
});

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

/** The exact prop set the /contacts/direct page wrapper passes. */
const directProps = {
  heading: "Contacts",
  description: "Contacts with no confirmed ecommerce link.",
  sourceFilter: "non-ecommerce" as const,
  filterIndicatorLabel: "Source: Non-Ecommerce",
  showAddButton: false,
};

describe("Contacts view (/contacts/direct props)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(crmClient.contacts.list)
      .mockResolvedValue([noLink, posOnly, ecomOnly, bothLinks]);
  });

  it("renders the Contacts heading", async () => {
    render(<ContactListPage {...directProps} />);
    expect(
      await screen.findByRole("heading", { name: "Contacts" })
    ).toBeInTheDocument();
  });

  it("renders the filter indicator", async () => {
    render(<ContactListPage {...directProps} />);
    await screen.findByRole("heading", { name: "Contacts" });
    expect(screen.getByTestId("contact-filter-indicator")).toHaveTextContent(
      "Source: Non-Ecommerce"
    );
  });

  it("does not render the Add Contact button", async () => {
    render(<ContactListPage {...directProps} />);
    await screen.findByRole("heading", { name: "Contacts" });
    expect(
      screen.queryByRole("button", { name: /Add Contact/i })
    ).not.toBeInTheDocument();
  });

  it("shows every contact without a confirmed ecommerce link (including no-link and POS-only)", async () => {
    render(<ContactListPage {...directProps} />);
    expect(await screen.findByText("No Link Nadia")).toBeInTheDocument();
    expect(screen.getByText("Pos Only Pat")).toBeInTheDocument();
  });

  it("excludes the POS+ecommerce merge-case contact (it belongs in Ecommerce Contacts)", async () => {
    render(<ContactListPage {...directProps} />);
    await screen.findByText("No Link Nadia");
    expect(screen.queryByText("Merged Morgan")).not.toBeInTheDocument();
    expect(screen.queryByText("Ecom Only Erin")).not.toBeInTheDocument();
  });
});

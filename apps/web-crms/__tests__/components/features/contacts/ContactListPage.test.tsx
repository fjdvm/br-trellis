import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

/**
 * A representative fixture set covering every origin case the partition must
 * classify: no source link at all, a non-ecommerce (POS) link only, an
 * ecommerce link only, and the identity-resolution merge case (both a POS and
 * an ecommerce link on one contact).
 */
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

const allContacts = [noLink, posOnly, ecomOnly, bothLinks];

describe("ContactListPage (default / All Contacts behavior)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(crmClient.contacts.list).mockResolvedValue(allContacts);
  });

  it("renders the default heading, description, and card title", async () => {
    render(<ContactListPage />);

    expect(
      await screen.findByRole("heading", { name: "All Contacts" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Unified contact profiles and source system origins.")
    ).toBeInTheDocument();
    expect(screen.getByText("Contact registry")).toBeInTheDocument();
  });

  it("shows the Add Contact button by default", async () => {
    render(<ContactListPage />);

    await screen.findByRole("heading", { name: "All Contacts" });
    expect(
      screen.getByRole("button", { name: /Add Contact/i })
    ).toBeInTheDocument();
  });

  it("renders no filter indicator by default", async () => {
    render(<ContactListPage />);

    await screen.findByRole("heading", { name: "All Contacts" });
    expect(
      screen.queryByTestId("contact-filter-indicator")
    ).not.toBeInTheDocument();
  });

  it("shows every contact regardless of origin (no filtering)", async () => {
    render(<ContactListPage />);

    expect(await screen.findByText("No Link Nadia")).toBeInTheDocument();
    expect(screen.getByText("Pos Only Pat")).toBeInTheDocument();
    expect(screen.getByText("Ecom Only Erin")).toBeInTheDocument();
    expect(screen.getByText("Merged Morgan")).toBeInTheDocument();
  });
});

describe("ContactListPage (non-ecommerce / Contacts view)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(crmClient.contacts.list).mockResolvedValue(allContacts);
  });

  it("shows only contacts without a confirmed ecommerce link", async () => {
    render(
      <ContactListPage heading="Contacts" sourceFilter="non-ecommerce" />
    );

    // No-link and POS-only contacts belong here.
    expect(await screen.findByText("No Link Nadia")).toBeInTheDocument();
    expect(screen.getByText("Pos Only Pat")).toBeInTheDocument();
    // Ecommerce-linked contacts (incl. the merged one) are excluded.
    expect(screen.queryByText("Ecom Only Erin")).not.toBeInTheDocument();
    expect(screen.queryByText("Merged Morgan")).not.toBeInTheDocument();
  });

  it("hides the Add Contact button when showAddButton is false", async () => {
    render(
      <ContactListPage
        heading="Contacts"
        sourceFilter="non-ecommerce"
        showAddButton={false}
      />
    );

    await screen.findByRole("heading", { name: "Contacts" });
    expect(
      screen.queryByRole("button", { name: /Add Contact/i })
    ).not.toBeInTheDocument();
  });

  it("renders the filter indicator and clears it back to /contacts", async () => {
    const user = userEvent.setup();
    render(
      <ContactListPage
        heading="Contacts"
        sourceFilter="non-ecommerce"
        filterIndicatorLabel="Source: Non-Ecommerce"
      />
    );

    await screen.findByRole("heading", { name: "Contacts" });
    const indicator = screen.getByTestId("contact-filter-indicator");
    expect(indicator).toHaveTextContent("Source: Non-Ecommerce");

    await user.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(mockPush).toHaveBeenCalledWith("/contacts");
  });
});

describe("ContactListPage (ecommerce / Ecommerce Contacts view)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(crmClient.contacts.list).mockResolvedValue(allContacts);
  });

  it("shows only contacts with at least one confirmed ecommerce link, including the merge case", async () => {
    render(
      <ContactListPage
        heading="Ecommerce Contacts"
        sourceFilter="ecommerce"
        filterIndicatorLabel="Source: Ecommerce"
      />
    );

    // Ecommerce-only and the POS+ecommerce merged contact both belong here.
    expect(await screen.findByText("Ecom Only Erin")).toBeInTheDocument();
    expect(screen.getByText("Merged Morgan")).toBeInTheDocument();
    // Non-ecommerce contacts are excluded.
    expect(screen.queryByText("No Link Nadia")).not.toBeInTheDocument();
    expect(screen.queryByText("Pos Only Pat")).not.toBeInTheDocument();
  });

  it("matches ecommerce case-insensitively (e.g. 'Ecommerce')", async () => {
    jest.mocked(crmClient.contacts.list).mockResolvedValue([
      makeContact({
        id: "c-upper",
        name: "Upper Case Uma",
        sourceReferences: [{ sourceSystem: "Ecommerce", sourceId: "shop-9" }],
      }),
      posOnly,
    ]);

    render(<ContactListPage sourceFilter="ecommerce" />);

    expect(await screen.findByText("Upper Case Uma")).toBeInTheDocument();
    expect(screen.queryByText("Pos Only Pat")).not.toBeInTheDocument();
  });
});

describe("ContactListPage (partition invariant)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(crmClient.contacts.list).mockResolvedValue(allContacts);
  });

  it("places every contact in exactly one of Contacts or Ecommerce Contacts", async () => {
    const { unmount } = render(
      <ContactListPage sourceFilter="non-ecommerce" />
    );
    await waitFor(() =>
      expect(crmClient.contacts.list).toHaveBeenCalled()
    );
    const nonEcom = [
      screen.queryByText("No Link Nadia"),
      screen.queryByText("Pos Only Pat"),
    ].filter(Boolean).length;
    const ecomInNonEcomView = [
      screen.queryByText("Ecom Only Erin"),
      screen.queryByText("Merged Morgan"),
    ].filter(Boolean).length;
    expect(nonEcom).toBe(2);
    expect(ecomInNonEcomView).toBe(0);
    unmount();

    render(<ContactListPage sourceFilter="ecommerce" />);
    expect(await screen.findByText("Ecom Only Erin")).toBeInTheDocument();
    expect(screen.getByText("Merged Morgan")).toBeInTheDocument();
    expect(screen.queryByText("No Link Nadia")).not.toBeInTheDocument();
    expect(screen.queryByText("Pos Only Pat")).not.toBeInTheDocument();
  });
});

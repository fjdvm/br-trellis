import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewTicketSheet } from "@/features/conversations/components/new-ticket-sheet";
import { contactsApi } from "@/features/contacts/contacts/services/contacts-api";
import { conversationTicketsApi } from "@/features/conversations/services/conversations-api";
import type { ContactListItem } from "@/features/contacts/types";
import type { TicketDetail } from "@/features/conversations/types";

jest.mock("@/features/conversations/services/conversations-api", () => ({
  conversationTicketsApi: {
      create: jest.fn(),
    }
}));

jest.mock("@/features/contacts/contacts/services/contacts-api", () => ({
  contactsApi: {
      list: jest.fn(),
    }
}));

function makeContact(overrides: Partial<ContactListItem> = {}): ContactListItem {
  return {
    id: "c-1",
    name: "jane doe",
    email: "jane@example.com",
    phone: null,
    companyName: null,
    lifetimeValue: 0,
    sourceReferences: [],
    ...overrides,
  };
}

function makeTicketDetail(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: "t-1",
    subject: "New subject",
    status: "Unclaimed",
    waitingOn: "None",
    source: "Manual",
    assignedToId: null,
    assignedToName: null,
    assignedToEmail: null,
    contactId: null,
    contact: null,
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-15T00:00:00Z",
    ...overrides,
  };
}

describe("NewTicketSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(contactsApi.list).mockResolvedValue([]);
    jest
      .mocked(conversationTicketsApi.create)
      .mockResolvedValue(makeTicketDetail());
  });

  it("renders a trigger button that opens the sheet", async () => {
    const user = userEvent.setup();
    render(<NewTicketSheet />);

    await user.click(screen.getByRole("button", { name: /new ticket/i }));

    expect(
      await screen.findByRole("heading", { name: /new ticket/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
  });

  it("does not submit when the subject is empty", async () => {
    const user = userEvent.setup();
    render(<NewTicketSheet />);

    await user.click(screen.getByRole("button", { name: /new ticket/i }));
    // Submit the form with an empty subject.
    await user.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(conversationTicketsApi.create).not.toHaveBeenCalled();
    // A validation message is shown (the exact error copy, not the sheet's
    // description text which also mentions the subject).
    expect(await screen.findByText("Subject is required.")).toBeInTheDocument();
  });

  it("creates a ticket with the trimmed subject and no contact by default", async () => {
    const user = userEvent.setup();
    const onCreated = jest.fn();
    render(<NewTicketSheet onCreated={onCreated} />);

    await user.click(screen.getByRole("button", { name: /new ticket/i }));
    await user.type(screen.getByLabelText(/subject/i), "  Cannot log in  ");
    await user.click(screen.getByRole("button", { name: /create ticket/i }));

    await waitFor(() =>
      expect(conversationTicketsApi.create).toHaveBeenCalledWith({
        subject: "Cannot log in",
        contactId: undefined,
      })
    );
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
  });

  it("populates the contact picker from contacts.list and submits the chosen contactId", async () => {
    jest
      .mocked(contactsApi.list)
      .mockResolvedValue([
        makeContact({ id: "c-1", name: "jane doe" }),
        makeContact({ id: "c-2", name: "john roe", email: "john@example.com" }),
      ]);
    const user = userEvent.setup();
    render(<NewTicketSheet />);

    await user.click(screen.getByRole("button", { name: /new ticket/i }));
    await user.type(screen.getByLabelText(/subject/i), "Billing question");

    // The contact <select> is populated from contacts.list.
    const contactSelect = await screen.findByLabelText(/contact/i);
    await waitFor(() =>
      expect(screen.getByRole("option", { name: /john roe/i })).toBeInTheDocument()
    );
    await user.selectOptions(contactSelect, "c-2");

    await user.click(screen.getByRole("button", { name: /create ticket/i }));

    await waitFor(() =>
      expect(conversationTicketsApi.create).toHaveBeenCalledWith({
        subject: "Billing question",
        contactId: "c-2",
      })
    );
  });

  it("surfaces the backend error and does not call onCreated on failure", async () => {
    jest
      .mocked(conversationTicketsApi.create)
      .mockRejectedValue(new Error("Contact does not exist."));
    const user = userEvent.setup();
    const onCreated = jest.fn();
    render(<NewTicketSheet onCreated={onCreated} />);

    await user.click(screen.getByRole("button", { name: /new ticket/i }));
    await user.type(screen.getByLabelText(/subject/i), "Broken");
    await user.click(screen.getByRole("button", { name: /create ticket/i }));

    expect(
      await screen.findByText("Contact does not exist.")
    ).toBeInTheDocument();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("disables the submit button while the create request is in flight", async () => {
    let resolveCreate: (value: TicketDetail) => void = () => {};
    jest.mocked(conversationTicketsApi.create).mockReturnValue(
      new Promise<TicketDetail>((resolve) => {
        resolveCreate = resolve;
      })
    );
    const user = userEvent.setup();
    render(<NewTicketSheet />);

    await user.click(screen.getByRole("button", { name: /new ticket/i }));
    await user.type(screen.getByLabelText(/subject/i), "Slow one");
    const submit = screen.getByRole("button", { name: /create ticket/i });
    await user.click(submit);

    await waitFor(() => expect(submit).toBeDisabled());
    resolveCreate(makeTicketDetail());
  });
});

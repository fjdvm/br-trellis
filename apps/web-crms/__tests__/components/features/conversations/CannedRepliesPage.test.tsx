import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { CannedRepliesPage } from "@/features/conversations/components/canned-replies-page";
import { cannedRepliesApi, cannedReplyCategoriesApi } from "@/features/conversations/services/conversations-api";

// useSession is overridden per describe via this mutable holder so we can flip
// canWrite / isSuperUser without re-mocking the module each time.
let mockSession: unknown = {
  data: {
    user: { name: "Bren Raphael", email: "bren@example.com" },
    isSuperUser: true,
    permissions: { CRMS: { Conversations: { canRead: true } } },
  },
  status: "authenticated",
};

jest.mock("next-auth/react", () => ({
  useSession: () => mockSession,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/features/conversations/services/conversations-api", () => ({
  cannedReplyCategoriesApi: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      restore: jest.fn(),
    },
  cannedRepliesApi: {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      archive: jest.fn(),
      restore: jest.fn(),
    }
}));

const api = {
  catList: jest.mocked(cannedReplyCategoriesApi.list),
  catCreate: jest.mocked(cannedReplyCategoriesApi.create),
  replyList: jest.mocked(cannedRepliesApi.list),
  replyArchive: jest.mocked(cannedRepliesApi.archive),
  replyRestore: jest.mocked(cannedRepliesApi.restore),
};

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

function superUserSession() {
  return {
    data: {
      user: { name: "Bren Raphael" },
      isSuperUser: true,
      permissions: { CRMS: { Conversations: { canRead: true } } },
    },
    status: "authenticated",
  };
}

function writerSession() {
  return {
    data: {
      user: { name: "Casey Writer" },
      isSuperUser: false,
      permissions: { CRMS: { Conversations: { canRead: true, canWrite: true } } },
    },
    status: "authenticated",
  };
}

function readerSession() {
  return {
    data: {
      user: { name: "Riley Reader" },
      isSuperUser: false,
      permissions: { CRMS: { Conversations: { canRead: true } } },
    },
    status: "authenticated",
  };
}

const sampleCategories = [
  { id: "cat-1", name: "Shipping", replyCount: 1, createdAt: "2025-01-15T00:00:00Z", deletedAt: null },
  { id: "cat-2", name: "Refunds", replyCount: 0, createdAt: "2025-01-16T00:00:00Z", deletedAt: null },
];

const sampleReplies = [
  {
    id: "rep-1",
    categoryId: "cat-1",
    categoryName: "Shipping",
    name: "Order status",
    body: "Hi {{customer_name}}, your order {{ticket_id}} is on its way.",
    createdAt: "2025-01-17T00:00:00Z",
    deletedAt: null,
  },
];

describe("CannedRepliesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = superUserSession();
    api.catList.mockResolvedValue(sampleCategories);
    api.replyList.mockResolvedValue(sampleReplies);
  });

  it("renders the single canned replies table with name, category, and body", async () => {
    render(<CannedRepliesPage />);

    expect(await screen.findByText("Order status")).toBeInTheDocument();
    // Category shows as the reply's badge (there is no separate categories table).
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(
      screen.getByText(/your order \{\{ticket_id\}\} is on its way/)
    ).toBeInTheDocument();
  });

  it("filters replies by category via the category Select", async () => {
    render(<CannedRepliesPage />);
    await screen.findByText("Order status");

    // Initial load is unfiltered.
    expect(api.replyList).toHaveBeenCalledWith(false, undefined);

    // Open the filter and pick "Refunds".
    fireEvent.click(screen.getByRole("combobox", { name: /Filter by category/i }));
    fireEvent.click(await screen.findByRole("option", { name: "Refunds" }));

    await waitFor(() =>
      expect(api.replyList).toHaveBeenCalledWith(false, "cat-2")
    );
  });

  it("hides archived items by default and toggles them via the button", async () => {
    render(<CannedRepliesPage />);

    await screen.findByText("Order status");
    expect(api.catList).toHaveBeenCalledWith(false);
    expect(api.replyList).toHaveBeenCalledWith(false, undefined);

    fireEvent.click(screen.getByText("Show Archived"));

    await waitFor(() => {
      expect(api.catList).toHaveBeenCalledWith(true);
      expect(api.replyList).toHaveBeenCalledWith(true, undefined);
    });
  });

  it("creates a category via the New Category sheet and refetches", async () => {
    api.catCreate.mockResolvedValue({
      id: "cat-new",
      name: "General",
      createdAt: "2025-02-01T00:00:00Z",
      deletedAt: null,
      replyCount: 0,
    });

    render(<CannedRepliesPage />);
    await screen.findByText("Order status");

    fireEvent.click(screen.getByRole("button", { name: /New Category/i }));
    fireEvent.change(await screen.findByLabelText(/Name/i), {
      target: { value: "General" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Category/i }));

    await waitFor(() =>
      expect(api.catCreate).toHaveBeenCalledWith({ name: "General" })
    );
    // Initial load (1) + post-create refetch (2).
    await waitFor(() => expect(api.catList).toHaveBeenCalledTimes(2));
  });

  it("archives a canned reply through the confirmation dialog", async () => {
    api.replyArchive.mockResolvedValue(undefined);

    render(<CannedRepliesPage />);
    await screen.findByText("Order status");

    const replyRow = screen.getByText("Order status").closest("tr")!;
    fireEvent.click(within(replyRow).getByRole("button", { name: /Archive/i }));

    // Confirm in the dialog.
    fireEvent.click(await screen.findByRole("button", { name: "Archive" }));

    await waitFor(() =>
      expect(api.replyArchive).toHaveBeenCalledWith("rep-1")
    );
  });

  it("restores an archived canned reply via the restore endpoint", async () => {
    api.replyList.mockResolvedValue([
      {
        id: "rep-archived",
        categoryId: "cat-1",
        categoryName: "Shipping",
        name: "Retired reply",
        body: "old",
        createdAt: "2025-01-10T00:00:00Z",
        deletedAt: "2025-02-01T00:00:00Z",
      },
    ]);
    api.replyRestore.mockResolvedValue({
      id: "rep-archived",
      categoryId: "cat-1",
      categoryName: "Shipping",
      name: "Retired reply",
      body: "old",
      createdAt: "2025-01-10T00:00:00Z",
      deletedAt: null,
    });

    render(<CannedRepliesPage />);
    await screen.findByText("Retired reply");

    fireEvent.click(screen.getByRole("button", { name: /Restore/i }));

    await waitFor(() =>
      expect(api.replyRestore).toHaveBeenCalledWith("rep-archived")
    );
  });

  describe("permission gating", () => {
    it("shows management controls for a SuperUser", async () => {
      mockSession = superUserSession();
      render(<CannedRepliesPage />);
      await screen.findByText("Order status");
      expect(screen.getByRole("button", { name: /New Category/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /New Canned Reply/i })).toBeInTheDocument();
    });

    it("shows management controls for an agent with Conversations.canWrite", async () => {
      mockSession = writerSession();
      render(<CannedRepliesPage />);
      await screen.findByText("Order status");
      expect(screen.getByRole("button", { name: /New Category/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /New Canned Reply/i })).toBeInTheDocument();
    });

    it("hides all management controls for a reader without canWrite", async () => {
      mockSession = readerSession();
      render(<CannedRepliesPage />);
      await screen.findByText("Order status");
      // No create/edit/archive controls at all.
      expect(screen.queryByRole("button", { name: /New Category/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /New Canned Reply/i })).not.toBeInTheDocument();
      // Exact names so the read-only "Show Archived" toggle isn't matched.
      expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
      // But the lists are still readable.
      expect(screen.getByText("Order status")).toBeInTheDocument();
    });
  });
});

import React from "react";
import { render, screen, act } from "@testing-library/react";
import { Sidebar } from "@/components/shared/Sidebar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next-auth
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: { name: "Test User", email: "test@example.com" },
      isSuperUser: true,
      permissions: {
        CRMS: {
          Dashboard: { canRead: true },
          "Customer Profiles": { canRead: true },
          Ecommerce: { canRead: true },
          Conversations: { canRead: true },
          Automation: { canRead: true },
        },
      },
    },
    status: "authenticated",
  }),
}));

// Mock sidebar UI components
jest.mock("@/components/ui/sidebar", () => ({
  SidebarHeader: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SidebarContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SidebarFooter: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SidebarGroup: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SidebarGroupContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SidebarMenu: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SidebarMenuItem: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SidebarMenuButton: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  SidebarRail: () => null,
  SidebarTrigger: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  useSidebar: () => ({
    open: true,
    openMobile: false,
    setOpenMobile: jest.fn(),
    toggleSidebar: jest.fn(),
    isMobile: false,
  }),
}));

// Mock the sync status hook
jest.mock("@/features/ecommerce/hooks/useEcommerceSyncStatus", () => {
  let statusValue = { status: null as string | null, isLoading: true };
  return {
    useEcommerceSyncStatus: () => statusValue,
    EcommerceSyncStatusProvider: ({ children }: { children: React.ReactNode }) => children,
    __setMockStatus: (value: { status: string | null; isLoading: boolean }) => {
      statusValue = value;
    },
  };
});

const { __setMockStatus } = require("@/features/ecommerce/hooks/useEcommerceSyncStatus");

describe("Sidebar Tickets group (#99 rename)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("activeAccount", "admin");
    __setMockStatus({ status: "healthy", isLoading: false });
  });

  it("renders a 'Tickets' group (the lifecycle group formerly named 'Conversations')", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    // The lifecycle group is now named Tickets. (A separate messenger
    // Conversations group is added in #100 and asserted below.)
    expect(screen.getByRole("button", { name: /Tickets/ })).toBeInTheDocument();
  });

  it("no longer lists a Triage Queue child (tab removed) and points lifecycle links at /tickets/*", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    // The Tickets group is collapsed on /dashboard (no active child); click the
    // group header button to reveal its children.
    await act(async () => {
      screen.getByRole("button", { name: /Tickets/ }).click();
    });

    // Triage Queue has been removed from the Tickets group for now.
    expect(screen.queryByText("Triage Queue")).not.toBeInTheDocument();
    // The messenger word "Inbox" is not used as a Tickets child label.
    expect(screen.queryByText("Inbox")).not.toBeInTheDocument();

    // The Tickets list child link points at /tickets.
    const ticketsListLink = screen
      .getAllByText("Tickets")
      .map((el) => el.closest("a"))
      .find((a): a is HTMLAnchorElement => a !== null);
    expect(ticketsListLink).toHaveAttribute("href", "/tickets");

    const myAssigned = screen.getByText("My Assigned").closest("a");
    expect(myAssigned).toHaveAttribute("href", "/tickets/assigned");
  });
});

describe("Sidebar two-group structure (#100)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("activeAccount", "admin");
    __setMockStatus({ status: "healthy", isLoading: false });
  });

  it("renders both a Tickets group and a new Conversations messenger group", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    expect(screen.getByRole("button", { name: /Tickets/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Conversations/ })
    ).toBeInTheDocument();
  });

  it("puts the messenger Inbox and relocated Canned Replies under Conversations, with Inbox pointing at /conversations/inbox", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    await act(async () => {
      screen.getByRole("button", { name: /Conversations/ }).click();
    });

    const inbox = screen.getByText("Inbox").closest("a");
    expect(inbox).toHaveAttribute("href", "/conversations/inbox");

    const cannedReplies = screen.getByText("Canned Replies").closest("a");
    expect(cannedReplies).toHaveAttribute("href", "/conversations/canned-replies");
  });

  it("no longer lists Canned Replies under the Tickets group", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    // Expand Tickets only.
    await act(async () => {
      screen.getByRole("button", { name: /Tickets/ }).click();
    });

    // Tickets group children (Triage Queue removed for now): Tickets, My Assigned — no Canned Replies.
    expect(screen.queryByText("Triage Queue")).not.toBeInTheDocument();
    expect(screen.getByText("My Assigned")).toBeInTheDocument();
    expect(screen.queryByText("Canned Replies")).not.toBeInTheDocument();
  });
});

describe("Sidebar Tickets group History tab (#107)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("activeAccount", "admin");
    __setMockStatus({ status: "healthy", isLoading: false });
  });

  it("includes a History child pointing at /tickets/history", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    await act(async () => {
      screen.getByRole("button", { name: /Tickets/ }).click();
    });

    const history = screen.getByText("History").closest("a");
    expect(history).toHaveAttribute("href", "/tickets/history");
  });

  it("orders the Tickets children Tickets → My Assigned → History (Triage Queue removed)", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    await act(async () => {
      screen.getByRole("button", { name: /Tickets/ }).click();
    });

    // Triage Queue is gone; History remains the last child, after My Assigned.
    expect(screen.queryByText("Triage Queue")).not.toBeInTheDocument();
    const myAssigned = screen.getByText("My Assigned").closest("a");
    const history = screen.getByText("History").closest("a");
    expect(myAssigned).not.toBeNull();
    expect(history).not.toBeNull();

    // History comes after My Assigned in document order.
    const position = myAssigned!.compareDocumentPosition(history!);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe("Sidebar Contacts group split (#117)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("activeAccount", "admin");
    __setMockStatus({ status: "healthy", isLoading: false });
  });

  // "Contacts" is both the group-header label and a child link label, so the
  // group is expanded via its header button and children are resolved by their
  // href (not by text alone) to disambiguate.
  async function expandContacts() {
    await act(async () => {
      render(<Sidebar />);
    });
    await act(async () => {
      screen.getByRole("button", { name: /Contacts/ }).click();
    });
  }

  /** Find the child nav anchor whose href exactly matches. */
  function childLinkByHref(href: string): HTMLAnchorElement | null {
    return screen
      .getAllByRole("link")
      .find((a): a is HTMLAnchorElement =>
        a.getAttribute("href") === href
      ) ?? null;
  }

  it("adds Contacts (/contacts/direct) and Ecommerce Contacts (/contacts/ecommerce) children", async () => {
    await expandContacts();

    expect(childLinkByHref("/contacts/direct")).not.toBeNull();
    expect(childLinkByHref("/contacts/direct")).toHaveTextContent("Contacts");

    expect(childLinkByHref("/contacts/ecommerce")).not.toBeNull();
    expect(childLinkByHref("/contacts/ecommerce")).toHaveTextContent(
      "Ecommerce Contacts"
    );
  });

  it("keeps All Contacts pointing at /contacts", async () => {
    await expandContacts();

    const allContacts = childLinkByHref("/contacts");
    expect(allContacts).not.toBeNull();
    expect(allContacts).toHaveTextContent("All Contacts");
  });

  it("orders the Contacts group: All Contacts → Contacts → Ecommerce Contacts → Companies → Lists/Segments → At-Risk Customers", async () => {
    await expandContacts();

    const hrefs = [
      "/contacts",
      "/contacts/direct",
      "/contacts/ecommerce",
      "/contacts/companies",
      "/contacts/segments",
      "/contacts/at-risk",
    ];
    const anchors = hrefs.map((href) => {
      const anchor = childLinkByHref(href);
      expect(anchor).not.toBeNull();
      return anchor!;
    });

    // Each entry precedes the next in document order.
    for (let i = 0; i < anchors.length - 1; i++) {
      const position = anchors[i].compareDocumentPosition(anchors[i + 1]);
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });
});

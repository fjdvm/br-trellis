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
jest.mock("@/hooks/useEcommerceSyncStatus", () => {
  let statusValue = { status: null as string | null, isLoading: true };
  return {
    useEcommerceSyncStatus: () => statusValue,
    EcommerceSyncStatusProvider: ({ children }: { children: React.ReactNode }) => children,
    __setMockStatus: (value: { status: string | null; isLoading: boolean }) => {
      statusValue = value;
    },
  };
});

const { __setMockStatus } = require("@/hooks/useEcommerceSyncStatus");

describe("Sidebar Ecommerce disabled state", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("activeAccount", "admin");
  });

  it("shows 'Not connected' badge on Ecommerce group when never_connected", async () => {
    __setMockStatus({ status: "never_connected", isLoading: false });

    await act(async () => {
      render(<Sidebar />);
    });

    expect(screen.getByText("Not connected")).toBeInTheDocument();
  });

  it("shows Ecommerce group normally when healthy", async () => {
    __setMockStatus({ status: "healthy", isLoading: false });

    await act(async () => {
      render(<Sidebar />);
    });

    expect(screen.queryByText("Not connected")).not.toBeInTheDocument();
    expect(screen.getByText("Ecommerce")).toBeInTheDocument();
  });

  it("shows Ecommerce group normally when stale", async () => {
    __setMockStatus({ status: "stale", isLoading: false });

    await act(async () => {
      render(<Sidebar />);
    });

    expect(screen.queryByText("Not connected")).not.toBeInTheDocument();
    expect(screen.getByText("Ecommerce")).toBeInTheDocument();
  });
});

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

  it("relabels the triage-queue child to 'Triage Queue' (the word 'Inbox' is freed) and points lifecycle links at /tickets/*", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    // The Tickets group is collapsed on /dashboard (no active child); click the
    // group header button to reveal its children.
    await act(async () => {
      screen.getByRole("button", { name: /Tickets/ }).click();
    });

    const triage = screen.getByText("Triage Queue").closest("a");
    expect(triage).toHaveAttribute("href", "/tickets/inbox");
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

  it("puts the messenger Inbox and relocated Canned Replies under Conversations, with Inbox pointing at /conversations", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    await act(async () => {
      screen.getByRole("button", { name: /Conversations/ }).click();
    });

    const inbox = screen.getByText("Inbox").closest("a");
    expect(inbox).toHaveAttribute("href", "/conversations");

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

    // Tickets group children: Triage Queue, Tickets, My Assigned — no Canned Replies.
    expect(screen.getByText("Triage Queue")).toBeInTheDocument();
    expect(screen.getByText("My Assigned")).toBeInTheDocument();
    expect(screen.queryByText("Canned Replies")).not.toBeInTheDocument();
  });
});

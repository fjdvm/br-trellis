import React from "react";
import { render, screen, act } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

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
          Conversations: { canRead: true },
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

describe("Sidebar Navigation Structure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("activeAccount", "admin");
    __setMockStatus({ status: "healthy", isLoading: false });
  });

  function childLinkByHref(href: string): HTMLAnchorElement | null {
    return screen
      .getAllByRole("link")
      .find((a): a is HTMLAnchorElement =>
        a.getAttribute("href") === href
      ) ?? null;
  }

  it("renders the 8 top-level sections in exact structure", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    // Top level items
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Contacts/ })).toBeInTheDocument();
    expect(screen.getByText("Segments")).toBeInTheDocument();
    expect(screen.getByText("Tickets")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Conversations/ })).toBeInTheDocument();
    expect(screen.getByText("Campaigns")).toBeInTheDocument();
    expect(screen.getByText("Analytics & Report")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("nests Ecommerce under Contacts", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    await act(async () => {
      screen.getByRole("button", { name: /Contacts/ }).click();
    });

    expect(childLinkByHref("/contacts")).toHaveTextContent("All");
    expect(childLinkByHref("/contacts/direct")).toHaveTextContent("Contacts");
    expect(childLinkByHref("/contacts/ecommerce")).toHaveTextContent("Ecommerce");
    expect(childLinkByHref("/contacts/companies")).toHaveTextContent("Companies");
  });

  it("renders Tickets as a flat single page entry and Conversations with Inbox + Canned Replies", async () => {
    await act(async () => {
      render(<Sidebar />);
    });

    const ticketsLink = childLinkByHref("/tickets");
    expect(ticketsLink).not.toBeNull();
    expect(ticketsLink).toHaveTextContent("Tickets");

    await act(async () => {
      screen.getByRole("button", { name: /Conversations/ }).click();
    });

    expect(childLinkByHref("/conversations/inbox")).toHaveTextContent("Inbox");
    expect(childLinkByHref("/conversations/canned-replies")).toHaveTextContent("Canned Replies");
  });
});

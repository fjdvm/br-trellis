import React from "react";
import { render, screen, act } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock next-auth with a mutable session status so we can simulate loading.
jest.mock("next-auth/react", () => {
  let sessionValue: { data: unknown; status: string } = {
    data: null,
    status: "loading",
  };
  return {
    useSession: () => sessionValue,
    __setMockSession: (value: { data: unknown; status: string }) => {
      sessionValue = value;
    },
  };
});

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

// Mock the sync status hook with a mutable value.
jest.mock("@/features/contacts/ecommerce/hooks/useEcommerceSyncStatus", () => {
  let statusValue = { status: null as string | null, isLoading: true };
  return {
    useEcommerceSyncStatus: () => statusValue,
    EcommerceSyncStatusProvider: ({ children }: { children: React.ReactNode }) => children,
    __setMockStatus: (value: { status: string | null; isLoading: boolean }) => {
      statusValue = value;
    },
  };
});

const { __setMockStatus } = require("@/features/contacts/ecommerce/hooks/useEcommerceSyncStatus");
const { __setMockSession } = require("next-auth/react");

const authenticatedSession = {
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
};

describe("Sidebar nav loading skeleton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem("activeAccount", "admin");
  });

  it("shows the nav skeleton while the session is loading", async () => {
    __setMockSession({ data: null, status: "loading" });
    __setMockStatus({ status: null, isLoading: false });

    await act(async () => {
      render(<Sidebar />);
    });

    expect(screen.getByTestId("sidebar-nav-skeleton")).toBeInTheDocument();
    // Real nav groups should not be present yet.
    expect(screen.queryByText("Contacts")).not.toBeInTheDocument();
  });

  it("replaces the skeleton with real nav once loaded", async () => {
    __setMockSession(authenticatedSession);
    __setMockStatus({ status: "healthy", isLoading: false });

    await act(async () => {
      render(<Sidebar />);
    });

    expect(screen.queryByTestId("sidebar-nav-skeleton")).not.toBeInTheDocument();
    expect(screen.getByText("Contacts")).toBeInTheDocument();
    expect(screen.getByText("Tickets")).toBeInTheDocument();
  });
});

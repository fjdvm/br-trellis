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

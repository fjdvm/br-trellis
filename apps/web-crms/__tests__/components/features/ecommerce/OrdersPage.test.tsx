import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { OrdersPage } from "@/features/ecommerce/components/orders-page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/ecommerce/orders",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock CRM API client
const mockGetSyncStatus = jest.fn();
const mockListOrders = jest.fn();
jest.mock("@/features/ecommerce/services/ecommerce-api", () => ({
  ecommerceSyncStatusApi: {
      get: () => mockGetSyncStatus(),
    },
  ecommerceOrdersApi: {
      list: () => mockListOrders(),
    }
}));

// Mock the hook to use our mock
jest.mock("@/features/ecommerce/hooks/useEcommerceSyncStatus", () => {
  const React = require("react");
  let statusValue: { status: string | null; isLoading: boolean } = { status: null, isLoading: true };

  return {
    useEcommerceSyncStatus: () => statusValue,
    EcommerceSyncStatusProvider: ({ children }: { children: React.ReactNode }) => {
      return children;
    },
    __setMockStatus: (value: { status: string | null; isLoading: boolean }) => {
      statusValue = value;
    },
  };
});

const { __setMockStatus } = require("@/features/ecommerce/hooks/useEcommerceSyncStatus");

describe("OrdersPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockListOrders.mockResolvedValue([]);
  });

  it("shows connect prompt when sync status is never_connected", async () => {
    __setMockStatus({ status: "never_connected", isLoading: false });

    await act(async () => {
      render(<OrdersPage />);
    });

    expect(screen.getByText("Ecommerce Not Connected")).toBeInTheDocument();
    expect(screen.getByText(/No ecommerce data is available yet/)).toBeInTheDocument();
    expect(screen.getByText("View Ecommerce Sync Settings")).toBeInTheDocument();
  });

  it("shows normal page content when sync status is healthy", async () => {
    __setMockStatus({ status: "healthy", isLoading: false });
    mockListOrders.mockResolvedValue([]);

    await act(async () => {
      render(<OrdersPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });
    expect(screen.queryByText("Ecommerce Not Connected")).not.toBeInTheDocument();
  });

  it("shows normal page content when sync status is stale", async () => {
    __setMockStatus({ status: "stale", isLoading: false });
    mockListOrders.mockResolvedValue([]);

    await act(async () => {
      render(<OrdersPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });
    expect(screen.queryByText("Ecommerce Not Connected")).not.toBeInTheDocument();
  });
});

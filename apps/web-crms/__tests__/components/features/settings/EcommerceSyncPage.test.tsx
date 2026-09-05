import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { EcommerceSyncPage } from "@/features/settings/components/ecommerce-sync-page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/settings/ecommerce-sync",
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock CRM API client
const mockGetSyncStatus = jest.fn();
jest.mock("@/features/ecommerce/services/ecommerce-api", () => ({
  ecommerceSyncStatusApi: {
      get: () => mockGetSyncStatus(),
    }
}));

describe("EcommerceSyncPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders healthy status with timestamps", async () => {
    mockGetSyncStatus.mockResolvedValue({
      status: "healthy",
      firstEventReceivedAt: "2026-08-25T10:00:00Z",
      lastEventReceivedAt: "2026-08-28T06:00:00Z",
      webhookSecretConfigured: true,
      maskedWebhookSecret: "********************tion",
    });

    await act(async () => {
      render(<EcommerceSyncPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });
    expect(screen.getByText("Your ecommerce platform is actively sending events. Data is syncing normally.")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("********************tion")).toBeInTheDocument();
  });

  it("renders stale status with warning", async () => {
    mockGetSyncStatus.mockResolvedValue({
      status: "stale",
      firstEventReceivedAt: "2026-08-10T10:00:00Z",
      lastEventReceivedAt: "2026-08-20T06:00:00Z",
      webhookSecretConfigured: true,
      maskedWebhookSecret: "********************tion",
    });

    await act(async () => {
      render(<EcommerceSyncPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Stale")).toBeInTheDocument();
    });
    expect(screen.getByText(/No events have been received recently/)).toBeInTheDocument();
  });

  it("renders never_connected status", async () => {
    mockGetSyncStatus.mockResolvedValue({
      status: "never_connected",
      firstEventReceivedAt: null,
      lastEventReceivedAt: null,
      webhookSecretConfigured: false,
      maskedWebhookSecret: null,
    });

    await act(async () => {
      render(<EcommerceSyncPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Not Connected")).toBeInTheDocument();
    });
    expect(screen.getByText(/No ecommerce events have ever been received/)).toBeInTheDocument();
    expect(screen.getByText("Not Configured")).toBeInTheDocument();
    // Both first and last event show "Never" when null
    const neverElements = screen.getAllByText("Never");
    expect(neverElements.length).toBe(2);
  });

  it("renders webhook secret not configured state", async () => {
    mockGetSyncStatus.mockResolvedValue({
      status: "healthy",
      firstEventReceivedAt: "2026-08-25T10:00:00Z",
      lastEventReceivedAt: "2026-08-28T06:00:00Z",
      webhookSecretConfigured: false,
      maskedWebhookSecret: null,
    });

    await act(async () => {
      render(<EcommerceSyncPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Not Configured")).toBeInTheDocument();
    });
    expect(screen.getByText(/No webhook secret is configured/)).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    mockGetSyncStatus.mockRejectedValue(new Error("Network error"));

    await act(async () => {
      render(<EcommerceSyncPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});

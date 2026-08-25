import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { SettingsPage } from "@/components/features/settings/SettingsPage";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/settings",
}));

// Mock AI API client
jest.mock("@/lib/api/ai-client", () => ({
  aiClient: {
    config: {
      getChurnThreshold: jest.fn(() => Promise.resolve({ churn_threshold: 0.60 })),
      updateChurnThreshold: jest.fn(() => Promise.resolve({ churn_threshold: 0.60 })),
      getPriorityWeights: jest.fn(() =>
        Promise.resolve({
          sentiment_weight: 0.40,
          urgency_weight: 0.30,
          history_weight: 0.30,
        })
      ),
      updatePriorityWeights: jest.fn(() =>
        Promise.resolve({
          sentiment_weight: 0.40,
          urgency_weight: 0.30,
          history_weight: 0.30,
        })
      ),
      getAnomalySensitivity: jest.fn(() => Promise.resolve({ sensitivity: 0.50 })),
      updateAnomalySensitivity: jest.fn(() => Promise.resolve({ sensitivity: 0.50 })),
      getConfidenceThresholds: jest.fn(() =>
        Promise.resolve({
          sentiment_threshold: 0.70,
          category_threshold: 0.70,
          nba_threshold: 0.70,
          resolution_estimate_threshold: 0.70,
        })
      ),
      updateConfidenceThresholds: jest.fn(() =>
        Promise.resolve({
          sentiment_threshold: 0.70,
          category_threshold: 0.70,
          nba_threshold: 0.70,
          resolution_estimate_threshold: 0.70,
        })
      ),
    },
  },
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("renders the general system settings tabs", async () => {
    await act(async () => {
      render(<SettingsPage />);
    });
    expect(screen.getByText("General")).toBeInTheDocument();
    expect(screen.getByText("Notifications")).toBeInTheDocument();
    expect(screen.getByText("Integrations")).toBeInTheDocument();
    expect(screen.getByText("AI Thresholds")).toBeInTheDocument();
  });

  it("renders access restricted screen when user is not admin/manager", async () => {
    localStorage.setItem("activeAccount", "sales"); // Sales Lead role
    await act(async () => {
      render(<SettingsPage />);
    });

    // Click on AI Thresholds tab
    const tabTrigger = screen.getByText("AI Thresholds");
    await act(async () => {
      fireEvent.click(tabTrigger);
      fireEvent.keyDown(tabTrigger, { key: "Enter", code: "Enter" });
      fireEvent.keyDown(tabTrigger, { key: " ", code: "Space" });
    });

    await waitFor(() => {
      expect(screen.getByText("Access Restricted")).toBeInTheDocument();
      expect(
        screen.getByText(/Only administrators and support managers are permitted/i)
      ).toBeInTheDocument();
    });
  });

  it("renders AI configurations when user is admin", async () => {
    localStorage.setItem("activeAccount", "admin"); // Administrator role
    await act(async () => {
      render(<SettingsPage />);
    });

    // Click on AI Thresholds tab
    const tabTrigger = screen.getByText("AI Thresholds");
    await act(async () => {
      fireEvent.click(tabTrigger);
      fireEvent.keyDown(tabTrigger, { key: "Enter", code: "Enter" });
      fireEvent.keyDown(tabTrigger, { key: " ", code: "Space" });
    });

    await waitFor(() => {
      expect(screen.getByText("Risk & Anomaly Thresholds")).toBeInTheDocument();
      expect(screen.getByText("Priority Weights (Sum must equal 1.0)")).toBeInTheDocument();
      expect(screen.getByText("Confidence Thresholds (0.00 - 1.00)")).toBeInTheDocument();
    });
  });
});

import React from "react";
import { render, screen } from "@testing-library/react";
import { DashboardChartSummary } from "@/features/dashboard/components/dashboard";

describe("DashboardChartSummary", () => {
  describe("workload panel", () => {
    it("computes avg and peak ticket count from forecastSeries", () => {
      const ticketVolume = {
        forecastSeries: [
          { date: "2026-01-01", count: 10 },
          { date: "2026-01-02", count: 20 },
          { date: "2026-01-03", count: 30 },
        ],
      };
      render(
        <DashboardChartSummary type="workload" days={7} ticketVolume={ticketVolume} />
      );
      expect(screen.getByText("AI Workload Forecast Summary")).toBeInTheDocument();
      expect(screen.getByText("Ticket Volume Projection (7 Days)")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument(); // avg
      expect(screen.getByText("30")).toBeInTheDocument(); // peak
    });

    it("renders -- when no forecastSeries data", () => {
      render(
        <DashboardChartSummary type="workload" days={14} ticketVolume={null} />
      );
      const dashes = screen.getAllByText("--");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("revenue panel", () => {
    it("computes top segment share and confidence from bySegment", () => {
      const revenueBySegment = {
        bySegment: { "High-Value": 60000, "Regular": 30000, "New": 10000 },
        totalProjected: 100000,
        confidence: 0.85,
        forecastSeries: [],
      };
      render(
        <DashboardChartSummary type="revenue" days={30} revenueBySegment={revenueBySegment} />
      );
      expect(screen.getByText("Revenue Breakdown")).toBeInTheDocument();
      // Top segment is High-Value at 60%
      expect(screen.getByText("60%")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument(); // confidence
    });

    it("renders -- when no segment data", () => {
      render(
        <DashboardChartSummary type="revenue" days={30} revenueBySegment={null} />
      );
      const dashes = screen.getAllByText("--");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("sentiment panel", () => {
    it("computes positive sentiment pct and CSAT from dailyScores", () => {
      const sentimentTrend = {
        dailyScores: [
          { date: "2026-01-01", score: 0.5 },
          { date: "2026-01-02", score: 0.8 },
          { date: "2026-01-03", score: -0.2 },
          { date: "2026-01-04", score: 0.3 },
        ],
      };
      render(
        <DashboardChartSummary type="sentiment" days={30} sentimentTrend={sentimentTrend} />
      );
      expect(screen.getByText("Sentiment Analysis")).toBeInTheDocument();
      // 3 of 4 scores are positive → 75%
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("renders -- when no sentiment data", () => {
      render(
        <DashboardChartSummary type="sentiment" days={30} sentimentTrend={null} />
      );
      const dashes = screen.getAllByText("--");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("risk panel", () => {
    it("renders high and critical counts from churnDistribution", () => {
      const churnDistribution = { low: 50, medium: 30, high: 15, critical: 5 };
      render(
        <DashboardChartSummary type="risk" days={7} churnDistribution={churnDistribution} />
      );
      expect(screen.getByText("Churn Risk Monitoring")).toBeInTheDocument();
      // high + critical = 20
      expect(screen.getByText("20 Accounts")).toBeInTheDocument();
      expect(screen.getByText("5 Accounts")).toBeInTheDocument();
    });

    it("renders -- when no churn data", () => {
      render(
        <DashboardChartSummary type="risk" days={7} churnDistribution={null} />
      );
      const dashes = screen.getAllByText("--");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });
});

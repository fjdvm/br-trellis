import { renderHook, waitFor } from "@testing-library/react";
import { useDashboardForecasts } from "@/features/dashboard/hooks/useDashboardForecasts";
import { aiClient } from "@/features/dashboard";

jest.mock("@/features/dashboard", () => ({
  aiClient: {
    forecasts: {
      getTicketVolume: jest.fn(),
      getRevenueBySegment: jest.fn(),
      getChurnDistribution: jest.fn(),
      getSentimentTrend: jest.fn(),
    },
  },
}));

describe("useDashboardForecasts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads all forecast data on mount", async () => {
    const mockTickets = { historicalSeries: [], forecastSeries: [] };
    const mockRevenue = { forecastSeries: [], bySegment: {} };
    const mockChurn = { low: 10, medium: 2, high: 1, critical: 0 };
    const mockSentiment = { dailyScores: [], movingAverage: [] };

    (aiClient.forecasts.getTicketVolume as jest.Mock).mockResolvedValue(mockTickets);
    (aiClient.forecasts.getRevenueBySegment as jest.Mock).mockResolvedValue(mockRevenue);
    (aiClient.forecasts.getChurnDistribution as jest.Mock).mockResolvedValue(mockChurn);
    (aiClient.forecasts.getSentimentTrend as jest.Mock).mockResolvedValue(mockSentiment);

    const { result } = renderHook(() => useDashboardForecasts(7));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.ticketVolume).toEqual(mockTickets);
    expect(result.current.revenueBySegment).toEqual(mockRevenue);
    expect(result.current.churnDistribution).toEqual(mockChurn);
    expect(result.current.sentimentTrend).toEqual(mockSentiment);

    expect(aiClient.forecasts.getTicketVolume).toHaveBeenCalledWith(7);
    expect(aiClient.forecasts.getRevenueBySegment).toHaveBeenCalledWith(7);
  });
});

import { downloadDashboardReport } from "@/components/features/dashboard/download-report";

describe("downloadDashboardReport", () => {
  let createObjectURLMock: jest.Mock;
  let revokeObjectURLMock: jest.Mock;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;

  beforeAll(() => {
    createObjectURLMock = jest.fn(() => "blob:http://localhost/mock-blob-url");
    revokeObjectURLMock = jest.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;
    // Mock HTMLAnchorElement click to prevent JSDOM navigation warning
    HTMLAnchorElement.prototype.click = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    appendChildSpy = jest.spyOn(document.body, "appendChild");
    removeChildSpy = jest.spyOn(document.body, "removeChild");
  });

  afterEach(() => {
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it("handles empty/null data and downloads a basic CSV structure", () => {
    const mockSummary = null;
    const mockForecasts = {
      ticketVolume: null,
      revenueBySegment: null,
      churnDistribution: null,
      sentimentTrend: null,
    };

    downloadDashboardReport(mockSummary, mockForecasts, 7);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();

    // Verify CSV content by checking the Blob content passed to createObjectURL
    const blobInstance = createObjectURLMock.mock.calls[0][0];
    expect(blobInstance).toBeInstanceOf(Blob);
  });

  it("structures CSV correctly when all data is present", async () => {
    const mockSummary = {
      churnRate: { value: 5.4, delta: -0.2, trend: "down" as const },
      averageClv: { value: 3450, delta: 120, trend: "up" as const },
      customerSatisfaction: { value: 4.2, delta: 0.1, trend: "up" as const },
      averageResolutionHours: { value: 3.5, delta: -0.5, trend: "down" as const },
      activeTickets: { value: 12, delta: 2, trend: "up" as const },
      activeCampaigns: { value: 2, delta: 0, trend: "flat" as const },
    };

    const mockForecasts = {
      ticketVolume: {
        historicalSeries: [{ date: "2026-08-01", count: 10 }],
        forecastSeries: [{ date: "2026-08-02", count: 12 }],
      },
      revenueBySegment: {
        totalProjected: 150000,
        confidence: 0.88,
        bySegment: { "High-Value": 90000, "Regular": 60000 },
        forecastSeries: [{ date: "2026-08-02", revenue: 152000 }],
      },
      churnDistribution: {
        low: 40,
        medium: 20,
        high: 10,
        critical: 5,
        trendSeries: [{ date: "2026-08-01", low: 39, medium: 20, high: 11, critical: 5 }],
      },
      sentimentTrend: {
        dailyScores: [{ date: "2026-08-01", score: 0.6 }],
        movingAverage: [{ date: "2026-08-01", score: 0.58 }],
        forecastNext7d: [{ date: "2026-08-02", score: 0.62 }],
      },
    };

    downloadDashboardReport(mockSummary, mockForecasts, 30);

    const blobInstance = createObjectURLMock.mock.calls[0][0];
    const blobText = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(blobInstance);
    });

    // Check headers
    expect(blobText).toContain("SentraCX Dashboard Report");
    expect(blobText).toContain("Forecast Horizon: 30 days");

    // Check sections exist
    expect(blobText).toContain("=== KPI Summary ===");
    expect(blobText).toContain("=== Ticket Volume Forecast ===");
    expect(blobText).toContain("=== Revenue Forecast ===");
    expect(blobText).toContain("=== Churn Risk Distribution ===");
    expect(blobText).toContain("=== Sentiment Trend ===");

    // Check values are present in CSV
    expect(blobText).toContain("Churn Rate,5.4,-0.2,down");
    expect(blobText).toContain("Historical,2026-08-01,10");
    expect(blobText).toContain("Forecasted,2026-08-02,12");
    expect(blobText).toContain("High-Value,90000");
    expect(blobText).toContain("Critical,5");
    expect(blobText).toContain("Daily Average,2026-08-01,0.6");
  });
});

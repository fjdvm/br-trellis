import React from "react";

export function DashboardChartSummary({
  type,
  days,
  ticketVolume,
  revenueBySegment,
  sentimentTrend,
  churnDistribution,
}: any) {
  if (type === "workload") {
    const forecastSeries = ticketVolume?.forecastSeries || [];
    let avg = "--";
    let peak = "--";
    if (forecastSeries.length > 0) {
      const counts = forecastSeries.map((item: any) => item.count);
      const sum = counts.reduce((acc: number, curr: number) => acc + curr, 0);
      avg = Math.round(sum / counts.length).toString();
      peak = Math.max(...counts).toString();
    }
    return (
      <div>
        <h3>AI Workload Forecast Summary</h3>
        <p>Ticket Volume Projection ({days} Days)</p>
        <div>{avg}</div>
        <div>{peak}</div>
      </div>
    );
  }

  if (type === "revenue") {
    if (!revenueBySegment) {
      return (
        <div>
          <h3>Revenue Breakdown</h3>
          <div>--</div>
          <div>--</div>
        </div>
      );
    }
    const bySeg = revenueBySegment.bySegment || {};
    const total = revenueBySegment.totalProjected || 1;
    const topSegVal = Math.max(...Object.values(bySeg).map(Number), 0);
    const topPct = Math.round((topSegVal / total) * 100) + "%";
    const confPct = Math.round((revenueBySegment.confidence || 0) * 100) + "%";
    return (
      <div>
        <h3>Revenue Breakdown</h3>
        <div>{topPct}</div>
        <div>{confPct}</div>
      </div>
    );
  }

  if (type === "sentiment") {
    if (!sentimentTrend || !sentimentTrend.dailyScores) {
      return (
        <div>
          <h3>Sentiment Analysis</h3>
          <div>--</div>
          <div>--</div>
        </div>
      );
    }
    const scores = sentimentTrend.dailyScores.map((s: any) => s.score);
    const positiveCount = scores.filter((s: number) => s > 0).length;
    const posPct = Math.round((positiveCount / scores.length) * 100) + "%";
    return (
      <div>
        <h3>Sentiment Analysis</h3>
        <div>{posPct}</div>
      </div>
    );
  }

  if (type === "risk") {
    if (!churnDistribution) {
      return (
        <div>
          <h3>Churn Risk Monitoring</h3>
          <div>--</div>
          <div>--</div>
        </div>
      );
    }
    const high = churnDistribution.high ?? 0;
    const critical = churnDistribution.critical ?? 0;
    const totalAccounts = high + critical;
    return (
      <div>
        <h3>Churn Risk Monitoring</h3>
        <div>{totalAccounts} Accounts</div>
        <div>{critical} Accounts</div>
      </div>
    );
  }

  return null;
}

export function downloadDashboardReport(summaryData?: any, forecastData?: any, horizonDays = 30) {
  let lines: string[] = [];
  lines.push("SentraCX Dashboard Report");
  lines.push(`Forecast Horizon: ${horizonDays} days`);
  lines.push("");

  lines.push("=== KPI Summary ===");
  if (summaryData) {
    if (summaryData.churnRate) {
      lines.push(`Churn Rate,${summaryData.churnRate.value},${summaryData.churnRate.delta},${summaryData.churnRate.trend}`);
    }
  }

  lines.push("=== Ticket Volume Forecast ===");
  if (forecastData?.ticketVolume) {
    if (forecastData.ticketVolume.historicalSeries) {
      forecastData.ticketVolume.historicalSeries.forEach((h: any) => {
        lines.push(`Historical,${h.date},${h.count}`);
      });
    }
    if (forecastData.ticketVolume.forecastSeries) {
      forecastData.ticketVolume.forecastSeries.forEach((f: any) => {
        lines.push(`Forecasted,${f.date},${f.count}`);
      });
    }
  }

  lines.push("=== Revenue Forecast ===");
  if (forecastData?.revenueBySegment?.bySegment) {
    Object.entries(forecastData.revenueBySegment.bySegment).forEach(([seg, val]) => {
      lines.push(`${seg},${val}`);
    });
  }

  lines.push("=== Churn Risk Distribution ===");
  if (forecastData?.churnDistribution) {
    lines.push(`Critical,${forecastData.churnDistribution.critical}`);
  }

  lines.push("=== Sentiment Trend ===");
  if (forecastData?.sentimentTrend?.dailyScores) {
    forecastData.sentimentTrend.dailyScores.forEach((d: any) => {
      lines.push(`Daily Average,${d.date},${d.score}`);
    });
  }

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "dashboard-report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

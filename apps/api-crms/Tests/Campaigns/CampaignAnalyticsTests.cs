using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

public sealed class CampaignAnalyticsTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"campaign-analytics-{Guid.NewGuid():N}.db");

    public CampaignAnalyticsTests()
    {
        using var context = CreateContext();
    }

    private async Task<Guid> CreateDispatchedEmailCampaign(int sentCount)
    {
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Analytics blast", new[] { "Email" }, null,
                new[] { "a@x.io", "b@x.io", "c@x.io", "d@x.io" }, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", null, "Hi", null, "Body", null, null, null, null) }),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);
        await CreateService().RecordDispatchResultAsync(
            created.Id, new CampaignDispatchResultDto(sentCount, sentCount, 0, System.Array.Empty<string>()),
            CancellationToken.None);
        return created.Id;
    }

    [Fact]
    public async Task Analytics_computes_open_and_click_rates_from_distinct_recipients()
    {
        var id = await CreateDispatchedEmailCampaign(sentCount: 4);
        var svc = CreateService();
        // 2 distinct openers (one opens twice), 1 clicker.
        await svc.RecordEventAsync(id, new CampaignEventDto("Open", "a@x.io", null, null), CancellationToken.None);
        await svc.RecordEventAsync(id, new CampaignEventDto("Open", "a@x.io", null, null), CancellationToken.None);
        await svc.RecordEventAsync(id, new CampaignEventDto("Open", "b@x.io", null, null), CancellationToken.None);
        await svc.RecordEventAsync(id, new CampaignEventDto("Click", "a@x.io", "https://shop/x", null), CancellationToken.None);

        var analytics = await CreateService().GetAnalyticsAsync(id, CancellationToken.None);

        Assert.NotNull(analytics);
        Assert.Equal(4, analytics!.SentCount);
        Assert.Equal(2, analytics.OpenedCount); // distinct
        Assert.Equal(1, analytics.ClickedCount);
        Assert.Equal(50.0, analytics.OpenRate); // 2/4
        Assert.Equal(25.0, analytics.ClickRate); // 1/4
    }

    [Fact]
    public async Task Analytics_reports_link_performance_for_clicked_urls()
    {
        var id = await CreateDispatchedEmailCampaign(sentCount: 4);
        var svc = CreateService();
        await svc.RecordEventAsync(id, new CampaignEventDto("Click", "a@x.io", "https://shop/sale", null), CancellationToken.None);
        await svc.RecordEventAsync(id, new CampaignEventDto("Click", "b@x.io", "https://shop/sale", null), CancellationToken.None);
        await svc.RecordEventAsync(id, new CampaignEventDto("Click", "c@x.io", "https://shop/new", null), CancellationToken.None);

        var analytics = await CreateService().GetAnalyticsAsync(id, CancellationToken.None);

        var top = analytics!.LinkPerformance[0];
        Assert.Equal("https://shop/sale", top.DestinationUrl);
        Assert.Equal(2, top.TotalClicks);
        Assert.Equal(2, top.UniqueClicks);
    }

    [Fact]
    public async Task EngagementMetrics_returns_per_campaign_summaries()
    {
        var id = await CreateDispatchedEmailCampaign(sentCount: 4);
        var svc = CreateService();
        await svc.RecordEventAsync(id, new CampaignEventDto("Open", "a@x.io", null, null), CancellationToken.None);
        await svc.RecordEventAsync(id, new CampaignEventDto("Open", "b@x.io", null, null), CancellationToken.None);

        var metrics = await CreateService().GetEngagementMetricsAsync(new[] { id }, CancellationToken.None);

        var m = Assert.Single(metrics);
        Assert.Equal(id, m.CampaignId);
        Assert.Equal(4, m.SentCount);
        Assert.Equal(2, m.OpenedCount);
        Assert.Equal(50.0, m.OpenRate);
    }

    [Fact]
    public async Task RecordEvent_returns_false_for_unknown_campaign()
    {
        var recorded = await CreateService().RecordEventAsync(
            Guid.NewGuid(), new CampaignEventDto("Open", "a@x.io", null, null), CancellationToken.None);
        Assert.False(recorded);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private CampaignService CreateService()
    {
        var context = CreateContext();
        var segmentService = new SegmentService(new SegmentRepository(context), context);
        return new CampaignService(new CampaignRepository(context), segmentService, context);
    }

    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source={_databasePath}")
            .Options;
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}

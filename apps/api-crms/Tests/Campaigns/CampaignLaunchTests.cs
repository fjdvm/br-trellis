using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

public sealed class CampaignLaunchTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"campaign-launch-{Guid.NewGuid():N}.db");

    public CampaignLaunchTests()
    {
        using var context = CreateContext();
    }

    [Fact]
    public async Task Launch_moves_a_Draft_to_Active()
    {
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Email blast", new[] { "Email" }, null, null, "SendNow", null, null, null),
            null, CancellationToken.None);

        var launched = await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);

        Assert.NotNull(launched);
        Assert.Equal("Active", launched!.Status);
    }

    [Fact]
    public async Task Launch_snapshots_the_email_audience_from_segment_members_and_explicit_emails()
    {
        // Seed a static segment with two members.
        Guid segmentId;
        await using (var ctx = CreateContext())
        {
            var segment = new Segment { Id = Guid.NewGuid(), Name = "VIPs", Type = SegmentType.Static, CreatedAt = DateTimeOffset.UtcNow };
            var alice = new Contact { Id = Guid.NewGuid(), Name = "Alice", Email = "Alice@Example.com", CreatedAt = DateTimeOffset.UtcNow };
            var bob = new Contact { Id = Guid.NewGuid(), Name = "Bob", Email = "bob@example.com", CreatedAt = DateTimeOffset.UtcNow };
            ctx.Segments.Add(segment);
            ctx.Contacts.AddRange(alice, bob);
            ctx.SegmentMemberships.AddRange(
                new SegmentMembership { SegmentId = segment.Id, ContactId = alice.Id, CreatedAt = DateTimeOffset.UtcNow },
                new SegmentMembership { SegmentId = segment.Id, ContactId = bob.Id, CreatedAt = DateTimeOffset.UtcNow });
            await ctx.SaveChangesAsync();
            segmentId = segment.Id;
        }

        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Segmented blast", new[] { "Email" }, segmentId.ToString(),
                new[] { "partner@x.io" }, "SendNow", null, null, null),
            null, CancellationToken.None);

        await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);

        // Recipients are snapshotted (normalized lowercase, deduped).
        await using var check = CreateContext();
        var entity = await check.Campaigns.SingleAsync(c => c.Id == created.Id);
        Assert.False(string.IsNullOrWhiteSpace(entity.ResolvedRecipients));
        var recipients = System.Text.Json.JsonSerializer.Deserialize<List<string>>(entity.ResolvedRecipients!)!;
        Assert.Contains("alice@example.com", recipients);
        Assert.Contains("bob@example.com", recipients);
        Assert.Contains("partner@x.io", recipients);
        Assert.Equal(3, recipients.Count);
    }

    [Fact]
    public async Task Launching_a_Banner_overlapping_an_active_Banner_is_rejected()
    {
        var start = DateTimeOffset.UtcNow;
        var end = start.AddDays(7);

        var first = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Banner A", new[] { "Banner" }, null, null, "Scheduled", start, end,
                new[] { new CampaignChannelContentInput("Banner", null, null, null, "A", null, "/a", null, null) }),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(first.Id, CancellationToken.None);

        var second = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Banner B", new[] { "Banner" }, null, null, "Scheduled", start.AddDays(1), end.AddDays(1),
                new[] { new CampaignChannelContentInput("Banner", null, null, null, "B", null, "/b", null, null) }),
            null, CancellationToken.None);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => CreateService().LaunchCampaignAsync(second.Id, CancellationToken.None));
    }

    [Fact]
    public async Task Email_campaigns_have_no_single_active_constraint()
    {
        var a = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Email A", new[] { "Email" }, null, null, "SendNow", null, null, null),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(a.Id, CancellationToken.None);

        var b = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Email B", new[] { "Email" }, null, null, "SendNow", null, null, null),
            null, CancellationToken.None);

        // No throw: two active Email campaigns are allowed.
        var launched = await CreateService().LaunchCampaignAsync(b.Id, CancellationToken.None);
        Assert.Equal("Active", launched!.Status);
    }

    [Fact]
    public async Task Sweep_ends_a_Banner_campaign_once_its_window_has_passed()
    {
        var start = DateTimeOffset.UtcNow.AddDays(-2);
        var end = DateTimeOffset.UtcNow.AddMinutes(-1); // already expired
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Expired banner", new[] { "Banner" }, null, null, "Scheduled", start, end,
                new[] { new CampaignChannelContentInput("Banner", null, null, null, "msg", null, "/x", null, null) }),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);

        var ended = await CreateService().SweepCampaignLifecycleAsync(CancellationToken.None);

        Assert.Contains(created.Id, ended);
        var reread = await CreateService().GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.Equal("Ended", reread!.Status);
    }

    [Fact]
    public async Task Multi_channel_stays_Active_until_every_channel_is_terminal()
    {
        // Email + Banner. Banner window already expired, but Email isn't terminal yet.
        var start = DateTimeOffset.UtcNow.AddDays(-2);
        var end = DateTimeOffset.UtcNow.AddMinutes(-1);
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Multi", new[] { "Email", "Banner" }, null, new[] { "x@y.io" }, "Scheduled", start, end,
                new[]
                {
                    new CampaignChannelContentInput("Email", null, "S", null, "B", null, null, null, null),
                    new CampaignChannelContentInput("Banner", null, null, null, "msg", null, "/x", null, null),
                }),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);

        // Sweep: Banner terminal (past end) but Email not terminal -> still Active.
        await CreateService().SweepCampaignLifecycleAsync(CancellationToken.None);
        var afterFirst = await CreateService().GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.Equal("Active", afterFirst!.Status);

        // Mark Email terminal, then sweep -> Ended.
        await using (var ctx = CreateContext())
        {
            var entity = await ctx.Campaigns.SingleAsync(c => c.Id == created.Id);
            entity.EmailTerminal = true;
            await ctx.SaveChangesAsync();
        }
        await CreateService().SweepCampaignLifecycleAsync(CancellationToken.None);
        var afterSecond = await CreateService().GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.Equal("Ended", afterSecond!.Status);
    }

    [Fact]
    public async Task GetActiveChannelContent_returns_the_active_banner_content()
    {
        var start = DateTimeOffset.UtcNow.AddMinutes(-5);
        var end = DateTimeOffset.UtcNow.AddDays(3);
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Banner promo", new[] { "Banner" }, null, null, "Scheduled", start, end,
                new[] { new CampaignChannelContentInput("Banner", null, null, null, "Free shipping!", null, "/sale", null, null, Dismissible: true) }),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);

        var content = await CreateService().GetActiveChannelContentAsync("Banner", CancellationToken.None);

        Assert.NotNull(content);
        Assert.Equal("Banner", content!.Channel);
        Assert.Equal("Free shipping!", content.Body);
        Assert.Equal("/sale", content.LinkUrl);
        Assert.True(content.Dismissible);
    }

    [Fact]
    public async Task GetActiveChannelContent_returns_null_when_no_active_campaign_for_channel()
    {
        // An active Banner exists, but Popup has nothing active.
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Banner only", new[] { "Banner" }, null, null, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Banner", null, null, null, "msg", null, "/x", null, null) }),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);

        var popup = await CreateService().GetActiveChannelContentAsync("Popup", CancellationToken.None);
        Assert.Null(popup);
    }

    [Fact]
    public async Task GetActiveChannelContent_ignores_a_draft_campaign()
    {
        // Draft (never launched) banner should not be served.
        await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Draft banner", new[] { "Banner" }, null, null, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Banner", null, null, null, "msg", null, "/x", null, null) }),
            null, CancellationToken.None);

        var content = await CreateService().GetActiveChannelContentAsync("Banner", CancellationToken.None);
        Assert.Null(content);
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

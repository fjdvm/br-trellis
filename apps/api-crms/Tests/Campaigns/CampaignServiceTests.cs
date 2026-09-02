using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

public sealed class CampaignServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"campaign-service-{Guid.NewGuid():N}.db");

    public CampaignServiceTests()
    {
        // Ensure the schema exists before the first service call.
        using var context = CreateContext();
    }

    [Fact]
    public async Task CreateCampaignAsync_defaults_to_Draft_and_persists_email_content_and_audience()
    {
        var segmentId = Guid.NewGuid();
        var input = new CreateCampaignDto(
            Title: "  Spring Sale  ",
            Channels: new[] { "Email" },
            TargetAudience: segmentId.ToString(),
            TargetEmails: new[] { "Extra@Example.com", "extra@example.com", "partner@x.io" },
            ScheduleType: "SendNow",
            StartDate: null,
            EndDate: null,
            ChannelContents: new[]
            {
                new CampaignChannelContentInput(
                    Channel: "Email",
                    TemplateId: Guid.NewGuid(),
                    Subject: "Big news",
                    Heading: null,
                    Body: "Body copy",
                    ImageUrl: "/img.png",
                    LinkUrl: null,
                    CtaText: null,
                    CtaUrl: null),
            });

        var result = await CreateService().CreateCampaignAsync(input, "user-1", CancellationToken.None);

        Assert.Equal("Draft", result.Status);
        Assert.Equal("Spring Sale", result.Title);
        Assert.Equal(new[] { "Email" }, result.Channels);
        Assert.Equal(segmentId.ToString(), result.TargetAudience);
        Assert.NotNull(result.TargetEmails);
        Assert.Equal(2, result.TargetEmails!.Count);
        Assert.Contains("extra@example.com", result.TargetEmails);
        Assert.Contains("partner@x.io", result.TargetEmails);
        var email = Assert.Single(result.ChannelContents);
        Assert.Equal("Email", email.Channel);
        Assert.Equal("Big news", email.Subject);
        Assert.Equal("Body copy", email.Body);
        Assert.Equal("user-1", result.CreatedById);

        // Confirm it persisted (fresh read).
        var reread = await CreateService().GetCampaignByIdAsync(result.Id, CancellationToken.None);
        Assert.NotNull(reread);
        Assert.Single(reread!.ChannelContents);
    }

    [Fact]
    public async Task CreateCampaignAsync_requires_a_title_and_a_channel()
    {
        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateCampaignAsync(
            new CreateCampaignDto("", new[] { "Email" }, null, null, "SendNow", null, null, null),
            null, CancellationToken.None));

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Titled", Array.Empty<string>(), null, null, "SendNow", null, null, null),
            null, CancellationToken.None));
    }

    [Fact]
    public async Task UpdateCampaignAsync_updates_a_Draft_and_replaces_channel_content()
    {
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Draft one", new[] { "Email" }, null, null, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", null, "Old", null, "old body", null, null, null, null) }),
            null, CancellationToken.None);

        var updated = await CreateService().UpdateCampaignAsync(created.Id,
            new UpdateCampaignDto("Draft renamed", null, null, null, null, null, null,
                new[] { new CampaignChannelContentInput("Email", null, "New subject", null, "new body", null, null, null, null) }),
            CancellationToken.None);

        Assert.NotNull(updated);
        Assert.Equal("Draft renamed", updated!.Title);
        var email = Assert.Single(updated.ChannelContents);
        Assert.Equal("New subject", email.Subject);
        Assert.Equal("new body", email.Body);
    }

    [Fact]
    public async Task UpdateCampaignAsync_rejects_editing_a_non_Draft_campaign()
    {
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Live one", new[] { "Email" }, null, null, "SendNow", null, null, null),
            null, CancellationToken.None);

        await SetStatus(created.Id, CampaignStatus.Active);

        await Assert.ThrowsAsync<InvalidOperationException>(() => CreateService().UpdateCampaignAsync(
            created.Id, new UpdateCampaignDto("nope", null, null, null, null, null, null, null),
            CancellationToken.None));
    }

    [Fact]
    public async Task ListCampaignsAsync_filters_by_status_and_All_returns_everything()
    {
        var draft = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Draft C", new[] { "Email" }, null, null, "SendNow", null, null, null),
            null, CancellationToken.None);
        var toActivate = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Active C", new[] { "Email" }, null, null, "SendNow", null, null, null),
            null, CancellationToken.None);
        await SetStatus(toActivate.Id, CampaignStatus.Active);

        var all = await CreateService().ListCampaignsAsync("All", CancellationToken.None);
        Assert.Equal(2, all.Count);

        var drafts = await CreateService().ListCampaignsAsync("Draft", CancellationToken.None);
        Assert.Single(drafts);
        Assert.Equal(draft.Id, drafts[0].Id);

        var actives = await CreateService().ListCampaignsAsync("Active", CancellationToken.None);
        Assert.Single(actives);
        Assert.Equal(toActivate.Id, actives[0].Id);
    }

    [Fact]
    public async Task CreateCampaignAsync_persists_independent_content_per_channel()
    {
        var input = new CreateCampaignDto(
            Title: "Multi promo",
            Channels: new[] { "Banner", "Popup" },
            TargetAudience: null,
            TargetEmails: null,
            ScheduleType: "SendNow",
            StartDate: null,
            EndDate: null,
            ChannelContents: new[]
            {
                new CampaignChannelContentInput("Banner", null, null, null, "Free shipping",
                    ImageUrl: null, LinkUrl: "/sale", CtaText: null, CtaUrl: null, Dismissible: true),
                new CampaignChannelContentInput("Popup", null, null, Heading: "Welcome!", Body: "Join us",
                    ImageUrl: "/hero.png", LinkUrl: null, CtaText: "Shop", CtaUrl: "/shop"),
            });

        var result = await CreateService().CreateCampaignAsync(input, null, CancellationToken.None);

        Assert.Equal(2, result.ChannelContents.Count);
        var banner = result.ChannelContents.Single(c => c.Channel == "Banner");
        var popup = result.ChannelContents.Single(c => c.Channel == "Popup");
        Assert.Equal("Free shipping", banner.Body);
        Assert.Equal("/sale", banner.LinkUrl);
        Assert.True(banner.Dismissible);
        Assert.Equal("Welcome!", popup.Heading);
        Assert.Equal("Join us", popup.Body);
        Assert.Equal("Shop", popup.CtaText);
        // No audience for a Banner/Popup-only campaign.
        Assert.Null(result.TargetAudience);
    }

    [Fact]
    public async Task GetDueEmailCampaignsAsync_returns_due_active_email_campaigns_filtering_opt_outs()
    {
        // A launched Email campaign due now, with an opted-out contact among recipients.
        await using (var ctx = CreateContext())
        {
            ctx.Contacts.Add(new Contact
            {
                Id = Guid.NewGuid(),
                Email = "optout@example.com",
                MarketingOptOut = true,
                CreatedAt = DateTimeOffset.UtcNow,
            });
            await ctx.SaveChangesAsync();
        }

        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Due blast", new[] { "Email" }, null,
                new[] { "keep@example.com", "optout@example.com" }, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", null, "Hello", null, "Body text", null, null, null, null) }),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);

        var due = await CreateService().GetDueEmailCampaignsAsync(CancellationToken.None);

        var dueCampaign = Assert.Single(due);
        Assert.Equal(created.Id, dueCampaign.Id);
        Assert.Equal("Hello", dueCampaign.Subject);
        Assert.Equal("Body text", dueCampaign.Body);
        Assert.Contains("keep@example.com", dueCampaign.Recipients);
        Assert.DoesNotContain("optout@example.com", dueCampaign.Recipients);
    }

    [Fact]
    public async Task GetDueEmailCampaignsAsync_excludes_draft_and_not_yet_due_campaigns()
    {
        // Draft (never launched) — not due.
        await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Draft", new[] { "Email" }, null, new[] { "a@b.io" }, "SendNow", null, null, null),
            null, CancellationToken.None);

        // Launched but scheduled in the future — not due yet.
        var future = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Future", new[] { "Email" }, null, new[] { "a@b.io" }, "Scheduled",
                DateTimeOffset.UtcNow.AddDays(3), DateTimeOffset.UtcNow.AddDays(4), null),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(future.Id, CancellationToken.None);

        var due = await CreateService().GetDueEmailCampaignsAsync(CancellationToken.None);
        Assert.Empty(due);
    }

    [Fact]
    public async Task RecordDispatchResultAsync_records_counts_and_marks_email_terminal()
    {
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Sent blast", new[] { "Email" }, null, new[] { "a@b.io" }, "SendNow", null, null, null),
            null, CancellationToken.None);
        await CreateService().LaunchCampaignAsync(created.Id, CancellationToken.None);

        var recorded = await CreateService().RecordDispatchResultAsync(
            created.Id, new CampaignDispatchResultDto(2, 1, 1, new[] { "550 mailbox full" }),
            CancellationToken.None);

        Assert.True(recorded);
        var detail = await CreateService().GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.NotNull(detail!.DispatchResult);
        Assert.Equal(1, detail.DispatchResult!.SentCount);
        Assert.Equal(1, detail.DispatchResult.FailedCount);
        Assert.Contains("550 mailbox full", detail.DispatchResult.Errors);

        // Email is terminal now; a single-Email campaign should end on the next sweep.
        await CreateService().SweepCampaignLifecycleAsync(CancellationToken.None);
        var after = await CreateService().GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.Equal("Ended", after!.Status);
    }

    [Fact]
    public async Task GetCampaignByIdAsync_returns_null_when_missing()
    {
        Assert.Null(await CreateService().GetCampaignByIdAsync(Guid.NewGuid(), CancellationToken.None));
    }

    [Fact]
    public async Task DeleteCampaignAsync_removes_the_campaign_and_its_content()
    {
        var created = await CreateService().CreateCampaignAsync(
            new CreateCampaignDto("Delete me", new[] { "Email" }, null, null, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", null, "S", null, "B", null, null, null, null) }),
            null, CancellationToken.None);

        var deleted = await CreateService().DeleteCampaignAsync(created.Id, CancellationToken.None);

        Assert.True(deleted);
        Assert.Null(await CreateService().GetCampaignByIdAsync(created.Id, CancellationToken.None));
        await using var check = CreateContext();
        Assert.Empty(check.CampaignChannelContents.Where(c => c.CampaignId == created.Id));
    }

    private async Task SetStatus(Guid id, CampaignStatus status)
    {
        await using var context = CreateContext();
        var entity = await context.Campaigns.SingleAsync(c => c.Id == id);
        entity.Status = status;
        await context.SaveChangesAsync();
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

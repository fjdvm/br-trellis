using api_crms.Data;
using api_crms.DTOs;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

/// <summary>
/// End-to-end internal dispatch (ADR 0009): Launch → the Campaign is due → the
/// dispatch pass sends it directly via the (faked) Brevo sender → the outcome is
/// recorded in-process → the Email channel is terminal → the next lifecycle sweep
/// moves a single-Email Campaign to Ended. No cross-service hop.
/// </summary>
public sealed class CampaignDispatchTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"campaign-dispatch-{Guid.NewGuid():N}.db");

    public CampaignDispatchTests()
    {
        using var context = CreateContext();
    }

    [Fact]
    public async Task Launch_then_dispatch_sends_the_due_campaign_records_the_result_and_feeds_Ended()
    {
        var sender = new RecordingMarketingEmailSender();
        var options = new CampaignDispatchOptions
        {
            UnsubscribeBaseUrl = "https://crms.example/api/marketing/unsubscribe",
        };

        var created = await Service(sender, options).CreateCampaignAsync(
            new CreateCampaignDto("Blast", new[] { "Email" }, null,
                new[] { "a@x.io", "b@x.io" }, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", null, "Hello", null, "<p>Shop now</p>", null, null, null, null) }),
            null, CancellationToken.None);
        await Service(sender, options).LaunchCampaignAsync(created.Id, CancellationToken.None);

        var dispatched = await Service(sender, options).DispatchDueEmailCampaignsAsync(CancellationToken.None);

        Assert.Equal(1, dispatched);
        // The (faked) Brevo send happened with the resolved recipients, content, and
        // the per-recipient unsubscribe base URL.
        var send = Assert.Single(sender.Sends);
        Assert.Equal(created.Id, send.CampaignId);
        Assert.Equal("Hello", send.Subject);
        Assert.Equal("<p>Shop now</p>", send.Body);
        Assert.Contains("a@x.io", send.Recipients);
        Assert.Contains("b@x.io", send.Recipients);
        Assert.Equal(options.UnsubscribeBaseUrl, send.UnsubscribeBaseUrl);

        // The outcome was recorded in-process and the Email channel is now terminal.
        var detail = await Service(sender, options).GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.NotNull(detail!.DispatchResult);
        Assert.Equal(2, detail.DispatchResult!.SentCount);
        Assert.Equal(0, detail.DispatchResult.FailedCount);

        // Terminal Email feeds the cross-Channel Ended aggregation on the next sweep.
        await Service(sender, options).SweepCampaignLifecycleAsync(CancellationToken.None);
        var after = await Service(sender, options).GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.Equal("Ended", after!.Status);
    }

    [Fact]
    public async Task Dispatch_does_not_resend_a_campaign_already_dispatched()
    {
        var sender = new RecordingMarketingEmailSender();

        var created = await Service(sender).CreateCampaignAsync(
            new CreateCampaignDto("Once", new[] { "Email" }, null, new[] { "a@x.io" }, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", null, "S", null, "B", null, null, null, null) }),
            null, CancellationToken.None);
        await Service(sender).LaunchCampaignAsync(created.Id, CancellationToken.None);

        await Service(sender).DispatchDueEmailCampaignsAsync(CancellationToken.None);
        var secondPass = await Service(sender).DispatchDueEmailCampaignsAsync(CancellationToken.None);

        Assert.Equal(0, secondPass);
        Assert.Single(sender.Sends); // only the first pass sent
    }

    [Fact]
    public async Task Dispatch_records_failures_reported_by_the_sender()
    {
        var sender = new RecordingMarketingEmailSender();

        var created = await Service(sender).CreateCampaignAsync(
            new CreateCampaignDto("Failing", new[] { "Email" }, null, new[] { "a@x.io", "b@x.io" }, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", null, "S", null, "B", null, null, null, null) }),
            null, CancellationToken.None);
        await Service(sender).LaunchCampaignAsync(created.Id, CancellationToken.None);
        sender.FailAll.Add(created.Id);

        await Service(sender).DispatchDueEmailCampaignsAsync(CancellationToken.None);

        var detail = await Service(sender).GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.Equal(0, detail!.DispatchResult!.SentCount);
        Assert.Equal(2, detail.DispatchResult.FailedCount);
        Assert.NotEmpty(detail.DispatchResult.Errors);
    }

    [Fact]
    public async Task Dispatch_marks_a_no_recipient_campaign_terminal_without_sending()
    {
        var sender = new RecordingMarketingEmailSender();

        // Launched Email campaign whose only recipient opted out -> zero recipients due.
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

        var created = await Service(sender).CreateCampaignAsync(
            new CreateCampaignDto("Empty", new[] { "Email" }, null, new[] { "optout@example.com" }, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", null, "S", null, "B", null, null, null, null) }),
            null, CancellationToken.None);
        await Service(sender).LaunchCampaignAsync(created.Id, CancellationToken.None);

        var dispatched = await Service(sender).DispatchDueEmailCampaignsAsync(CancellationToken.None);

        Assert.Equal(1, dispatched);
        Assert.Empty(sender.Sends); // nothing sent
        var detail = await Service(sender).GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.Equal(0, detail!.DispatchResult!.SentCount);
        // Terminal despite no send: the next sweep ends it.
        await Service(sender).SweepCampaignLifecycleAsync(CancellationToken.None);
        var after = await Service(sender).GetCampaignByIdAsync(created.Id, CancellationToken.None);
        Assert.Equal("Ended", after!.Status);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private CampaignService Service(
        RecordingMarketingEmailSender sender, CampaignDispatchOptions? options = null)
    {
        var context = CreateContext();
        var segmentService = new SegmentService(new SegmentRepository(context), context);
        return new CampaignService(
            new CampaignRepository(context), segmentService, context,
            sender, options ?? new CampaignDispatchOptions());
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

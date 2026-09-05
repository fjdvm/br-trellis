using api_crms.Data;
using api_crms.DTOs;
using api_crms.Helpers;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

/// <summary>
/// Exercises the full real path — not isolated renderer fixtures — for the block
/// content gap fixed under #166: save a Template via the actual BlockTemplateService
/// (the same save path the Template Builder UI calls), compose a Campaign that
/// references it by TemplateId, then confirm the real dispatch and storefront
/// resolution paths produce real HTML from that Template's blocks, instead of an
/// empty structural skeleton or raw JSON/markdown.
/// </summary>
public sealed class TemplateContentEndToEndTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"template-content-e2e-{Guid.NewGuid():N}.db");

    public TemplateContentEndToEndTests()
    {
        using var context = CreateContext();
    }

    [Fact]
    public async Task Saved_email_template_blocks_reach_the_real_dispatch_body_as_real_html()
    {
        // 1. Save a Template via the real builder save path, with real content on
        //    every block type — exactly what a user fills in via the Template
        //    Builder UI, not a hand-built renderer fixture.
        var template = await CreateBlockTemplateService().CreateAsync(
            new CreateBlockTemplateInput(
                "Summer Sale Template",
                null,
                "Email",
                new[]
                {
                    new CreateTemplateBlockInput("heading", "Hero Title", 0, "center", null, null, "Summer Sale!"),
                    new CreateTemplateBlockInput("text", "Body Copy", 1, "left", null, null, "**Save big** on everything today."),
                    new CreateTemplateBlockInput("button", "CTA", 2, null, null, null,
                        "{\"text\":\"Shop Now\",\"url\":\"https://example.com/shop\"}"),
                    new CreateTemplateBlockInput("image", "Hero Image", 3, null, null, null,
                        "{\"url\":\"https://cdn.example.com/hero.jpg\",\"alt\":\"Sale banner\"}"),
                    new CreateTemplateBlockInput("carousel", "Featured Products", 4, null, null, null,
                        "[{\"imageUrl\":\"https://cdn.example.com/p1.jpg\",\"caption\":\"Product 1\",\"linkUrl\":\"https://example.com/p1\"}]"),
                }),
            CancellationToken.None);

        // 2. Compose and launch a Campaign that references the Template by id —
        //    no Body of its own, matching what a real "template selected" compose
        //    flow would submit.
        var sender = new RecordingMarketingEmailSender();
        var created = await Service(sender).CreateCampaignAsync(
            new CreateCampaignDto("Summer Blast", new[] { "Email" }, null, new[] { "a@x.io" }, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", template.Id, "Big Sale", null, null, null, null, null, null) }),
            null, CancellationToken.None);
        await Service(sender).LaunchCampaignAsync(created.Id, CancellationToken.None);

        // 3. Dispatch through the real due-campaign resolution + send pipeline.
        var dispatched = await Service(sender).DispatchDueEmailCampaignsAsync(CancellationToken.None);
        Assert.Equal(1, dispatched);

        var send = Assert.Single(sender.Sends);
        Assert.Equal("Big Sale", send.Subject);

        // 4. The Body handed to the sender is exactly what BrevoMarketingEmailSender
        //    would run through EmailBodyRenderer.RenderToHtml in production — render
        //    it the same way and assert on real HTML, not raw JSON/labels.
        var html = EmailBodyRenderer.RenderToHtml(send.Body);

        Assert.Contains("Summer Sale!</h2>", html);
        Assert.Contains("<strong>Save big</strong>", html);
        Assert.Contains("Shop Now", html);
        Assert.Contains("https://example.com/shop", html);
        Assert.Contains("https://cdn.example.com/hero.jpg", html);
        Assert.Contains("Product 1", html);
        Assert.Contains("https://cdn.example.com/p1.jpg", html);

        // No structural placeholders and no raw JSON should have leaked through.
        Assert.DoesNotContain("Hero Title", html);
        Assert.DoesNotContain("\"type\":\"heading\"", html);
    }

    [Fact]
    public async Task Storefront_banner_renders_plain_text_bold_markers_as_real_html()
    {
        var sender = new RecordingMarketingEmailSender();
        var created = await Service(sender).CreateCampaignAsync(
            new CreateCampaignDto("Homepage Banner", new[] { "Banner" }, null, null, "SendNow", null, null,
                new[]
                {
                    new CampaignChannelContentInput(
                        "Banner", null, null, null, "**Save 20%** today only!", null, "https://example.com/deals", null, null, true),
                }),
            null, CancellationToken.None);
        await Service(sender).LaunchCampaignAsync(created.Id, CancellationToken.None);

        var active = await Service(sender).GetActiveChannelContentAsync("Banner", CancellationToken.None);

        Assert.NotNull(active);
        Assert.Contains("<strong>Save 20%</strong>", active!.Body);
        Assert.DoesNotContain("**", active.Body);
    }

    [Fact]
    public async Task Storefront_popup_resolves_a_referenced_template_to_real_block_html()
    {
        var template = await CreateBlockTemplateService().CreateAsync(
            new CreateBlockTemplateInput(
                "Welcome Popup Template",
                null,
                "Popup",
                new[]
                {
                    new CreateTemplateBlockInput("text", "Body Copy", 0, "left", null, null, "Welcome! Enjoy *10% off* your first order."),
                    new CreateTemplateBlockInput("button", "CTA", 1, null, null, null,
                        "{\"text\":\"Claim Offer\",\"url\":\"https://example.com/offer\"}"),
                }),
            CancellationToken.None);

        var sender = new RecordingMarketingEmailSender();
        var created = await Service(sender).CreateCampaignAsync(
            new CreateCampaignDto("Welcome Popup", new[] { "Popup" }, null, null, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Popup", template.Id, null, "Welcome", null, null, null, null, null) }),
            null, CancellationToken.None);
        await Service(sender).LaunchCampaignAsync(created.Id, CancellationToken.None);

        var active = await Service(sender).GetActiveChannelContentAsync("Popup", CancellationToken.None);

        Assert.NotNull(active);
        Assert.Contains("<em>10% off</em>", active!.Body);
        Assert.Contains("Claim Offer", active.Body);
        Assert.Contains("https://example.com/offer", active.Body);
        Assert.DoesNotContain("\"type\":\"text\"", active.Body);
    }

    [Fact]
    public async Task Per_campaign_block_overrides_win_but_untouched_blocks_keep_the_templates_own_content()
    {
        var template = await CreateBlockTemplateService().CreateAsync(
            new CreateBlockTemplateInput(
                "Reusable Announcement",
                null,
                "Email",
                new[]
                {
                    new CreateTemplateBlockInput("heading", "Hero Title", 0, null, null, null, "Default Headline"),
                    new CreateTemplateBlockInput("text", "Body Copy", 1, null, null, null, "Default body copy."),
                }),
            CancellationToken.None);
        var headingBlockId = template.Blocks.Single(b => b.Type == "heading").Id;
        var textBlockId = template.Blocks.Single(b => b.Type == "text").Id;

        // The composer's per-campaign block fields (channel-form-block-fields.tsx)
        // initialise every block to an empty value the moment a Template is picked,
        // then the user only actually customizes the heading. The submitted Body
        // (a dict keyed by block id) reflects exactly that: one real override, one
        // still-empty entry.
        var overridesBody = $$"""
        {
            "{{headingBlockId}}": "Custom Headline For This Campaign",
            "{{textBlockId}}": ""
        }
        """;

        var sender = new RecordingMarketingEmailSender();
        var created = await Service(sender).CreateCampaignAsync(
            new CreateCampaignDto("Announcement Blast", new[] { "Email" }, null, new[] { "a@x.io" }, "SendNow", null, null,
                new[] { new CampaignChannelContentInput("Email", template.Id, "Subject", null, overridesBody, null, null, null, null) }),
            null, CancellationToken.None);
        await Service(sender).LaunchCampaignAsync(created.Id, CancellationToken.None);
        await Service(sender).DispatchDueEmailCampaignsAsync(CancellationToken.None);

        var send = Assert.Single(sender.Sends);
        var html = EmailBodyRenderer.RenderToHtml(send.Body);

        Assert.Contains("Custom Headline For This Campaign", html);
        Assert.DoesNotContain("Default Headline", html);
        // The untouched (empty-override) text block falls back to the Template's
        // own default content rather than rendering blank.
        Assert.Contains("Default body copy.", html);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private BlockTemplateService CreateBlockTemplateService()
    {
        return new BlockTemplateService(new BlockTemplateRepository(CreateContext()));
    }

    private CampaignService Service(RecordingMarketingEmailSender sender)
    {
        var context = CreateContext();
        var segmentService = new SegmentService(new SegmentRepository(context), context);
        return new CampaignService(
            new CampaignRepository(context), segmentService, context,
            sender, new CampaignDispatchOptions());
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

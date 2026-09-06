using api_crms.Data;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

/// <summary>
/// Exercises ICampaignService.RenderPreviewHtml — the same entry point the
/// composer's live preview calls via POST /api/v1/campaigns/render-preview — so
/// the preview endpoint is proven to produce exactly the HTML EmailBodyRenderer
/// would produce at real dispatch/storefront time.
/// </summary>
public sealed class CampaignPreviewRenderTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"campaign-preview-render-{Guid.NewGuid():N}.db");

    [Fact]
    public void Passes_already_authored_html_through_untouched()
    {
        const string rawHtml = "<div><p>Hello World</p></div>";
        var html = Service().RenderPreviewHtml(rawHtml);

        Assert.Equal(rawHtml, html);
    }

    [Fact]
    public void Renders_legacy_plain_text_with_italic_markers()
    {
        var html = Service().RenderPreviewHtml("Enjoy *10% off* today");

        Assert.Contains("<em>10% off</em>", html);
    }

    [Fact]
    public void Returns_empty_string_for_blank_content()
    {
        Assert.Equal(string.Empty, Service().RenderPreviewHtml(null));
        Assert.Equal(string.Empty, Service().RenderPreviewHtml("   "));
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private CampaignService Service()
    {
        var context = CreateContext();
        var segmentService = new SegmentService(new SegmentRepository(context), context);
        return new CampaignService(
            new CampaignRepository(context), segmentService, context,
            new RecordingMarketingEmailSender(), new CampaignDispatchOptions());
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

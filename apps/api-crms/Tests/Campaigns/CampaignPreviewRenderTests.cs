using api_crms.Data;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

/// <summary>
/// Exercises ICampaignService.RenderPreviewHtml — the same entry point the
/// composer's live preview calls via POST /api/v1/campaigns/render-preview — for
/// every block type, so the preview endpoint is proven to produce exactly the HTML
/// EmailBodyRenderer would produce at real dispatch/storefront time, for each shape
/// a composer draft can be in.
/// </summary>
public sealed class CampaignPreviewRenderTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"campaign-preview-render-{Guid.NewGuid():N}.db");

    [Fact]
    public void Renders_a_heading_block()
    {
        var html = Service().RenderPreviewHtml(
            "[{\"type\":\"heading\",\"label\":\"Hero\",\"content\":\"Summer Sale!\",\"textAlign\":\"center\"}]");

        Assert.Contains("Summer Sale!</h2>", html);
        Assert.Contains("text-align:center;", html);
    }

    [Fact]
    public void Renders_a_text_block_with_bold_markers()
    {
        var html = Service().RenderPreviewHtml(
            "[{\"type\":\"text\",\"label\":\"Body\",\"content\":\"**Save big** today\"}]");

        Assert.Contains("<strong>Save big</strong>", html);
    }

    [Fact]
    public void Renders_a_button_block()
    {
        var html = Service().RenderPreviewHtml(
            "[{\"type\":\"button\",\"label\":\"CTA\",\"content\":{\"text\":\"Shop Now\",\"url\":\"https://example.com/shop\"}}]");

        Assert.Contains("Shop Now", html);
        Assert.Contains("https://example.com/shop", html);
    }

    [Fact]
    public void Renders_a_link_block()
    {
        var html = Service().RenderPreviewHtml(
            "[{\"type\":\"link\",\"label\":\"Learn More\",\"content\":{\"text\":\"Learn More\",\"url\":\"https://example.com/info\"}}]");

        Assert.Contains("Learn More", html);
        Assert.Contains("https://example.com/info", html);
    }

    [Fact]
    public void Renders_an_image_block()
    {
        var html = Service().RenderPreviewHtml(
            "[{\"type\":\"image\",\"label\":\"Hero Image\",\"content\":{\"url\":\"https://cdn.example.com/hero.jpg\",\"alt\":\"Sale\"}}]");

        Assert.Contains("https://cdn.example.com/hero.jpg", html);
        Assert.Contains("alt=\"Sale\"", html);
    }

    [Fact]
    public void Renders_a_stacked_images_block()
    {
        var html = Service().RenderPreviewHtml(
            "[{\"type\":\"carousel\",\"label\":\"Stacked Images\",\"content\":[{\"imageUrl\":\"https://cdn.example.com/p1.jpg\",\"caption\":\"Product 1\",\"linkUrl\":\"https://example.com/p1\"}]}]");

        Assert.Contains("https://cdn.example.com/p1.jpg", html);
        Assert.Contains("Product 1", html);
        Assert.Contains("https://example.com/p1", html);
    }

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

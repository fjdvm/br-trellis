using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

public sealed class TemplateServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"template-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task ListTemplatesAsync_no_filter_returns_all_ordered_by_channel_then_name()
    {
        await using var context = CreateContext();
        SeedThree(context);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListTemplatesAsync(null, CancellationToken.None);

        Assert.Equal(3, result.Count);
        // Channel is persisted as a string, so ordering is alphabetical:
        // Banner < Email < Popup; within Email, "Alpha" < "Beta".
        Assert.Equal("Banner One", result[0].Name);
        Assert.Equal("Alpha Email", result[1].Name);
        Assert.Equal("Email", result[1].Channel);
        Assert.Equal("Beta Email", result[2].Name);
    }

    [Fact]
    public async Task ListTemplatesAsync_filters_by_channel_case_insensitively()
    {
        await using var context = CreateContext();
        SeedThree(context);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListTemplatesAsync("email", CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, t => Assert.Equal("Email", t.Channel));
    }

    [Fact]
    public async Task ListTemplatesAsync_unknown_channel_returns_empty()
    {
        await using var context = CreateContext();
        SeedThree(context);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListTemplatesAsync("Sms", CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetTemplateByIdAsync_returns_mapped_template_with_content_and_format()
    {
        await using var context = CreateContext();
        var template = new Template
        {
            Id = Guid.NewGuid(),
            Name = "Promo",
            Channel = CampaignChannel.Email,
            Content = "<h1>Hi</h1>",
            Format = TemplateFormat.Html,
            ThumbnailUrl = "/thumb.png",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Templates.Add(template);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.GetTemplateByIdAsync(template.Id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Promo", result!.Name);
        Assert.Equal("Email", result.Channel);
        Assert.Equal("<h1>Hi</h1>", result.Content);
        Assert.Equal("Html", result.Format);
        Assert.Equal("/thumb.png", result.ThumbnailUrl);
    }

    [Fact]
    public async Task GetTemplateByIdAsync_returns_null_when_missing()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.GetTemplateByIdAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(result);
    }

    private static void SeedThree(AppDbContext context)
    {
        context.Templates.AddRange(
            new Template { Id = Guid.NewGuid(), Name = "Beta Email", Channel = CampaignChannel.Email, Content = "b", Format = TemplateFormat.Html, CreatedAt = DateTimeOffset.UtcNow },
            new Template { Id = Guid.NewGuid(), Name = "Alpha Email", Channel = CampaignChannel.Email, Content = "a", Format = TemplateFormat.Html, CreatedAt = DateTimeOffset.UtcNow },
            new Template { Id = Guid.NewGuid(), Name = "Banner One", Channel = CampaignChannel.Banner, Content = "x", Format = TemplateFormat.Html, CreatedAt = DateTimeOffset.UtcNow });
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private static TemplateService CreateService(AppDbContext context)
    {
        return new TemplateService(new TemplateRepository(context));
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

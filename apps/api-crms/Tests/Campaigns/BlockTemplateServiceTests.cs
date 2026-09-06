using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Campaigns;

public sealed class BlockTemplateServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"block-template-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task CreateAsync_persists_structure_only_rows_with_no_content_fields()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var input = new CreateBlockTemplateInput(
            Name: "Promotional Email Layout",
            Description: "3 structural block layout",
            Channel: "Email",
            Theme: "LightToViolet",
            Blocks: new List<CreateTemplateBlockInput>
            {
                new("text", "Top Subheader", 0, "left", true, false),
                new("image", "Main Product Shot", 1, "center", false, false),
                new("button", "Shop CTA Button", 2, "center", false, true)
            }
        );

        var created = await service.CreateAsync(input);

        Assert.NotEqual(Guid.Empty, created.Id);
        Assert.Equal("Promotional Email Layout", created.Name);
        Assert.Equal("Email", created.Channel);
        Assert.Equal("LightToViolet", created.Theme);
        Assert.Equal(3, created.Blocks.Count);

        // Verify direct EF Core database records
        await using var verifyContext = CreateContext();
        var dbRecord = await verifyContext.BlockTemplates
            .Include(t => t.Blocks)
            .FirstOrDefaultAsync(t => t.Id == created.Id);

        Assert.NotNull(dbRecord);
        Assert.Equal(3, dbRecord!.Blocks.Count);

        // Explicitly assert every block carries ONLY structural properties (type, label, order, styling)
        var block0 = dbRecord.Blocks.Single(b => b.Order == 0);
        Assert.Equal("text", block0.Type);
        Assert.Equal("Top Subheader", block0.Label);
        Assert.Equal("left", block0.TextAlign);
        Assert.True(block0.IsBold);
        Assert.False(block0.IsItalic);

        var block1 = dbRecord.Blocks.Single(b => b.Order == 1);
        Assert.Equal("image", block1.Type);
        Assert.Equal("Main Product Shot", block1.Label);
        Assert.Equal("center", block1.TextAlign);

        var block2 = dbRecord.Blocks.Single(b => b.Order == 2);
        Assert.Equal("button", block2.Type);
        Assert.Equal("Shop CTA Button", block2.Label);
        Assert.True(block2.IsItalic);
    }

    [Fact]
    public async Task ListAsync_filters_by_channel_and_excludes_archived()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.CreateAsync(new CreateBlockTemplateInput("Email One", null, "Email", "VioletToLight", [new("text", "Body", 0, null, null, null)]));
        var archivedEmail = await service.CreateAsync(new CreateBlockTemplateInput("Archived Email", null, "Email", "VioletToLight", [new("text", "Body", 0, null, null, null)]));
        await service.ArchiveAsync(archivedEmail.Id);

        // Legacy Popup row inserted directly (bypassing the service, which now
        // rejects non-Email channels) to mirror pre-existing archived data and
        // confirm ListAsync's channel filter still excludes it correctly.
        context.BlockTemplates.Add(new BlockTemplate
        {
            Id = Guid.NewGuid(),
            Name = "Legacy Popup One",
            Channel = CampaignChannel.Popup,
            IsArchived = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var emailTemplates = await service.ListAsync("Email");
        Assert.Single(emailTemplates);
        Assert.Equal("Email One", emailTemplates[0].Name);

        var allActive = await service.ListAsync(includeArchived: false);
        Assert.Equal(2, allActive.Count);

        var allWithArchived = await service.ListAsync(includeArchived: true);
        Assert.Equal(3, allWithArchived.Count);
    }

    [Fact]
    public async Task CreateAsync_rejects_exceeding_channel_per_type_maximum()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        // Email allows max 3 image blocks. Sending 4 image blocks must fail.
        var invalidEmailInput = new CreateBlockTemplateInput(
            "Invalid Email",
            null,
            "Email",
            "VioletToLight",
            [
                new("image", "Image 1", 0, null, null, null),
                new("image", "Image 2", 1, null, null, null),
                new("image", "Image 3", 2, null, null, null),
                new("image", "Image 4", 3, null, null, null)
            ]
        );

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(invalidEmailInput));
        Assert.Contains("Email templates allow a maximum of 3 image component", ex.Message);
    }

    [Theory]
    [InlineData("Banner")]
    [InlineData("Popup")]
    public async Task CreateAsync_rejects_non_email_channel(string channel)
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var input = new CreateBlockTemplateInput(
            "Should Not Save",
            null,
            channel,
            "VioletToLight",
            [new("text", "Body", 0, null, null, null)]
        );

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(input));
        Assert.Contains("Email channel", ex.Message);
    }

    [Theory]
    [InlineData("Banner")]
    [InlineData("Popup")]
    public async Task UpdateAsync_rejects_non_email_channel(string channel)
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var created = await service.CreateAsync(new CreateBlockTemplateInput("Email Template", null, "Email", "VioletToLight", [new("text", "Body", 0, null, null, null)]));

        var updateInput = new UpdateBlockTemplateInput(
            "Email Template",
            null,
            channel,
            "VioletToLight",
            [new("text", "Body", 0, null, null, null)]
        );

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.UpdateAsync(created.Id, updateInput));
        Assert.Contains("Email channel", ex.Message);
    }

    [Fact]
    public async Task UpdateAsync_replaces_block_structure_without_restriction()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var created = await service.CreateAsync(new CreateBlockTemplateInput("Initial Layout", null, "Email", "VioletToLight", [new("text", "Old Text", 0, null, null, null)]));

        var updateInput = new UpdateBlockTemplateInput(
            "Updated Layout",
            "New description",
            "Email",
            "LightToViolet",
            [
                new("heading", "New Heading", 0, null, null, null),
                new("button", "New CTA", 1, null, null, null)
            ]
        );

        var updated = await service.UpdateAsync(created.Id, updateInput);
        Assert.NotNull(updated);
        Assert.Equal("Updated Layout", updated!.Name);
        Assert.Equal("LightToViolet", updated.Theme);
        Assert.Equal(2, updated.Blocks.Count);
        Assert.Equal("heading", updated.Blocks[0].Type);
        Assert.Equal("button", updated.Blocks[1].Type);
    }

    [Fact]
    public async Task CreateAsync_rejects_invalid_theme()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var input = new CreateBlockTemplateInput(
            "Bad Theme",
            null,
            "Email",
            "Rainbow",
            [new("text", "Body", 0, null, null, null)]
        );

        var ex = await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(input));
        Assert.Contains("Invalid theme", ex.Message);
    }

    public void Dispose()
    {
        if (File.Exists(_databasePath))
        {
            File.Delete(_databasePath);
        }
    }

    private static BlockTemplateService CreateService(AppDbContext context)
    {
        return new BlockTemplateService(new BlockTemplateRepository(context));
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

using System.Text.Json;
using api_crms.Data;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Segments;

public sealed class SegmentServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"segment-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task Dynamic_segment_MatchAll_returns_contacts_matching_all_conditions()
    {
        await using var context = CreateContext();
        var contact1 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Alice", SentimentScore = -0.5m };
        var contact2 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Bob", SentimentScore = 0.8m };
        var contact3 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Alice", SentimentScore = 0.9m };
        context.Contacts.AddRange(contact1, contact2, contact3);

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[]
            {
                new { Field = "Name", Operator = "equals", Value = "Alice" },
                new { Field = "SentimentScore", Operator = "less_than", Value = "0" },
            }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "Negative Alices",
            Type = SegmentType.Dynamic,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.EvaluateSegmentAsync(segment.Id, CancellationToken.None);

        Assert.Single(members);
        Assert.Equal(contact1.Id, members[0].Id);
    }

    [Fact]
    public async Task Dynamic_segment_MatchAny_returns_contacts_matching_any_condition()
    {
        await using var context = CreateContext();
        var contact1 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Alice", SentimentScore = 0.5m };
        var contact2 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Bob", SentimentScore = -0.8m };
        var contact3 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Carol", SentimentScore = 0.9m };
        context.Contacts.AddRange(contact1, contact2, contact3);

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAny",
            Conditions = new[]
            {
                new { Field = "Name", Operator = "equals", Value = "Alice" },
                new { Field = "SentimentScore", Operator = "less_than", Value = "0" },
            }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "Alice or Negative",
            Type = SegmentType.Dynamic,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.EvaluateSegmentAsync(segment.Id, CancellationToken.None);

        Assert.Equal(2, members.Count);
        Assert.Contains(members, c => c.Id == contact1.Id);
        Assert.Contains(members, c => c.Id == contact2.Id);
    }

    [Fact]
    public async Task Static_segment_returns_explicit_membership()
    {
        await using var context = CreateContext();
        var contact1 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Alice" };
        var contact2 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Bob" };
        context.Contacts.AddRange(contact1, contact2);

        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "VIP list",
            Type = SegmentType.Static,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        context.SegmentMemberships.Add(new SegmentMembership
        {
            SegmentId = segment.Id,
            ContactId = contact1.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.EvaluateSegmentAsync(segment.Id, CancellationToken.None);

        Assert.Single(members);
        Assert.Equal(contact1.Id, members[0].Id);
    }

    [Fact]
    public async Task At_Risk_segment_returns_contacts_below_sentiment_threshold()
    {
        await using var context = CreateContext();
        var atRisk = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Risk", SentimentScore = -0.5m };
        var healthy = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Healthy", SentimentScore = 0.8m };
        context.Contacts.AddRange(atRisk, healthy);

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[]
            {
                new { Field = "SentimentScore", Operator = "less_than", Value = "0" },
            }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "At-Risk Customers",
            Type = SegmentType.Dynamic,
            IsSystemDefined = true,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.EvaluateSegmentAsync(segment.Id, CancellationToken.None);

        Assert.Single(members);
        Assert.Equal(atRisk.Id, members[0].Id);
    }

    [Fact]
    public async Task DeleteSegment_throws_for_system_defined_segment()
    {
        await using var context = CreateContext();
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "At-Risk Customers",
            Type = SegmentType.Dynamic,
            IsSystemDefined = true,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.DeleteSegmentAsync(segment.Id, CancellationToken.None));
    }

    [Fact]
    public async Task Dynamic_segment_evaluates_custom_field_values()
    {
        await using var context = CreateContext();
        var definition = new CustomFieldDefinition
        {
            Id = Guid.NewGuid(),
            Name = "Region",
            FieldType = CustomFieldType.Text,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.CustomFieldDefinitions.Add(definition);

        var contact1 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Alice" };
        var contact2 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Bob" };
        context.Contacts.AddRange(contact1, contact2);

        context.CustomFieldValues.Add(new CustomFieldValue
        {
            Id = Guid.NewGuid(),
            ContactId = contact1.Id,
            CustomFieldDefinitionId = definition.Id,
            TextValue = "APAC",
        });
        context.CustomFieldValues.Add(new CustomFieldValue
        {
            Id = Guid.NewGuid(),
            ContactId = contact2.Id,
            CustomFieldDefinitionId = definition.Id,
            TextValue = "EMEA",
        });

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[]
            {
                new { Field = "Region", Operator = "equals", Value = "APAC" },
            }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "APAC region",
            Type = SegmentType.Dynamic,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.EvaluateSegmentAsync(segment.Id, CancellationToken.None);

        Assert.Single(members);
        Assert.Equal(contact1.Id, members[0].Id);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private SegmentService CreateService(AppDbContext context)
    {
        return new SegmentService(new SegmentRepository(context), context);
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

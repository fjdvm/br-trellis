using System.Text.Json;
using api_crms.Controllers;
using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.AspNetCore.Mvc;
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

    [Fact]
    public async Task Dynamic_segment_evaluates_ltv_condition()
    {
        await using var context = CreateContext();
        var highValue = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "High", LifetimeValue = 5000m };
        var lowValue = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Low", LifetimeValue = 50m };
        context.Contacts.AddRange(highValue, lowValue);

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[]
            {
                new { Field = "LifetimeValue", Operator = "greater_than", Value = "1000" },
            }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "High Value Customers",
            Type = SegmentType.Dynamic,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.EvaluateSegmentAsync(segment.Id, CancellationToken.None);

        Assert.Single(members);
        Assert.Equal(highValue.Id, members[0].Id);
    }

    [Fact]
    public async Task Dynamic_segment_evaluates_in_stock_condition()
    {
        await using var context = CreateContext();
        var contact1 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "InStock Buyer" };
        var contact2 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "OutOfStock Buyer" };
        context.Contacts.AddRange(contact1, contact2);

        // Create products
        var productInStock = new Product
        {
            Id = Guid.NewGuid(),
            PlatformProductId = "prod-in-stock",
            Name = "Available Widget",
            Price = 25m,
            InStock = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        var productOutOfStock = new Product
        {
            Id = Guid.NewGuid(),
            PlatformProductId = "prod-out-of-stock",
            Name = "Unavailable Widget",
            Price = 30m,
            InStock = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        context.Products.AddRange(productInStock, productOutOfStock);

        // Contact1 has cart with in-stock product
        var cart1 = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-in-stock",
            ContactId = contact1.Id,
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        cart1.Items.Add(new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart1.Id,
            ProductId = "prod-in-stock",
            ProductName = "Available Widget",
            Quantity = 1,
            UnitPrice = 25m,
        });
        context.Carts.Add(cart1);

        // Contact2 has cart with out-of-stock product
        var cart2 = new Cart
        {
            Id = Guid.NewGuid(),
            PlatformCartId = "cart-out-of-stock",
            ContactId = contact2.Id,
            Status = CartStatus.Active,
            LastActivityAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        cart2.Items.Add(new CartItem
        {
            Id = Guid.NewGuid(),
            CartId = cart2.Id,
            ProductId = "prod-out-of-stock",
            ProductName = "Unavailable Widget",
            Quantity = 1,
            UnitPrice = 30m,
        });
        context.Carts.Add(cart2);

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[]
            {
                new { Field = "in_stock", Operator = "equals", Value = "true" },
            }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "Contacts with in-stock items",
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
    public async Task Dynamic_segment_ltv_and_in_stock_compose_with_match_all()
    {
        await using var context = CreateContext();
        var contact1 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "High+InStock", LifetimeValue = 2000m };
        var contact2 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Low+InStock", LifetimeValue = 50m };
        context.Contacts.AddRange(contact1, contact2);

        context.Products.Add(new Product
        {
            Id = Guid.NewGuid(),
            PlatformProductId = "prod-1",
            Name = "Widget",
            Price = 25m,
            InStock = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });

        // Both contacts have carts with in-stock products
        foreach (var contact in new[] { contact1, contact2 })
        {
            var cart = new Cart
            {
                Id = Guid.NewGuid(),
                PlatformCartId = $"cart-{contact.Id}",
                ContactId = contact.Id,
                Status = CartStatus.Active,
                LastActivityAt = DateTimeOffset.UtcNow,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow,
            };
            cart.Items.Add(new CartItem
            {
                Id = Guid.NewGuid(),
                CartId = cart.Id,
                ProductId = "prod-1",
                ProductName = "Widget",
                Quantity = 1,
                UnitPrice = 25m,
            });
            context.Carts.Add(cart);
        }

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[]
            {
                new { Field = "LifetimeValue", Operator = "greater_than", Value = "1000" },
                new { Field = "in_stock", Operator = "equals", Value = "true" },
            }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "High value + in stock",
            Type = SegmentType.Dynamic,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.EvaluateSegmentAsync(segment.Id, CancellationToken.None);

        // Only contact1 matches both conditions
        Assert.Single(members);
        Assert.Equal(contact1.Id, members[0].Id);
    }

    // --- ListSegmentsAsync tests ---

    [Fact]
    public async Task ListSegmentsAsync_returns_all_non_deleted_segments_with_correct_dto_shape()
    {
        await using var context = CreateContext();
        var contact = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Alice", SentimentScore = -0.5m, LifetimeValue = 2000m };
        context.Contacts.Add(contact);

        // Dynamic segment
        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[] { new { Field = "SentimentScore", Operator = "less_than", Value = "0" } }
        });
        var dynamicSegment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "At-Risk Customers",
            Type = SegmentType.Dynamic,
            IsSystemDefined = true,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(dynamicSegment);

        // Static segment
        var staticSegment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "VIP List",
            Type = SegmentType.Static,
            IsSystemDefined = false,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(staticSegment);
        context.SegmentMemberships.Add(new SegmentMembership
        {
            SegmentId = staticSegment.Id,
            ContactId = contact.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        });

        // Deleted segment — should not appear
        var deletedSegment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "Deleted",
            Type = SegmentType.Dynamic,
            CreatedAt = DateTimeOffset.UtcNow,
            DeletedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(deletedSegment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var results = await service.ListSegmentsAsync(CancellationToken.None);

        Assert.Equal(2, results.Count);

        var atRisk = results.Single(s => s.Name == "At-Risk Customers");
        Assert.Equal("Dynamic", atRisk.Type);
        Assert.True(atRisk.IsSystemDefined);
        Assert.NotNull(atRisk.Rule);
        Assert.Equal("MatchAll", atRisk.Rule!.MatchMode);
        Assert.Single(atRisk.Rule.Conditions);
        Assert.Equal("SentimentScore", atRisk.Rule.Conditions[0].Field);
        Assert.Equal("less_than", atRisk.Rule.Conditions[0].Operator);
        Assert.Equal("0", atRisk.Rule.Conditions[0].Value);
        Assert.Equal(1, atRisk.MemberCount); // Alice has -0.5 sentiment

        var vip = results.Single(s => s.Name == "VIP List");
        Assert.Equal("Static", vip.Type);
        Assert.False(vip.IsSystemDefined);
        Assert.Null(vip.Rule);
        Assert.Equal(1, vip.MemberCount); // Alice is a static member
    }

    [Fact]
    public async Task ListSegmentsAsync_computes_correct_member_count_for_dynamic_segment()
    {
        await using var context = CreateContext();
        var c1 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "High", LifetimeValue = 5000m };
        var c2 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Low", LifetimeValue = 100m };
        var c3 = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "AlsoHigh", LifetimeValue = 3000m };
        context.Contacts.AddRange(c1, c2, c3);

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[] { new { Field = "LifetimeValue", Operator = "greater_than", Value = "1000" } }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "High Value",
            Type = SegmentType.Dynamic,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var results = await service.ListSegmentsAsync(CancellationToken.None);

        var dto = Assert.Single(results);
        Assert.Equal(2, dto.MemberCount); // c1 and c3 match
    }

    // --- GetSegmentMembersAsync tests ---

    [Fact]
    public async Task GetSegmentMembersAsync_returns_null_for_missing_segment()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.GetSegmentMembersAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetSegmentMembersAsync_returns_members_for_static_segment()
    {
        await using var context = CreateContext();
        var contact = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Alice", Email = "alice@example.com", LifetimeValue = 500m };
        context.Contacts.Add(contact);

        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "VIP",
            Type = SegmentType.Static,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        context.SegmentMemberships.Add(new SegmentMembership
        {
            SegmentId = segment.Id,
            ContactId = contact.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.GetSegmentMembersAsync(segment.Id, CancellationToken.None);

        Assert.NotNull(members);
        var member = Assert.Single(members);
        Assert.Equal("Alice", member.Name);
        Assert.Equal("alice@example.com", member.Email);
        Assert.Equal(500m, member.LifetimeValue);
    }

    [Fact]
    public async Task GetSegmentMembersAsync_returns_members_for_dynamic_segment()
    {
        await using var context = CreateContext();
        var atRisk = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Risky", SentimentScore = -0.8m };
        var healthy = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Healthy", SentimentScore = 0.5m };
        context.Contacts.AddRange(atRisk, healthy);

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[] { new { Field = "SentimentScore", Operator = "less_than", Value = "0" } }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "At-Risk",
            Type = SegmentType.Dynamic,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var members = await service.GetSegmentMembersAsync(segment.Id, CancellationToken.None);

        Assert.NotNull(members);
        var member = Assert.Single(members);
        Assert.Equal("Risky", member.Name);
    }

    // --- Controller-level tests ---

    [Fact]
    public async Task SegmentController_ListSegments_returns_ok_with_items()
    {
        await using var context = CreateContext();
        context.Segments.Add(new Segment
        {
            Id = Guid.NewGuid(),
            Name = "Test Segment",
            Type = SegmentType.Static,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var controller = new SegmentController(service);

        var response = await controller.ListSegments(CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IReadOnlyList<SegmentDto>>(result.Value);
        Assert.Single(items);
        Assert.Equal("Test Segment", items[0].Name);
    }

    [Fact]
    public async Task SegmentController_GetSegmentMembers_returns_NotFound_for_missing_segment()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var controller = new SegmentController(service);

        var response = await controller.GetSegmentMembers(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    public async Task SegmentController_GetSegmentMembers_returns_ok_for_static_segment()
    {
        await using var context = CreateContext();
        var contact = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Bob" };
        context.Contacts.Add(contact);

        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "Static Seg",
            Type = SegmentType.Static,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        context.SegmentMemberships.Add(new SegmentMembership
        {
            SegmentId = segment.Id,
            ContactId = contact.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var controller = new SegmentController(service);

        var response = await controller.GetSegmentMembers(segment.Id, CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var members = Assert.IsAssignableFrom<IReadOnlyList<SegmentMemberDto>>(result.Value);
        Assert.Single(members);
        Assert.Equal("Bob", members[0].Name);
    }

    [Fact]
    public async Task SegmentController_GetSegmentMembers_returns_ok_for_dynamic_segment()
    {
        await using var context = CreateContext();
        var contact = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow, Name = "Risky", SentimentScore = -1m };
        context.Contacts.Add(contact);

        var rule = JsonSerializer.Serialize(new
        {
            MatchMode = "MatchAll",
            Conditions = new[] { new { Field = "SentimentScore", Operator = "less_than", Value = "0" } }
        });
        var segment = new Segment
        {
            Id = Guid.NewGuid(),
            Name = "Dynamic Seg",
            Type = SegmentType.Dynamic,
            Rule = rule,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Segments.Add(segment);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var controller = new SegmentController(service);

        var response = await controller.GetSegmentMembers(segment.Id, CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var members = Assert.IsAssignableFrom<IReadOnlyList<SegmentMemberDto>>(result.Value);
        Assert.Single(members);
        Assert.Equal("Risky", members[0].Name);
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

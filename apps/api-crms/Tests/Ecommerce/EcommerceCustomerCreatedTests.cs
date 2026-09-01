using System.Text.Json;
using api_crms.Data;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Ecommerce;

/// <summary>
/// Covers eager Contact creation on shop signup: a <c>customer.created</c> event
/// resolves/creates the Contact via ContactIdentityService from the customer's
/// email (and name), so a newly registered shopper appears in CRM Contacts without
/// having placed an order or started a chat first.
/// </summary>
public sealed class EcommerceCustomerCreatedTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"ecommerce-customer-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task Customer_created_creates_contact_from_email_and_name()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = CustomerPayload("evt-1", "newbie@example.com", "New Bie");

        var processed = await service.ProcessEventAsync("evt-1", "customer.created", payload);

        Assert.True(processed);
        var contact = await context.Contacts.SingleAsync();
        Assert.Equal("newbie@example.com", contact.Email);
        Assert.Equal("New Bie", contact.Name);
    }

    [Fact]
    public async Task Customer_created_matches_existing_contact_by_email()
    {
        await using var context = CreateContext();
        var existingId = await SeedContactAsync(context, "returning@example.com");
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "customer.created",
            CustomerPayload("evt-1", "returning@example.com", "Returning Shopper"));

        Assert.Equal(1, await context.Contacts.CountAsync());
        Assert.Equal(existingId, (await context.Contacts.SingleAsync()).Id);
    }

    [Fact]
    public async Task Customer_created_without_email_throws_and_rolls_back()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = JsonSerializer.Serialize(new
        {
            EventId = "evt-1",
            EventType = "customer.created",
            Data = new { Name = "No Email", OccurredAt = DateTimeOffset.UtcNow.ToString("O") },
        });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessEventAsync("evt-1", "customer.created", payload));
        Assert.Equal(0, await context.Contacts.CountAsync());
        Assert.Equal(0, await context.ProcessedEvents.CountAsync());
    }

    [Fact]
    public async Task Duplicate_customer_created_event_is_deduped()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var payload = CustomerPayload("evt-1", "dupe@example.com", "Dupe");

        var first = await service.ProcessEventAsync("evt-1", "customer.created", payload);
        var second = await service.ProcessEventAsync("evt-1", "customer.created", payload);

        Assert.True(first);
        Assert.False(second);
        Assert.Equal(1, await context.Contacts.CountAsync());
    }

    public void Dispose() => File.Delete(_databasePath);

    private EcommerceIngestionService CreateService(AppDbContext context)
    {
        var identityService = new ContactIdentityService(
            new ContactIdentityRepository(context), new ContactIdentityOptions());
        return new EcommerceIngestionService(new EcommerceRepository(context), identityService);
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

    private static async Task<Guid> SeedContactAsync(AppDbContext context, string email)
    {
        var contact = new Contact
        {
            Id = Guid.NewGuid(), Name = "Existing", Email = email,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();
        return contact.Id;
    }

    private static string CustomerPayload(string eventId, string email, string name)
    {
        return JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "customer.created",
            Data = new
            {
                CustomerEmail = email,
                Name = name,
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });
    }
}

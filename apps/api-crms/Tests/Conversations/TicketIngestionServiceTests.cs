using System.Text;
using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Helpers;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Conversations;

/// <summary>
/// Covers #122: the shop-chat Tickets/Messages ingestion service. New conversations
/// become Tickets tagged <see cref="TicketSource.Ecommerce"/>; the Contact is
/// resolved via ContactIdentityService from the supplied email; redelivery dedups;
/// subsequent messages append to the existing conversation in order.
/// </summary>
public sealed class TicketIngestionServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"ticket-ingestion-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task New_conversation_creates_ecommerce_sourced_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = MessagePayload("evt-1", "conv-1", "shopper@example.com", "Hi, where is my order?");

        var processed = await service.ProcessEventAsync("evt-1", "ticket.message.received", payload);

        Assert.True(processed);
        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal("conv-1", ticket.ExternalThreadId);
        Assert.Equal(TicketSource.Ecommerce, ticket.Source);
        Assert.Equal(TicketStatus.Unclaimed, ticket.Status);
        Assert.Equal(WaitingOn.Agent, ticket.WaitingOn);
    }

    [Fact]
    public async Task New_conversation_resolves_contact_from_email()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = MessagePayload("evt-1", "conv-1", "shopper@example.com", "Hello");

        await service.ProcessEventAsync("evt-1", "ticket.message.received", payload);

        var contact = await context.Contacts.SingleAsync();
        Assert.Equal("shopper@example.com", contact.Email);
        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal(contact.Id, ticket.ContactId);

        var message = await context.Messages.SingleAsync();
        Assert.Equal(MessageSenderType.Contact, message.SenderType);
        Assert.Equal(contact.Id, message.SenderContactId);
        Assert.Equal("Hello", message.Content);
    }

    [Fact]
    public async Task New_conversation_matches_existing_contact_by_email()
    {
        await using var context = CreateContext();
        var existingId = await SeedContactAsync(context, "returning@example.com");
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "returning@example.com", "Me again"));

        Assert.Equal(1, await context.Contacts.CountAsync());
        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal(existingId, ticket.ContactId);
    }

    [Fact]
    public async Task Second_message_on_conversation_appends_in_order_without_new_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "First"));
        await service.ProcessEventAsync("evt-2", "ticket.message.received",
            MessagePayload("evt-2", "conv-1", "shopper@example.com", "Second"));

        Assert.Equal(1, await context.Tickets.CountAsync());
        var messages = (await context.Messages.ToListAsync())
            .OrderBy(m => m.SentAt)
            .ToList();
        Assert.Equal(2, messages.Count);
        Assert.Equal("First", messages[0].Content);
        Assert.Equal("Second", messages[1].Content);
    }

    [Fact]
    public async Task Duplicate_event_id_is_a_no_op()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = MessagePayload("evt-1", "conv-1", "shopper@example.com", "Hi");

        var first = await service.ProcessEventAsync("evt-1", "ticket.message.received", payload);
        var second = await service.ProcessEventAsync("evt-1", "ticket.message.received", payload);

        Assert.True(first);
        Assert.False(second);
        Assert.Equal(1, await context.Tickets.CountAsync());
        Assert.Equal(1, await context.Messages.CountAsync());
    }

    [Fact]
    public async Task Unknown_event_type_throws_and_leaves_zero_rows()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = MessagePayload("evt-x", "conv-1", "shopper@example.com", "Hi");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessEventAsync("evt-x", "ticket.closed", payload));

        Assert.Equal(0, await context.Tickets.CountAsync());
        Assert.Equal(0, await context.Messages.CountAsync());
        Assert.Equal(0, await context.ProcessedEvents.CountAsync());
    }

    [Fact]
    public async Task Missing_email_throws_and_rolls_back()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = JsonSerializer.Serialize(new
        {
            EventId = "evt-1",
            EventType = "ticket.message.received",
            Data = new
            {
                ConversationId = "conv-1",
                CustomerEmail = "",
                MessageBody = "Hi",
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessEventAsync("evt-1", "ticket.message.received", payload));
        Assert.Equal(0, await context.Tickets.CountAsync());
        Assert.Equal(0, await context.ProcessedEvents.CountAsync());
    }

    // HMAC contract is shared with the other webhooks (HmacSignatureValidator).
    [Fact]
    public void Valid_signature_passes_validation()
    {
        const string secret = "tickets-secret";
        var body = Encoding.UTF8.GetBytes(MessagePayload("evt-1", "conv-1", "a@b.com", "Hi"));
        var hash = System.Security.Cryptography.HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret), body);
        var signature = "sha256=" + Convert.ToHexStringLower(hash);

        Assert.True(HmacSignatureValidator.IsValid(body, signature, secret));
    }

    public void Dispose() => File.Delete(_databasePath);

    private TicketIngestionService CreateService(AppDbContext context)
    {
        var identityService = new ContactIdentityService(
            new ContactIdentityRepository(context),
            new ContactIdentityOptions());
        return new TicketIngestionService(
            new TicketIngestionRepository(context), identityService);
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
            Id = Guid.NewGuid(),
            Name = "Existing",
            Email = email,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();
        return contact.Id;
    }

    private static string MessagePayload(
        string eventId, string conversationId, string email, string body)
    {
        return JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "ticket.message.received",
            Data = new
            {
                ConversationId = conversationId,
                CustomerEmail = email,
                CustomerName = "A Shopper",
                MessageBody = body,
                Subject = "Shop chat",
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });
    }
}

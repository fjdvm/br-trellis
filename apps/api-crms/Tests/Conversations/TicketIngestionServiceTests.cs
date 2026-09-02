using System.Text;
using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Helpers;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using api_crms.Tests.Helpers;
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
        // #148 / ADR 0006: a shop-chat ticket is keyed on its own id — ExternalThreadId
        // equals Ticket.Id, not the inbound conversationId.
        Assert.Equal(ticket.Id.ToString(), ticket.ExternalThreadId);
        Assert.Equal(TicketSource.Ecommerce, ticket.Source);
        Assert.Equal(TicketStatus.Unclaimed, ticket.Status);
        Assert.Equal(WaitingOn.Agent, ticket.WaitingOn);
    }

    // --- Caller-supplied ticket id (#148 amendment, ADR 0006 Option 1) ---
    // api-oos mints the shop-chat conversation key as a Guid and sends it as the
    // ConversationId; ingestion adopts a well-formed, non-colliding Guid as the new
    // Ticket's own id, and falls back to generating one otherwise. Either way the
    // ExternalThreadId == Ticket.Id invariant holds.

    [Fact]
    public async Task Caller_supplied_guid_conversation_id_becomes_the_ticket_id()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var suppliedId = Guid.NewGuid();

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", suppliedId.ToString(), "shopper@example.com", "Hi"));

        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal(suppliedId, ticket.Id);
        Assert.Equal(suppliedId.ToString(), ticket.ExternalThreadId);
    }

    [Fact]
    public async Task Non_guid_conversation_id_falls_back_to_a_generated_ticket_id()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "not-a-guid", "shopper@example.com", "Hi"));

        var ticket = await context.Tickets.SingleAsync();
        // A generated Guid — not the malformed supplied value — and still self-keyed.
        Assert.NotEqual(Guid.Empty, ticket.Id);
        Assert.Equal(ticket.Id.ToString(), ticket.ExternalThreadId);
    }

    [Fact]
    public async Task Supplied_id_that_already_resolves_appends_rather_than_overwriting()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        // api-oos mints one Guid for a conversation and reuses it as the key across the
        // session. The first message creates the ticket keyed on it; a later message on
        // the same id must append to that same ticket — never re-create or overwrite it.
        var conversationId = Guid.NewGuid();
        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", conversationId.ToString(), "shopper@example.com", "First"));
        await service.ProcessEventAsync("evt-2", "ticket.message.received",
            MessagePayload("evt-2", conversationId.ToString(), "shopper@example.com", "Second"));

        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal(conversationId, ticket.Id);
        var messages = (await context.Messages.ToListAsync()).OrderBy(m => m.SentAt).ToList();
        Assert.Equal(new[] { "First", "Second" }, messages.Select(m => m.Content).ToArray());
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
    public async Task New_conversation_broadcasts_the_message_to_its_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "Live shop chat"));

        var ticket = await context.Tickets.SingleAsync();
        var broadcast = Assert.Single(_broadcaster.Messages);
        Assert.Equal(ticket.Id, broadcast.TicketId);
        Assert.Equal("Live shop chat", broadcast.Message.Content);
    }

    [Fact]
    public async Task Second_message_broadcasts_the_appended_message_to_its_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "First"));
        // The client now holds the canonical ticket id and sends it as the conversation
        // key on subsequent messages (#148/#149, ADR 0006).
        var ticketKey = (await context.Tickets.SingleAsync()).Id.ToString();
        await service.ProcessEventAsync("evt-2", "ticket.message.received",
            MessagePayload("evt-2", ticketKey, "shopper@example.com", "Second"));

        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal(2, _broadcaster.Messages.Count);
        var last = _broadcaster.Messages[^1];
        Assert.Equal(ticket.Id, last.TicketId);
        Assert.Equal("Second", last.Message.Content);
    }

    [Fact]
    public async Task New_conversation_broadcasts_a_new_ticket_to_the_inbox()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "Hi"));

        var ticket = await context.Tickets.SingleAsync();
        var summary = Assert.Single(_broadcaster.NewTickets);
        Assert.Equal(ticket.Id, summary.Id);
        Assert.Equal("Ecommerce", summary.Source);
        Assert.Equal("Agent", summary.WaitingOn);
        Assert.Empty(_broadcaster.StatusChanges);
    }

    [Fact]
    public async Task Second_message_broadcasts_a_status_change_not_a_new_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "First"));
        var ticketKey = (await context.Tickets.SingleAsync()).Id.ToString();
        await service.ProcessEventAsync("evt-2", "ticket.message.received",
            MessagePayload("evt-2", ticketKey, "shopper@example.com", "Second"));

        var ticket = await context.Tickets.SingleAsync();
        Assert.Single(_broadcaster.NewTickets);
        var change = Assert.Single(_broadcaster.StatusChanges);
        Assert.Equal(ticket.Id, change.Id);
        Assert.Equal("Agent", change.WaitingOn);
    }

    [Fact]
    public async Task Failed_ingestion_does_not_broadcast()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        // Missing email → InvalidOperationException, rolled back before commit.
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

        Assert.Empty(_broadcaster.Messages);
        Assert.Empty(_broadcaster.NewTickets);
        Assert.Empty(_broadcaster.StatusChanges);
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
        var ticketKey = (await context.Tickets.SingleAsync()).Id.ToString();
        await service.ProcessEventAsync("evt-2", "ticket.message.received",
            MessagePayload("evt-2", ticketKey, "shopper@example.com", "Second"));

        Assert.Equal(1, await context.Tickets.CountAsync());
        var messages = (await context.Messages.ToListAsync())
            .OrderBy(m => m.SentAt)
            .ToList();
        Assert.Equal(2, messages.Count);
        Assert.Equal("First", messages[0].Content);
        Assert.Equal("Second", messages[1].Content);
    }

    // --- Cancellation (ticket.canceled) ---
    // A shop customer canceling their ticket in web-shop is relayed by api-oos as a
    // `ticket.canceled` event on the same HMAC Tickets webhook. Ingestion resolves the
    // ticket by its conversation key and flips Status → Canceled, then broadcasts the
    // status change so web-crms updates live. Terminal tickets are left untouched, and
    // an unknown conversation is a safe no-op (not an error) so redelivery can't wedge.

    [Fact]
    public async Task Cancel_event_sets_ticket_status_to_canceled()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "Please cancel this"));
        var ticketId = (await context.Tickets.SingleAsync()).Id.ToString();

        var processed = await service.ProcessEventAsync(
            "evt-cancel", "ticket.canceled", CancelPayload("evt-cancel", ticketId, "shopper@example.com"));

        Assert.True(processed);
        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal(TicketStatus.Canceled, ticket.Status);
    }

    [Fact]
    public async Task Cancel_event_broadcasts_a_status_change()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "First"));
        var ticketId = (await context.Tickets.SingleAsync()).Id.ToString();
        _broadcaster.StatusChanges.Clear();

        await service.ProcessEventAsync(
            "evt-cancel", "ticket.canceled", CancelPayload("evt-cancel", ticketId, "shopper@example.com"));

        var change = Assert.Single(_broadcaster.StatusChanges);
        Assert.Equal(Guid.Parse(ticketId), change.Id);
        Assert.Equal("Canceled", change.Status);
    }

    [Fact]
    public async Task Cancel_event_is_idempotent_on_redelivery()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "Hi"));
        var ticketId = (await context.Tickets.SingleAsync()).Id.ToString();

        var first = await service.ProcessEventAsync(
            "evt-cancel", "ticket.canceled", CancelPayload("evt-cancel", ticketId, "shopper@example.com"));
        var second = await service.ProcessEventAsync(
            "evt-cancel", "ticket.canceled", CancelPayload("evt-cancel", ticketId, "shopper@example.com"));

        Assert.True(first);
        Assert.False(second); // deduped by event id
        Assert.Equal(TicketStatus.Canceled, (await context.Tickets.SingleAsync()).Status);
    }

    [Fact]
    public async Task Cancel_event_leaves_a_terminal_ticket_untouched()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync("evt-1", "ticket.message.received",
            MessagePayload("evt-1", "conv-1", "shopper@example.com", "Hi"));
        var ticket = await context.Tickets.SingleAsync();
        ticket.Status = TicketStatus.Completed; // already terminal
        await context.SaveChangesAsync();
        _broadcaster.StatusChanges.Clear();

        var processed = await service.ProcessEventAsync(
            "evt-cancel", "ticket.canceled", CancelPayload("evt-cancel", ticket.Id.ToString(), "shopper@example.com"));

        Assert.True(processed); // acknowledged (event recorded), but status is unchanged
        Assert.Equal(TicketStatus.Completed, (await context.Tickets.SingleAsync()).Status);
        Assert.Empty(_broadcaster.StatusChanges);
    }

    [Fact]
    public async Task Cancel_event_for_unknown_conversation_is_a_safe_no_op()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var processed = await service.ProcessEventAsync(
            "evt-cancel", "ticket.canceled",
            CancelPayload("evt-cancel", Guid.NewGuid().ToString(), "nobody@example.com"));

        Assert.True(processed); // acknowledged so at-least-once redelivery can't wedge
        Assert.Equal(0, await context.Tickets.CountAsync());
        Assert.Empty(_broadcaster.StatusChanges);
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

    private readonly FakeConversationBroadcaster _broadcaster = new();

    private TicketIngestionService CreateService(AppDbContext context)
    {
        var identityService = new ContactIdentityService(
            new ContactIdentityRepository(context),
            new ContactIdentityOptions());
        return new TicketIngestionService(
            new TicketIngestionRepository(context), identityService, _broadcaster);
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

    private static string CancelPayload(
        string eventId, string conversationId, string email)
    {
        return JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "ticket.canceled",
            Data = new
            {
                ConversationId = conversationId,
                CustomerEmail = email,
                CustomerName = (string?)null,
                MessageBody = (string?)null,
                Subject = (string?)null,
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });
    }
}

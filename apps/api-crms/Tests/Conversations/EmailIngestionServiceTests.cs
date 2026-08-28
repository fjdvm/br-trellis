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

public sealed class EmailIngestionServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"email-ingestion-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task New_inbound_email_creates_unclaimed_waiting_agent_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = CreateEmailPayload("evt-1", "thread-1", "Help please", "Nothing works.");

        var processed = await service.ProcessEventAsync("evt-1", "email.received", payload);

        Assert.True(processed);
        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal("thread-1", ticket.ExternalThreadId);
        Assert.Equal("Help please", ticket.Subject);
        Assert.Equal(TicketStatus.Unclaimed, ticket.Status);
        Assert.Equal(WaitingOn.Agent, ticket.WaitingOn);
        Assert.Null(ticket.ContactId);
    }

    [Fact]
    public async Task New_inbound_email_records_contact_authored_message()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = CreateEmailPayload("evt-1", "thread-1", "Subject", "Body text here.");

        await service.ProcessEventAsync("evt-1", "email.received", payload);

        var message = await context.Messages.SingleAsync();
        Assert.Equal(MessageSenderType.Contact, message.SenderType);
        Assert.Equal("Body text here.", message.Content);
    }

    [Fact]
    public async Task New_inbound_email_with_known_contact_links_ticket()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var service = CreateService(context);

        var payload = CreateEmailPayload(
            "evt-1", "thread-1", "Subject", "Body.", contactId: contactId);

        await service.ProcessEventAsync("evt-1", "email.received", payload);

        var ticket = await context.Tickets.SingleAsync();
        Assert.Equal(contactId, ticket.ContactId);
        var message = await context.Messages.SingleAsync();
        Assert.Equal(contactId, message.SenderContactId);
    }

    [Fact]
    public async Task Email_matching_existing_thread_appends_message_not_new_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var first = CreateEmailPayload("evt-1", "thread-1", "Subject", "First message.");
        await service.ProcessEventAsync("evt-1", "email.received", first);

        var second = CreateEmailPayload("evt-2", "thread-1", "Subject", "Second message.");
        await service.ProcessEventAsync("evt-2", "email.received", second);

        Assert.Equal(1, await context.Tickets.CountAsync());
        Assert.Equal(2, await context.Messages.CountAsync());
    }

    [Fact]
    public async Task Reply_on_existing_thread_sets_waiting_on_agent()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.ProcessEventAsync(
            "evt-1", "email.received",
            CreateEmailPayload("evt-1", "thread-1", "Subject", "First."));

        // Agent takes over — simulate a state where waiting is on the customer.
        context.ChangeTracker.Clear();
        var ticket = await context.Tickets.SingleAsync();
        ticket.WaitingOn = WaitingOn.Customer;
        ticket.Status = TicketStatus.Claimed;
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        // Customer replies via email again.
        await service.ProcessEventAsync(
            "evt-2", "email.received",
            CreateEmailPayload("evt-2", "thread-1", "Subject", "Customer reply."));

        var updated = await context.Tickets.SingleAsync();
        Assert.Equal(WaitingOn.Agent, updated.WaitingOn);
        // Status (ownership) is not forced back by an inbound reply.
        Assert.Equal(TicketStatus.Claimed, updated.Status);
    }

    [Fact]
    public async Task Duplicate_event_id_is_a_no_op()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = CreateEmailPayload("evt-1", "thread-1", "Subject", "Body.");

        var first = await service.ProcessEventAsync("evt-1", "email.received", payload);
        var second = await service.ProcessEventAsync("evt-1", "email.received", payload);

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

        var payload = CreateEmailPayload("evt-bad", "thread-1", "Subject", "Body.");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessEventAsync("evt-bad", "email.bounced", payload));

        Assert.Equal(0, await context.Tickets.CountAsync());
        Assert.Equal(0, await context.Messages.CountAsync());
        Assert.Equal(0, await context.ProcessedEvents.CountAsync());
    }

    [Fact]
    public async Task Missing_body_throws_and_rolls_back()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var payload = CreateEmailPayload("evt-1", "thread-1", "Subject", body: "");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.ProcessEventAsync("evt-1", "email.received", payload));

        Assert.Equal(0, await context.Tickets.CountAsync());
        Assert.Equal(0, await context.ProcessedEvents.CountAsync());
    }

    // --- HMAC signature contract (reuses HmacSignatureValidator, like Ecommerce) ---

    [Fact]
    public void Valid_signature_passes_validation()
    {
        const string secret = "email-secret";
        var body = Encoding.UTF8.GetBytes(CreateEmailPayload("evt-1", "thread-1", "S", "B"));
        var signature = ComputeSignature(body, secret);

        Assert.True(HmacSignatureValidator.IsValid(body, signature, secret));
    }

    [Fact]
    public void Invalid_signature_fails_validation()
    {
        const string secret = "email-secret";
        var body = Encoding.UTF8.GetBytes(CreateEmailPayload("evt-1", "thread-1", "S", "B"));

        Assert.False(HmacSignatureValidator.IsValid(body, "sha256=deadbeef", secret));
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private EmailIngestionService CreateService(AppDbContext context)
    {
        return new EmailIngestionService(new EmailRepository(context));
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

    private static async Task<Guid> SeedContactAsync(AppDbContext context)
    {
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Maya",
            Email = "maya@acme.com",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();
        return contact.Id;
    }

    private static string CreateEmailPayload(
        string eventId,
        string threadId,
        string subject,
        string body,
        Guid? contactId = null)
    {
        return JsonSerializer.Serialize(new
        {
            EventId = eventId,
            EventType = "email.received",
            Data = new
            {
                ThreadId = threadId,
                Subject = subject,
                FromEmail = "customer@example.com",
                FromName = "A Customer",
                Body = body,
                ContactId = contactId,
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        });
    }

    private static string ComputeSignature(byte[] body, string secret)
    {
        var hash = System.Security.Cryptography.HMACSHA256.HashData(
            Encoding.UTF8.GetBytes(secret), body);
        return "sha256=" + Convert.ToHexStringLower(hash);
    }
}

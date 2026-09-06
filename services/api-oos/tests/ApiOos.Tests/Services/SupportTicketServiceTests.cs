using ApiOos.Data;
using ApiOos.DTOs.Requests.Support;
using ApiOos.DTOs.Webhooks;
using ApiOos.Interfaces.Services;
using ApiOos.Models;
using ApiOos.Repositories;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// The profile "Submit Ticket" flow must actually create a ticket: SupportTicketService
/// relays a ticket.message.received event to api-crms's Tickets webhook, carrying the
/// signed-in shopper's email/name so the CRM files it against the right Contact.
/// </summary>
public sealed class SupportTicketServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly FakeTicketWebhookClient _webhook = new();
    private readonly FakeCustomerTicketDetailReader _reader = new();
    private readonly SupportTicketService _service;

    public SupportTicketServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        _service = new SupportTicketService(new UserRepository(_context), _webhook, _reader);
    }

    public void Dispose()
    {
        _context.Database.CloseConnection();
        _context.Dispose();
    }

    private async Task<User> SeedUserAsync()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "shopper@example.com",
            FullName = "Shop Per",
            PasswordHash = "hash",
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task Create_relays_a_ticket_message_event_with_subject_and_body()
    {
        var user = await SeedUserAsync();

        var result = await _service.CreateAsync(
            user.Id, new CreateSupportTicketRequest("Where is my order?", "Inquiry", "It's late."));

        result.TicketId.Should().NotBeNullOrWhiteSpace();
        // #149 / ADR 0006 Option 1: the returned id is the conversation key api-oos
        // mints, relayed as the ConversationId and adopted by api-crms as the Ticket's
        // own id — so it must be a well-formed Guid and match what was sent.
        Guid.TryParse(result.TicketId, out _).Should().BeTrue();

        _webhook.Sent.Should().ContainSingle();
        var evt = _webhook.Sent.Single();
        evt.EventType.Should().Be("ticket.message.received");
        evt.Data.ConversationId.Should().Be(result.TicketId);
        evt.Data.CustomerEmail.Should().Be("shopper@example.com");
        evt.Data.CustomerName.Should().Be("Shop Per");
        evt.Data.Subject.Should().Be("[Inquiry] Where is my order?");
        evt.Data.MessageBody.Should().Be("It's late.");
    }

    [Fact]
    public async Task Create_throws_for_blank_title()
    {
        var user = await SeedUserAsync();

        var act = () => _service.CreateAsync(
            user.Id, new CreateSupportTicketRequest("   ", "Inquiry", "body"));

        await act.Should().ThrowAsync<Exception>();
        _webhook.Sent.Should().BeEmpty();
    }

    // --- Cancellation relay ---
    // A customer canceling their ticket in web-shop must be ownership-gated (only the
    // owning Contact may cancel) and, when allowed, relayed to api-crms as a
    // `ticket.canceled` event on the same Tickets webhook. api-oos owns no ticket state,
    // so the cancel is a relay, not a local mutation.

    [Fact]
    public async Task Cancel_relays_a_ticket_canceled_event_when_the_caller_owns_the_ticket()
    {
        var user = await SeedUserAsync();
        var ticketId = Guid.NewGuid().ToString();
        _reader.Result = CustomerTicketDetail.Open(ticketId, "Subj", "Unclaimed", []);

        var ok = await _service.CancelAsync(user.Id, ticketId);

        ok.Should().BeTrue();
        _reader.LastTicketId.Should().Be(ticketId);
        _reader.LastEmail.Should().Be("shopper@example.com");
        _webhook.Sent.Should().ContainSingle();
        var evt = _webhook.Sent.Single();
        evt.EventType.Should().Be("ticket.canceled");
        evt.Data.ConversationId.Should().Be(ticketId);
        evt.Data.CustomerEmail.Should().Be("shopper@example.com");
    }

    [Fact]
    public async Task Cancel_relays_even_while_awaiting_staff_reply()
    {
        var user = await SeedUserAsync();
        var ticketId = Guid.NewGuid().ToString();
        _reader.Result = CustomerTicketDetail.AwaitingStaffReply(ticketId, "Subj", "Unclaimed");

        var ok = await _service.CancelAsync(user.Id, ticketId);

        ok.Should().BeTrue();
        _webhook.Sent.Should().ContainSingle();
        _webhook.Sent.Single().EventType.Should().Be("ticket.canceled");
    }

    [Fact]
    public async Task Cancel_does_not_relay_when_the_caller_is_not_the_owner()
    {
        var user = await SeedUserAsync();
        var ticketId = Guid.NewGuid().ToString();
        _reader.Result = CustomerTicketDetail.NotOwner;

        var ok = await _service.CancelAsync(user.Id, ticketId);

        ok.Should().BeFalse();
        _webhook.Sent.Should().BeEmpty();
    }

    [Fact]
    public async Task Cancel_does_not_relay_when_the_ticket_is_not_found()
    {
        var user = await SeedUserAsync();
        var ticketId = Guid.NewGuid().ToString();
        _reader.Result = CustomerTicketDetail.NotFound;

        var ok = await _service.CancelAsync(user.Id, ticketId);

        ok.Should().BeFalse();
        _webhook.Sent.Should().BeEmpty();
    }

    private sealed class FakeTicketWebhookClient : ITicketWebhookClient
    {
        public List<TicketWebhookEvent> Sent { get; } = [];

        public Task SendAsync(TicketWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
        {
            Sent.Add(webhookEvent);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeCustomerTicketDetailReader : ICustomerTicketDetailReader
    {
        public CustomerTicketDetail Result { get; set; } = CustomerTicketDetail.NotFound;
        public string? LastTicketId { get; private set; }
        public string? LastEmail { get; private set; }

        public Task<CustomerTicketDetail> GetTicketDetailForCustomerAsync(
            string ticketId, string requestingEmail, CancellationToken cancellationToken = default)
        {
            LastTicketId = ticketId;
            LastEmail = requestingEmail;
            return Task.FromResult(Result);
        }
    }
}

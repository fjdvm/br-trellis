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
    private readonly SupportTicketService _service;

    public SupportTicketServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        _service = new SupportTicketService(new UserRepository(_context), _webhook);
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

    private sealed class FakeTicketWebhookClient : ITicketWebhookClient
    {
        public List<TicketWebhookEvent> Sent { get; } = [];

        public Task SendAsync(TicketWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
        {
            Sent.Add(webhookEvent);
            return Task.CompletedTask;
        }
    }
}

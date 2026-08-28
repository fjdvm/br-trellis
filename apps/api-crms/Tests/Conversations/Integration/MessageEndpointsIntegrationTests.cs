using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Conversations.Integration;

/// <summary>
/// End-to-end HTTP verification for #71 (Message thread post + list).
/// </summary>
public sealed class MessageEndpointsIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public MessageEndpointsIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Post_staff_message_records_staff_identity()
    {
        var ticketId = SeedTicket(contactId: null);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType = "Staff", senderStaffId = "auth|amelia", senderStaffName = "Amelia", content = "Hello" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Staff", body.GetProperty("senderType").GetString());
        Assert.Equal("auth|amelia", body.GetProperty("senderStaffId").GetString());
        Assert.Equal("Amelia", body.GetProperty("senderStaffName").GetString());
        Assert.Equal("Hello", body.GetProperty("content").GetString());
    }

    [Fact]
    public async Task Post_contact_message_with_linked_contact()
    {
        var contactId = SeedContact();
        var ticketId = SeedTicket(contactId);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType = "Contact", senderContactId = contactId, content = "My order is late" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Contact", body.GetProperty("senderType").GetString());
        Assert.Equal(contactId, body.GetProperty("senderContactId").GetGuid());
    }

    [Fact]
    public async Task Post_contact_message_with_null_contact_on_unlinked_ticket_succeeds()
    {
        var ticketId = SeedTicket(contactId: null);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType = "Contact", senderContactId = (Guid?)null, content = "Anonymous guest" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Contact", body.GetProperty("senderType").GetString());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("senderContactId").ValueKind);
    }

    [Fact]
    public async Task Get_messages_ordered_chronologically()
    {
        var ticketId = SeedTicket(contactId: null);
        var now = DateTimeOffset.UtcNow;
        SeedMessage(ticketId, "third", now.AddMinutes(20));
        SeedMessage(ticketId, "first", now);
        SeedMessage(ticketId, "second", now.AddMinutes(10));

        var response = await _client.GetAsync($"/api/v1/tickets/{ticketId}/messages");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<JsonElement>();
        var contents = new List<string>();
        foreach (var m in items.EnumerateArray())
            contents.Add(m.GetProperty("content").GetString()!);
        Assert.Equal(new[] { "first", "second", "third" }, contents);
    }

    [Fact]
    public async Task Get_messages_empty_thread_returns_200_empty_array()
    {
        var ticketId = SeedTicket(contactId: null);

        var response = await _client.GetAsync($"/api/v1/tickets/{ticketId}/messages");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, items.GetArrayLength());
    }

    [Fact]
    public async Task Post_on_missing_ticket_returns_404()
    {
        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{Guid.NewGuid()}/messages",
            new { senderType = "Staff", senderStaffId = "auth|a", senderStaffName = "A", content = "hi" });
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Get_on_missing_ticket_returns_404()
    {
        var response = await _client.GetAsync($"/api/v1/tickets/{Guid.NewGuid()}/messages");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("Robot", "auth|a", "content ok")]      // invalid sender type
    [InlineData("Staff", "auth|a", "")]                // empty content
    [InlineData("Staff", null, "content ok")]          // staff without id
    public async Task Post_invalid_input_returns_400(string senderType, string? staffId, string content)
    {
        var ticketId = SeedTicket(contactId: null);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType, senderStaffId = staffId, senderStaffName = "A", content });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_contact_message_with_nonexistent_contact_returns_400()
    {
        var ticketId = SeedTicket(contactId: null);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType = "Contact", senderContactId = Guid.NewGuid(), content = "ghost" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Message_response_has_no_read_unread_field()
    {
        var ticketId = SeedTicket(contactId: null);

        var response = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType = "Staff", senderStaffId = "auth|a", senderStaffName = "A", content = "hi" });

        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var prop in body.EnumerateObject())
        {
            var name = prop.Name.ToLowerInvariant();
            Assert.DoesNotContain("read", name);
            Assert.DoesNotContain("unread", name);
        }
    }

    private Guid SeedContact()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Msg Contact",
            Email = "msg@example.com",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Contacts.Add(contact);
        db.SaveChanges();
        return contact.Id;
    }

    private Guid SeedTicket(Guid? contactId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            ContactId = contactId,
            Subject = "Message ticket",
            Status = TicketStatus.Unclaimed,
            WaitingOn = WaitingOn.None,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        db.Tickets.Add(ticket);
        db.SaveChanges();
        return ticket.Id;
    }

    private void SeedMessage(Guid ticketId, string content, DateTimeOffset sentAt)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Messages.Add(new Message
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            SenderType = MessageSenderType.Staff,
            SenderStaffId = "auth|a",
            SenderStaffName = "A",
            Content = content,
            SentAt = sentAt,
        });
        db.SaveChanges();
    }
}

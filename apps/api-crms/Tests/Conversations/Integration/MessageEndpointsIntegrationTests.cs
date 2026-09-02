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
        // POST now requires the ConversationsCanWrite policy (#138). Grant it by
        // default so the existing post/list behaviour tests exercise an authorized
        // caller; the unauthenticated-rejection case sends its own headers.
        _client.DefaultRequestHeaders.Add(
            "X-Test-Permissions",
            """{"CRMS":{"Conversations":{"canWrite":true}}}""");
    }

    [Fact]
    public async Task Post_message_without_authentication_is_rejected()
    {
        var ticketId = SeedTicket(contactId: null);

        // A fresh client with no granted permissions, flagged anonymous — the
        // TestAuthHandler returns NoResult, so the ConversationsCanWrite policy
        // challenges the request.
        using var anonymous = _factory.CreateClient();
        anonymous.DefaultRequestHeaders.Add("X-Test-Anonymous", "true");

        var response = await anonymous.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType = "Staff", senderStaffId = "auth|a", senderStaffName = "A", content = "hi" });

        Assert.True(
            response.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden,
            $"Expected 401/403 but got {(int)response.StatusCode}.");
    }

    [Fact]
    public async Task Post_message_with_authentication_but_without_conversations_write_is_forbidden()
    {
        var ticketId = SeedTicket(contactId: null);

        // Authenticated, but lacking Conversations.canWrite — the policy denies.
        using var readOnly = _factory.CreateClient();
        readOnly.DefaultRequestHeaders.Add(
            "X-Test-Permissions",
            """{"CRMS":{"Ecommerce":{"canRead":true}}}""");

        var response = await readOnly.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType = "Staff", senderStaffId = "auth|a", senderStaffName = "A", content = "hi" });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
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

    [Fact]
    public async Task Staff_reply_is_readable_via_the_conversation_key_endpoint_under_the_ticket_id()
    {
        // #150 / ADR 0006: a shop-chat ticket is keyed on its own id (ExternalThreadId
        // == Id). A staff reply posted through the agent endpoint (keyed by ticket id)
        // must be readable through the customer's poll endpoint (keyed by the
        // conversation id) — and for shop chat those keys are the SAME ticket id. This
        // is the exact "customer sees the staff reply" path, proven in-process.
        var ticketId = SeedShopChatTicket();

        var post = await _client.PostAsJsonAsync(
            $"/api/v1/tickets/{ticketId}/messages",
            new { senderType = "Staff", senderStaffId = "auth|amelia", senderStaffName = "Amelia", content = "On it!" });
        Assert.Equal(HttpStatusCode.Created, post.StatusCode);

        // The customer's poll uses the conversation-key endpoint with the ticket id.
        var read = await _client.GetAsync($"/api/v1/conversations/{ticketId}/messages");
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);

        var items = await read.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(1, items.GetArrayLength());
        Assert.Equal("Staff", items[0].GetProperty("senderType").GetString());
        Assert.Equal("On it!", items[0].GetProperty("content").GetString());
    }

    private Guid SeedShopChatTicket()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var id = Guid.NewGuid();
        db.Tickets.Add(new Ticket
        {
            Id = id,
            ContactId = null,
            Subject = "Shop chat",
            ExternalThreadId = id.ToString(), // shop-chat invariant: thread id == ticket id
            Status = TicketStatus.Unclaimed,
            WaitingOn = WaitingOn.Agent,
            Source = TicketSource.Ecommerce,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        });
        db.SaveChanges();
        return id;
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

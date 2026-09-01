using api_crms.Controllers;
using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using api_crms.Tests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Conversations;

public sealed class MessageServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"message-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task Post_staff_authored_message_records_staff_identity()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        var result = await service.PostMessageAsync(
            ticketId,
            new PostMessageDto("Staff", null, "auth|amelia", "Amelia Ward", "How can I help?"),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Staff", result!.SenderType);
        Assert.Equal("auth|amelia", result.SenderStaffId);
        Assert.Equal("Amelia Ward", result.SenderStaffName);
        Assert.Null(result.SenderContactId);
        Assert.Equal("How can I help?", result.Content);
    }

    [Fact]
    public async Task Post_contact_authored_message_with_linked_contact()
    {
        await using var context = CreateContext();
        var contactId = await SeedContactAsync(context);
        var ticketId = await SeedTicketAsync(context, contactId);
        var service = CreateService(context);

        var result = await service.PostMessageAsync(
            ticketId,
            new PostMessageDto("Contact", contactId, null, null, "My order hasn't arrived."),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Contact", result!.SenderType);
        Assert.Equal(contactId, result.SenderContactId);
        Assert.Null(result.SenderStaffId);
    }

    [Fact]
    public async Task Post_contact_authored_message_with_null_contact_on_unlinked_ticket()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        // A Contact-authored message must be creatable with SenderContactId=null
        // when the ticket has no linked Contact — must not fail.
        var result = await service.PostMessageAsync(
            ticketId,
            new PostMessageDto("Contact", null, null, null, "Hello from an anonymous guest."),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Contact", result!.SenderType);
        Assert.Null(result.SenderContactId);
    }

    [Fact]
    public async Task Post_trims_content()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        var result = await service.PostMessageAsync(
            ticketId,
            new PostMessageDto("Staff", null, "auth|amelia", "Amelia", "  padded  "),
            CancellationToken.None);

        Assert.Equal("padded", result!.Content);
    }

    [Fact]
    public async Task Post_returns_null_for_missing_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.PostMessageAsync(
            Guid.NewGuid(),
            new PostMessageDto("Staff", null, "auth|amelia", "Amelia", "hi"),
            CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Post_broadcasts_the_created_message_to_its_ticket()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        var result = await service.PostMessageAsync(
            ticketId,
            new PostMessageDto("Staff", null, "auth|amelia", "Amelia", "Live reply"),
            CancellationToken.None);

        // The created message is broadcast to the ticket's thread group so an
        // agent viewing it sees the reply without waiting for a poll tick.
        var broadcast = Assert.Single(_broadcaster.Messages);
        Assert.Equal(ticketId, broadcast.TicketId);
        Assert.Equal(result!.Id, broadcast.Message.Id);
        Assert.Equal("Live reply", broadcast.Message.Content);
    }

    [Fact]
    public async Task Post_does_not_broadcast_when_the_ticket_is_missing()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.PostMessageAsync(
            Guid.NewGuid(),
            new PostMessageDto("Staff", null, "auth|amelia", "Amelia", "hi"),
            CancellationToken.None);

        Assert.Empty(_broadcaster.Messages);
    }

    [Fact]
    public async Task Post_does_not_broadcast_when_input_is_invalid()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PostMessageAsync(
                ticketId,
                new PostMessageDto("Staff", null, null, null, "no id"),
                CancellationToken.None));

        Assert.Empty(_broadcaster.Messages);
    }

    [Fact]
    public async Task Post_throws_for_empty_content()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PostMessageAsync(
                ticketId,
                new PostMessageDto("Staff", null, "auth|amelia", "Amelia", "  "),
                CancellationToken.None));
    }

    [Fact]
    public async Task Post_throws_for_invalid_sender_type()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PostMessageAsync(
                ticketId,
                new PostMessageDto("Robot", null, null, null, "beep"),
                CancellationToken.None));
    }

    [Fact]
    public async Task Post_staff_message_without_staff_id_throws()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PostMessageAsync(
                ticketId,
                new PostMessageDto("Staff", null, null, null, "no id"),
                CancellationToken.None));
    }

    [Fact]
    public async Task Post_contact_message_with_nonexistent_contact_throws()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PostMessageAsync(
                ticketId,
                new PostMessageDto("Contact", Guid.NewGuid(), null, null, "ghost"),
                CancellationToken.None));
    }

    [Fact]
    public async Task List_returns_messages_ordered_chronologically()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var now = DateTimeOffset.UtcNow;

        // Insert out of chronological order
        await SeedMessageAsync(context, ticketId, "third", now.AddMinutes(20));
        await SeedMessageAsync(context, ticketId, "first", now);
        await SeedMessageAsync(context, ticketId, "second", now.AddMinutes(10));

        var service = CreateService(context);
        var result = await service.ListMessagesAsync(ticketId, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(3, result!.Count);
        Assert.Equal("first", result[0].Content);
        Assert.Equal("second", result[1].Content);
        Assert.Equal("third", result[2].Content);
    }

    [Fact]
    public async Task List_returns_empty_for_ticket_with_no_messages()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        var result = await service.ListMessagesAsync(ticketId, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Empty(result!);
    }

    [Fact]
    public async Task List_returns_null_for_missing_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.ListMessagesAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(result);
    }

    // --- Thin controller status-code tests ---

    [Fact]
    public async Task Controller_PostMessage_returns_created()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var controller = new MessageController(CreateService(context));

        var response = await controller.PostMessage(
            ticketId,
            new PostMessageDto("Staff", null, "auth|amelia", "Amelia", "hi"),
            CancellationToken.None);

        Assert.IsType<CreatedAtActionResult>(response.Result);
    }

    [Fact]
    public async Task Controller_PostMessage_returns_not_found_for_missing_ticket()
    {
        await using var context = CreateContext();
        var controller = new MessageController(CreateService(context));

        var response = await controller.PostMessage(
            Guid.NewGuid(),
            new PostMessageDto("Staff", null, "auth|amelia", "Amelia", "hi"),
            CancellationToken.None);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    public async Task Controller_PostMessage_returns_bad_request_for_invalid_input()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var controller = new MessageController(CreateService(context));

        var response = await controller.PostMessage(
            ticketId,
            new PostMessageDto("Staff", null, null, null, "no id"),
            CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(response.Result);
    }

    [Fact]
    public async Task Controller_ListMessages_returns_ok()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        await SeedMessageAsync(context, ticketId, "hi", DateTimeOffset.UtcNow);
        var controller = new MessageController(CreateService(context));

        var response = await controller.ListMessages(ticketId, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IReadOnlyList<MessageDto>>(ok.Value);
        Assert.Single(items);
    }

    [Fact]
    public async Task Controller_ListMessages_returns_not_found_for_missing_ticket()
    {
        await using var context = CreateContext();
        var controller = new MessageController(CreateService(context));

        var response = await controller.ListMessages(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    [Fact]
    public async Task ListMessagesSince_returns_only_messages_after_the_watermark()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        var t0 = DateTimeOffset.UtcNow.AddMinutes(-10);
        var watermark = DateTimeOffset.UtcNow.AddMinutes(-5);
        await SeedMessageAsync(context, ticketId, "old", t0);
        await SeedMessageAsync(context, ticketId, "new-1", watermark.AddMinutes(1));
        await SeedMessageAsync(context, ticketId, "new-2", watermark.AddMinutes(2));

        var result = await service.ListMessagesSinceAsync(ticketId, watermark, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(new[] { "new-1", "new-2" }, result!.Select(m => m.Content).ToArray());
    }

    [Fact]
    public async Task ListMessagesSince_with_null_watermark_returns_all_messages_in_order()
    {
        await using var context = CreateContext();
        var ticketId = await SeedTicketAsync(context, contactId: null);
        var service = CreateService(context);

        var now = DateTimeOffset.UtcNow;
        await SeedMessageAsync(context, ticketId, "first", now.AddMinutes(-2));
        await SeedMessageAsync(context, ticketId, "second", now.AddMinutes(-1));

        var result = await service.ListMessagesSinceAsync(ticketId, null, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(new[] { "first", "second" }, result!.Select(m => m.Content).ToArray());
    }

    [Fact]
    public async Task ListMessagesSince_returns_null_for_missing_ticket()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.ListMessagesSinceAsync(
            Guid.NewGuid(), DateTimeOffset.UtcNow, CancellationToken.None);

        Assert.Null(result);
    }

    private readonly FakeConversationBroadcaster _broadcaster = new();

    private MessageService CreateService(AppDbContext context)
    {
        return new MessageService(new MessageRepository(context), _broadcaster);
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

    private static async Task<Guid> SeedTicketAsync(AppDbContext context, Guid? contactId)
    {
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            ContactId = contactId,
            Subject = "Test ticket",
            Status = TicketStatus.Unclaimed,
            WaitingOn = WaitingOn.None,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };
        context.Tickets.Add(ticket);
        await context.SaveChangesAsync();
        return ticket.Id;
    }

    private static async Task SeedMessageAsync(
        AppDbContext context, Guid ticketId, string content, DateTimeOffset sentAt)
    {
        context.Messages.Add(new Message
        {
            Id = Guid.NewGuid(),
            TicketId = ticketId,
            SenderType = MessageSenderType.Staff,
            SenderStaffId = "auth|amelia",
            SenderStaffName = "Amelia",
            Content = content,
            SentAt = sentAt,
        });
        await context.SaveChangesAsync();
    }
}

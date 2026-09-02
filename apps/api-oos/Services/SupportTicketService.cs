namespace ApiOos.Services;

using ApiOos.DTOs.Requests.Support;
using ApiOos.DTOs.Responses;
using ApiOos.DTOs.Webhooks;
using ApiOos.Exceptions;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;

/// <summary>
/// Creates a shopper support ticket by relaying it to api-crms's Tickets webhook as
/// the opening message of a brand-new conversation. Reuses the same
/// <see cref="ITicketWebhookClient"/> contract the live-agent chat uses, so the CRM
/// resolves the Contact from the shopper's email and files the ticket — api-oos keeps
/// no ticket state of its own. A fresh ConversationId per submission makes each
/// profile ticket its own CRM conversation.
/// </summary>
public sealed class SupportTicketService(
    IUserRepository userRepository,
    ITicketWebhookClient ticketWebhookClient) : ISupportTicketService
{
    public async Task<SupportTicketResponseDto> CreateAsync(
        Guid userId,
        CreateSupportTicketRequest request,
        CancellationToken cancellationToken = default)
    {
        var title = Require(request.Title, "Title");
        var description = Require(request.Description, "Description");
        var type = string.IsNullOrWhiteSpace(request.Type) ? "Inquiry" : request.Type.Trim();

        var user = await userRepository.GetByIdAsync(userId)
            ?? throw new NotFoundException("User not found.");
        if (string.IsNullOrWhiteSpace(user.Email))
        {
            throw new AppException("Your account has no email on file; cannot create a ticket.");
        }

        // A new conversation per submitted ticket. api-crms adopts this Guid as the
        // Ticket's own id (ADR 0006 Option 1), so the value returned to the shopper is
        // the canonical CRM Ticket id — the single key used for re-entry and reads.
        var conversationId = Guid.NewGuid().ToString();

        await ticketWebhookClient.SendAsync(new TicketWebhookEvent
        {
            EventId = Guid.NewGuid().ToString(),
            EventType = "ticket.message.received",
            Data = new TicketWebhookData
            {
                ConversationId = conversationId,
                CustomerEmail = user.Email,
                CustomerName = user.FullName,
                MessageBody = description,
                Subject = $"[{type}] {title}",
                OccurredAt = DateTimeOffset.UtcNow.ToString("O"),
            },
        }, cancellationToken);

        return new SupportTicketResponseDto { TicketId = conversationId };
    }

    private static string Require(string? value, string name)
    {
        return string.IsNullOrWhiteSpace(value)
            ? throw new AppException($"{name} is required.")
            : value.Trim();
    }
}

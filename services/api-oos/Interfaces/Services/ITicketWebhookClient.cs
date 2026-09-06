namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Webhooks;

/// <summary>
/// Sends shop-chat Ticket/Message events to api-crms's Tickets webhook
/// (<c>POST api/v1/webhooks/tickets</c>). One-way and HMAC-signed — api-crms only
/// ever receives. This is how a live-agent chat message reaches the CRM.
/// </summary>
public interface ITicketWebhookClient
{
    /// <summary>
    /// Delivers a single ticket/message event. Implementations sign the body with the
    /// shared secret and POST it to api-crms.
    /// </summary>
    Task SendAsync(TicketWebhookEvent webhookEvent, CancellationToken cancellationToken = default);
}

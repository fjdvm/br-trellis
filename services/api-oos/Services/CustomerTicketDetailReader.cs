namespace ApiOos.Services;

using System.Net;
using System.Text.Json;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

/// <summary>
/// Resolves a single Ticket-by-id for a signed-in customer, verifying ownership
/// (case-insensitive Contact-email match) before returning any Conversation data.
/// Reads api-crms's <c>GET api/v1/tickets/{id}</c> and
/// <c>GET api/v1/tickets/{id}/messages</c> over the same named <c>ApiCrms</c>
/// HttpClient <see cref="CrmTicketReader"/> already uses for the list — no new
/// inter-service auth mechanism (ADR 0005). api-crms is the system of record; api-oos
/// stores no ticket state.
/// </summary>
public sealed class CustomerTicketDetailReader(
    IHttpClientFactory httpClientFactory,
    ILogger<CustomerTicketDetailReader> logger) : ICustomerTicketDetailReader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<CustomerTicketDetail> GetTicketDetailForCustomerAsync(
        string ticketId, string requestingEmail, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ticketId) || string.IsNullOrWhiteSpace(requestingEmail))
        {
            // No id or no identified caller → indistinguishable "not found".
            return CustomerTicketDetail.NotFound;
        }

        var client = httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);
        var escapedId = Uri.EscapeDataString(ticketId.Trim());

        CrmTicketDetail? ticket;
        try
        {
            using var response = await client.GetAsync($"api/v1/tickets/{escapedId}", cancellationToken);
            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return CustomerTicketDetail.NotFound;
            }
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Reading ticket {TicketId} from api-crms returned {Status}",
                    ticketId, (int)response.StatusCode);
                // Fail closed on any upstream error rather than leaking access.
                return CustomerTicketDetail.NotFound;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            ticket = await JsonSerializer.DeserializeAsync<CrmTicketDetail>(
                stream, JsonOptions, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to read ticket {TicketId} from api-crms", ticketId);
            return CustomerTicketDetail.NotFound;
        }

        if (ticket is null)
        {
            return CustomerTicketDetail.NotFound;
        }

        // Ownership: case-insensitive email match. A Contact with no email on file can
        // never match → NotOwner (fail closed). NotOwner is returned as the same 404 as
        // NotFound at the API boundary so ids can't be enumerated (ADR 0005).
        var ownerEmail = ticket.Contact?.Email;
        if (string.IsNullOrWhiteSpace(ownerEmail)
            || !string.Equals(ownerEmail.Trim(), requestingEmail.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return CustomerTicketDetail.NotOwner;
        }

        var messages = await GetMessagesAsync(client, escapedId, ticketId, cancellationToken);

        // Staff-reply gate (#145): the Conversation stays closed to its own Contact
        // until at least one Staff-authored Message exists — independent of the Ticket's
        // Status (a Staff reply unlocks it even while Status is still Unclaimed). The
        // Contact's own opening message never satisfies this.
        var hasStaffReply = messages.Any(m =>
            string.Equals(m.SenderType, "Staff", StringComparison.OrdinalIgnoreCase));

        var subject = ticket.Subject ?? string.Empty;
        var status = ticket.Status ?? "Unclaimed";
        var id = ticket.Id.ToString();

        return hasStaffReply
            ? CustomerTicketDetail.Open(id, subject, status, messages)
            : CustomerTicketDetail.AwaitingStaffReply(id, subject, status);
    }

    private async Task<IReadOnlyList<CustomerTicketMessage>> GetMessagesAsync(
        HttpClient client, string escapedId, string ticketId, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await client.GetAsync(
                $"api/v1/tickets/{escapedId}/messages", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Reading messages for ticket {TicketId} returned {Status}",
                    ticketId, (int)response.StatusCode);
                return [];
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var messages = await JsonSerializer.DeserializeAsync<List<CrmMessageResponse>>(
                stream, JsonOptions, cancellationToken) ?? [];

            return messages
                .OrderBy(m => m.SentAt)
                .Select(m => new CustomerTicketMessage
                {
                    Id = m.Id.ToString(),
                    SenderType = m.SenderType ?? string.Empty,
                    SenderStaffName = m.SenderStaffName,
                    Content = m.Content ?? string.Empty,
                    SentAt = m.SentAt,
                })
                .ToList();
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to read messages for ticket {TicketId}", ticketId);
            return [];
        }
    }

    private sealed class CrmTicketDetail
    {
        public Guid Id { get; init; }
        public string? Subject { get; init; }
        public string? Status { get; init; }
        public CrmTicketContact? Contact { get; init; }
    }

    private sealed class CrmTicketContact
    {
        public string? Email { get; init; }
    }

    private sealed class CrmMessageResponse
    {
        public Guid Id { get; init; }
        public string? SenderType { get; init; }
        public string? SenderStaffName { get; init; }
        public string? Content { get; init; }
        public DateTimeOffset SentAt { get; init; }
    }
}

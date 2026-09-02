namespace ApiOos.Services;

using System.Text.Json;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

/// <summary>
/// Reads shopper tickets from api-crms's <c>GET api/v1/tickets</c> endpoint over the
/// named <c>ApiCrms</c> HttpClient, then filters to the tickets whose Contact email
/// matches the signed-in shopper. api-crms is the system of record; api-oos keeps no
/// ticket state (ADR 0002).
/// </summary>
public sealed class CrmTicketReader(
    IHttpClientFactory httpClientFactory,
    ICrmMessageReader messageReader,
    ILogger<CrmTicketReader> logger) : ISupportTicketReader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<IReadOnlyList<ShopperTicket>> GetTicketsByEmailAsync(
        string customerEmail, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(customerEmail))
        {
            return [];
        }

        var client = httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);

        try
        {
            using var response = await client.GetAsync("api/v1/tickets", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Listing tickets from api-crms returned {Status}", (int)response.StatusCode);
                return [];
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var tickets = await JsonSerializer.DeserializeAsync<List<CrmTicketListItem>>(
                stream, JsonOptions, cancellationToken) ?? [];

            var email = customerEmail.Trim();

            var mine = tickets
                .Where(t => string.Equals(t.Contact?.Email, email, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(t => t.CreatedAt)
                .ToList();

            // Determine "has Staff replied" per ticket. This is bounded to the signed-in
            // shopper's own tickets (a handful), not the whole CRM inbox, so the extra
            // per-ticket message reads are cheap. Run them concurrently.
            var staffReplyChecks = await Task.WhenAll(
                mine.Select(t => HasStaffRepliedAsync(t.Id.ToString(), cancellationToken)));

            return mine
                .Select((t, i) => new ShopperTicket
                {
                    Id = t.Id.ToString(),
                    Title = StripTypePrefix(t.Subject),
                    Description = null,
                    Status = t.Status ?? "Unclaimed",
                    AssignedToName = t.AssignedToName,
                    HasStaffReplied = staffReplyChecks[i],
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                })
                .ToList();
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Failed to list tickets from api-crms for {Email}", customerEmail);
            return [];
        }
    }

    /// <summary>
    /// True once at least one Staff-authored Message exists on the ticket. Reuses the
    /// same server-to-server messages read the staff-reply relay uses; a read failure
    /// resolves to false (fail closed → the "Message Staff" link stays hidden rather
    /// than appearing prematurely).
    /// </summary>
    private async Task<bool> HasStaffRepliedAsync(string ticketId, CancellationToken cancellationToken)
    {
        var messages = await messageReader.GetMessagesSinceAsync(ticketId, null, cancellationToken);
        return messages.Any(m =>
            string.Equals(m.SenderType, "Staff", StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Shopper tickets are filed with a subject of "[Type] Title" (see
    /// SupportTicketService). Strip the leading "[Type] " so the shopper sees the
    /// title they typed. Leaves subjects without a prefix untouched.
    /// </summary>
    private static string StripTypePrefix(string? subject)
    {
        if (string.IsNullOrWhiteSpace(subject))
        {
            return "Support Ticket";
        }

        var trimmed = subject.Trim();
        if (trimmed.StartsWith('['))
        {
            var close = trimmed.IndexOf(']');
            if (close > 0 && close < trimmed.Length - 1)
            {
                return trimmed[(close + 1)..].Trim();
            }
        }

        return trimmed;
    }

    private sealed class CrmTicketListItem
    {
        public Guid Id { get; init; }
        public string? Subject { get; init; }
        public string? Status { get; init; }
        public string? AssignedToName { get; init; }
        public CrmTicketContact? Contact { get; init; }
        public DateTimeOffset CreatedAt { get; init; }
        public DateTimeOffset UpdatedAt { get; init; }
    }

    private sealed class CrmTicketContact
    {
        public Guid Id { get; init; }
        public string? Name { get; init; }
        public string? Email { get; init; }
    }
}

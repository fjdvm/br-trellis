namespace api_crms.Interfaces;

public interface ITicketIngestionService
{
    /// <summary>
    /// Ingests a shop-chat Ticket/Message event. Returns <c>true</c> when processed,
    /// <c>false</c> when the event id was already seen (dedup — redelivery is a no-op).
    /// </summary>
    Task<bool> ProcessEventAsync(
        string eventId,
        string eventType,
        string payload,
        CancellationToken cancellationToken = default);
}

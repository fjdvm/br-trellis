namespace api_crms.Interfaces;

public interface IEcommerceIngestionService
{
    Task<bool> ProcessEventAsync(
        string eventId,
        string eventType,
        string payload,
        CancellationToken cancellationToken = default);
}

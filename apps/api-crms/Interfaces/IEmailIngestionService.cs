namespace api_crms.Interfaces;

public interface IEmailIngestionService
{
    Task<bool> ProcessEventAsync(
        string eventId,
        string eventType,
        string payload,
        CancellationToken cancellationToken = default);
}

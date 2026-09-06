namespace api_crms.DTOs;

public sealed record EmailWebhookPayload(
    string EventId,
    string EventType,
    EmailEventData Data);

public sealed record EmailEventData(
    string ThreadId,
    string Subject,
    string FromEmail,
    string? FromName,
    string Body,
    Guid? ContactId,
    string? OccurredAt);

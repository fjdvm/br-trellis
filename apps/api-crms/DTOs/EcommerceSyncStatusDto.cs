namespace api_crms.DTOs;

public sealed record EcommerceSyncStatusDto(
    string Status,
    DateTimeOffset? FirstEventReceivedAt,
    DateTimeOffset? LastEventReceivedAt,
    bool WebhookSecretConfigured,
    string? MaskedWebhookSecret);

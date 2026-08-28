using api_crms.DTOs;
using api_crms.Models;

namespace api_crms.Mappers;

public static class EcommerceSyncStatusMapper
{
    public static EcommerceSyncStatusDto ToDto(
        EcommerceSyncStatus? syncStatus,
        string status,
        bool webhookSecretConfigured,
        string? maskedWebhookSecret)
    {
        return new EcommerceSyncStatusDto(
            Status: status,
            FirstEventReceivedAt: syncStatus?.FirstEventReceivedAt,
            LastEventReceivedAt: syncStatus?.LastEventReceivedAt,
            WebhookSecretConfigured: webhookSecretConfigured,
            MaskedWebhookSecret: maskedWebhookSecret);
    }
}

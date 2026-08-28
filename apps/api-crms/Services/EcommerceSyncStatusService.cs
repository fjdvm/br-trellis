using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Mappers;

namespace api_crms.Services;

public sealed class EcommerceSyncStatusService(
    IEcommerceRepository ecommerceRepository,
    IConfiguration configuration) : IEcommerceSyncStatusService
{
    private static readonly TimeSpan DefaultStalenessThreshold = TimeSpan.FromHours(48);

    public async Task<EcommerceSyncStatusDto> GetSyncStatusAsync(CancellationToken cancellationToken)
    {
        var syncStatus = await ecommerceRepository.GetSyncStatusAsync(cancellationToken);

        var status = ComputeStatus(syncStatus?.LastEventReceivedAt);

        var webhookSecret = configuration["Ecommerce:WebhookSecret"] ?? string.Empty;
        var isConfigured = !string.IsNullOrWhiteSpace(webhookSecret)
            && webhookSecret != "change-me-in-production";
        var masked = isConfigured ? MaskSecret(webhookSecret) : null;

        return EcommerceSyncStatusMapper.ToDto(syncStatus, status, isConfigured, masked);
    }

    private string ComputeStatus(DateTimeOffset? lastEventReceivedAt)
    {
        if (lastEventReceivedAt is null)
            return "never_connected";

        var threshold = configuration.GetValue<double?>("Ecommerce:StalenessThresholdHours")
            is { } hours
                ? TimeSpan.FromHours(hours)
                : DefaultStalenessThreshold;

        return DateTimeOffset.UtcNow - lastEventReceivedAt.Value <= threshold
            ? "healthy"
            : "stale";
    }

    private static string MaskSecret(string secret)
    {
        if (secret.Length <= 4)
            return secret;

        return new string('*', secret.Length - 4) + secret[^4..];
    }
}

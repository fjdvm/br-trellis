using api_crms.Enums;
using api_crms.Interfaces;

namespace api_crms.Tests.Campaigns;

/// <summary>
/// Records every Campaign send so tests can assert dispatch behavior without SMTP.
/// Reports all recipients as sent unless an id is registered in <see cref="FailAll"/>.
/// </summary>
public sealed class RecordingMarketingEmailSender : IMarketingEmailSender
{
    public List<(Guid CampaignId, IReadOnlyList<string> Recipients, string Subject, string Body, string? UnsubscribeBaseUrl, EmailTheme? Theme)> Sends { get; } = new();

    // Campaign ids whose sends should report every recipient as failed.
    public HashSet<Guid> FailAll { get; } = new();

    public Task<MarketingDispatchOutcome> SendCampaignAsync(
        Guid campaignId,
        IReadOnlyList<string> recipients,
        string subject,
        string htmlBody,
        string? unsubscribeBaseUrl = null,
        EmailTheme? theme = null,
        CancellationToken cancellationToken = default)
    {
        Sends.Add((campaignId, recipients, subject, htmlBody, unsubscribeBaseUrl, theme));
        var outcome = FailAll.Contains(campaignId)
            ? new MarketingDispatchOutcome(0, recipients.Count, recipients.Select(r => $"{r}: failed").ToList())
            : new MarketingDispatchOutcome(recipients.Count, 0, Array.Empty<string>());
        return Task.FromResult(outcome);
    }
}

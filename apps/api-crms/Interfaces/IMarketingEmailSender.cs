using api_crms.Enums;

namespace api_crms.Interfaces;

/// <summary>
/// Sends marketing Email Campaigns directly via api-crms's own Brevo SMTP relay
/// (ADR 0009). api-crms owns its own <c>Brevo:*</c> credentials, independent of
/// api-oos's transactional-email account. Every send carries an <c>X-Mailin-Tag</c>
/// SMTP header set to the Campaign id, so Brevo's engagement webhook can attribute
/// opens/clicks back to the originating Campaign.
///
/// This is api-crms's first outbound third-party integration — a deliberate, scoped
/// exception to ADR 0002/0007 for marketing email only.
/// </summary>
public interface IMarketingEmailSender
{
    /// <summary>
    /// Sends the same Campaign email body to every recipient, one message per
    /// recipient over Brevo SMTP, tagging each with <paramref name="campaignId"/>.
    /// Individual failures are recorded (not retried) and accumulated into the
    /// returned outcome. When <paramref name="unsubscribeBaseUrl"/> is set, a
    /// per-recipient unsubscribe footer (carrying that recipient's email) is
    /// appended to each message.
    /// </summary>
    Task<MarketingDispatchOutcome> SendCampaignAsync(
        Guid campaignId,
        IReadOnlyList<string> recipients,
        string subject,
        string htmlBody,
        string? unsubscribeBaseUrl = null,
        EmailTheme? theme = null,
        CancellationToken cancellationToken = default);
}

/// <summary>Outcome of a Campaign dispatch: how many succeeded/failed and the errors.</summary>
public sealed record MarketingDispatchOutcome(int SentCount, int FailedCount, IReadOnlyList<string> Errors);

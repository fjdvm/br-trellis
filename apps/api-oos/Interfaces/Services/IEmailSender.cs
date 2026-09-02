namespace ApiOos.Interfaces.Services;

/// <summary>
/// Sends transactional emails to shoppers (e.g. signup confirmation). This is an
/// abstraction so the delivery mechanism (dev logging, SMTP, a provider API) can be
/// swapped without touching business logic in Services.
/// </summary>
public interface IEmailSender
{
    /// <summary>
    /// Sends the account-confirmation email that a shopper receives right after
    /// signing up. <paramref name="confirmationUrl"/> is the fully-qualified link
    /// that lands them on the web-shop "Verified User" page.
    /// </summary>
    Task SendEmailConfirmationAsync(
        string toEmail,
        string fullName,
        string confirmationUrl,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Sends the same marketing email body to many recipients, one message per
    /// recipient over the existing Brevo SMTP relay. Individual failures are
    /// recorded (not retried) and accumulated into the returned result. When
    /// <paramref name="unsubscribeBaseUrl"/> is set, a per-recipient unsubscribe
    /// footer (carrying that recipient's email) is appended to each message.
    /// </summary>
    Task<BulkEmailResult> SendBulkAsync(
        IReadOnlyList<string> recipients,
        string subject,
        string htmlBody,
        string? unsubscribeBaseUrl = null,
        CancellationToken cancellationToken = default);
}

/// <summary>Outcome of a bulk send: how many succeeded/failed and the errors.</summary>
public sealed record BulkEmailResult(int SentCount, int FailedCount, IReadOnlyList<string> Errors);

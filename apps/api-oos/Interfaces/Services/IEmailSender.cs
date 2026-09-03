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
}

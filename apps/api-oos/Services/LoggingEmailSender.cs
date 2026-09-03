namespace ApiOos.Services;

using ApiOos.Interfaces.Services;

/// <summary>
/// Development email sender: instead of talking to an SMTP server or a delivery
/// provider, it logs the confirmation link. This mirrors the existing forgot-password
/// flow, which also logs its token rather than sending real mail. Swap this for a
/// real <see cref="IEmailSender"/> implementation in production.
/// </summary>
public class LoggingEmailSender : IEmailSender
{
    private readonly ILogger<LoggingEmailSender> _logger;

    public LoggingEmailSender(ILogger<LoggingEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendEmailConfirmationAsync(
        string toEmail,
        string fullName,
        string confirmationUrl,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Email confirmation for {FullName} <{Email}>. Confirmation link: {ConfirmationUrl}",
            fullName,
            toEmail,
            confirmationUrl);

        return Task.CompletedTask;
    }
}

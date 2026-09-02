namespace ApiOos.Services;

using System.Net;
using System.Net.Mail;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

/// <summary>
/// Sends transactional emails via Brevo SMTP (smtp-relay.brevo.com).
/// Uses the same <c>Brevo:*</c> configuration keys that <see cref="ContactService"/>
/// and <see cref="JobService"/> already read, so a single set of credentials
/// covers all outbound email from api-oos.
///
/// When credentials are missing the sender gracefully logs a warning and
/// returns, so local development without Brevo still works.
/// </summary>
public class BrevoEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<BrevoEmailSender> _logger;

    public BrevoEmailSender(IConfiguration configuration, ILogger<BrevoEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendEmailConfirmationAsync(
        string toEmail,
        string fullName,
        string confirmationUrl,
        CancellationToken cancellationToken = default)
    {
        var host = _configuration["Brevo:SmtpHost"] ?? "smtp-relay.brevo.com";
        var portStr = _configuration["Brevo:SmtpPort"];
        int.TryParse(portStr, out var port);
        if (port == 0) port = 587;

        var username = _configuration["Brevo:Username"];
        var password = _configuration["Brevo:Password"];
        var fromEmail = _configuration["Brevo:FromEmail"] ?? "jude.nitram08@gmail.com";

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            _logger.LogWarning(
                "Brevo SMTP credentials not configured. Confirmation email for {Email} not sent. Link: {Url}",
                toEmail,
                confirmationUrl);
            return;
        }

        try
        {
            using var client = new SmtpClient(host, port)
            {
                Credentials = new NetworkCredential(username, password),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail, "Bren Raphael's"),
                Subject = "Confirm your email — Bren Raphael's Ube Jam & Halaya",
                Body = BuildHtmlBody(fullName, confirmationUrl),
                IsBodyHtml = true
            };
            mailMessage.To.Add(new MailAddress(toEmail, fullName));

            await client.SendMailAsync(mailMessage, cancellationToken);

            _logger.LogInformation(
                "Confirmation email sent via Brevo SMTP to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send confirmation email via Brevo SMTP to {Email}", toEmail);
        }
    }
    public async Task<BulkEmailResult> SendBulkAsync(
        IReadOnlyList<string> recipients,
        string subject,
        string htmlBody,
        string? unsubscribeBaseUrl = null,
        CancellationToken cancellationToken = default)
    {
        var sent = 0;
        var failed = 0;
        var errors = new List<string>();

        foreach (var recipient in recipients)
        {
            cancellationToken.ThrowIfCancellationRequested();
            try
            {
                var body = AppendUnsubscribeFooter(htmlBody, recipient, unsubscribeBaseUrl);
                await SendSingleAsync(recipient, subject, body, cancellationToken);
                sent++;
            }
            catch (Exception ex)
            {
                failed++;
                errors.Add($"{recipient}: {ex.Message}");
                _logger.LogWarning(ex, "Bulk send to {Recipient} failed", recipient);
            }
        }

        return new BulkEmailResult(sent, failed, errors);
    }

    // Appends a per-recipient unsubscribe link so the opt-out endpoint can
    // identify who is unsubscribing. Returns the body unchanged when no base URL
    // is configured.
    private static string AppendUnsubscribeFooter(string htmlBody, string recipient, string? unsubscribeBaseUrl)
    {
        if (string.IsNullOrWhiteSpace(unsubscribeBaseUrl))
        {
            return htmlBody;
        }
        var url = $"{unsubscribeBaseUrl.TrimEnd('/')}?email={Uri.EscapeDataString(recipient)}";
        return htmlBody +
            $"<p style=\"font-size:12px;color:#888;margin-top:24px;\">" +
            $"Don't want these emails? <a href=\"{url}\">Unsubscribe</a>.</p>";
    }

    /// <summary>
    /// Sends a single marketing message over Brevo SMTP. Virtual so tests can
    /// intercept the actual network call while still exercising the bulk loop's
    /// success/failure accumulation. Throws when credentials are missing so the
    /// bulk result reflects that recipients weren't delivered.
    /// </summary>
    protected virtual async Task SendSingleAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        var host = _configuration["Brevo:SmtpHost"] ?? "smtp-relay.brevo.com";
        var portStr = _configuration["Brevo:SmtpPort"];
        int.TryParse(portStr, out var port);
        if (port == 0) port = 587;

        var username = _configuration["Brevo:Username"];
        var password = _configuration["Brevo:Password"];
        var fromEmail = _configuration["Brevo:FromEmail"] ?? "jude.nitram08@gmail.com";

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException("Brevo SMTP credentials are not configured.");
        }

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(username, password),
            EnableSsl = true,
        };
        var mailMessage = new MailMessage
        {
            From = new MailAddress(fromEmail, "Bren Raphael's"),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        mailMessage.To.Add(new MailAddress(toEmail));
        await client.SendMailAsync(mailMessage, cancellationToken);
    }


    private static string BuildHtmlBody(string fullName, string confirmationUrl)
    {
        return $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8" /></head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9f5ff; padding: 40px 0;">
              <table align="center" width="600" cellpadding="0" cellspacing="0"
                     style="background: #ffffff; border-radius: 8px; border: 1px solid #e8e0f0; padding: 40px;">
                <tr>
                  <td style="text-align: center; padding-bottom: 24px;">
                    <h1 style="color: #6b21a8; margin: 0;">Bren Raphael's</h1>
                    <p style="color: #6b7280; font-size: 14px;">Ube Jam &amp; Halaya</p>
                  </td>
                </tr>
                <tr>
                  <td>
                    <p style="font-size: 16px; color: #1f2937;">Hi {WebUtility.HtmlEncode(fullName)},</p>
                    <p style="font-size: 16px; color: #1f2937;">
                      Thank you for creating an account! Please confirm your email address
                      by clicking the button below:
                    </p>
                    <p style="text-align: center; padding: 24px 0;">
                      <a href="{WebUtility.HtmlEncode(confirmationUrl)}"
                         style="display: inline-block; background-color: #6b21a8; color: #ffffff;
                                padding: 14px 32px; text-decoration: none; border-radius: 6px;
                                font-weight: 600; font-size: 16px;">
                        Verify My Email
                      </a>
                    </p>
                    <p style="font-size: 14px; color: #6b7280;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="font-size: 13px; color: #6b21a8; word-break: break-all;">
                      {WebUtility.HtmlEncode(confirmationUrl)}
                    </p>
                    <p style="font-size: 14px; color: #6b7280; padding-top: 16px;">
                      This link expires in 24 hours. If you didn't create an account, you can
                      safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 32px; border-top: 1px solid #e8e0f0;">
                    <p style="font-size: 12px; color: #9ca3af;">
                      &copy; 2024 Bren Raphael's Ube Jam &amp; Halaya. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
    }
}

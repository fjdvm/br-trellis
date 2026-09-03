using System.Net;
using System.Net.Mail;
using api_crms.Interfaces;

namespace api_crms.Services;

/// <summary>
/// Sends marketing Email Campaigns via Brevo SMTP (smtp-relay.brevo.com), using
/// api-crms's own independent <c>Brevo:*</c> configuration (ADR 0009). Mirrors the
/// structure of api-oos's <c>BrevoEmailSender</c>: an <see cref="SmtpClient"/> per
/// message, looped once per recipient. Every message sets an <c>X-Mailin-Tag</c>
/// header carrying the Campaign id so Brevo's engagement webhook can attribute
/// opens/clicks back to the Campaign.
///
/// When credentials are missing every send fails (recorded in the outcome), so the
/// dispatch result honestly reflects that nothing was delivered rather than silently
/// reporting success.
/// </summary>
public class BrevoMarketingEmailSender(
    IConfiguration configuration,
    ILogger<BrevoMarketingEmailSender> logger) : IMarketingEmailSender
{
    public async Task<MarketingDispatchOutcome> SendCampaignAsync(
        Guid campaignId,
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
                await SendSingleAsync(campaignId, recipient, subject, body, cancellationToken);
                sent++;
            }
            catch (Exception ex)
            {
                failed++;
                errors.Add($"{recipient}: {ex.Message}");
                logger.LogWarning(ex, "Campaign {CampaignId} send to {Recipient} failed", campaignId, recipient);
            }
        }

        return new MarketingDispatchOutcome(sent, failed, errors);
    }

    // Appends a per-recipient unsubscribe link so the opt-out endpoint can identify
    // who is unsubscribing. Returns the body unchanged when no base URL is configured.
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
    /// Sends a single Campaign message over Brevo SMTP, tagged with the Campaign id
    /// via the <c>X-Mailin-Tag</c> header. Virtual so tests can intercept the actual
    /// network call while still exercising the loop's success/failure accumulation
    /// and header wiring. Throws when credentials are missing so the outcome reflects
    /// that recipients weren't delivered.
    /// </summary>
    protected virtual async Task SendSingleAsync(
        Guid campaignId,
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        var host = configuration["Brevo:SmtpHost"] ?? "smtp-relay.brevo.com";
        var portStr = configuration["Brevo:SmtpPort"];
        int.TryParse(portStr, out var port);
        if (port == 0) port = 587;

        var username = configuration["Brevo:Username"];
        var password = configuration["Brevo:Password"];
        var fromEmail = configuration["Brevo:FromEmail"] ?? "jude.nitram08@gmail.com";
        var fromName = configuration["Brevo:FromName"] ?? "Bren Raphael's";

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException("Brevo SMTP credentials are not configured.");
        }

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(username, password),
            EnableSsl = true,
        };
        using var mailMessage = BuildMessage(campaignId, fromEmail, fromName, toEmail, subject, htmlBody);
        await client.SendMailAsync(mailMessage, cancellationToken);
    }

    /// <summary>
    /// Builds the <see cref="MailMessage"/> for a single Campaign send, including the
    /// <c>X-Mailin-Tag</c> header carrying the Campaign id.
    /// </summary>
    private static MailMessage BuildMessage(
        Guid campaignId,
        string fromEmail,
        string fromName,
        string toEmail,
        string subject,
        string htmlBody)
    {
        var mailMessage = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        // Brevo reads this header as the message's tag; the engagement webhook then
        // resolves the Campaign id back from it (fixing #164's missing-tag gap).
        mailMessage.Headers.Add("X-Mailin-Tag", campaignId.ToString());
        mailMessage.To.Add(new MailAddress(toEmail));
        return mailMessage;
    }
}

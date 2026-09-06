using System.Net;
using System.Net.Mail;
using api_crms.Enums;
using api_crms.Helpers;
using api_crms.Interfaces;

namespace api_crms.Services;

/// <summary>Sends marketing Email Campaigns via Brevo SMTP, reusing one connection per dispatch.</summary>
public class BrevoMarketingEmailSender(
    IConfiguration configuration,
    ILogger<BrevoMarketingEmailSender> logger) : IMarketingEmailSender
{
    private const int PacingDelayMilliseconds = 200;

    public async Task<MarketingDispatchOutcome> SendCampaignAsync(
        Guid campaignId,
        IReadOnlyList<string> recipients,
        string subject,
        string htmlBody,
        string? unsubscribeBaseUrl = null,
        EmailTheme? theme = null,
        CancellationToken cancellationToken = default)
    {
        var sent = 0;
        var failed = 0;
        var errors = new List<string>();
        var renderedHtml = EmailBodyRenderer.RenderToHtml(htmlBody, theme: theme);

        SmtpClient client;
        try
        {
            client = CreateClient();
        }
        catch (Exception ex)
        {
            foreach (var recipient in recipients)
            {
                failed++;
                errors.Add($"{recipient}: {ex.Message}");
                logger.LogWarning(ex, "Campaign {CampaignId} send to {Recipient} failed", campaignId, recipient);
            }
            return new MarketingDispatchOutcome(sent, failed, errors);
        }

        using (client)
        {
            for (var i = 0; i < recipients.Count; i++)
            {
                cancellationToken.ThrowIfCancellationRequested();
                if (i > 0)
                {
                    await PaceAsync(cancellationToken);
                }

                var recipient = recipients[i];
                try
                {
                    var body = AppendUnsubscribeFooter(renderedHtml, recipient, unsubscribeBaseUrl);
                    await SendSingleAsync(client, campaignId, recipient, subject, body, cancellationToken);
                    sent++;
                }
                catch (Exception ex)
                {
                    failed++;
                    errors.Add($"{recipient}: {ex.Message}");
                    logger.LogWarning(ex, "Campaign {CampaignId} send to {Recipient} failed", campaignId, recipient);
                }
            }
        }

        return new MarketingDispatchOutcome(sent, failed, errors);
    }

    // Appends a per-recipient unsubscribe link so the opt-out endpoint can identify who is unsubscribing.
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

    /// <summary>Builds the shared SMTP connection for one dispatch. Virtual so tests can substitute a fake connection.</summary>
    protected virtual SmtpClient CreateClient()
    {
        var host = configuration["Brevo:SmtpHost"] ?? "smtp-relay.brevo.com";
        var portStr = configuration["Brevo:SmtpPort"];
        int.TryParse(portStr, out var port);
        if (port == 0) port = 587;

        var username = configuration["Brevo:Username"];
        var password = configuration["Brevo:Password"];

        if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
        {
            throw new InvalidOperationException("Brevo SMTP credentials are not configured.");
        }

        return new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(username, password),
            EnableSsl = true,
        };
    }

    /// <summary>Pacing delay applied between sends. Virtual so tests can skip the real delay.</summary>
    protected virtual Task PaceAsync(CancellationToken cancellationToken) =>
        Task.Delay(PacingDelayMilliseconds, cancellationToken);

    /// <summary>Sends a single Campaign message over the shared connection, tagged with the Campaign id.</summary>
    protected virtual async Task SendSingleAsync(
        SmtpClient client,
        Guid campaignId,
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        var fromEmail = configuration["Brevo:FromEmail"] ?? "jude.nitram08@gmail.com";
        var fromName = configuration["Brevo:FromName"] ?? "Bren Raphael's";

        using var mailMessage = BuildMessage(campaignId, fromEmail, fromName, toEmail, subject, htmlBody);
        await client.SendMailAsync(mailMessage, cancellationToken);
    }

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
        // Brevo reads this header as the message's tag; the engagement webhook resolves the Campaign id from it.
        mailMessage.Headers.Add("X-Mailin-Tag", campaignId.ToString());
        mailMessage.To.Add(new MailAddress(toEmail));
        return mailMessage;
    }
}

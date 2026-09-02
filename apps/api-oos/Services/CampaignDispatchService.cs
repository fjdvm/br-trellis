namespace ApiOos.Services;

using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

public interface ICampaignDispatchService
{
    // Dispatches every currently-due Email campaign. Returns the number dispatched.
    Task<int> DispatchDueCampaignsAsync(CancellationToken cancellationToken = default);
}

/// <summary>
/// Orchestrates one dispatch pass: pull due campaigns from api-crms, bulk-send each
/// over Brevo, and report the outcome back. Appends an unsubscribe footer to the
/// body so every marketing email carries a working opt-out link (#162).
/// </summary>
public sealed class CampaignDispatchService(
    ICampaignDispatchClient dispatchClient,
    IEmailSender emailSender,
    IConfiguration configuration,
    ILogger<CampaignDispatchService> logger) : ICampaignDispatchService
{
    public async Task<int> DispatchDueCampaignsAsync(CancellationToken cancellationToken = default)
    {
        var due = await dispatchClient.GetDueCampaignsAsync(cancellationToken);
        var dispatched = 0;

        foreach (var campaign in due)
        {
            if (campaign.Recipients.Count == 0)
            {
                // Nothing to send, but still report so api-crms marks it terminal.
                await dispatchClient.ReportDispatchResultAsync(
                    campaign.Id, new CampaignDispatchReport(0, 0, 0, []), cancellationToken);
                dispatched++;
                continue;
            }

            var body = AppendUnsubscribeFooter(campaign.Body);
            var result = await emailSender.SendBulkAsync(
                campaign.Recipients, campaign.Subject, body, cancellationToken);

            await dispatchClient.ReportDispatchResultAsync(
                campaign.Id,
                new CampaignDispatchReport(
                    campaign.Recipients.Count, result.SentCount, result.FailedCount, result.Errors),
                cancellationToken);

            logger.LogInformation(
                "Dispatched campaign {CampaignId}: {Sent} sent, {Failed} failed",
                campaign.Id, result.SentCount, result.FailedCount);
            dispatched++;
        }

        return dispatched;
    }

    private string AppendUnsubscribeFooter(string body)
    {
        // The unsubscribe link hits api-oos's own unauthenticated endpoint, which
        // relays the opt-out to api-crms. web-shop base URL is used so the link
        // resolves to a browser-facing page/handler.
        var baseUrl = configuration["ApiOos:PublicBaseUrl"]
            ?? configuration["WebShop:BaseUrl"]
            ?? "https://localhost:3004";
        var unsubscribeUrl = $"{baseUrl.TrimEnd('/')}/api/marketing/unsubscribe";
        return body +
            $"<p style=\"font-size:12px;color:#888;margin-top:24px;\">" +
            $"Don't want these emails? <a href=\"{unsubscribeUrl}\">Unsubscribe</a>.</p>";
    }
}

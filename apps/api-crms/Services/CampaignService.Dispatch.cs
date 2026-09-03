using api_crms.DTOs;
using api_crms.Interfaces;

namespace api_crms.Services;

/// <summary>
/// Configuration for api-crms's direct Email dispatch (ADR 0009). The unsubscribe
/// base URL is embedded per-recipient in every marketing email so a click lands on
/// api-crms's own public unsubscribe endpoint. Null/empty leaves the footer off
/// (e.g. local dev without a public URL).
/// </summary>
public sealed class CampaignDispatchOptions
{
    public string? UnsubscribeBaseUrl { get; init; }
}

public sealed partial class CampaignService
{
    // Internal dispatch pass (ADR 0009). Reuses GetDueEmailCampaignsAsync (which
    // already resolves recipients, dedups, and filters opt-outs) and
    // RecordDispatchResultAsync (which marks the Email channel terminal and clears
    // NextRunAt). Sending is done directly via Brevo — no cross-service hop. A
    // Campaign with no recipients is still recorded so its Email channel goes
    // terminal and the cross-Channel Ended aggregation can complete.
    public async Task<int> DispatchDueEmailCampaignsAsync(CancellationToken cancellationToken)
    {
        var due = await GetDueEmailCampaignsAsync(cancellationToken);
        var dispatched = 0;

        foreach (var campaign in due)
        {
            MarketingDispatchOutcome outcome;
            if (campaign.Recipients.Count == 0)
            {
                outcome = new MarketingDispatchOutcome(0, 0, Array.Empty<string>());
            }
            else
            {
                outcome = await marketingEmailSender.SendCampaignAsync(
                    campaign.Id,
                    campaign.Recipients,
                    campaign.Subject,
                    campaign.Body,
                    dispatchOptions.UnsubscribeBaseUrl,
                    cancellationToken);
            }

            await RecordDispatchResultAsync(
                campaign.Id,
                new CampaignDispatchResultDto(
                    campaign.Recipients.Count,
                    outcome.SentCount,
                    outcome.FailedCount,
                    outcome.Errors),
                cancellationToken);

            dispatched++;
        }

        return dispatched;
    }
}

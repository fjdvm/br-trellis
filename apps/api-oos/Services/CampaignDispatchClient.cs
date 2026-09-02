namespace ApiOos.Services;

using System.Net.Http.Json;
using System.Text.Json;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

/// <summary>
/// Talks to api-crms's Campaign dispatch endpoints over the named <c>ApiCrms</c>
/// HttpClient: GET api/v1/campaigns/due, POST api/v1/campaigns/{id}/dispatch-result,
/// and POST api/v1/contacts/opt-out. This is the sole initiator of the crossing
/// (ADR 0008); api-crms never calls back.
/// </summary>
public sealed class CampaignDispatchClient(
    IHttpClientFactory httpClientFactory,
    ILogger<CampaignDispatchClient> logger) : ICampaignDispatchClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<IReadOnlyList<DueCampaign>> GetDueCampaignsAsync(CancellationToken cancellationToken = default)
    {
        var client = httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);
        try
        {
            using var response = await client.GetAsync("api/v1/campaigns/due", cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Polling api-crms for due campaigns returned {Status}", (int)response.StatusCode);
                return [];
            }
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var due = await JsonSerializer.DeserializeAsync<List<DueCampaign>>(stream, JsonOptions, cancellationToken);
            return due ?? [];
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to poll api-crms for due campaigns");
            return [];
        }
    }

    public async Task ReportDispatchResultAsync(
        Guid campaignId,
        CampaignDispatchReport report,
        CancellationToken cancellationToken = default)
    {
        var client = httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);
        using var response = await client.PostAsJsonAsync(
            $"api/v1/campaigns/{campaignId}/dispatch-result", report, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "api-crms rejected dispatch result for {CampaignId}: {Status}",
                campaignId, (int)response.StatusCode);
        }
    }

    public async Task ReportOptOutAsync(string email, CancellationToken cancellationToken = default)
    {
        var client = httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);
        using var response = await client.PostAsJsonAsync(
            "api/v1/contacts/opt-out", new { Email = email }, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("api-crms rejected opt-out for {Email}: {Status}", email, (int)response.StatusCode);
        }
    }
}

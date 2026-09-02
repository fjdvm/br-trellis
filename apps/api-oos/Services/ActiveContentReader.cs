namespace ApiOos.Services;

using System.Net;
using System.Text.Json;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

/// <summary>
/// Fetches currently-Active Banner/Popup content from api-crms's
/// <c>GET api/v1/campaigns/active-content?channel=</c> over the named
/// <c>ApiCrms</c> HttpClient. A 204 (nothing active) maps to null.
/// </summary>
public sealed class ActiveContentReader(
    IHttpClientFactory httpClientFactory,
    ILogger<ActiveContentReader> logger) : IActiveContentReader
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<ActiveContent?> GetActiveContentAsync(
        string channel, CancellationToken cancellationToken = default)
    {
        var client = httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);
        var path = $"api/v1/campaigns/active-content?channel={Uri.EscapeDataString(channel)}";
        try
        {
            using var response = await client.GetAsync(path, cancellationToken);
            if (response.StatusCode == HttpStatusCode.NoContent
                || response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "api-crms active-content for {Channel} returned {Status}", channel, (int)response.StatusCode);
                return null;
            }
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            if (stream.Length == 0)
            {
                return null;
            }
            return await JsonSerializer.DeserializeAsync<ActiveContent>(stream, JsonOptions, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to read active {Channel} content from api-crms", channel);
            return null;
        }
    }
}

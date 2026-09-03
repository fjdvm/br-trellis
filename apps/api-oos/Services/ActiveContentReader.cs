using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace ApiOos.Services;

/// <summary>
/// Fetches currently-Active Banner/Popup content from api-crms's
/// <c>GET api/v1/campaigns/active-content?channel=</c> over the named
/// <c>ApiCrms</c> HttpClient. A 204 (nothing active) maps to null.
/// Cached in-memory per channel with a 30-second TTL.
/// </summary>
public sealed class ActiveContentReader : IActiveContentReader
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ActiveContentReader> _logger;
    private readonly TimeProvider _timeProvider;
    private readonly ConcurrentDictionary<string, (ActiveContent? Content, DateTimeOffset ExpiresAt)> _cache = new();

    public ActiveContentReader(
        IHttpClientFactory httpClientFactory,
        ILogger<ActiveContentReader> logger,
        TimeProvider? timeProvider = null)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<ActiveContent?> GetActiveContentAsync(
        string channel, CancellationToken cancellationToken = default)
    {
        var now = _timeProvider.GetUtcNow();
        if (_cache.TryGetValue(channel, out var cached) && cached.ExpiresAt > now)
        {
            return cached.Content;
        }

        var client = _httpClientFactory.CreateClient(EcommerceWebhookClient.HttpClientName);
        var path = $"api/v1/campaigns/active-content?channel={Uri.EscapeDataString(channel)}";
        try
        {
            using var response = await client.GetAsync(path, cancellationToken);
            if (response.StatusCode == HttpStatusCode.NoContent
                || response.StatusCode == HttpStatusCode.NotFound)
            {
                _cache[channel] = (null, now.Add(CacheTtl));
                return null;
            }
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "api-crms active-content for {Channel} returned {Status}", channel, (int)response.StatusCode);
                return null;
            }
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            if (stream.Length == 0)
            {
                _cache[channel] = (null, now.Add(CacheTtl));
                return null;
            }
            var content = await JsonSerializer.DeserializeAsync<ActiveContent>(stream, JsonOptions, cancellationToken);
            _cache[channel] = (content, now.Add(CacheTtl));
            return content;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read active {Channel} content from api-crms", channel);
            return null;
        }
    }
}

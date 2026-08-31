namespace ApiOos.Services;

using System.Net.Http.Json;
using System.Text.Json;
using ApiOos.Interfaces.Services;
using Microsoft.Extensions.Logging;

public class SentraCxService : ISentraCxService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SentraCxService> _logger;

    public SentraCxService(
        IHttpClientFactory httpClientFactory,
        ILogger<SentraCxService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<string> CreateSupportTicketAsync(Guid userId, string userName, string userEmail)
    {
        var client = _httpClientFactory.CreateClient("SentraCX");

        var ticketBody = new
        {
            title = $"Support Chat - {userName}",
            description = $"Live chat session initiated by {userName} ({userEmail})"
        };

        var response = await client.PostAsJsonAsync($"/api/v1/tickets?customerId={userId}", ticketBody);
        response.EnsureSuccessStatusCode();

        using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync());
        if (doc.RootElement.TryGetProperty("id", out var idProp))
        {
            return idProp.GetString() ?? idProp.GetGuid().ToString();
        }

        throw new InvalidOperationException("Failed to extract ticket ID from SentraCX API response.");
    }

    public async Task<string> ProxyGetAsync(string path)
    {
        var client = _httpClientFactory.CreateClient("SentraCX");
        var response = await client.GetAsync(path);
        if (!response.IsSuccessStatusCode)
        {
            return "[]";
        }
        return await response.Content.ReadAsStringAsync();
    }

    public async Task<(string Content, int StatusCode)> ProxyPostAsync(string path, object body)
    {
        var client = _httpClientFactory.CreateClient("SentraCX");
        var response = await client.PostAsJsonAsync(path, body);
        var content = await response.Content.ReadAsStringAsync();
        return (content, (int)response.StatusCode);
    }

    public async Task<bool> ProxyDeleteAsync(string path)
    {
        var client = _httpClientFactory.CreateClient("SentraCX");
        var response = await client.DeleteAsync(path);
        return response.IsSuccessStatusCode;
    }
}

using System.Net;
using System.Text;
using ApiOos.Interfaces.Services;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// ActiveContentReader proxies api-crms's active-content endpoint: a 204 means
/// nothing is active (→ null); a 200 returns the deserialized content.
/// </summary>
public sealed class ActiveContentReaderTests
{
    [Fact]
    public async Task GetActiveContent_returns_content_when_crms_returns_200()
    {
        const string json = """
        {
          "campaignId": "11111111-1111-1111-1111-111111111111",
          "channel": "Banner",
          "heading": null,
          "body": "Free shipping!",
          "imageUrl": null,
          "linkUrl": "/sale",
          "ctaText": null,
          "ctaUrl": null,
          "dismissible": true
        }
        """;
        var reader = BuildReader(HttpStatusCode.OK, json);

        var content = await reader.GetActiveContentAsync("Banner");

        content.Should().NotBeNull();
        content!.Channel.Should().Be("Banner");
        content.Body.Should().Be("Free shipping!");
        content.LinkUrl.Should().Be("/sale");
        content.Dismissible.Should().BeTrue();
    }

    [Fact]
    public async Task GetActiveContent_returns_null_on_204()
    {
        var reader = BuildReader(HttpStatusCode.NoContent, "");

        var content = await reader.GetActiveContentAsync("Popup");

        content.Should().BeNull();
    }

    [Fact]
    public async Task GetActiveContent_returns_null_when_crms_errors()
    {
        var reader = BuildReader(HttpStatusCode.InternalServerError, "");

        (await reader.GetActiveContentAsync("Banner")).Should().BeNull();
    }

    private static IActiveContentReader BuildReader(HttpStatusCode status, string body)
    {
        var handler = new StubHandler(status, body);
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:5035/") };
        return new ActiveContentReader(new StubHttpClientFactory(client), NullLogger<ActiveContentReader>.Instance);
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var message = new HttpResponseMessage(status);
            if (!string.IsNullOrEmpty(body))
            {
                message.Content = new StringContent(body, Encoding.UTF8, "application/json");
            }
            return Task.FromResult(message);
        }
    }
}

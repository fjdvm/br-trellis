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
        var (reader, _) = BuildReader(HttpStatusCode.OK, json);

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
        var (reader, _) = BuildReader(HttpStatusCode.NoContent, "");

        var content = await reader.GetActiveContentAsync("Popup");

        content.Should().BeNull();
    }

    [Fact]
    public async Task GetActiveContent_returns_null_when_crms_errors()
    {
        var (reader, _) = BuildReader(HttpStatusCode.InternalServerError, "");

        (await reader.GetActiveContentAsync("Banner")).Should().BeNull();
    }

    [Fact]
    public async Task GetActiveContent_serves_from_cache_within_30s_window_and_expires_after()
    {
        const string json = """
        {
          "campaignId": "11111111-1111-1111-1111-111111111111",
          "channel": "Banner",
          "body": "Cached Banner",
          "dismissible": true
        }
        """;
        var timeProvider = new TestTimeProvider();
        var (reader, handler) = BuildReader(HttpStatusCode.OK, json, timeProvider);

        // First call triggers HTTP request
        var content1 = await reader.GetActiveContentAsync("Banner");
        handler.RequestCount.Should().Be(1);
        content1!.Body.Should().Be("Cached Banner");

        // Advance 29 seconds (within 30s TTL window)
        timeProvider.Advance(TimeSpan.FromSeconds(29));

        // Second call served from cache, no new HTTP request
        var content2 = await reader.GetActiveContentAsync("Banner");
        handler.RequestCount.Should().Be(1);
        content2!.Body.Should().Be("Cached Banner");

        // Advance past 30s (total +31s from start)
        timeProvider.Advance(TimeSpan.FromSeconds(2));

        // Third call after 30s triggers fresh upstream HTTP call
        var content3 = await reader.GetActiveContentAsync("Banner");
        handler.RequestCount.Should().Be(2);
        content3!.Body.Should().Be("Cached Banner");
    }

    [Fact]
    public async Task GetActiveContent_caches_independently_per_channel()
    {
        const string bannerJson = """{"channel": "Banner", "body": "Banner Content"}""";
        const string popupJson = """{"channel": "Popup", "body": "Popup Content"}""";

        var handler = new DynamicStubHandler(req =>
        {
            if (req.RequestUri!.Query.Contains("channel=Banner"))
                return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(bannerJson, Encoding.UTF8, "application/json") };
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(popupJson, Encoding.UTF8, "application/json") };
        });
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:5035/") };
        var timeProvider = new TestTimeProvider();
        var reader = new ActiveContentReader(new StubHttpClientFactory(client), NullLogger<ActiveContentReader>.Instance, timeProvider);

        var banner1 = await reader.GetActiveContentAsync("Banner");
        var popup1 = await reader.GetActiveContentAsync("Popup");
        handler.RequestCount.Should().Be(2);
        banner1!.Body.Should().Be("Banner Content");
        popup1!.Body.Should().Be("Popup Content");

        // Within TTL window, both served from their respective cached entries
        var banner2 = await reader.GetActiveContentAsync("Banner");
        var popup2 = await reader.GetActiveContentAsync("Popup");
        handler.RequestCount.Should().Be(2);
        banner2!.Body.Should().Be("Banner Content");
        popup2!.Body.Should().Be("Popup Content");
    }

    [Fact]
    public async Task GetActiveContent_transient_error_is_not_cached()
    {
        var callCount = 0;
        var handler = new DynamicStubHandler(_ =>
        {
            callCount++;
            if (callCount == 1)
            {
                return new HttpResponseMessage(HttpStatusCode.InternalServerError);
            }
            const string json = """{"channel": "Banner", "body": "Recovered Content"}""";
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") };
        });
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:5035/") };
        var timeProvider = new TestTimeProvider();
        var reader = new ActiveContentReader(new StubHttpClientFactory(client), NullLogger<ActiveContentReader>.Instance, timeProvider);

        // First call fails with 500
        var firstResult = await reader.GetActiveContentAsync("Banner");
        firstResult.Should().BeNull();
        handler.RequestCount.Should().Be(1);

        // Immediately retry without advancing time - transient error was not cached, so it makes a new request and succeeds
        var secondResult = await reader.GetActiveContentAsync("Banner");
        secondResult.Should().NotBeNull();
        secondResult!.Body.Should().Be("Recovered Content");
        handler.RequestCount.Should().Be(2);
    }

    private static (IActiveContentReader Reader, StubHandler Handler) BuildReader(
        HttpStatusCode status, string body, TimeProvider? timeProvider = null)
    {
        var handler = new StubHandler(status, body);
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:5035/") };
        var reader = new ActiveContentReader(new StubHttpClientFactory(client), NullLogger<ActiveContentReader>.Instance, timeProvider);
        return (reader, handler);
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public int RequestCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            var message = new HttpResponseMessage(status);
            if (!string.IsNullOrEmpty(body))
            {
                message.Content = new StringContent(body, Encoding.UTF8, "application/json");
            }
            return Task.FromResult(message);
        }
    }

    private sealed class DynamicStubHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        public int RequestCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            RequestCount++;
            return Task.FromResult(responder(request));
        }
    }

    private sealed class TestTimeProvider : TimeProvider
    {
        private DateTimeOffset _now = DateTimeOffset.UtcNow;

        public override DateTimeOffset GetUtcNow() => _now;

        public void Advance(TimeSpan delta)
        {
            _now = _now.Add(delta);
        }
    }
}

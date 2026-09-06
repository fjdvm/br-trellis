using System.Net;
using ApiOos.DTOs.Webhooks;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Chat;

/// <summary>
/// Covers #151: TicketWebhookClient.SendAsync must fail loud. A non-2xx response from
/// api-crms's Tickets webhook is surfaced to the caller (thrown), not swallowed with a
/// warning — so a rejected relay can never look like a successful send. A 2xx response
/// completes normally. (Echo-gating and retry/backoff are out of scope; see #147.)
/// </summary>
public sealed class TicketWebhookClientTests
{
    [Fact]
    public async Task SendAsync_throws_on_non_success_status()
    {
        var client = BuildClient(HttpStatusCode.Unauthorized);

        var act = () => client.SendAsync(SampleEvent());

        await act.Should().ThrowAsync<HttpRequestException>(
            "a rejected relay must surface, not be swallowed as a warning");
    }

    [Fact]
    public async Task SendAsync_throws_on_server_error()
    {
        var client = BuildClient(HttpStatusCode.InternalServerError);

        var act = () => client.SendAsync(SampleEvent());

        await act.Should().ThrowAsync<HttpRequestException>();
    }

    [Fact]
    public async Task SendAsync_completes_on_success()
    {
        var client = BuildClient(HttpStatusCode.OK);

        var act = () => client.SendAsync(SampleEvent());

        await act.Should().NotThrowAsync();
    }

    private static TicketWebhookEvent SampleEvent() => new()
    {
        EventId = Guid.NewGuid().ToString(),
        EventType = "ticket.message.received",
        Data = new TicketWebhookData
        {
            ConversationId = "conv-1",
            CustomerEmail = "shopper@example.com",
            MessageBody = "Hello",
        },
    };

    private static TicketWebhookClient BuildClient(HttpStatusCode status)
    {
        var handler = new StubHandler(status);
        var httpClient = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:5035/") };
        var factory = new StubHttpClientFactory(httpClient);
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Tickets:WebhookSecret"] = "test-secret",
            })
            .Build();
        return new TicketWebhookClient(factory, config, NullLogger<TicketWebhookClient>.Instance);
    }

    private sealed class StubHandler(HttpStatusCode status) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(new HttpResponseMessage(status));
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }
}

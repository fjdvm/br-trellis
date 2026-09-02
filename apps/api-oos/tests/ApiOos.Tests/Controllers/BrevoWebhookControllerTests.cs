using ApiOos.Controllers;
using ApiOos.Interfaces.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Controllers;

/// <summary>
/// The Brevo webhook maps open/click events to campaign engagement events and
/// relays them to api-crms, resolving the Campaign id from the Brevo tag. Non
/// open/click events and untagged events are ignored.
/// </summary>
public sealed class BrevoWebhookControllerTests
{
    private sealed class CapturingClient : ICampaignDispatchClient
    {
        public List<(Guid Id, CampaignEventReport Report)> Events { get; } = new();
        public Task<IReadOnlyList<DueCampaign>> GetDueCampaignsAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<DueCampaign>>(new List<DueCampaign>());
        public Task ReportDispatchResultAsync(Guid id, CampaignDispatchReport report, CancellationToken ct = default)
            => Task.CompletedTask;
        public Task ReportOptOutAsync(string email, CancellationToken ct = default) => Task.CompletedTask;
        public Task ReportEventAsync(Guid campaignId, CampaignEventReport report, CancellationToken ct = default)
        {
            Events.Add((campaignId, report));
            return Task.CompletedTask;
        }
    }

    private static BrevoWebhookController Build(CapturingClient client)
        => new(client, NullLogger<BrevoWebhookController>.Instance);

    [Fact]
    public async Task Relays_an_open_event_attributed_to_the_campaign_from_the_tag()
    {
        var client = new CapturingClient();
        var campaignId = Guid.NewGuid();

        await Build(client).Receive(new BrevoWebhookController.BrevoEvent
        {
            Event = "opened",
            Email = "shopper@x.io",
            Tags = new List<string> { campaignId.ToString() },
            Ts = 1_700_000_000,
        }, CancellationToken.None);

        var relayed = client.Events.Should().ContainSingle().Subject;
        relayed.Id.Should().Be(campaignId);
        relayed.Report.EventType.Should().Be("Open");
        relayed.Report.Email.Should().Be("shopper@x.io");
    }

    [Fact]
    public async Task Relays_a_click_event_with_its_link()
    {
        var client = new CapturingClient();
        var campaignId = Guid.NewGuid();

        await Build(client).Receive(new BrevoWebhookController.BrevoEvent
        {
            Event = "click",
            Email = "shopper@x.io",
            Link = "https://shop/sale",
            CampaignId = campaignId.ToString(),
        }, CancellationToken.None);

        var relayed = client.Events.Should().ContainSingle().Subject;
        relayed.Report.EventType.Should().Be("Click");
        relayed.Report.Url.Should().Be("https://shop/sale");
    }

    [Fact]
    public async Task Ignores_non_open_click_events()
    {
        var client = new CapturingClient();

        await Build(client).Receive(new BrevoWebhookController.BrevoEvent
        {
            Event = "delivered",
            Email = "shopper@x.io",
            Tags = new List<string> { Guid.NewGuid().ToString() },
        }, CancellationToken.None);

        client.Events.Should().BeEmpty();
    }

    [Fact]
    public async Task Ignores_events_without_a_resolvable_campaign_tag()
    {
        var client = new CapturingClient();

        await Build(client).Receive(new BrevoWebhookController.BrevoEvent
        {
            Event = "opened",
            Email = "shopper@x.io",
            Tags = new List<string> { "not-a-guid" },
        }, CancellationToken.None);

        client.Events.Should().BeEmpty();
    }
}

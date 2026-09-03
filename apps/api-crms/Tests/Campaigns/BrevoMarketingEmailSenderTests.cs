using api_crms.Interfaces;
using api_crms.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace api_crms.Tests.Campaigns;

/// <summary>
/// The api-crms marketing sender (ADR 0009): mirrors the Brevo SMTP loop, accumulates
/// per-recipient success/failure, appends a per-recipient unsubscribe footer, and tags
/// every message with the Campaign id (X-Mailin-Tag). The actual SMTP call is faked.
/// </summary>
public sealed class BrevoMarketingEmailSenderTests
{
    private sealed class TestSender : BrevoMarketingEmailSender
    {
        private readonly HashSet<string> _failFor;
        public List<(Guid CampaignId, string To, string Subject, string Body)> Messages { get; } = new();

        public TestSender(HashSet<string> failFor)
            : base(new ConfigurationBuilder().Build(), NullLogger<BrevoMarketingEmailSender>.Instance)
        {
            _failFor = failFor;
        }

        protected override Task SendSingleAsync(
            Guid campaignId, string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
        {
            if (_failFor.Contains(toEmail))
            {
                throw new InvalidOperationException("smtp rejected");
            }
            Messages.Add((campaignId, toEmail, subject, htmlBody));
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task SendCampaignAsync_accumulates_sent_and_failed_counts_and_errors()
    {
        var sender = new TestSender(failFor: new HashSet<string> { "bad@x.io" });

        var outcome = await sender.SendCampaignAsync(
            Guid.NewGuid(), new[] { "a@x.io", "bad@x.io", "c@x.io" }, "Subject", "<p>Body</p>");

        Assert.Equal(2, outcome.SentCount);
        Assert.Equal(1, outcome.FailedCount);
        var error = Assert.Single(outcome.Errors);
        Assert.Contains("bad@x.io", error);
        Assert.Equal(new[] { "a@x.io", "c@x.io" }, sender.Messages.Select(m => m.To));
    }

    [Fact]
    public async Task SendCampaignAsync_tags_every_message_with_the_campaign_id()
    {
        var campaignId = Guid.NewGuid();
        var sender = new TestSender(failFor: new HashSet<string>());

        await sender.SendCampaignAsync(
            campaignId, new[] { "a@x.io", "b@x.io" }, "Subject", "<p>Body</p>");

        Assert.All(sender.Messages, m => Assert.Equal(campaignId, m.CampaignId));
    }

    [Fact]
    public async Task SendCampaignAsync_appends_a_per_recipient_unsubscribe_link_when_base_url_is_set()
    {
        var sender = new TestSender(failFor: new HashSet<string>());

        await sender.SendCampaignAsync(
            Guid.NewGuid(), new[] { "a@x.io", "b@x.io" }, "Subject", "<p>Body</p>",
            unsubscribeBaseUrl: "https://crms/api/marketing/unsubscribe");

        var a = sender.Messages.Single(m => m.To == "a@x.io").Body;
        var b = sender.Messages.Single(m => m.To == "b@x.io").Body;
        Assert.Contains("email=a%40x.io", a);
        Assert.Contains("email=b%40x.io", b);
        Assert.Contains("Unsubscribe", a);
    }

    [Fact]
    public async Task SendCampaignAsync_omits_the_footer_when_no_base_url_is_set()
    {
        var sender = new TestSender(failFor: new HashSet<string>());

        await sender.SendCampaignAsync(
            Guid.NewGuid(), new[] { "a@x.io" }, "Subject", "<p>Body</p>");

        Assert.DoesNotContain("Unsubscribe", sender.Messages.Single().Body);
    }

    [Fact]
    public async Task SendCampaignAsync_reports_all_failed_when_credentials_are_missing()
    {
        // The real (non-overridden) sender throws when credentials aren't configured,
        // so the outcome honestly reflects that nothing was delivered.
        var sender = new BrevoMarketingEmailSender(
            new ConfigurationBuilder().Build(), NullLogger<BrevoMarketingEmailSender>.Instance);

        var outcome = await sender.SendCampaignAsync(
            Guid.NewGuid(), new[] { "a@x.io", "b@x.io" }, "Subject", "<p>Body</p>");

        Assert.Equal(0, outcome.SentCount);
        Assert.Equal(2, outcome.FailedCount);
    }
}

using ApiOos.Interfaces.Services;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// Campaign dispatch (#162): the bulk sender accumulates per-recipient
/// success/failure, and the dispatch service polls api-crms, sends, and reports
/// the outcome back. SMTP and the api-crms HTTP calls are faked.
/// </summary>
public sealed class CampaignDispatchTests
{
    // --- Bulk send accumulation (extends the BrevoEmailSender seam) ---

    private sealed class TestBrevoSender : BrevoEmailSender
    {
        private readonly HashSet<string> _failFor;
        public List<string> Sent { get; } = new();

        public TestBrevoSender(HashSet<string> failFor)
            : base(new ConfigurationBuilder().Build(), NullLogger<BrevoEmailSender>.Instance)
        {
            _failFor = failFor;
        }

        protected override Task SendSingleAsync(
            string toEmail, string subject, string htmlBody, CancellationToken cancellationToken)
        {
            if (_failFor.Contains(toEmail))
            {
                throw new InvalidOperationException("smtp rejected");
            }
            Sent.Add(toEmail);
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task SendBulkAsync_accumulates_sent_and_failed_counts_and_errors()
    {
        var sender = new TestBrevoSender(failFor: new HashSet<string> { "bad@x.io" });

        var result = await sender.SendBulkAsync(
            new[] { "a@x.io", "bad@x.io", "c@x.io" }, "Subject", "<p>Body</p>");

        result.SentCount.Should().Be(2);
        result.FailedCount.Should().Be(1);
        result.Errors.Should().ContainSingle().Which.Should().Contain("bad@x.io");
        sender.Sent.Should().BeEquivalentTo(new[] { "a@x.io", "c@x.io" });
    }

    // --- Dispatch service end-to-end (fakes) ---

    private sealed class FakeDispatchClient : ICampaignDispatchClient
    {
        public List<DueCampaign> Due { get; init; } = new();
        public List<(Guid Id, CampaignDispatchReport Report)> Reports { get; } = new();
        public List<string> OptOuts { get; } = new();

        public Task<IReadOnlyList<DueCampaign>> GetDueCampaignsAsync(CancellationToken ct = default)
            => Task.FromResult<IReadOnlyList<DueCampaign>>(Due);

        public Task ReportDispatchResultAsync(Guid id, CampaignDispatchReport report, CancellationToken ct = default)
        {
            Reports.Add((id, report));
            return Task.CompletedTask;
        }

        public Task ReportOptOutAsync(string email, CancellationToken ct = default)
        {
            OptOuts.Add(email);
            return Task.CompletedTask;
        }
    }

    private sealed class RecordingSender : IEmailSender
    {
        public List<(IReadOnlyList<string> Recipients, string Subject, string Body)> Calls { get; } = new();

        public Task SendEmailConfirmationAsync(string toEmail, string fullName, string confirmationUrl, CancellationToken ct = default)
            => Task.CompletedTask;

        public Task<BulkEmailResult> SendBulkAsync(IReadOnlyList<string> recipients, string subject, string htmlBody, CancellationToken ct = default)
        {
            Calls.Add((recipients, subject, htmlBody));
            return Task.FromResult(new BulkEmailResult(recipients.Count, 0, System.Array.Empty<string>()));
        }
    }

    private static CampaignDispatchService BuildService(FakeDispatchClient client, IEmailSender sender)
    {
        var config = new ConfigurationBuilder().Build();
        return new CampaignDispatchService(client, sender, config, NullLogger<CampaignDispatchService>.Instance);
    }

    [Fact]
    public async Task DispatchDueCampaignsAsync_sends_each_due_campaign_and_reports_the_result()
    {
        var campaignId = Guid.NewGuid();
        var client = new FakeDispatchClient
        {
            Due =
            {
                new DueCampaign(campaignId, "Blast", "Hello", "<p>Shop now</p>", new[] { "a@x.io", "b@x.io" }),
            },
        };
        var sender = new RecordingSender();
        var service = BuildService(client, sender);

        var dispatched = await service.DispatchDueCampaignsAsync();

        dispatched.Should().Be(1);
        sender.Calls.Should().ContainSingle();
        sender.Calls[0].Recipients.Should().BeEquivalentTo(new[] { "a@x.io", "b@x.io" });
        sender.Calls[0].Subject.Should().Be("Hello");
        // Body carries a working unsubscribe link.
        sender.Calls[0].Body.Should().Contain("unsubscribe");
        // Outcome reported back to api-crms.
        client.Reports.Should().ContainSingle();
        client.Reports[0].Id.Should().Be(campaignId);
        client.Reports[0].Report.SentCount.Should().Be(2);
        client.Reports[0].Report.FailedCount.Should().Be(0);
    }

    [Fact]
    public async Task DispatchDueCampaignsAsync_reports_terminal_even_when_no_recipients()
    {
        var campaignId = Guid.NewGuid();
        var client = new FakeDispatchClient
        {
            Due = { new DueCampaign(campaignId, "Empty", "Hi", "<p>x</p>", System.Array.Empty<string>()) },
        };
        var sender = new RecordingSender();
        var service = BuildService(client, sender);

        await service.DispatchDueCampaignsAsync();

        sender.Calls.Should().BeEmpty("no recipients means no send");
        client.Reports.Should().ContainSingle("but api-crms is still told so the Email channel goes terminal");
        client.Reports[0].Report.SentCount.Should().Be(0);
    }
}

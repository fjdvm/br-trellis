using api_crms.Controllers;
using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace api_crms.Tests.Campaigns;

/// <summary>
/// The public unsubscribe endpoint (ADR 0009). Behavior that matters for a
/// public-facing surface: a valid email opts the Contact out; an invalid/missing
/// email is silently ignored; and the confirmation is identical regardless of
/// whether the email matched — no signal an attacker could use to enumerate Contacts.
/// </summary>
public sealed class MarketingUnsubscribeEndpointTests
{
    private sealed class FakeContactService : IContactService
    {
        public List<string> OptedOut { get; } = new();
        public int MatchCount { get; set; }

        public Task<int> SetMarketingOptOutByEmailAsync(string email, CancellationToken cancellationToken)
        {
            OptedOut.Add(email);
            return Task.FromResult(MatchCount);
        }

        // Unused members.
        public Task<IReadOnlyList<ContactListItemDto>> ListContactsAsync(CancellationToken ct) => throw new NotImplementedException();
        public Task<ContactDetailDto?> GetContactByIdAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
        public Task<ContactDetailDto> CreateContactAsync(CreateContactDto input, CancellationToken ct) => throw new NotImplementedException();
        public Task<ContactDetailDto?> UpdateContactAsync(Guid id, UpdateContactDto input, CancellationToken ct) => throw new NotImplementedException();
        public Task<bool> DeleteContactAsync(Guid id, CancellationToken ct) => throw new NotImplementedException();
    }

    private sealed class DummyCampaignService : ICampaignService
    {
        public Task<CampaignDetailDto> CreateCampaignAsync(CreateCampaignDto input, string? createdByUserId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<CampaignDetailDto?> UpdateCampaignAsync(Guid id, UpdateCampaignDto input, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<bool> DeleteCampaignAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<CampaignDetailDto?> GetCampaignByIdAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<CampaignListItemDto>> ListCampaignsAsync(string? status, string? search, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<CampaignDetailDto?> LaunchCampaignAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<CampaignDetailDto?> EndCampaignAsync(Guid id, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<DueCampaignDto>> GetDueEmailCampaignsAsync(CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<bool> RecordDispatchResultAsync(Guid id, CampaignDispatchResultDto result, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<ActiveChannelContentDto?> GetActiveChannelContentAsync(string channel, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<Guid>> SweepCampaignLifecycleAsync(CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<int> DispatchDueEmailCampaignsAsync(CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<bool> RecordEventAsync(Guid campaignId, CampaignEventDto input, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<CampaignAnalyticsDto?> GetAnalyticsAsync(Guid campaignId, CancellationToken cancellationToken) => throw new NotImplementedException();
        public Task<IReadOnlyList<CampaignEngagementMetricsDto>> GetEngagementMetricsAsync(IReadOnlyList<Guid> campaignIds, CancellationToken cancellationToken) => throw new NotImplementedException();
    }

    [Fact]
    public async Task Unsubscribe_opts_out_a_valid_email()
    {
        var contacts = new FakeContactService();
        var controller = new MarketingController(contacts, new DummyCampaignService());

        var result = await controller.Unsubscribe("Shopper@Example.com", CancellationToken.None);

        var content = Assert.IsType<ContentResult>(result);
        Assert.Contains("unsubscribed", content.Content!, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("Shopper@Example.com", Assert.Single(contacts.OptedOut));
    }

    [Fact]
    public async Task Unsubscribe_returns_the_same_confirmation_whether_or_not_the_email_matched()
    {
        // A matching contact...
        var matched = new FakeContactService { MatchCount = 1 };
        var matchedResult = Assert.IsType<ContentResult>(
            await new MarketingController(matched, new DummyCampaignService()).Unsubscribe("known@example.com", CancellationToken.None));

        // ...and an unknown one produce byte-identical confirmations (no leakage).
        var unknown = new FakeContactService { MatchCount = 0 };
        var unknownResult = Assert.IsType<ContentResult>(
            await new MarketingController(unknown, new DummyCampaignService()).Unsubscribe("stranger@example.com", CancellationToken.None));

        Assert.Equal(matchedResult.Content, unknownResult.Content);
        Assert.Equal(matchedResult.ContentType, unknownResult.ContentType);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-an-email")]
    [InlineData("also@bad@example.com")]
    public async Task Unsubscribe_silently_ignores_missing_or_malformed_email(string? email)
    {
        var contacts = new FakeContactService();
        var controller = new MarketingController(contacts, new DummyCampaignService());

        var result = await controller.Unsubscribe(email, CancellationToken.None);

        // Still returns the generic confirmation (no validation error leaked)...
        var content = Assert.IsType<ContentResult>(result);
        Assert.Contains("unsubscribed", content.Content!, StringComparison.OrdinalIgnoreCase);
        // ...but never touches the data store.
        Assert.Empty(contacts.OptedOut);
    }

    [Fact]
    public async Task Unsubscribe_ignores_absurdly_long_input()
    {
        var contacts = new FakeContactService();
        var controller = new MarketingController(contacts);
        var huge = new string('a', 300) + "@example.com";

        await controller.Unsubscribe(huge, CancellationToken.None);

        Assert.Empty(contacts.OptedOut);
    }

    [Fact]
    public async Task UnsubscribePost_returns_no_content_and_opts_out()
    {
        var contacts = new FakeContactService();
        var controller = new MarketingController(contacts);

        var result = await controller.UnsubscribePost(
            new MarketingController.UnsubscribeRequest("shopper@example.com"), CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.Equal("shopper@example.com", Assert.Single(contacts.OptedOut));
    }
}

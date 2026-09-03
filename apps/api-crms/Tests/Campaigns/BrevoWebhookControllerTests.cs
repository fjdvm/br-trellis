using System.Net;
using System.Net.Http.Json;
using api_crms.Controllers;
using api_crms.Data;
using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Campaigns;

public sealed class BrevoWebhookControllerTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"brevo-webhook-{Guid.NewGuid():N}.db");

    private TestServer CreateServer()
    {
        var builder = new WebHostBuilder()
            .ConfigureServices(services =>
            {
                services.AddRouting();
                services.AddControllers();
                services.AddDbContext<AppDbContext>(options =>
                    options.UseSqlite($"Data Source={_databasePath}"));
                services.AddScoped<IContactRepository, ContactRepository>();
                services.AddScoped<IContactService, ContactService>();
                services.AddScoped<ISegmentRepository, SegmentRepository>();
                services.AddScoped<ISegmentService, SegmentService>();
                services.AddScoped<ICampaignService, CampaignService>();
                services.AddSingleton(new CampaignDispatchOptions());
                services.AddSingleton<IMarketingEmailSender, DummySender>();
            })
            .Configure(app =>
            {
                app.UseRouting();
                app.UseEndpoints(endpoints => endpoints.MapControllers());
            });

        var server = new TestServer(builder);
        using var scope = server.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        return server;
    }

    [Fact]
    public async Task BrevoWebhook_resolves_XMailinTag_and_records_analytics_event()
    {
        using var server = CreateServer();
        using var client = server.CreateClient();

        Guid campaignId;
        using (var scope = server.Services.CreateScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<ICampaignService>();
            var created = await service.CreateCampaignAsync(
                new CreateCampaignDto("Webhook Test", new[] { "Email" }, null,
                    new[] { "user@example.com" }, "SendNow", null, null,
                    new[] { new CampaignChannelContentInput("Email", null, "Subj", null, "Body", null, null, null, null) }),
                null, CancellationToken.None);
            await service.LaunchCampaignAsync(created.Id, CancellationToken.None);
            campaignId = created.Id;
        }

        var payload = new
        {
            @event = "opened",
            email = "user@example.com",
            date = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
            url = (string?)null,
            campaignId = (Guid?)null,
            tag = (string?)null,
            tags = (string[]?)null,
            X_Mailin_Tag = campaignId.ToString()
        };

        var response = await client.PostAsJsonAsync("/api/marketing/webhook/brevo", payload);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using (var scope = server.Services.CreateScope())
        {
            var service = scope.ServiceProvider.GetRequiredService<ICampaignService>();
            var analytics = await service.GetAnalyticsAsync(campaignId, CancellationToken.None);
            Assert.NotNull(analytics);
            Assert.Equal(1, analytics!.OpenedCount);
        }
    }

    public void Dispose()
    {
        if (File.Exists(_databasePath))
        {
            try { File.Delete(_databasePath); } catch { }
        }
    }

    private sealed class DummySender : IMarketingEmailSender
    {
        public Task<MarketingDispatchOutcome> SendCampaignAsync(
            Guid campaignId,
            IReadOnlyList<string> recipients,
            string subject,
            string htmlBody,
            string? unsubscribeBaseUrl = null,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new MarketingDispatchOutcome(recipients.Count, 0, Array.Empty<string>()));
        }
    }
}

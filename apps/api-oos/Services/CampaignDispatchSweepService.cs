namespace ApiOos.Services;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>
/// Background loop that drives <see cref="CampaignDispatchService"/> on an interval,
/// polling api-crms for due Email campaigns and dispatching them via Brevo (ADR 0008).
/// Mirrors <see cref="StaffReplyPollingService"/>; the dispatch service is scoped, so
/// each tick opens a DI scope.
/// </summary>
public sealed class CampaignDispatchSweepService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<CampaignDispatchSweepService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalSeconds = configuration.GetValue<double?>("Campaigns:DispatchPollIntervalSeconds") ?? 60;
        var interval = TimeSpan.FromSeconds(Math.Max(5, intervalSeconds));
        using var timer = new PeriodicTimer(interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var dispatcher = scope.ServiceProvider.GetRequiredService<ICampaignDispatchService>();
                await dispatcher.DispatchDueCampaignsAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Campaign dispatch sweep tick failed.");
            }
        }
    }
}

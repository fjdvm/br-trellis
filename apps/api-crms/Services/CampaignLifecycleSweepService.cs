using api_crms.Interfaces;

namespace api_crms.Services;

public sealed class CampaignLifecycleOptions
{
    // How often the internal lifecycle sweep runs. Default: 15 minutes.
    public TimeSpan SweepInterval { get; init; } = TimeSpan.FromMinutes(15);
}

// Internal, api-crms-owned sweep (no external calls, per ADR 0008) that advances
// Banner/Popup campaigns to Ended once their window expires and aggregates
// cross-Channel status. Mirrors the "scheduled sweep discovers due work" pattern
// used by Cart abandonment. Creates a scope per tick since CampaignService is scoped.
public sealed class CampaignLifecycleSweepService(
    IServiceProvider services,
    CampaignLifecycleOptions options,
    ILogger<CampaignLifecycleSweepService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(options.SweepInterval);
        do
        {
            try
            {
                using var scope = services.CreateScope();
                var campaignService = scope.ServiceProvider.GetRequiredService<ICampaignService>();
                var ended = await campaignService.SweepCampaignLifecycleAsync(stoppingToken);
                if (ended.Count > 0)
                {
                    logger.LogInformation("Campaign lifecycle sweep ended {Count} campaign(s).", ended.Count);
                }
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Campaign lifecycle sweep failed.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}

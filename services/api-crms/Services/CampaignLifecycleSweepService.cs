using api_crms.Interfaces;

namespace api_crms.Services;

public sealed class CampaignLifecycleOptions
{
    // How often the internal lifecycle sweep runs. Default: 15 minutes.
    public TimeSpan SweepInterval { get; init; } = TimeSpan.FromMinutes(15);
}

// Internal, api-crms-owned sweep. Advances Banner/Popup campaigns to Ended once
// their window expires, aggregates cross-Channel status, and — per ADR 0009 —
// dispatches due Email Campaigns directly via Brevo (no cross-service hop). Mirrors
// the "scheduled sweep discovers due work" pattern used by Cart abandonment. Creates
// a scope per tick since CampaignService is scoped.
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

                // Dispatch first so a Campaign that becomes Email-terminal this tick
                // is eligible to End on the same tick's lifecycle pass.
                var dispatched = await campaignService.DispatchDueEmailCampaignsAsync(stoppingToken);
                if (dispatched > 0)
                {
                    logger.LogInformation("Campaign dispatch sweep sent {Count} campaign(s).", dispatched);
                }

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

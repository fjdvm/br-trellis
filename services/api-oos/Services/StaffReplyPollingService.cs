namespace ApiOos.Services;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

/// <summary>
/// Background loop that drives <see cref="StaffReplyRelayService"/> on an interval,
/// polling api-crms for staff replies on active chat conversations and relaying them
/// down the hub. The relay service is scoped, so each tick opens a DI scope.
/// </summary>
public sealed class StaffReplyPollingService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    ILogger<StaffReplyPollingService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var intervalSeconds = configuration.GetValue<double?>("Chat:PollIntervalSeconds") ?? 3;
        var interval = TimeSpan.FromSeconds(Math.Max(1, intervalSeconds));
        using var timer = new PeriodicTimer(interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var relay = scope.ServiceProvider.GetRequiredService<StaffReplyRelayService>();
                await relay.PollOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Staff-reply polling tick failed.");
            }
        }
    }
}

using api_crms.DTOs;
using api_crms.Interfaces;
using api_crms.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace api_crms.Tests.Campaigns;

/// <summary>
/// Verifies the concern raised before shortening Campaigns:SweepIntervalMinutes:
/// if one tick's dispatch pass (e.g. a large recipient list) takes longer than the
/// configured interval, does a later timer tick start a second, overlapping
/// dispatch pass against the same due campaign? See ExecuteAsync's
/// do { ... } while (await timer.WaitForNextTickAsync(...)) structure — it is a
/// single sequential loop, so a slow tick body simply causes intervening ticks to
/// be coalesced away by PeriodicTimer, never run concurrently.
/// </summary>
public sealed class CampaignLifecycleSweepServiceTests
{
    [Fact]
    public async Task A_slow_dispatch_pass_never_overlaps_with_a_later_timer_tick()
    {
        // Interval is far shorter than the simulated dispatch duration, so many
        // ticks' worth of time elapse while a single dispatch pass is still running
        // -- exactly the "3.5 minute send, 1 minute interval" scenario, scaled down.
        var probe = new ConcurrencyProbe();
        var services = new ServiceCollection();
        services.AddSingleton<ICampaignService>(new SlowCampaignService(probe, dispatchDelayMs: 150));
        await using var provider = services.BuildServiceProvider();

        var options = new CampaignLifecycleOptions { SweepInterval = TimeSpan.FromMilliseconds(20) };
        var sut = new CampaignLifecycleSweepService(provider, options, NullLogger<CampaignLifecycleSweepService>.Instance);

        await sut.StartAsync(CancellationToken.None);
        await Task.Delay(600); // several dispatch-durations' worth of would-be ticks
        await sut.StopAsync(CancellationToken.None);

        // Multiple ticks did occur sequentially over the 600ms window...
        Assert.True(probe.CallCount >= 2, $"expected at least 2 dispatch passes, saw {probe.CallCount}");
        // ...but never more than one dispatch pass in flight at the same time.
        Assert.Equal(1, probe.MaxConcurrent);
    }

    private sealed class ConcurrencyProbe
    {
        private readonly object gate = new();
        private int current;

        public int CallCount { get; private set; }
        public int MaxConcurrent { get; private set; }

        public IDisposable Enter()
        {
            lock (gate)
            {
                CallCount++;
                current++;
                if (current > MaxConcurrent)
                {
                    MaxConcurrent = current;
                }
            }
            return new Exit(this);
        }

        private void Leave()
        {
            lock (gate)
            {
                current--;
            }
        }

        private sealed class Exit(ConcurrencyProbe probe) : IDisposable
        {
            public void Dispose() => probe.Leave();
        }
    }

    // Only DispatchDueEmailCampaignsAsync/SweepCampaignLifecycleAsync are exercised
    // by CampaignLifecycleSweepService.ExecuteAsync; every other member is unused.
    private sealed class SlowCampaignService(ConcurrencyProbe probe, int dispatchDelayMs) : ICampaignService
    {
        public async Task<int> DispatchDueEmailCampaignsAsync(CancellationToken cancellationToken)
        {
            using (probe.Enter())
            {
                await Task.Delay(dispatchDelayMs, cancellationToken);
            }
            return 0;
        }

        public Task<IReadOnlyList<Guid>> SweepCampaignLifecycleAsync(CancellationToken cancellationToken)
            => Task.FromResult<IReadOnlyList<Guid>>(Array.Empty<Guid>());

        public Task<IReadOnlyList<CampaignListItemDto>> ListCampaignsAsync(string? status, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<CampaignDetailDto?> GetCampaignByIdAsync(Guid id, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<CampaignDetailDto> CreateCampaignAsync(CreateCampaignDto input, string? createdById, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<CampaignDetailDto?> UpdateCampaignAsync(Guid id, UpdateCampaignDto input, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<bool> DeleteCampaignAsync(Guid id, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<CampaignDetailDto?> LaunchCampaignAsync(Guid id, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<IReadOnlyList<DueCampaignDto>> GetDueEmailCampaignsAsync(CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<bool> RecordDispatchResultAsync(Guid id, CampaignDispatchResultDto result, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<ActiveChannelContentDto?> GetActiveChannelContentAsync(string channel, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public string RenderPreviewHtml(string? content)
            => throw new NotImplementedException();

        public Task<bool> RecordEventAsync(Guid campaignId, CampaignEventDto input, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<CampaignAnalyticsDto?> GetAnalyticsAsync(Guid campaignId, CancellationToken cancellationToken)
            => throw new NotImplementedException();

        public Task<IReadOnlyList<CampaignEngagementMetricsDto>> GetEngagementMetricsAsync(IReadOnlyList<Guid> ids, CancellationToken cancellationToken)
            => throw new NotImplementedException();
    }
}

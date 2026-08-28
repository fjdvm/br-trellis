using System.Net;
using System.Net.Http.Json;
using api_crms.Data;
using api_crms.DTOs;
using api_crms.Models;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Ecommerce;

public sealed class EcommerceSyncStatusControllerTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public EcommerceSyncStatusControllerTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void ClearSyncStatus()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.EcommerceSyncStatuses.RemoveRange(db.EcommerceSyncStatuses);
        db.SaveChanges();
    }

    [Fact]
    public async Task Returns_never_connected_when_no_sync_status_row_exists()
    {
        ClearSyncStatus();

        var response = await _client.GetAsync("/api/v1/ecommerce/sync-status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<EcommerceSyncStatusDto>();
        Assert.NotNull(dto);
        Assert.Equal("never_connected", dto.Status);
        Assert.Null(dto.FirstEventReceivedAt);
        Assert.Null(dto.LastEventReceivedAt);
    }

    [Fact]
    public async Task Returns_healthy_when_last_event_received_recently()
    {
        ClearSyncStatus();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var now = DateTimeOffset.UtcNow;

        db.EcommerceSyncStatuses.Add(new EcommerceSyncStatus
        {
            Id = 1,
            FirstEventReceivedAt = now.AddHours(-1),
            LastEventReceivedAt = now.AddMinutes(-5),
        });
        await db.SaveChangesAsync();

        var response = await _client.GetAsync("/api/v1/ecommerce/sync-status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<EcommerceSyncStatusDto>();
        Assert.NotNull(dto);
        Assert.Equal("healthy", dto.Status);
        Assert.NotNull(dto.FirstEventReceivedAt);
        Assert.NotNull(dto.LastEventReceivedAt);
    }

    [Fact]
    public async Task Returns_stale_when_last_event_is_older_than_threshold()
    {
        ClearSyncStatus();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        db.EcommerceSyncStatuses.Add(new EcommerceSyncStatus
        {
            Id = 1,
            FirstEventReceivedAt = DateTimeOffset.UtcNow.AddDays(-10),
            LastEventReceivedAt = DateTimeOffset.UtcNow.AddDays(-5),
        });
        await db.SaveChangesAsync();

        var response = await _client.GetAsync("/api/v1/ecommerce/sync-status");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var dto = await response.Content.ReadFromJsonAsync<EcommerceSyncStatusDto>();
        Assert.NotNull(dto);
        Assert.Equal("stale", dto.Status);
    }

    [Fact]
    public async Task Returns_unauthorized_without_authentication()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Test-Anonymous", "true");

        var response = await client.GetAsync("/api/v1/ecommerce/sync-status");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

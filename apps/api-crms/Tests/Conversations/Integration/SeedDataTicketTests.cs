using api_crms.Data;
using api_crms.Enums;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Conversations.Integration;

/// <summary>
/// Verifies the seed data requirement from #68: seed tickets span multiple
/// Status/WaitingOn combinations, including at least one Unclaimed+WaitingOn=Agent
/// and one with ContactId = null. Runs the real SeedData.Seed against a fresh DB.
/// </summary>
public sealed class SeedDataTicketTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"seed-ticket-{Guid.NewGuid():N}.db");

    [Fact]
    public void Seed_includes_unclaimed_waiting_agent_and_null_contact_tickets()
    {
        using var context = CreateContext();

        SeedData.Seed(context);

        var tickets = context.Tickets.ToList();
        Assert.NotEmpty(tickets);

        // At least one Unclaimed + WaitingOn=Agent
        Assert.Contains(tickets, t =>
            t.Status == TicketStatus.Unclaimed && t.WaitingOn == WaitingOn.Agent);

        // At least one with ContactId = null
        Assert.Contains(tickets, t => t.ContactId == null);

        // Spans multiple Status/WaitingOn combinations
        Assert.True(tickets.Select(t => t.Status).Distinct().Count() > 1);
        Assert.True(tickets.Select(t => t.WaitingOn).Distinct().Count() > 1);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite($"Data Source={_databasePath}")
            .Options;
        var context = new AppDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}

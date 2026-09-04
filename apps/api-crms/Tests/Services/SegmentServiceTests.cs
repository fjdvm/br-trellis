using api_crms.Data;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Services;

public sealed class SegmentServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"segment-service-{Guid.NewGuid():N}.db");

    public SegmentServiceTests()
    {
        using var context = CreateContext();
    }

    [Fact]
    public async Task GetAudienceCountsAsync_returns_unified_companies_count_matching_contacts_with_company()
    {
        await using var context = CreateContext();

        // 2 active companies
        var company1 = new Company { Id = Guid.NewGuid(), Name = "Co 1", CreatedAt = DateTimeOffset.UtcNow };
        var company2 = new Company { Id = Guid.NewGuid(), Name = "Co 2", CreatedAt = DateTimeOffset.UtcNow };
        context.Companies.AddRange(company1, company2);

        // Contact with company
        var contactWithCompany1 = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Alice",
            Email = "alice@co1.com",
            CompanyId = company1.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };
        var contactWithCompany2 = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Bob",
            Email = "bob@co1.com",
            CompanyId = company1.Id,
            CreatedAt = DateTimeOffset.UtcNow
        };

        // Contact without company
        var contactSolo = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Charlie",
            Email = "charlie@solo.com",
            CompanyId = null,
            CreatedAt = DateTimeOffset.UtcNow
        };

        context.Contacts.AddRange(contactWithCompany1, contactWithCompany2, contactSolo);
        await context.SaveChangesAsync();

        var service = new SegmentService(new SegmentRepository(context), context);
        var counts = await service.GetAudienceCountsAsync(CancellationToken.None);

        Assert.Equal(3, counts.All);
        Assert.Equal(1, counts.Contacts);
        Assert.Equal(2, counts.Companies); // Counts contacts with CompanyId != null (2), not Company table count (2)
        Assert.Equal(0, counts.Ecommerce);
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

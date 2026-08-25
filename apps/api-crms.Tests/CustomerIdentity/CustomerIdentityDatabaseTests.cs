using api_crms.CustomerIdentity.Persistence;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.CustomerIdentity;

public sealed class CustomerIdentityDatabaseTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"customer-identity-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task Migration_creates_customer_identity_tables()
    {
        await using var context = CreateContext();

        await context.Database.MigrateAsync();

        var tableNames = await context.Database
            .SqlQuery<string>($"SELECT name AS Value FROM sqlite_master WHERE type = 'table'")
            .ToListAsync();

        Assert.Contains("customer", tableNames);
        Assert.Contains("source_reference", tableNames);

        var customerColumns = await GetColumnNames(context, "customer");
        var sourceReferenceColumns = await GetColumnNames(context, "source_reference");

        AssertRequiredColumns(customerColumns, "id", "created_at", "name", "email", "phone", "deleted_at");
        AssertRequiredColumns(
            sourceReferenceColumns,
            "id",
            "customer_id",
            "source_system",
            "source_id",
            "match_confidence",
            "status",
            "created_at",
            "deleted_at");

        var customer = new Customer
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var sourceReference = new SourceReference
        {
            Id = Guid.NewGuid(),
            CustomerId = customer.Id,
            SourceSystem = "pos",
            SourceId = "source-123",
            Status = SourceReferenceStatus.Linked,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        context.Add(customer);
        context.Add(sourceReference);
        await context.SaveChangesAsync();

        var persistedStatus = await context.Database
            .SqlQuery<string>($"SELECT status AS Value FROM source_reference WHERE id = {sourceReference.Id}")
            .SingleAsync();

        Assert.Equal("linked", persistedStatus);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private static async Task<List<string>> GetColumnNames(
        CustomerIdentityDbContext context,
        string tableName)
    {
        return await context.Database
            .SqlQuery<string>($"SELECT name AS Value FROM pragma_table_info({tableName})")
            .ToListAsync();
    }

    private static void AssertRequiredColumns(
        IEnumerable<string> actualColumns,
        params string[] requiredColumns)
    {
        foreach (var requiredColumn in requiredColumns)
        {
            Assert.Contains(requiredColumn, actualColumns);
        }
    }

    private CustomerIdentityDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CustomerIdentityDbContext>()
            .UseSqlite($"Data Source={_databasePath}")
            .Options;

        return new CustomerIdentityDbContext(options);
    }
}

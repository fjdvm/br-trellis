using api_crms.Data;
using api_crms.Models;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.ContactIdentity;

public sealed class ContactIdentityDatabaseTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"contact-identity-db-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task AppDbContext_creates_all_required_tables()
    {
        await using var context = CreateContext();

        var tableNames = await context.Database
            .SqlQuery<string>($"SELECT name AS Value FROM sqlite_master WHERE type = 'table'")
            .ToListAsync();

        Assert.Contains("contact", tableNames);
        Assert.Contains("source_reference", tableNames);
        Assert.Contains("identity_match_candidate", tableNames);
        Assert.Contains("company", tableNames);
        Assert.Contains("custom_field_definition", tableNames);
        Assert.Contains("custom_field_option", tableNames);
        Assert.Contains("custom_field_value", tableNames);
        Assert.Contains("segment", tableNames);
        Assert.Contains("segment_membership", tableNames);
        Assert.Contains("timeline_entry", tableNames);
    }

    [Fact]
    public async Task Contact_table_has_required_columns()
    {
        await using var context = CreateContext();

        var columns = await GetColumnNames(context, "contact");

        AssertRequiredColumns(columns,
            "id", "created_at", "name", "email", "phone",
            "sentiment_score", "company_id", "deleted_at");
    }

    [Fact]
    public async Task Source_reference_stores_status_as_lowercase_string()
    {
        await using var context = CreateContext();

        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var sourceReference = new SourceReference
        {
            Id = Guid.NewGuid(),
            ContactId = contact.Id,
            SourceSystem = "pos",
            SourceId = "source-123",
            Status = SourceReferenceStatus.Linked,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        context.Add(contact);
        context.Add(sourceReference);
        await context.SaveChangesAsync();

        var persistedStatus = await context.Database
            .SqlQuery<string>($"SELECT status AS Value FROM source_reference WHERE id = {sourceReference.Id}")
            .SingleAsync();

        Assert.Equal("linked", persistedStatus);
    }

    [Fact]
    public async Task Source_reference_has_unique_constraint_on_source_system_and_source_id()
    {
        await using var context = CreateContext();

        var indexes = await context.Database
            .SqlQuery<string>($"SELECT name AS Value FROM pragma_index_list('source_reference')")
            .ToListAsync();

        Assert.Contains("IX_source_reference_source_system_source_id", indexes);
    }

    [Fact]
    public async Task Identity_match_candidate_has_required_columns()
    {
        await using var context = CreateContext();

        var columns = await GetColumnNames(context, "identity_match_candidate");

        AssertRequiredColumns(columns,
            "id", "source_reference_id", "candidate_contact_id",
            "confidence_score", "created_at", "deleted_at");
    }

    [Fact]
    public async Task Company_table_has_required_columns()
    {
        await using var context = CreateContext();

        var columns = await GetColumnNames(context, "company");

        AssertRequiredColumns(columns, "id", "name", "created_at", "deleted_at");
    }

    [Fact]
    public async Task Custom_field_definition_table_has_required_columns()
    {
        await using var context = CreateContext();

        var columns = await GetColumnNames(context, "custom_field_definition");

        AssertRequiredColumns(columns, "id", "name", "field_type", "created_at", "deleted_at");
    }

    [Fact]
    public async Task Custom_field_value_table_has_required_columns()
    {
        await using var context = CreateContext();

        var columns = await GetColumnNames(context, "custom_field_value");

        AssertRequiredColumns(columns,
            "id", "contact_id", "custom_field_definition_id",
            "text_value", "number_value", "date_value", "bool_value", "option_id");
    }

    [Fact]
    public async Task Segment_table_has_required_columns()
    {
        await using var context = CreateContext();

        var columns = await GetColumnNames(context, "segment");

        AssertRequiredColumns(columns,
            "id", "name", "type", "is_system_defined", "rule", "created_at", "deleted_at");
    }

    [Fact]
    public async Task Timeline_entry_table_has_required_columns()
    {
        await using var context = CreateContext();

        var columns = await GetColumnNames(context, "timeline_entry");

        AssertRequiredColumns(columns,
            "id", "contact_id", "source_module", "entry_type",
            "summary", "occurred_at", "created_at");
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private static async Task<List<string>> GetColumnNames(AppDbContext context, string tableName)
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

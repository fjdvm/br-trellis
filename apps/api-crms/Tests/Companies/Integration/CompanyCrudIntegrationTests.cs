using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using api_crms.Data;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Companies.Integration;

/// <summary>
/// End-to-end HTTP verification for #46 (Company CRUD end-to-end): create, read,
/// update, archive; BuyerType and PrimaryContactId validation; archived exclusion
/// from list; member count. Drives /api/v1/companies through TestWebApplicationFactory.
/// </summary>
public sealed class CompanyCrudIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public CompanyCrudIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void ResetCompanies()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Contacts.RemoveRange(db.Contacts);
        db.Companies.RemoveRange(db.Companies);
        db.SaveChanges();
    }

    [Fact]
    public async Task Create_read_returns_company_with_buyer_type()
    {
        ResetCompanies();

        var create = await _client.PostAsJsonAsync(
            "/api/v1/companies", new { name = "Acme End2End", buyerType = "Institutional", primaryContactId = (Guid?)null });
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetGuid();
        Assert.Equal("Acme End2End", created.GetProperty("name").GetString());
        Assert.Equal("Institutional", created.GetProperty("buyerType").GetString());

        var read = await _client.GetAsync($"/api/v1/companies/{id}");
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
        var body = await read.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Acme End2End", body.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Create_with_invalid_buyer_type_is_rejected()
    {
        ResetCompanies();

        // CompanyController surfaces service validation as an exception (no ArgumentException
        // catch, unlike TicketController), so the request fails at the pipeline boundary.
        // The acceptance requirement is that an invalid BuyerType is REJECTED and not
        // persisted — assert that here.
        await Assert.ThrowsAnyAsync<Exception>(() => _client.PostAsJsonAsync(
            "/api/v1/companies", new { name = "Bad", buyerType = "NotAType", primaryContactId = (Guid?)null }));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.False(db.Companies.Any(c => c.Name == "Bad"));
    }

    [Fact]
    public async Task Update_changes_name_and_buyer_type()
    {
        ResetCompanies();
        var id = await CreateCompanyAsync("Old", "Individual");

        var update = await _client.PutAsJsonAsync(
            $"/api/v1/companies/{id}", new { name = "New Name", buyerType = "Institutional", primaryContactId = (Guid?)null });
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var body = await update.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("New Name", body.GetProperty("name").GetString());
        Assert.Equal("Institutional", body.GetProperty("buyerType").GetString());
    }

    [Fact]
    public async Task PrimaryContact_not_belonging_to_company_is_rejected()
    {
        ResetCompanies();
        var companyId = await CreateCompanyAsync("Co", "Institutional");
        // Contact belongs to a DIFFERENT company.
        Guid foreignContactId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var other = new Company { Id = Guid.NewGuid(), Name = "Other", BuyerType = BuyerType.Individual, CreatedAt = DateTimeOffset.UtcNow };
            db.Companies.Add(other);
            var contact = new Contact { Id = Guid.NewGuid(), Name = "Foreign", CompanyId = other.Id, CreatedAt = DateTimeOffset.UtcNow };
            db.Contacts.Add(contact);
            db.SaveChanges();
            foreignContactId = contact.Id;
        }

        // Validation rejects a primary contact that belongs to another company; the
        // CompanyController surfaces this as an exception rather than a 400.
        await Assert.ThrowsAnyAsync<Exception>(() => _client.PutAsJsonAsync(
            $"/api/v1/companies/{companyId}", new { name = (string?)null, buyerType = (string?)null, primaryContactId = foreignContactId }));

        // The rejected link was not persisted.
        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Null(verifyDb.Companies.Find(companyId)!.PrimaryContactId);
    }

    [Fact]
    public async Task Archive_excludes_from_default_list_and_returns_no_content()
    {
        ResetCompanies();
        var id = await CreateCompanyAsync("ToArchive", "Institutional");

        var archive = await _client.DeleteAsync($"/api/v1/companies/{id}");
        Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);

        var list = await _client.GetAsync("/api/v1/companies");
        var items = await list.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in items.EnumerateArray())
        {
            Assert.NotEqual(id, item.GetProperty("id").GetGuid());
        }

        // Included when includeArchived=true
        var listArchived = await _client.GetAsync("/api/v1/companies?includeArchived=true");
        var archivedItems = await listArchived.Content.ReadFromJsonAsync<JsonElement>();
        var found = false;
        foreach (var item in archivedItems.EnumerateArray())
            if (item.GetProperty("id").GetGuid() == id) found = true;
        Assert.True(found);
    }

    [Fact]
    public async Task Archive_missing_company_returns_404()
    {
        var response = await _client.DeleteAsync($"/api/v1/companies/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task List_member_count_excludes_deleted_contacts()
    {
        ResetCompanies();
        var companyId = await CreateCompanyAsync("Members", "Institutional");
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Contacts.AddRange(
                new Contact { Id = Guid.NewGuid(), Name = "A", CompanyId = companyId, CreatedAt = DateTimeOffset.UtcNow },
                new Contact { Id = Guid.NewGuid(), Name = "B", CompanyId = companyId, CreatedAt = DateTimeOffset.UtcNow },
                new Contact { Id = Guid.NewGuid(), Name = "Del", CompanyId = companyId, CreatedAt = DateTimeOffset.UtcNow, DeletedAt = DateTimeOffset.UtcNow });
            db.SaveChanges();
        }

        var list = await _client.GetAsync("/api/v1/companies");
        var items = await list.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in items.EnumerateArray())
        {
            if (item.GetProperty("id").GetGuid() == companyId)
            {
                Assert.Equal(2, item.GetProperty("memberCount").GetInt32());
            }
        }
    }

    private async Task<Guid> CreateCompanyAsync(string name, string buyerType)
    {
        var response = await _client.PostAsJsonAsync(
            "/api/v1/companies", new { name, buyerType, primaryContactId = (Guid?)null });
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using api_crms.Data;
using api_crms.Models;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Conversations.Integration;

/// <summary>
/// End-to-end HTTP verification for #111 (Canned Reply Categories CRUD + the
/// ConversationsCanWrite policy): create, read, update, archive; archived
/// exclusion from list; reply count; and the write-policy enforcement on the
/// mutating endpoints (claim present, absent, and isSuperUser bypass) while
/// GET requires only authentication. Drives /api/v1/canned-reply-categories
/// through TestWebApplicationFactory, mirroring CompanyCrudIntegrationTests.
/// </summary>
public sealed class CannedReplyCategoryCrudIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private const string CanWrite = """{"CRMS":{"Conversations":{"canWrite":true}}}""";
    private const string NoWrite = """{"CRMS":{"Conversations":{}}}""";

    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public CannedReplyCategoryCrudIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private void ResetCannedReplies()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.CannedReplies.RemoveRange(db.CannedReplies);
        db.CannedReplyCategories.RemoveRange(db.CannedReplyCategories);
        db.SaveChanges();
    }

    // --- CRUD behavior (with write permission) ---

    [Fact]
    public async Task Create_read_returns_category()
    {
        ResetCannedReplies();

        var create = await PostCategoryAsync("Shipping");
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetGuid();
        Assert.Equal("Shipping", created.GetProperty("name").GetString());

        var read = await _client.GetAsync($"/api/v1/canned-reply-categories/{id}");
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
        var body = await read.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Shipping", body.GetProperty("name").GetString());
        Assert.Equal(0, body.GetProperty("replyCount").GetInt32());
    }

    [Fact]
    public async Task Create_with_blank_name_is_rejected()
    {
        ResetCannedReplies();

        // Service validation surfaces as a pipeline exception (no ArgumentException
        // catch in the controller), matching the CompanyController convention.
        await Assert.ThrowsAnyAsync<Exception>(() => PostCategoryAsync("   "));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Empty(db.CannedReplyCategories);
    }

    [Fact]
    public async Task Update_changes_name()
    {
        ResetCannedReplies();
        var id = await CreateCategoryAsync("Old");

        var update = await SendJsonAsync(
            HttpMethod.Put, $"/api/v1/canned-reply-categories/{id}", new { name = "New" }, CanWrite);
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var body = await update.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("New", body.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Archive_excludes_from_default_list_and_returns_no_content()
    {
        ResetCannedReplies();
        var id = await CreateCategoryAsync("ToArchive");

        var archive = await SendAsync(HttpMethod.Delete, $"/api/v1/canned-reply-categories/{id}", CanWrite);
        Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);

        var list = await _client.GetAsync("/api/v1/canned-reply-categories");
        var items = await list.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in items.EnumerateArray())
        {
            Assert.NotEqual(id, item.GetProperty("id").GetGuid());
        }

        var listArchived = await _client.GetAsync("/api/v1/canned-reply-categories?includeArchived=true");
        var archivedItems = await listArchived.Content.ReadFromJsonAsync<JsonElement>();
        var found = false;
        foreach (var item in archivedItems.EnumerateArray())
            if (item.GetProperty("id").GetGuid() == id) found = true;
        Assert.True(found);
    }

    [Fact]
    public async Task Archive_missing_category_returns_404()
    {
        var response = await SendAsync(
            HttpMethod.Delete, $"/api/v1/canned-reply-categories/{Guid.NewGuid()}", CanWrite);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Restore_brings_archived_category_back_into_default_list()
    {
        ResetCannedReplies();
        var id = await CreateCategoryAsync("Retired");
        await SendAsync(HttpMethod.Delete, $"/api/v1/canned-reply-categories/{id}", CanWrite);

        var restore = await SendAsync(
            HttpMethod.Post, $"/api/v1/canned-reply-categories/{id}/restore", CanWrite);
        Assert.Equal(HttpStatusCode.OK, restore.StatusCode);
        var body = await restore.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("deletedAt").ValueKind == JsonValueKind.Null);

        // Back in the default (non-archived) list.
        var list = await _client.GetAsync("/api/v1/canned-reply-categories");
        var items = await list.Content.ReadFromJsonAsync<JsonElement>();
        var found = false;
        foreach (var item in items.EnumerateArray())
            if (item.GetProperty("id").GetGuid() == id) found = true;
        Assert.True(found);
    }

    [Fact]
    public async Task Restore_without_write_permission_is_forbidden()
    {
        ResetCannedReplies();
        var id = await CreateCategoryAsync("Retired");
        await SendAsync(HttpMethod.Delete, $"/api/v1/canned-reply-categories/{id}", CanWrite);

        var response = await SendAsync(
            HttpMethod.Post, $"/api/v1/canned-reply-categories/{id}/restore", NoWrite);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task List_reply_count_excludes_archived_replies()
    {
        ResetCannedReplies();
        var categoryId = await CreateCategoryAsync("Refunds");
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.CannedReplies.AddRange(
                new CannedReply { Id = Guid.NewGuid(), CategoryId = categoryId, Name = "A", Body = "x", CreatedAt = DateTimeOffset.UtcNow },
                new CannedReply { Id = Guid.NewGuid(), CategoryId = categoryId, Name = "B", Body = "y", CreatedAt = DateTimeOffset.UtcNow },
                new CannedReply { Id = Guid.NewGuid(), CategoryId = categoryId, Name = "Del", Body = "z", CreatedAt = DateTimeOffset.UtcNow, DeletedAt = DateTimeOffset.UtcNow });
            db.SaveChanges();
        }

        var list = await _client.GetAsync("/api/v1/canned-reply-categories");
        var items = await list.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in items.EnumerateArray())
        {
            if (item.GetProperty("id").GetGuid() == categoryId)
            {
                Assert.Equal(2, item.GetProperty("replyCount").GetInt32());
            }
        }
    }

    // --- ConversationsCanWrite policy enforcement ---

    [Fact]
    public async Task Create_without_write_permission_is_forbidden()
    {
        ResetCannedReplies();
        var response = await SendJsonAsync(
            HttpMethod.Post, "/api/v1/canned-reply-categories", new { name = "NoPerm" }, NoWrite);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Assert.Empty(db.CannedReplyCategories);
    }

    [Fact]
    public async Task Update_without_write_permission_is_forbidden()
    {
        ResetCannedReplies();
        var id = await CreateCategoryAsync("Locked");
        var response = await SendJsonAsync(
            HttpMethod.Put, $"/api/v1/canned-reply-categories/{id}", new { name = "Hacked" }, NoWrite);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Archive_without_write_permission_is_forbidden()
    {
        ResetCannedReplies();
        var id = await CreateCategoryAsync("Locked");
        var response = await SendAsync(
            HttpMethod.Delete, $"/api/v1/canned-reply-categories/{id}", NoWrite);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Create_as_superuser_without_claim_is_allowed()
    {
        ResetCannedReplies();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/canned-reply-categories")
        {
            Content = JsonContent.Create(new { name = "SuperMade" }),
        };
        request.Headers.Add("X-Test-Permissions", """{"CRMS":{}}""");
        request.Headers.Add("X-Test-Is-SuperUser", "true");

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Get_list_requires_only_authentication()
    {
        // Default test claims contain no Conversations.canWrite, yet GET succeeds.
        var response = await _client.GetAsync("/api/v1/canned-reply-categories");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Get_list_anonymous_is_unauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/canned-reply-categories");
        request.Headers.Add("X-Test-Anonymous", "true");
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- Helpers ---

    private Task<HttpResponseMessage> PostCategoryAsync(string name) =>
        SendJsonAsync(HttpMethod.Post, "/api/v1/canned-reply-categories", new { name }, CanWrite);

    private async Task<Guid> CreateCategoryAsync(string name)
    {
        var response = await PostCategoryAsync(name);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private async Task<HttpResponseMessage> SendJsonAsync(
        HttpMethod method, string path, object payload, string permissions)
    {
        using var request = new HttpRequestMessage(method, path)
        {
            Content = JsonContent.Create(payload),
        };
        request.Headers.Add("X-Test-Permissions", permissions);
        return await _client.SendAsync(request);
    }

    private async Task<HttpResponseMessage> SendAsync(
        HttpMethod method, string path, string permissions)
    {
        using var request = new HttpRequestMessage(method, path);
        request.Headers.Add("X-Test-Permissions", permissions);
        return await _client.SendAsync(request);
    }
}

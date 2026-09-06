using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using api_crms.Data;
using api_crms.Tests.Helpers;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace api_crms.Tests.Conversations.Integration;

/// <summary>
/// End-to-end HTTP verification for #112 (Canned Replies CRUD scoped to a
/// Category): create, read, update, archive; the ConversationsCanWrite policy
/// on the mutating endpoints; the optional ?categoryId list filter; and the
/// key rule that a Category with any non-archived Canned Reply cannot be
/// archived. Drives /api/v1/canned-replies and /api/v1/canned-reply-categories
/// through TestWebApplicationFactory.
/// </summary>
public sealed class CannedReplyCrudIntegrationTests
    : IClassFixture<TestWebApplicationFactory>
{
    private const string CanWrite = """{"CRMS":{"Conversations":{"canWrite":true}}}""";
    private const string NoWrite = """{"CRMS":{"Conversations":{}}}""";

    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public CannedReplyCrudIntegrationTests(TestWebApplicationFactory factory)
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

    // --- CRUD behavior ---

    [Fact]
    public async Task Create_read_returns_reply_with_category()
    {
        ResetCannedReplies();
        var categoryId = await CreateCategoryAsync("Shipping");

        var create = await SendJsonAsync(HttpMethod.Post, "/api/v1/canned-replies",
            new { categoryId, name = "Where is my order", body = "Hi {{customer_name}}, your order {{ticket_id}} is on its way." }, CanWrite);
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetGuid();
        Assert.Equal("Where is my order", created.GetProperty("name").GetString());
        Assert.Equal(categoryId, created.GetProperty("categoryId").GetGuid());
        Assert.Equal("Shipping", created.GetProperty("categoryName").GetString());

        var read = await _client.GetAsync($"/api/v1/canned-replies/{id}");
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
        var body = await read.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Contains("{{customer_name}}", body.GetProperty("body").GetString());
    }

    [Fact]
    public async Task Create_in_nonexistent_category_is_rejected()
    {
        ResetCannedReplies();
        await Assert.ThrowsAnyAsync<Exception>(() => SendJsonAsync(
            HttpMethod.Post, "/api/v1/canned-replies",
            new { categoryId = Guid.NewGuid(), name = "Orphan", body = "x" }, CanWrite));
    }

    [Fact]
    public async Task Update_changes_name_body_and_category()
    {
        ResetCannedReplies();
        var catA = await CreateCategoryAsync("A");
        var catB = await CreateCategoryAsync("B");
        var id = await CreateReplyAsync(catA, "Old", "old body");

        var update = await SendJsonAsync(HttpMethod.Put, $"/api/v1/canned-replies/{id}",
            new { categoryId = catB, name = "New", body = "new body" }, CanWrite);
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var body = await update.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("New", body.GetProperty("name").GetString());
        Assert.Equal("new body", body.GetProperty("body").GetString());
        Assert.Equal(catB, body.GetProperty("categoryId").GetGuid());
    }

    [Fact]
    public async Task Archive_excludes_from_default_list()
    {
        ResetCannedReplies();
        var categoryId = await CreateCategoryAsync("General");
        var id = await CreateReplyAsync(categoryId, "Greeting", "Hello");

        var archive = await SendAsync(HttpMethod.Delete, $"/api/v1/canned-replies/{id}", CanWrite);
        Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);

        var list = await _client.GetAsync("/api/v1/canned-replies");
        var items = await list.Content.ReadFromJsonAsync<JsonElement>();
        foreach (var item in items.EnumerateArray())
            Assert.NotEqual(id, item.GetProperty("id").GetGuid());

        var archived = await _client.GetAsync("/api/v1/canned-replies?includeArchived=true");
        var archivedItems = await archived.Content.ReadFromJsonAsync<JsonElement>();
        var found = false;
        foreach (var item in archivedItems.EnumerateArray())
            if (item.GetProperty("id").GetGuid() == id) found = true;
        Assert.True(found);
    }

    [Fact]
    public async Task List_filters_by_category()    {
        ResetCannedReplies();
        var catA = await CreateCategoryAsync("A");
        var catB = await CreateCategoryAsync("B");
        var replyA = await CreateReplyAsync(catA, "InA", "a");
        await CreateReplyAsync(catB, "InB", "b");

        var list = await _client.GetAsync($"/api/v1/canned-replies?categoryId={catA}");
        var items = await list.Content.ReadFromJsonAsync<JsonElement>();
        var ids = items.EnumerateArray().Select(i => i.GetProperty("id").GetGuid()).ToList();
        Assert.Single(ids);
        Assert.Equal(replyA, ids[0]);
    }

    // --- Non-empty-category archive guard (the #112 headline rule) ---

    [Fact]
    public async Task Restore_brings_archived_reply_back_into_default_list()
    {
        ResetCannedReplies();
        var categoryId = await CreateCategoryAsync("General");
        var id = await CreateReplyAsync(categoryId, "Greeting", "Hello");
        await SendAsync(HttpMethod.Delete, $"/api/v1/canned-replies/{id}", CanWrite);

        var restore = await SendAsync(HttpMethod.Post, $"/api/v1/canned-replies/{id}/restore", CanWrite);
        Assert.Equal(HttpStatusCode.OK, restore.StatusCode);

        var list = await _client.GetAsync("/api/v1/canned-replies");
        var items = await list.Content.ReadFromJsonAsync<JsonElement>();
        var found = false;
        foreach (var item in items.EnumerateArray())
            if (item.GetProperty("id").GetGuid() == id) found = true;
        Assert.True(found);
    }

    [Fact]
    public async Task Restoring_reply_into_archived_category_is_rejected()
    {
        ResetCannedReplies();
        var categoryId = await CreateCategoryAsync("Seasonal");
        var replyId = await CreateReplyAsync(categoryId, "Holiday", "Closed");
        // Archive the reply, then the (now-empty) category.
        await SendAsync(HttpMethod.Delete, $"/api/v1/canned-replies/{replyId}", CanWrite);
        await SendAsync(HttpMethod.Delete, $"/api/v1/canned-reply-categories/{categoryId}", CanWrite);

        // Restoring the reply into an archived category must be rejected so an
        // active reply can never live under a hidden category.
        await Assert.ThrowsAnyAsync<Exception>(() => SendAsync(
            HttpMethod.Post, $"/api/v1/canned-replies/{replyId}/restore", CanWrite));
    }

    [Fact]
    public async Task Archiving_category_with_active_reply_is_rejected_and_category_survives()
    {
        ResetCannedReplies();
        var categoryId = await CreateCategoryAsync("Refunds");
        await CreateReplyAsync(categoryId, "Refund policy", "Our refund policy is...");

        // Service validation surfaces as a pipeline exception, matching convention.
        await Assert.ThrowsAnyAsync<Exception>(() => SendAsync(
            HttpMethod.Delete, $"/api/v1/canned-reply-categories/{categoryId}", CanWrite));

        // The category was NOT archived.
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var category = db.CannedReplyCategories.Find(categoryId);
        Assert.NotNull(category);
        Assert.Null(category!.DeletedAt);
    }

    [Fact]
    public async Task Archiving_category_after_its_replies_archived_succeeds()
    {
        ResetCannedReplies();
        var categoryId = await CreateCategoryAsync("Seasonal");
        var replyId = await CreateReplyAsync(categoryId, "Holiday hours", "We are closed...");

        // Archive the only reply first.
        var archiveReply = await SendAsync(HttpMethod.Delete, $"/api/v1/canned-replies/{replyId}", CanWrite);
        Assert.Equal(HttpStatusCode.NoContent, archiveReply.StatusCode);

        // Now the category can be archived.
        var archiveCategory = await SendAsync(HttpMethod.Delete, $"/api/v1/canned-reply-categories/{categoryId}", CanWrite);
        Assert.Equal(HttpStatusCode.NoContent, archiveCategory.StatusCode);
    }

    // --- Policy enforcement ---

    [Fact]
    public async Task Create_without_write_permission_is_forbidden()
    {
        ResetCannedReplies();
        var categoryId = await CreateCategoryAsync("Locked");
        var response = await SendJsonAsync(HttpMethod.Post, "/api/v1/canned-replies",
            new { categoryId, name = "NoPerm", body = "x" }, NoWrite);
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Get_list_requires_only_authentication()
    {
        var response = await _client.GetAsync("/api/v1/canned-replies");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Get_list_anonymous_is_unauthorized()
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/v1/canned-replies");
        request.Headers.Add("X-Test-Anonymous", "true");
        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // --- Helpers ---

    private async Task<Guid> CreateCategoryAsync(string name)
    {
        var response = await SendJsonAsync(
            HttpMethod.Post, "/api/v1/canned-reply-categories", new { name }, CanWrite);
        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private async Task<Guid> CreateReplyAsync(Guid categoryId, string name, string bodyText)
    {
        var response = await SendJsonAsync(
            HttpMethod.Post, "/api/v1/canned-replies", new { categoryId, name, body = bodyText }, CanWrite);
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

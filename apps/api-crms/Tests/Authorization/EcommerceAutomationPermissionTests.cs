using System.Net;
using api_crms.Tests.Helpers;
using Xunit;

namespace api_crms.Tests.Authorization;

public class EcommerceAutomationPermissionTests(TestWebApplicationFactory factory)
    : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    // --- Ecommerce (Orders, Products, Carts) ---

    [Theory]
    [InlineData("/api/v1/orders")]
    [InlineData("/api/v1/products")]
    [InlineData("/api/v1/carts")]
    public async Task EcommerceEndpoints_WithCanRead_ReturnsOk(string path)
    {
        var response = await SendAsync(path, """{"CRMS":{"Ecommerce":{"canRead":true}}}""");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData("/api/v1/orders")]
    [InlineData("/api/v1/products")]
    [InlineData("/api/v1/carts")]
    public async Task EcommerceEndpoints_WithoutCanRead_ReturnsForbidden(string path)
    {
        var response = await SendAsync(path, """{"CRMS":{"Ecommerce":{}}}""");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData("/api/v1/orders")]
    [InlineData("/api/v1/products")]
    [InlineData("/api/v1/carts")]
    public async Task EcommerceEndpoints_WithEmptyPermissions_ReturnsForbidden(string path)
    {
        var response = await SendAsync(path, """{"CRMS":{}}""");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // --- Automation (Workflow Runs) ---

    [Fact]
    public async Task WorkflowRuns_WithCanRead_ReturnsOk()
    {
        var response = await SendAsync("/api/v1/workflow-runs", """{"CRMS":{"Automation":{"canRead":true}}}""");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task WorkflowRuns_WithoutCanRead_ReturnsForbidden()
    {
        var response = await SendAsync("/api/v1/workflow-runs", """{"CRMS":{"Automation":{}}}""");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // --- Independent gating ---

    [Fact]
    public async Task EcommerceCanRead_DoesNotGrantAutomation()
    {
        var permissions = """{"CRMS":{"Ecommerce":{"canRead":true}}}""";

        var ordersResponse = await SendAsync("/api/v1/orders", permissions);
        var workflowResponse = await SendAsync("/api/v1/workflow-runs", permissions);

        Assert.Equal(HttpStatusCode.OK, ordersResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, workflowResponse.StatusCode);
    }

    [Fact]
    public async Task AutomationCanRead_DoesNotGrantEcommerce()
    {
        var permissions = """{"CRMS":{"Automation":{"canRead":true}}}""";

        var ordersResponse = await SendAsync("/api/v1/orders", permissions);
        var workflowResponse = await SendAsync("/api/v1/workflow-runs", permissions);

        Assert.Equal(HttpStatusCode.Forbidden, ordersResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, workflowResponse.StatusCode);
    }

    // --- SuperUser bypass ---

    [Theory]
    [InlineData("/api/v1/orders")]
    [InlineData("/api/v1/products")]
    [InlineData("/api/v1/carts")]
    [InlineData("/api/v1/workflow-runs")]
    public async Task SuperUser_BypassesAllPermissionChecks(string path)
    {
        var response = await SendAsync(path, """{"CRMS":{}}""", isSuperUser: true);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // --- Unauthenticated (anonymous) ---

    [Theory]
    [InlineData("/api/v1/orders")]
    [InlineData("/api/v1/products")]
    [InlineData("/api/v1/carts")]
    [InlineData("/api/v1/workflow-runs")]
    public async Task Anonymous_ReturnsUnauthorized(string path)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Add("X-Test-Anonymous", "true");

        var response = await _client.SendAsync(request);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<HttpResponseMessage> SendAsync(
        string path,
        string permissions,
        bool isSuperUser = false)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, path);
        request.Headers.Add("X-Test-Permissions", permissions);
        if (isSuperUser) request.Headers.Add("X-Test-Is-SuperUser", "true");

        return await _client.SendAsync(request);
    }
}

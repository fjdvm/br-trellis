using api_crms.Controllers;
using api_crms.CustomerIdentity;
using api_crms.CustomerIdentity.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.CustomerIdentity;

public sealed class CustomerIdentityServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"customer-identity-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task ResolveOrCreateCustomer_creates_a_linked_customer_when_no_candidate_exists()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.ResolveOrCreateCustomerAsync(new ResolveOrCreateCustomerCommand(
            "pos",
            "customer-100",
            "Maya Chen",
            "maya@example.com",
            "555-0100"));

        var customer = await context.Customers.SingleAsync();
        var sourceReference = await context.SourceReferences.SingleAsync();

        Assert.True(result.CreatedCustomer);
        Assert.Equal(customer.Id, result.CustomerId);
        Assert.Equal("Maya Chen", customer.Name);
        Assert.Equal(SourceReferenceStatus.Linked, sourceReference.Status);
        Assert.Equal(customer.Id, sourceReference.CustomerId);
        Assert.Equal("pos", sourceReference.SourceSystem);
        Assert.Equal("customer-100", sourceReference.SourceId);
    }

    [Fact]
    public async Task ResolveOrCreateCustomer_links_a_new_source_reference_to_the_single_high_confidence_customer()
    {
        await using var context = CreateContext();
        var existingCustomer = new Customer
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Email = "maya@example.com",
        };
        context.Customers.Add(existingCustomer);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ResolveOrCreateCustomerAsync(new ResolveOrCreateCustomerCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            "maya@example.com",
            null));

        Assert.False(result.CreatedCustomer);
        Assert.Equal(existingCustomer.Id, result.CustomerId);
        Assert.Equal(1, await context.Customers.CountAsync());

        var sourceReference = await context.SourceReferences.SingleAsync();
        Assert.Equal(existingCustomer.Id, sourceReference.CustomerId);
        Assert.Equal(SourceReferenceStatus.Linked, sourceReference.Status);
        Assert.Equal(1m, sourceReference.MatchConfidence);
    }

    [Fact]
    public async Task ResolveOrCreateCustomer_is_idempotent_for_the_same_source_record()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var command = new ResolveOrCreateCustomerCommand(
            "pos",
            "customer-100",
            "Maya Chen",
            "maya@example.com",
            "555-0100");

        var first = await service.ResolveOrCreateCustomerAsync(command);
        var repeated = await service.ResolveOrCreateCustomerAsync(command);

        Assert.Equal(first.CustomerId, repeated.CustomerId);
        Assert.False(repeated.CreatedCustomer);
        Assert.Equal(1, await context.Customers.CountAsync());
        Assert.Equal(1, await context.SourceReferences.CountAsync());
    }

    [Fact]
    public async Task ResolveOrCreateCustomer_endpoint_returns_the_resolved_customer()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var controller = new CustomerIdentityController(service, context);

        var response = await controller.ResolveOrCreateCustomer(
            new ResolveOrCreateCustomerCommand(
                "pos",
                "customer-100",
                "Maya Chen",
                "maya@example.com",
                "555-0100"),
            CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var payload = Assert.IsType<ResolveOrCreateCustomerResult>(result.Value);

        Assert.True(payload.CreatedCustomer);
        Assert.Equal(await context.Customers.Select(customer => customer.Id).SingleAsync(), payload.CustomerId);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private CustomerIdentityService CreateService(CustomerIdentityDbContext context)
    {
        return new CustomerIdentityService(context, new CustomerIdentityOptions());
    }

    private CustomerIdentityDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CustomerIdentityDbContext>()
            .UseSqlite($"Data Source={_databasePath}")
            .Options;
        var context = new CustomerIdentityDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}

using api_crms.Controllers;
using api_crms.CustomerIdentity;
using api_crms.CustomerIdentity.Persistence;
using api_crms.DTOs;
using api_crms.Repositories;
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
    public async Task ResolveOrCreateCustomer_creates_a_pending_review_customer_for_an_ambiguous_candidate()
    {
        await using var context = CreateContext();
        var existingCustomer = new Customer
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Maya Chen",
        };
        context.Customers.Add(existingCustomer);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ResolveOrCreateCustomerAsync(new ResolveOrCreateCustomerCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            null,
            null));

        var sourceReference = await context.SourceReferences
            .SingleAsync(reference => reference.SourceSystem == "ecommerce");
        var candidate = await context.IdentityMatchCandidates.SingleAsync();

        Assert.True(result.CreatedCustomer);
        Assert.NotEqual(existingCustomer.Id, result.CustomerId);
        Assert.Equal(2, await context.Customers.CountAsync());
        Assert.Equal(SourceReferenceStatus.PendingReview, sourceReference.Status);
        Assert.Equal(0.5m, sourceReference.MatchConfidence);
        Assert.Equal(sourceReference.Id, candidate.SourceReferenceId);
        Assert.Equal(existingCustomer.Id, candidate.CandidateCustomerId);
        Assert.Equal(0.5m, candidate.ConfidenceScore);
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

    [Fact]
    public async Task ResolveOrCreateCustomer_creates_a_pending_review_customer_for_multiple_high_confidence_candidates()
    {
        await using var context = CreateContext();
        context.Customers.AddRange(
            new Customer
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTimeOffset.UtcNow,
                Email = "maya@example.com",
            },
            new Customer
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTimeOffset.UtcNow,
                Email = "maya@example.com",
            });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ResolveOrCreateCustomerAsync(new ResolveOrCreateCustomerCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            "maya@example.com",
            null));

        var sourceReference = await context.SourceReferences
            .SingleAsync(reference => reference.SourceSystem == "ecommerce");
        var candidates = await context.IdentityMatchCandidates.ToListAsync();

        Assert.True(result.CreatedCustomer);
        Assert.Equal(SourceReferenceStatus.PendingReview, sourceReference.Status);
        Assert.Equal(2, candidates.Count);
        Assert.All(candidates, candidate => Assert.Equal(1m, candidate.ConfidenceScore));
    }

    [Fact]
    public async Task ListPendingReviewCustomers_returns_the_pending_customer_with_its_candidate_and_confidence()
    {
        await using var context = CreateContext();
        context.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Maya Chen",
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        await service.ResolveOrCreateCustomerAsync(new ResolveOrCreateCustomerCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            null,
            null));

        var pendingReview = Assert.Single(await service.ListPendingReviewCustomersAsync());
        var candidate = Assert.Single(pendingReview.Candidates);

        Assert.Equal("Maya Chen", pendingReview.Customer.Name);
        Assert.Equal("Maya Chen", candidate.Customer.Name);
        Assert.Equal(0.5m, candidate.ConfidenceScore);
    }

    [Fact]
    public async Task PendingReview_endpoint_returns_queued_customer_candidates()
    {
        await using var context = CreateContext();
        context.Customers.Add(new Customer
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Maya Chen",
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        await service.ResolveOrCreateCustomerAsync(new ResolveOrCreateCustomerCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            null,
            null));
        var controller = new CustomerIdentityController(service, context);

        var response = await controller.ListPendingReviewCustomers(CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var payload = Assert.IsAssignableFrom<IReadOnlyList<PendingReviewCustomer>>(result.Value);
        Assert.Single(payload);
        Assert.Equal(0.5m, Assert.Single(payload[0].Candidates).ConfidenceScore);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private CustomerIdentityService CreateService(CustomerIdentityDbContext context)
    {
        return new CustomerIdentityService(
            new CustomerIdentityRepository(context),
            new CustomerIdentityOptions());
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

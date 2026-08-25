using api_crms.Controllers;
using api_crms.Data;
using api_crms.DTOs;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.ContactIdentity;

public sealed class ContactIdentityServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"contact-identity-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task ResolveOrCreateContact_creates_a_linked_contact_when_no_candidate_exists()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.ResolveOrCreateContactAsync(new ResolveOrCreateContactCommand(
            "pos",
            "customer-100",
            "Maya Chen",
            "maya@example.com",
            "555-0100"));

        var contact = await context.Contacts.SingleAsync();
        var sourceReference = await context.SourceReferences.SingleAsync();

        Assert.True(result.CreatedContact);
        Assert.Equal(contact.Id, result.ContactId);
        Assert.Equal("Maya Chen", contact.Name);
        Assert.Equal(SourceReferenceStatus.Linked, sourceReference.Status);
        Assert.Equal(contact.Id, sourceReference.ContactId);
        Assert.Equal("pos", sourceReference.SourceSystem);
        Assert.Equal("customer-100", sourceReference.SourceId);
    }

    [Fact]
    public async Task ResolveOrCreateContact_links_a_new_source_reference_to_the_single_high_confidence_contact()
    {
        await using var context = CreateContext();
        var existingContact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Email = "maya@example.com",
        };
        context.Contacts.Add(existingContact);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ResolveOrCreateContactAsync(new ResolveOrCreateContactCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            "maya@example.com",
            null));

        Assert.False(result.CreatedContact);
        Assert.Equal(existingContact.Id, result.ContactId);
        Assert.Equal(1, await context.Contacts.CountAsync());

        var sourceReference = await context.SourceReferences.SingleAsync();
        Assert.Equal(existingContact.Id, sourceReference.ContactId);
        Assert.Equal(SourceReferenceStatus.Linked, sourceReference.Status);
        Assert.Equal(1m, sourceReference.MatchConfidence);
    }

    [Fact]
    public async Task ResolveOrCreateContact_creates_a_pending_review_contact_for_an_ambiguous_candidate()
    {
        await using var context = CreateContext();
        var existingContact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Maya Chen",
        };
        context.Contacts.Add(existingContact);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ResolveOrCreateContactAsync(new ResolveOrCreateContactCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            null,
            null));

        var sourceReference = await context.SourceReferences
            .SingleAsync(reference => reference.SourceSystem == "ecommerce");
        var candidate = await context.IdentityMatchCandidates.SingleAsync();

        Assert.True(result.CreatedContact);
        Assert.NotEqual(existingContact.Id, result.ContactId);
        Assert.Equal(2, await context.Contacts.CountAsync());
        Assert.Equal(SourceReferenceStatus.PendingReview, sourceReference.Status);
        Assert.Equal(0.5m, sourceReference.MatchConfidence);
        Assert.Equal(sourceReference.Id, candidate.SourceReferenceId);
        Assert.Equal(existingContact.Id, candidate.CandidateContactId);
        Assert.Equal(0.5m, candidate.ConfidenceScore);
    }

    [Fact]
    public async Task ResolveOrCreateContact_is_idempotent_for_the_same_source_record()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var command = new ResolveOrCreateContactCommand(
            "pos",
            "customer-100",
            "Maya Chen",
            "maya@example.com",
            "555-0100");

        var first = await service.ResolveOrCreateContactAsync(command);
        var repeated = await service.ResolveOrCreateContactAsync(command);

        Assert.Equal(first.ContactId, repeated.ContactId);
        Assert.False(repeated.CreatedContact);
        Assert.Equal(1, await context.Contacts.CountAsync());
        Assert.Equal(1, await context.SourceReferences.CountAsync());
    }

    [Fact]
    public async Task ResolveOrCreateContact_endpoint_returns_the_resolved_contact()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var controller = new ContactIdentityController(service);

        var response = await controller.ResolveOrCreateContact(
            new ResolveOrCreateContactCommand(
                "pos",
                "customer-100",
                "Maya Chen",
                "maya@example.com",
                "555-0100"),
            CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var payload = Assert.IsType<ResolveOrCreateContactResult>(result.Value);

        Assert.True(payload.CreatedContact);
        Assert.Equal(await context.Contacts.Select(c => c.Id).SingleAsync(), payload.ContactId);
    }

    [Fact]
    public async Task ResolveOrCreateContact_creates_a_pending_review_contact_for_multiple_high_confidence_candidates()
    {
        await using var context = CreateContext();
        context.Contacts.AddRange(
            new Contact
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTimeOffset.UtcNow,
                Email = "maya@example.com",
            },
            new Contact
            {
                Id = Guid.NewGuid(),
                CreatedAt = DateTimeOffset.UtcNow,
                Email = "maya@example.com",
            });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ResolveOrCreateContactAsync(new ResolveOrCreateContactCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            "maya@example.com",
            null));

        var sourceReference = await context.SourceReferences
            .SingleAsync(reference => reference.SourceSystem == "ecommerce");
        var candidates = await context.IdentityMatchCandidates.ToListAsync();

        Assert.True(result.CreatedContact);
        Assert.Equal(SourceReferenceStatus.PendingReview, sourceReference.Status);
        Assert.Equal(2, candidates.Count);
        Assert.All(candidates, candidate => Assert.Equal(1m, candidate.ConfidenceScore));
    }

    [Fact]
    public async Task ListPendingReviewContacts_returns_the_pending_contact_with_its_candidate_and_confidence()
    {
        await using var context = CreateContext();
        context.Contacts.Add(new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Maya Chen",
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        await service.ResolveOrCreateContactAsync(new ResolveOrCreateContactCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            null,
            null));

        var pendingReview = Assert.Single(await service.ListPendingReviewContactsAsync());
        var candidate = Assert.Single(pendingReview.Candidates);

        Assert.Equal("Maya Chen", pendingReview.Contact.Name);
        Assert.Equal("Maya Chen", candidate.Contact.Name);
        Assert.Equal(0.5m, candidate.ConfidenceScore);
    }

    [Fact]
    public async Task PendingReview_endpoint_returns_queued_contact_candidates()
    {
        await using var context = CreateContext();
        context.Contacts.Add(new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Maya Chen",
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        await service.ResolveOrCreateContactAsync(new ResolveOrCreateContactCommand(
            "ecommerce",
            "buyer-200",
            "Maya Chen",
            null,
            null));
        var controller = new ContactIdentityController(service);

        var response = await controller.ListPendingReviewContacts(CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var payload = Assert.IsAssignableFrom<IReadOnlyList<PendingReviewContact>>(result.Value);
        Assert.Single(payload);
        Assert.Equal(0.5m, Assert.Single(payload[0].Candidates).ConfidenceScore);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private ContactIdentityService CreateService(AppDbContext context)
    {
        return new ContactIdentityService(
            new ContactIdentityRepository(context),
            new ContactIdentityOptions());
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

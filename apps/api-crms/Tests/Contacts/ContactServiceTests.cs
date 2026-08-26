using api_crms.Controllers;
using api_crms.Data;
using api_crms.DTOs;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Contacts;

public sealed class ContactServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"contact-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task ListContacts_returns_all_active_contacts_with_source_references()
    {
        await using var context = CreateContext();
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Maya Chen",
            Email = "maya@example.com",
        };
        context.Contacts.Add(contact);
        context.SourceReferences.Add(new SourceReference
        {
            Id = Guid.NewGuid(),
            ContactId = contact.Id,
            SourceSystem = "pos",
            SourceId = "c-100",
            Status = SourceReferenceStatus.Linked,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = new ContactService(new ContactRepository(context), context);
        var result = await service.ListContactsAsync(CancellationToken.None);

        var item = Assert.Single(result);
        Assert.Equal("Maya Chen", item.Name);
        Assert.Equal("pos", item.SourceReferences[0].SourceSystem);
    }

    [Fact]
    public async Task GetContactById_returns_detail_with_company_and_timeline()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme Corp",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);

        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Maya Chen",
            CompanyId = company.Id,
            SentimentScore = 0.75m,
        };
        context.Contacts.Add(contact);

        context.TimelineEntries.Add(new TimelineEntry
        {
            Id = Guid.NewGuid(),
            ContactId = contact.Id,
            SourceModule = "Ecommerce",
            EntryType = "Order",
            Summary = "Placed order #123",
            OccurredAt = DateTimeOffset.UtcNow.AddDays(-1),
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = new ContactService(new ContactRepository(context), context);
        var detail = await service.GetContactByIdAsync(contact.Id, CancellationToken.None);

        Assert.NotNull(detail);
        Assert.Equal("Maya Chen", detail.Name);
        Assert.Equal("Acme Corp", detail.Company!.Name);
        Assert.Equal(0.75m, detail.SentimentScore);
        Assert.Single(detail.TimelineEntries);
        Assert.Equal("Placed order #123", detail.TimelineEntries[0].Summary);
    }

    [Fact]
    public async Task GetContactById_returns_null_for_deleted_contact()
    {
        await using var context = CreateContext();
        context.Contacts.Add(new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            DeletedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = new ContactService(new ContactRepository(context), context);
        var result = await service.GetContactByIdAsync(
            (await context.Contacts.FirstAsync()).Id,
            CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task ContactController_GetContact_returns_NotFound_for_missing_contact()
    {
        await using var context = CreateContext();
        var service = new ContactService(new ContactRepository(context), context);
        var customFieldService = new CustomFieldService(context);
        var controller = new ContactController(service, customFieldService);

        var response = await controller.GetContact(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    [Fact]
    public async Task ContactController_ListContacts_returns_ok_with_items()
    {
        await using var context = CreateContext();
        context.Contacts.Add(new Contact
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow,
            Name = "Alice",
        });
        await context.SaveChangesAsync();

        var service = new ContactService(new ContactRepository(context), context);
        var customFieldService = new CustomFieldService(context);
        var controller = new ContactController(service, customFieldService);

        var response = await controller.ListContacts(CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IReadOnlyList<ContactListItemDto>>(result.Value);
        Assert.Single(items);
    }

    [Fact]
    public async Task CustomFieldService_update_and_read_round_trips()
    {
        await using var context = CreateContext();
        var definition = new CustomFieldDefinition
        {
            Id = Guid.NewGuid(),
            Name = "Tier",
            FieldType = CustomFieldType.Text,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.CustomFieldDefinitions.Add(definition);
        var contact = new Contact { Id = Guid.NewGuid(), CreatedAt = DateTimeOffset.UtcNow };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();

        var cfService = new CustomFieldService(context);
        await cfService.UpdateValueAsync(contact.Id, new CustomFieldValueUpdateDto(
            definition.Id, "Gold", null, null, null, null), CancellationToken.None);

        var values = await cfService.GetValuesForContactAsync(contact.Id, CancellationToken.None);

        var value = Assert.Single(values);
        Assert.Equal("Tier", value.Name);
        Assert.Equal("Gold", value.TextValue);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    [Fact]
    public async Task CreateContact_with_active_company_succeeds()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Active Co",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var service = new ContactService(new ContactRepository(context), context);
        var result = await service.CreateContactAsync(
            new CreateContactDto("Alice", "alice@test.com", null, company.Id),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Alice", result.Name);
    }

    [Fact]
    public async Task CreateContact_with_archived_company_throws()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Archived Co",
            CreatedAt = DateTimeOffset.UtcNow,
            DeletedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var service = new ContactService(new ContactRepository(context), context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateContactAsync(
                new CreateContactDto("Bob", "bob@test.com", null, company.Id),
                CancellationToken.None));
    }

    [Fact]
    public async Task UpdateContact_with_archived_company_throws()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Archived Co",
            CreatedAt = DateTimeOffset.UtcNow,
            DeletedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Alice",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();

        var service = new ContactService(new ContactRepository(context), context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.UpdateContactAsync(
                contact.Id,
                new UpdateContactDto(null, null, null, company.Id),
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateContact_with_nonexistent_company_throws()
    {
        await using var context = CreateContext();
        var service = new ContactService(new ContactRepository(context), context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateContactAsync(
                new CreateContactDto("Alice", "alice@test.com", null, Guid.NewGuid()),
                CancellationToken.None));
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

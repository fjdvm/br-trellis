using api_crms.Controllers;
using api_crms.Data;
using api_crms.DTOs;
using api_crms.Enums;
using api_crms.Models;
using api_crms.Repositories;
using api_crms.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace api_crms.Tests.Companies;

public sealed class CompanyServiceTests : IDisposable
{
    private readonly string _databasePath = Path.Combine(
        Path.GetTempPath(),
        $"company-service-{Guid.NewGuid():N}.db");

    [Fact]
    public async Task CreateCompany_creates_with_name_and_buyer_type()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.CreateCompanyAsync(
            new CreateCompanyDto("Acme Corp", "Institutional", null),
            CancellationToken.None);

        Assert.Equal("Acme Corp", result.Name);
        Assert.Equal("Institutional", result.BuyerType);
        Assert.Null(result.PrimaryContactId);
        Assert.Null(result.DeletedAt);
    }

    [Fact]
    public async Task CreateCompany_throws_for_empty_name()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateCompanyAsync(
                new CreateCompanyDto("", "Institutional", null),
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateCompany_throws_for_invalid_buyer_type()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateCompanyAsync(
                new CreateCompanyDto("Test", "InvalidType", null),
                CancellationToken.None));
    }

    [Fact]
    public async Task CreateCompany_with_primary_contact_that_belongs_to_company_succeeds()
    {
        await using var context = CreateContext();

        // First create the company without primary contact
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Test Co",
            BuyerType = BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);

        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Alice",
            CompanyId = company.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();

        var service = CreateService(context);

        // Now update the company with a primary contact
        var result = await service.UpdateCompanyAsync(
            company.Id,
            new UpdateCompanyDto(null, null, contact.Id),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(contact.Id, result.PrimaryContactId);
    }

    [Fact]
    public async Task CreateCompany_with_primary_contact_not_belonging_to_company_throws()
    {
        await using var context = CreateContext();

        var otherCompany = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Other Co",
            BuyerType = BuyerType.Individual,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(otherCompany);

        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Bob",
            CompanyId = otherCompany.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();

        var service = CreateService(context);

        // Try to create a new company pointing at a contact that belongs to 'otherCompany'
        await Assert.ThrowsAsync<ArgumentException>(
            () => service.CreateCompanyAsync(
                new CreateCompanyDto("New Co", "Institutional", contact.Id),
                CancellationToken.None));
    }

    [Fact]
    public async Task ListCompanies_excludes_archived_by_default()
    {
        await using var context = CreateContext();
        context.Companies.AddRange(
            new Company
            {
                Id = Guid.NewGuid(),
                Name = "Active Co",
                BuyerType = BuyerType.Institutional,
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new Company
            {
                Id = Guid.NewGuid(),
                Name = "Archived Co",
                BuyerType = BuyerType.Individual,
                CreatedAt = DateTimeOffset.UtcNow,
                DeletedAt = DateTimeOffset.UtcNow,
            });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListCompaniesAsync(false, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal("Active Co", result[0].Name);
    }

    [Fact]
    public async Task ListCompanies_includes_archived_when_flag_set()
    {
        await using var context = CreateContext();
        context.Companies.AddRange(
            new Company
            {
                Id = Guid.NewGuid(),
                Name = "Active Co",
                BuyerType = BuyerType.Institutional,
                CreatedAt = DateTimeOffset.UtcNow,
            },
            new Company
            {
                Id = Guid.NewGuid(),
                Name = "Archived Co",
                BuyerType = BuyerType.Individual,
                CreatedAt = DateTimeOffset.UtcNow,
                DeletedAt = DateTimeOffset.UtcNow,
            });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListCompaniesAsync(true, CancellationToken.None);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task ListCompanies_returns_correct_member_count()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Co",
            BuyerType = BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        context.Contacts.AddRange(
            new Contact { Id = Guid.NewGuid(), Name = "Alice", CompanyId = company.Id, CreatedAt = DateTimeOffset.UtcNow },
            new Contact { Id = Guid.NewGuid(), Name = "Bob", CompanyId = company.Id, CreatedAt = DateTimeOffset.UtcNow },
            new Contact { Id = Guid.NewGuid(), Name = "Deleted", CompanyId = company.Id, CreatedAt = DateTimeOffset.UtcNow, DeletedAt = DateTimeOffset.UtcNow }
        );
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ListCompaniesAsync(false, CancellationToken.None);

        Assert.Single(result);
        Assert.Equal(2, result[0].MemberCount); // excludes deleted contact
    }

    [Fact]
    public async Task GetCompanyById_returns_detail_with_contacts()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Test Co",
            BuyerType = BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        context.Contacts.Add(new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Alice",
            Email = "alice@test.co",
            CompanyId = company.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.GetCompanyByIdAsync(company.Id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Test Co", result.Name);
        Assert.Equal("Institutional", result.BuyerType);
        Assert.Single(result.Contacts);
        Assert.Equal("Alice", result.Contacts[0].Name);
    }

    [Fact]
    public async Task GetCompanyById_returns_null_for_nonexistent()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var result = await service.GetCompanyByIdAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task UpdateCompany_updates_name_and_buyer_type()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Old Name",
            BuyerType = BuyerType.Individual,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.UpdateCompanyAsync(
            company.Id,
            new UpdateCompanyDto("New Name", "Institutional", null),
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("New Name", result.Name);
        Assert.Equal("Institutional", result.BuyerType);
    }

    [Fact]
    public async Task UpdateCompany_returns_null_for_archived_company()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Archived",
            BuyerType = BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
            DeletedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.UpdateCompanyAsync(
            company.Id,
            new UpdateCompanyDto("New Name", null, null),
            CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task ArchiveCompany_sets_deleted_at_and_keeps_contacts_linked()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "To Archive",
            BuyerType = BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        var contact = new Contact
        {
            Id = Guid.NewGuid(),
            Name = "Member",
            CompanyId = company.Id,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        context.Contacts.Add(contact);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ArchiveCompanyAsync(company.Id, CancellationToken.None);

        Assert.True(result);

        // Verify company is archived
        var archived = await context.Companies.FindAsync(company.Id);
        Assert.NotNull(archived!.DeletedAt);

        // Verify contact still linked
        var linkedContact = await context.Contacts.FindAsync(contact.Id);
        Assert.Equal(company.Id, linkedContact!.CompanyId);
    }

    [Fact]
    public async Task ArchiveCompany_returns_false_for_already_archived()
    {
        await using var context = CreateContext();
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Already Archived",
            BuyerType = BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
            DeletedAt = DateTimeOffset.UtcNow,
        };
        context.Companies.Add(company);
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var result = await service.ArchiveCompanyAsync(company.Id, CancellationToken.None);

        Assert.False(result);
    }

    [Fact]
    public async Task CompanyController_ListCompanies_returns_ok()
    {
        await using var context = CreateContext();
        context.Companies.Add(new Company
        {
            Id = Guid.NewGuid(),
            Name = "Test",
            BuyerType = BuyerType.Institutional,
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync();

        var service = CreateService(context);
        var controller = new CompanyController(service);

        var response = await controller.ListCompanies(false, CancellationToken.None);

        var result = Assert.IsType<OkObjectResult>(response.Result);
        var items = Assert.IsAssignableFrom<IReadOnlyList<CompanyListItemDto>>(result.Value);
        Assert.Single(items);
    }

    [Fact]
    public async Task CompanyController_GetCompany_returns_NotFound_for_missing()
    {
        await using var context = CreateContext();
        var service = CreateService(context);
        var controller = new CompanyController(service);

        var response = await controller.GetCompany(Guid.NewGuid(), CancellationToken.None);

        Assert.IsType<NotFoundResult>(response.Result);
    }

    public void Dispose()
    {
        File.Delete(_databasePath);
    }

    private CompanyService CreateService(AppDbContext context)
    {
        return new CompanyService(new CompanyRepository(context), context);
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

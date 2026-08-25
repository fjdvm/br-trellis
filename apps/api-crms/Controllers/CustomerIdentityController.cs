using api_crms.CustomerIdentity;
using api_crms.CustomerIdentity.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/customer-identity")]
public sealed class CustomerIdentityController(
    CustomerIdentityService customerIdentityService,
    CustomerIdentityDbContext dbContext) : ControllerBase
{
    [HttpGet("health")]
    public IActionResult HealthCheck()
    {
        return Ok();
    }

    [HttpPost("resolve-or-create")]
    public async Task<ActionResult<ResolveOrCreateCustomerResult>> ResolveOrCreateCustomer(
        ResolveOrCreateCustomerCommand command,
        CancellationToken cancellationToken)
    {
        var result = await customerIdentityService.ResolveOrCreateCustomerAsync(
            command,
            cancellationToken);
        return Ok(result);
    }

    [HttpGet("customers")]
    public async Task<ActionResult<IReadOnlyList<CustomerListItem>>> ListCustomers(
        CancellationToken cancellationToken)
    {
        var customers = await dbContext.Customers
            .AsNoTracking()
            .Include(customer => customer.SourceReferences)
            .Where(customer => customer.DeletedAt == null)
            .OrderBy(customer => customer.Name)
            .ToListAsync(cancellationToken);

        return Ok(customers.Select(customer => new CustomerListItem(
            customer.Id,
            customer.Name,
            customer.Email,
            customer.Phone,
            customer.SourceReferences
                .Where(reference => reference.DeletedAt == null)
                .OrderBy(reference => reference.SourceSystem)
                .Select(reference => new CustomerSourceReference(
                    reference.SourceSystem,
                    reference.SourceId))
                .ToList())).ToList());
    }
}

public sealed record CustomerListItem(
    Guid Id,
    string? Name,
    string? Email,
    string? Phone,
    IReadOnlyList<CustomerSourceReference> SourceReferences);

public sealed record CustomerSourceReference(string SourceSystem, string SourceId);

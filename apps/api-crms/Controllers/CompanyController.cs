using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/companies")]
public sealed class CompanyController(ICompanyService companyService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CompanyListItemDto>>> ListCompanies(
        [FromQuery] bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        return Ok(await companyService.ListCompaniesAsync(includeArchived, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CompanyDetailDto>> GetCompany(
        Guid id,
        CancellationToken cancellationToken)
    {
        var company = await companyService.GetCompanyByIdAsync(id, cancellationToken);
        return company is null ? NotFound() : Ok(company);
    }

    [HttpPost]
    public async Task<ActionResult<CompanyDetailDto>> CreateCompany(
        CreateCompanyDto input,
        CancellationToken cancellationToken)
    {
        var company = await companyService.CreateCompanyAsync(input, cancellationToken);
        return CreatedAtAction(nameof(GetCompany), new { id = company.Id }, company);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CompanyDetailDto>> UpdateCompany(
        Guid id,
        UpdateCompanyDto input,
        CancellationToken cancellationToken)
    {
        var company = await companyService.UpdateCompanyAsync(id, input, cancellationToken);
        return company is null ? NotFound() : Ok(company);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> ArchiveCompany(
        Guid id,
        CancellationToken cancellationToken)
    {
        var archived = await companyService.ArchiveCompanyAsync(id, cancellationToken);
        return archived ? NoContent() : NotFound();
    }
}

using api_crms.Authorization;
using api_crms.DTOs;
using api_crms.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace api_crms.Controllers;

[ApiController]
[Route("api/v1/products")]
[Authorize(Policy = CrmPermissionPolicies.EcommerceCanRead)]
public sealed class ProductController(IProductService productService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductListItemDto>>> ListProducts(
        CancellationToken cancellationToken)
    {
        return Ok(await productService.ListProductsAsync(cancellationToken));
    }
}

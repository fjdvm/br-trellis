namespace ApiOos.DTOs.Responses;

using ApiOos.Enums;
using ApiOos.Models;


public record ProductDto(
    Guid Id,
    string Name,
    string Description,
    decimal Price,
    List<string> Images,
    int Stock,
    ProductCategory Category,
    string SKU,
    bool IsActive
);

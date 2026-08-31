namespace ApiOos.DTOs.Requests;

using ApiOos.Enums;
using ApiOos.Models;


public class ProductQueryParams
{
    public ProductCategory? Category { get; set; }
    public string? Search { get; set; }
    public string? Sort { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

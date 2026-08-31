namespace ApiOos.DTOs.Responses;

public record PagedResult<T>(
    List<T> Data,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

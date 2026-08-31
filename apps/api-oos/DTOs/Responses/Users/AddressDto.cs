namespace ApiOos.DTOs.Responses.Users;

public record AddressDto(
    Guid Id,
    string Label,
    string Street,
    string City,
    string Province,
    string PostalCode,
    string Country,
    bool IsDefault
);

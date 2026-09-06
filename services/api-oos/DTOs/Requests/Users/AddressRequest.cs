namespace ApiOos.DTOs.Requests.Users;

public record AddressRequest(
    string Label,
    string Street,
    string City,
    string Province,
    string PostalCode,
    string Country = "Philippines",
    bool IsDefault = false
);

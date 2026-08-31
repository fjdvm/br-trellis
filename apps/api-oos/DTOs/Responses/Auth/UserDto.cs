namespace ApiOos.DTOs.Responses.Auth;

public record UserDto(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    string? AvatarUrl,
    string? PreferredLanguage
);

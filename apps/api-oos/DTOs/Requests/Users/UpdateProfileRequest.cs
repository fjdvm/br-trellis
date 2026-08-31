namespace ApiOos.DTOs.Requests.Users;

public record UpdateProfileRequest(string FullName, string? PhoneNumber, string? PreferredLanguage);

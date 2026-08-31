namespace ApiOos.DTOs.Responses.Auth;

public record AuthResponse(
    string AccessToken,
    string RefreshToken,
    UserDto User
);

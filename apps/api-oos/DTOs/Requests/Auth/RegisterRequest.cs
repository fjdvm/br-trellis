namespace ApiOos.DTOs.Requests.Auth;

public record RegisterRequest(string FullName, string Email, string Password);

namespace ApiOos.DTOs.Requests.Auth;

public record ResetPasswordRequest(string Token, string NewPassword);

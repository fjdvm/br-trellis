namespace ApiOos.Interfaces.Services;

using ApiOos.DTOs.Requests.Auth;
using ApiOos.DTOs.Responses.Auth;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> RefreshAsync(string refreshToken);
    Task RevokeAsync(string refreshToken);
    Task ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(ResetPasswordRequest request);

    /// <summary>
    /// Confirms a shopper's email address using the token from the confirmation
    /// link. Idempotent: a second click on an already-verified account still
    /// succeeds so the "Verified User" page renders cleanly.
    /// </summary>
    Task VerifyEmailAsync(string token);
}

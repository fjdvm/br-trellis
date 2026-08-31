namespace ApiOos.Services;

using ApiOos.DTOs.Requests.Auth;
using ApiOos.DTOs.Responses.Auth;
using ApiOos.Exceptions;
using ApiOos.Helpers;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Models;
using BCrypt.Net;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtTokenHelper _jwtTokenHelper;
    private readonly ISentraCxService _sentraCxService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        JwtTokenHelper jwtTokenHelper,
        ISentraCxService sentraCxService,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _jwtTokenHelper = jwtTokenHelper;
        _sentraCxService = sentraCxService;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
        {
            throw new ConflictException("Email is already registered.");
        }

        var passwordHash = BCrypt.HashPassword(request.Password);
        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email.ToLower(),
            PasswordHash = passwordHash,
            RefreshToken = _jwtTokenHelper.GenerateRefreshToken(),
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(7)
        };

        await _userRepository.CreateAsync(user);

        // Notify SentraCX CRM so the customer profile is created
        try
        {
            await _sentraCxService.EnsureCustomerSignupAsync(user.Id, user.FullName, user.Email);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to sync new user {UserId} to SentraCX CRM.", user.Id);
        }

        var accessToken = _jwtTokenHelper.GenerateAccessToken(user);
        var userDto = MapToUserDto(user);

        return new AuthResponse(accessToken, user.RefreshToken!, userDto);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null || !BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        user.RefreshToken = _jwtTokenHelper.GenerateRefreshToken();
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userRepository.UpdateAsync(user);

        var accessToken = _jwtTokenHelper.GenerateAccessToken(user);
        var userDto = MapToUserDto(user);

        return new AuthResponse(accessToken, user.RefreshToken, userDto);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken);
        if (user == null || user.RefreshTokenExpiry == null || user.RefreshTokenExpiry <= DateTime.UtcNow)
        {
            throw new UnauthorizedException("Invalid or expired refresh token.");
        }

        user.RefreshToken = _jwtTokenHelper.GenerateRefreshToken();
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _userRepository.UpdateAsync(user);

        var accessToken = _jwtTokenHelper.GenerateAccessToken(user);
        var userDto = MapToUserDto(user);

        return new AuthResponse(accessToken, user.RefreshToken, userDto);
    }

    public async Task RevokeAsync(string refreshToken)
    {
        var user = await _userRepository.GetByRefreshTokenAsync(refreshToken);
        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _userRepository.UpdateAsync(user);
        }
    }

    public async Task ForgotPasswordAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        if (user == null)
        {
            // For security, do not disclose whether user exists or not
            return;
        }

        var token = Guid.NewGuid().ToString("N");
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddMinutes(30);
        await _userRepository.UpdateAsync(user);

        _logger.LogInformation("Password reset token generated for {Email}: {Token}", user.Email, token);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userRepository.GetByResetTokenAsync(request.Token);
        if (user == null || user.PasswordResetTokenExpiry == null || user.PasswordResetTokenExpiry <= DateTime.UtcNow)
        {
            throw new AppException("Invalid or expired password reset token.");
        }

        user.PasswordHash = BCrypt.HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        await _userRepository.UpdateAsync(user);
    }

    private static UserDto MapToUserDto(User user)
    {
        return new UserDto(
            user.Id,
            user.FullName,
            user.Email,
            user.PhoneNumber,
            user.AvatarUrl,
            user.PreferredLanguage
        );
    }
}

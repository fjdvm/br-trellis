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
    private readonly IEcommerceWebhookClient _ecommerceWebhookClient;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        JwtTokenHelper jwtTokenHelper,
        IEcommerceWebhookClient ecommerceWebhookClient,
        IEmailSender emailSender,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _jwtTokenHelper = jwtTokenHelper;
        _ecommerceWebhookClient = ecommerceWebhookClient;
        _emailSender = emailSender;
        _configuration = configuration;
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
        var verificationToken = Guid.NewGuid().ToString("N");
        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email.ToLower(),
            PasswordHash = passwordHash,
            RefreshToken = _jwtTokenHelper.GenerateRefreshToken(),
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(7),
            IsEmailVerified = false,
            EmailVerificationToken = verificationToken,
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddDays(1)
        };

        await _userRepository.CreateAsync(user);

        // Send the account-confirmation email. Best-effort: a mail failure must not
        // fail signup — the shopper can still request a new link later.
        await SendEmailConfirmationAsync(user);

        // Eagerly notify api-crms so the new customer surfaces in CRM Contacts
        // immediately (resolved via ContactIdentityService). Best-effort: a CRM
        // outage must never fail signup — api-crms is a passive receiver.
        await DispatchCustomerCreatedAsync(user);

        var accessToken = _jwtTokenHelper.GenerateAccessToken(user);
        var userDto = MapToUserDto(user);

        return new AuthResponse(accessToken, user.RefreshToken!, userDto);
    }

    private async Task SendEmailConfirmationAsync(User user)
    {
        try
        {
            var baseUrl = _configuration["WebShop:BaseUrl"] ?? "https://localhost:3012";
            baseUrl = baseUrl.TrimEnd('/');
            var confirmationUrl = $"{baseUrl}/verify-email?token={user.EmailVerificationToken}";

            await _emailSender.SendEmailConfirmationAsync(
                user.Email, user.FullName, confirmationUrl);
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception, "Failed to send confirmation email for {UserId}.", user.Id);
        }
    }

    private async Task DispatchCustomerCreatedAsync(User user)
    {
        try
        {
            await _ecommerceWebhookClient.SendAsync(new ApiOos.DTOs.Webhooks.EcommerceWebhookEvent
            {
                EventId = Guid.NewGuid().ToString(),
                EventType = "customer.created",
                Data = new ApiOos.DTOs.Webhooks.EcommerceWebhookData
                {
                    CustomerEmail = user.Email,
                    Name = user.FullName,
                    OccurredAt = user.CreatedAt.ToUniversalTime().ToString("O"),
                },
            });
        }
        catch (Exception exception)
        {
            _logger.LogWarning(
                exception, "Failed to deliver customer.created webhook for {UserId}.", user.Id);
        }
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

    public async Task VerifyEmailAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new AppException("Invalid or expired confirmation link.");
        }

        var user = await _userRepository.GetByEmailVerificationTokenAsync(token);
        if (user == null)
        {
            throw new AppException("Invalid or expired confirmation link.");
        }

        // Idempotent: already-verified accounts still resolve successfully so a
        // repeat click on the link renders the "Verified User" page cleanly.
        if (user.IsEmailVerified)
        {
            return;
        }

        if (user.EmailVerificationTokenExpiry == null ||
            user.EmailVerificationTokenExpiry <= DateTime.UtcNow)
        {
            throw new AppException("Invalid or expired confirmation link.");
        }

        user.IsEmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;
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

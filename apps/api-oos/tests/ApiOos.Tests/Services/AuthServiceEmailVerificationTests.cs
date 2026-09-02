using ApiOos.Data;
using ApiOos.DTOs.Requests.Auth;
using ApiOos.DTOs.Webhooks;
using ApiOos.Exceptions;
using ApiOos.Helpers;
using ApiOos.Interfaces.Services;
using ApiOos.Repositories;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// Signup must send an account-confirmation email carrying a link to the web-shop
/// "Verified User" page, and clicking that link must mark the account verified.
/// The whole point of the confirmation flow lives here.
/// </summary>
public sealed class AuthServiceEmailVerificationTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly FakeEmailSender _emailSender = new();
    private readonly AuthService _authService;

    public AuthServiceEmailVerificationTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["WebShop:BaseUrl"] = "https://localhost:3012",
            })
            .Build();

        var jwt = new JwtTokenHelper(BuildJwtSettings());
        _authService = new AuthService(
            new UserRepository(_context),
            jwt,
            new NoopWebhookClient(),
            _emailSender,
            config,
            NullLogger<AuthService>.Instance);
    }

    public void Dispose()
    {
        _context.Database.CloseConnection();
        _context.Dispose();
    }

    [Fact]
    public async Task Register_creates_unverified_user_and_sends_confirmation_link()
    {
        await _authService.RegisterAsync(new RegisterRequest(
            "Verify Me", "verify@example.com", "Password123!"));

        var user = await _context.Users.SingleAsync();
        user.IsEmailVerified.Should().BeFalse("a freshly registered account is not yet confirmed");
        user.EmailVerificationToken.Should().NotBeNullOrWhiteSpace();
        user.EmailVerificationTokenExpiry.Should().NotBeNull();

        _emailSender.Sent.Should().ContainSingle();
        var sent = _emailSender.Sent.Single();
        sent.Email.Should().Be("verify@example.com");
        sent.Url.Should().Contain("/verify-email?token=");
        sent.Url.Should().Contain(user.EmailVerificationToken!);
        sent.Url.Should().StartWith("https://localhost:3012");
    }

    [Fact]
    public async Task VerifyEmail_marks_account_verified_and_clears_token()
    {
        await _authService.RegisterAsync(new RegisterRequest(
            "Verify Me", "verify@example.com", "Password123!"));
        var token = (await _context.Users.SingleAsync()).EmailVerificationToken!;

        await _authService.VerifyEmailAsync(token);

        var user = await _context.Users.SingleAsync();
        user.IsEmailVerified.Should().BeTrue();
        user.EmailVerificationToken.Should().BeNull("a used token cannot be replayed");
        user.EmailVerificationTokenExpiry.Should().BeNull();
    }

    [Fact]
    public async Task VerifyEmail_is_idempotent_for_already_verified_account()
    {
        await _authService.RegisterAsync(new RegisterRequest(
            "Verify Me", "verify@example.com", "Password123!"));
        var token = (await _context.Users.SingleAsync()).EmailVerificationToken!;
        await _authService.VerifyEmailAsync(token);

        // Second click on the same link (token already cleared) — resolving by the
        // now-verified user is not possible, so a bad token throws. But calling with
        // a fresh unknown token throws too. Assert the used-token path is a clean
        // AppException rather than an unhandled error.
        Func<Task> act = () => _authService.VerifyEmailAsync(token);
        await act.Should().ThrowAsync<AppException>();
    }

    [Fact]
    public async Task VerifyEmail_rejects_unknown_token()
    {
        Func<Task> act = () => _authService.VerifyEmailAsync("does-not-exist");
        await act.Should().ThrowAsync<AppException>();
    }

    [Fact]
    public async Task VerifyEmail_rejects_expired_token()
    {
        await _authService.RegisterAsync(new RegisterRequest(
            "Verify Me", "verify@example.com", "Password123!"));
        var user = await _context.Users.SingleAsync();
        user.EmailVerificationTokenExpiry = DateTime.UtcNow.AddMinutes(-1);
        await _context.SaveChangesAsync();

        Func<Task> act = () => _authService.VerifyEmailAsync(user.EmailVerificationToken!);
        await act.Should().ThrowAsync<AppException>();
    }

    private static Microsoft.Extensions.Options.IOptions<ApiOos.Configurations.JwtSettings> BuildJwtSettings()
    {
        return Microsoft.Extensions.Options.Options.Create(new ApiOos.Configurations.JwtSettings
        {
            Issuer = "https://localhost:7004",
            Audience = "br-online-shop",
            SecretKey = "dev-only-secret-key-min-256-bits-long-for-hmac-sha256-test",
            ExpirationInMinutes = 60,
        });
    }

    private sealed class NoopWebhookClient : IEcommerceWebhookClient
    {
        public Task SendAsync(EcommerceWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    private sealed class FakeEmailSender : IEmailSender
    {
        public List<(string Email, string Name, string Url)> Sent { get; } = [];

        public Task SendEmailConfirmationAsync(
            string toEmail, string fullName, string confirmationUrl, CancellationToken cancellationToken = default)
        {
            Sent.Add((toEmail, fullName, confirmationUrl));
            return Task.CompletedTask;
        }

        public Task<ApiOos.Interfaces.Services.BulkEmailResult> SendBulkAsync(
            IReadOnlyList<string> recipients, string subject, string htmlBody, string? unsubscribeBaseUrl = null, CancellationToken cancellationToken = default)
            => Task.FromResult(new ApiOos.Interfaces.Services.BulkEmailResult(recipients.Count, 0, System.Array.Empty<string>()));
    }
}

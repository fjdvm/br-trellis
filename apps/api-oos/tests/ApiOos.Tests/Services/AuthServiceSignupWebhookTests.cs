using ApiOos.Data;
using ApiOos.DTOs.Requests.Auth;
using ApiOos.DTOs.Webhooks;
using ApiOos.Helpers;
using ApiOos.Interfaces.Services;
using ApiOos.Repositories;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// A new shop signup must surface in CRM Contacts: RegisterAsync dispatches a
/// customer.created event to api-crms's Ecommerce webhook. Delivery is best-effort —
/// a CRM outage must not fail registration.
/// </summary>
public sealed class AuthServiceSignupWebhookTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly FakeEcommerceWebhookClient _webhook = new();
    private readonly FakeEmailSender _emailSender = new();
    private readonly AuthService _authService;

    public AuthServiceSignupWebhookTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        var jwt = new JwtTokenHelper(BuildJwtSettings());
        _authService = new AuthService(
            new UserRepository(_context),
            jwt,
            _webhook,
            _emailSender,
            new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build(),
            NullLogger<AuthService>.Instance);
    }

    public void Dispose()
    {
        _context.Database.CloseConnection();
        _context.Dispose();
    }

    [Fact]
    public async Task Register_dispatches_customer_created_with_email_and_name()
    {
        await _authService.RegisterAsync(new RegisterRequest(
            "New Bie", "NewBie@Example.com", "Password123!"));

        _webhook.Sent.Should().ContainSingle();
        var evt = _webhook.Sent.Single();
        evt.EventType.Should().Be("customer.created");
        evt.Data.CustomerEmail.Should().Be("newbie@example.com", "email is normalised to lowercase on signup");
        evt.Data.Name.Should().Be("New Bie");
    }

    [Fact]
    public async Task Register_still_succeeds_when_webhook_delivery_throws()
    {
        _webhook.ThrowOnSend = true;

        var result = await _authService.RegisterAsync(new RegisterRequest(
            "Resilient", "resilient@example.com", "Password123!"));

        result.Should().NotBeNull();
        (await _context.Users.CountAsync()).Should().Be(1);
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

    private sealed class FakeEcommerceWebhookClient : IEcommerceWebhookClient
    {
        public List<EcommerceWebhookEvent> Sent { get; } = [];
        public bool ThrowOnSend { get; set; }

        public Task SendAsync(EcommerceWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
        {
            if (ThrowOnSend) throw new HttpRequestException("simulated CRM outage");
            Sent.Add(webhookEvent);
            return Task.CompletedTask;
        }
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
    }
}

using ApiOos.Data;
using ApiOos.DTOs.Requests.Users;
using ApiOos.DTOs.Webhooks;
using ApiOos.Interfaces.Services;
using ApiOos.Models;
using ApiOos.Repositories;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// Editing a shop profile must sync to CRM: UpdateMeAsync dispatches a
/// customer.updated event carrying the new name. Delivery is best-effort — a CRM
/// outage must not fail the profile edit.
/// </summary>
public sealed class UserServiceProfileWebhookTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly FakeEcommerceWebhookClient _webhook = new();
    private readonly UserService _userService;

    public UserServiceProfileWebhookTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite("DataSource=:memory:")
            .Options;
        _context = new AppDbContext(options);
        _context.Database.OpenConnection();
        _context.Database.EnsureCreated();

        _userService = new UserService(
            new UserRepository(_context), _webhook, NullLogger<UserService>.Instance);
    }

    public void Dispose()
    {
        _context.Database.CloseConnection();
        _context.Dispose();
    }

    private async Task<User> SeedUserAsync()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "shopper@example.com",
            FullName = "Old Name",
            PasswordHash = "hash",
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    [Fact]
    public async Task UpdateMe_dispatches_customer_updated_with_new_name()
    {
        var user = await SeedUserAsync();

        await _userService.UpdateMeAsync(user.Id, new UpdateProfileRequest("New Name", null, null));

        _webhook.Sent.Should().ContainSingle();
        var evt = _webhook.Sent.Single();
        evt.EventType.Should().Be("customer.updated");
        evt.Data.CustomerEmail.Should().Be("shopper@example.com");
        evt.Data.Name.Should().Be("New Name");
    }

    [Fact]
    public async Task UpdateMe_still_succeeds_when_webhook_delivery_throws()
    {
        _webhook.ThrowOnSend = true;
        var user = await SeedUserAsync();

        var result = await _userService.UpdateMeAsync(
            user.Id, new UpdateProfileRequest("New Name", null, null));

        result.FullName.Should().Be("New Name");
        (await _context.Users.FindAsync(user.Id))!.FullName.Should().Be("New Name");
    }

    [Fact]
    public async Task DeleteMe_deletes_the_user_and_dispatches_customer_deleted()
    {
        var user = await SeedUserAsync();

        await _userService.DeleteMeAsync(user.Id);

        (await _context.Users.FindAsync(user.Id)).Should().BeNull("the shop account is removed");
        _webhook.Sent.Should().ContainSingle();
        var evt = _webhook.Sent.Single();
        evt.EventType.Should().Be("customer.deleted");
        evt.Data.CustomerEmail.Should().Be("shopper@example.com");
    }

    [Fact]
    public async Task DeleteMe_still_removes_user_when_webhook_delivery_throws()
    {
        _webhook.ThrowOnSend = true;
        var user = await SeedUserAsync();

        await _userService.DeleteMeAsync(user.Id);

        (await _context.Users.FindAsync(user.Id)).Should().BeNull();
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
}

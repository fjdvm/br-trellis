namespace ApiOos.Tests.Controllers;

using System.Security.Claims;
using ApiOos.Controllers;
using ApiOos.DTOs.Requests.Support;
using ApiOos.DTOs.Responses;
using ApiOos.Interfaces.Repositories;
using ApiOos.Interfaces.Services;
using ApiOos.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

/// <summary>
/// The controller-layer mapping for the ownership-gated Conversation endpoint (#144):
/// NotFound and NotOwner must both map to an *identical* 404 (so ticket ids can't be
/// enumerated by probing), and Owner maps to 200 with the ticket + full history.
/// </summary>
public sealed class SupportControllerConversationTests
{
    private const string TicketId = "11111111-1111-1111-1111-111111111111";
    private const string UserEmail = "owner@example.com";

    [Fact]
    public async Task GetConversation_when_NotFound_returns_404()
    {
        var controller = BuildController(CustomerTicketDetail.NotFound);

        var result = await controller.GetConversation(TicketId, CancellationToken.None);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetConversation_when_NotOwner_returns_the_same_404_as_NotFound()
    {
        var notFound = await BuildController(CustomerTicketDetail.NotFound)
            .GetConversation(TicketId, CancellationToken.None);
        var notOwner = await BuildController(CustomerTicketDetail.NotOwner)
            .GetConversation(TicketId, CancellationToken.None);

        // Same result type and same (absent) body — indistinguishable to a prober.
        notOwner.Result.Should().BeOfType<NotFoundResult>();
        var notFoundStatus = (notFound.Result as NotFoundResult)!.StatusCode;
        var notOwnerStatus = (notOwner.Result as NotFoundResult)!.StatusCode;
        notOwnerStatus.Should().Be(notFoundStatus);
    }

    [Fact]
    public async Task GetConversation_when_Open_returns_200_with_ticket_and_history()
    {
        var open = CustomerTicketDetail.Open(
            TicketId,
            "[Complain] Late delivery",
            "Unclaimed",
            new List<CustomerTicketMessage>
            {
                new()
                {
                    Id = "m1", SenderType = "Contact", Content = "First",
                    SentAt = DateTimeOffset.Parse("2026-09-01T11:00:00+00:00"),
                },
                new()
                {
                    Id = "m2", SenderType = "Staff", SenderStaffName = "Amelia", Content = "Second",
                    SentAt = DateTimeOffset.Parse("2026-09-01T12:00:00+00:00"),
                },
            });

        var controller = BuildController(open);

        var result = await controller.GetConversation(TicketId, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.StatusCode.Should().Be(200);
        var dto = ok.Value.Should().BeOfType<ConversationDetailDto>().Subject;
        dto.Id.Should().Be(TicketId);
        dto.Subject.Should().Be("[Complain] Late delivery");
        dto.Status.Should().Be("Unclaimed");
        dto.State.Should().Be("open");
        dto.Messages.Select(m => m.Content).Should().ContainInOrder("First", "Second");
    }

    [Fact]
    public async Task GetConversation_when_AwaitingStaffReply_returns_200_with_no_messages()
    {
        // The waiting state must return subject/status only — never the thread (#145).
        var awaiting = CustomerTicketDetail.AwaitingStaffReply(
            TicketId, "[Complain] Late delivery", "Unclaimed");

        var controller = BuildController(awaiting);

        var result = await controller.GetConversation(TicketId, CancellationToken.None);

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.StatusCode.Should().Be(200);
        var dto = ok.Value.Should().BeOfType<ConversationDetailDto>().Subject;
        dto.State.Should().Be("awaiting-staff-reply");
        dto.Subject.Should().Be("[Complain] Late delivery");
        dto.Status.Should().Be("Unclaimed");
        dto.Messages.Should().BeEmpty();
    }

    private static SupportController BuildController(CustomerTicketDetail detail)
    {
        var reader = new FakeCustomerTicketDetailReader(detail);
        var userRepo = new FakeUserRepository(UserEmail);
        var controller = new SupportController(
            new ThrowingSupportTicketService(),
            new UnusedSupportTicketReader(),
            userRepo,
            reader);

        var userId = Guid.NewGuid();
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test")),
            },
        };
        userRepo.UserId = userId;
        return controller;
    }

    private sealed class FakeCustomerTicketDetailReader(CustomerTicketDetail detail)
        : ICustomerTicketDetailReader
    {
        public Task<CustomerTicketDetail> GetTicketDetailForCustomerAsync(
            string ticketId, string requestingEmail, CancellationToken cancellationToken = default) =>
            Task.FromResult(detail);
    }

    private sealed class FakeUserRepository(string email) : IUserRepository
    {
        public Guid UserId { get; set; }

        public Task<User?> GetByIdAsync(Guid id) =>
            Task.FromResult<User?>(new User
            {
                Id = id,
                Email = email,
                FullName = "Owner",
                PasswordHash = "hash",
            });

        public Task<User?> GetByEmailAsync(string email) => throw new NotImplementedException();
        public Task<User?> GetByRefreshTokenAsync(string token) => throw new NotImplementedException();
        public Task<User?> GetByResetTokenAsync(string token) => throw new NotImplementedException();
        public Task<User?> GetByEmailVerificationTokenAsync(string token) => throw new NotImplementedException();
        public Task<User> CreateAsync(User user) => throw new NotImplementedException();
        public Task<User> UpdateAsync(User user) => throw new NotImplementedException();
        public Task DeleteAsync(User user) => throw new NotImplementedException();
        public Task<IEnumerable<Address>> GetAddressesAsync(Guid userId) => throw new NotImplementedException();
        public Task<Address> AddAddressAsync(Address address) => throw new NotImplementedException();
        public Task<Address?> GetAddressByIdAsync(Guid addressId) => throw new NotImplementedException();
        public Task<Address> UpdateAddressAsync(Address address) => throw new NotImplementedException();
        public Task DeleteAddressAsync(Guid addressId) => throw new NotImplementedException();
    }

    private sealed class UnusedSupportTicketReader : ISupportTicketReader
    {
        public Task<IReadOnlyList<ShopperTicket>> GetTicketsByEmailAsync(
            string customerEmail, CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();
    }

    private sealed class ThrowingSupportTicketService : ISupportTicketService
    {
        public Task<SupportTicketResponseDto> CreateAsync(
            Guid userId, CreateSupportTicketRequest request, CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();
    }
}

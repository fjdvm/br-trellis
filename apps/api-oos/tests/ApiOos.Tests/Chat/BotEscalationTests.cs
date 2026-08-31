using ApiOos.Controllers;
using ApiOos.DTOs.Requests;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace ApiOos.Tests.Chat;

/// <summary>
/// Covers #126: the bot no longer calls SentraCX. A bot-phase message immediately
/// escalates to a live agent (ShouldEscalate=true) with no canned/LLM reply, and the
/// public bot endpoint requires the Identity Handshake email to have been supplied.
/// </summary>
public sealed class BotEscalationTests
{
    [Fact]
    public async Task GetBotReply_escalates_without_calling_out()
    {
        var service = new CrmChatbotService();

        var reply = await service.GetBotReplyAsync(
            new BotReplyRequestDto { UserMessage = "help", TicketId = "conv-1" }, "customer-1");

        reply.ShouldEscalate.Should().BeTrue();
        reply.Reply.Should().NotBeNullOrWhiteSpace("a short connecting-to-agent notice is returned");
    }

    [Fact]
    public async Task GetPublicBotReply_escalates()
    {
        var service = new CrmChatbotService();

        var reply = await service.GetPublicBotReplyAsync("hi");

        reply.ShouldEscalate.Should().BeTrue();
    }

    [Fact]
    public async Task PublicReply_without_handshake_email_is_rejected()
    {
        var controller = new BotController(new CrmChatbotService());

        var result = await controller.GetPublicReply(new BotReplyRequestDto
        {
            UserMessage = "anonymous message",
            // no CustomerEmail — Handshake not completed
        });

        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task PublicReply_with_handshake_email_escalates()
    {
        var controller = new BotController(new CrmChatbotService());

        var result = await controller.GetPublicReply(new BotReplyRequestDto
        {
            UserMessage = "hi",
            CustomerEmail = "guest@example.com",
        });

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        ok.Value.Should().BeOfType<ApiOos.DTOs.Responses.BotReplyResponseDto>()
            .Which.ShouldEscalate.Should().BeTrue();
    }
}

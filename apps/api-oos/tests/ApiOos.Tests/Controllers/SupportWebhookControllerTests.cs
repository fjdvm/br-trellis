namespace ApiOos.Tests.Controllers;

using System.Security.Claims;
using ApiOos.Controllers;
using ApiOos.DTOs.Responses;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

/// <summary>
/// Covers #149 (ADR 0006, Option 1): the live-agent chat "open conversation" endpoint
/// mints the conversation key as a Guid and returns it. That Guid is what the widget
/// joins the hub with and sends as the ConversationId, and api-crms ingestion adopts it
/// as the new Ticket's own id — so the value returned here must be a well-formed Guid
/// (otherwise ingestion would fall back to a generated id and the widget's key would
/// diverge from the ticket id, reintroducing the split this fix closes).
/// </summary>
public sealed class SupportWebhookControllerTests
{
    [Fact]
    public void CreateSupportTicket_returns_a_wellformed_guid_conversation_key()
    {
        var controller = BuildController(Guid.NewGuid());

        var result = controller.CreateSupportTicket();

        var ok = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var dto = ok.Value.Should().BeOfType<SupportTicketResponseDto>().Subject;
        Guid.TryParse(dto.TicketId, out _).Should().BeTrue(
            "the conversation key must be adoptable as the CRM Ticket id (ADR 0006 Option 1)");
    }

    [Fact]
    public void CreateSupportTicket_mints_a_distinct_key_per_call()
    {
        var controller = BuildController(Guid.NewGuid());

        var first = ((controller.CreateSupportTicket().Result as OkObjectResult)!.Value as SupportTicketResponseDto)!.TicketId;
        var second = ((controller.CreateSupportTicket().Result as OkObjectResult)!.Value as SupportTicketResponseDto)!.TicketId;

        first.Should().NotBe(second);
    }

    private static SupportWebhookController BuildController(Guid userId)
    {
        var controller = new SupportWebhookController
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext
                {
                    User = new ClaimsPrincipal(new ClaimsIdentity(
                        new[] { new Claim(ClaimTypes.NameIdentifier, userId.ToString()) }, "test")),
                },
            },
        };
        return controller;
    }
}

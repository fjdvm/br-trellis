using System.Net;
using System.Text;
using ApiOos.Interfaces.Services;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// Seam 1 — the actual security decision (issue #144). CustomerTicketDetailReader reads
/// a single Ticket + its messages from api-crms and resolves the requesting customer
/// against the Ticket's Contact into exactly three outcomes: NotFound, NotOwner, Owner.
/// It is deliberately unaware of any staff-reply concept — that split is #145.
/// </summary>
public sealed class CustomerTicketDetailReaderTests
{
    private const string TicketId = "11111111-1111-1111-1111-111111111111";

    private static string TicketJson(string? ownerEmail) => $$"""
    {
      "id": "{{TicketId}}",
      "subject": "[Complain] Late delivery",
      "status": "Unclaimed",
      "waitingOn": "Agent",
      "source": "Ecommerce",
      "assignedToId": null,
      "assignedToName": null,
      "assignedToEmail": null,
      "contactId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "contact": { "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "name": "Me", "email": {{(ownerEmail is null ? "null" : $"\"{ownerEmail}\"")}} },
      "createdAt": "2026-09-01T10:00:00+00:00",
      "updatedAt": "2026-09-01T10:00:00+00:00"
    }
    """;

    // Deliberately out of chronological order in the payload, to prove the reader sorts.
    private const string MessagesJson = """
    [
      {
        "id": "22222222-2222-2222-2222-222222222222",
        "ticketId": "11111111-1111-1111-1111-111111111111",
        "senderType": "Staff",
        "senderContactId": null,
        "senderStaffId": "staff-1",
        "senderStaffName": "Amelia",
        "content": "Second (staff reply)",
        "sentAt": "2026-09-01T12:00:00+00:00"
      },
      {
        "id": "33333333-3333-3333-3333-333333333333",
        "ticketId": "11111111-1111-1111-1111-111111111111",
        "senderType": "Contact",
        "senderContactId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "senderStaffId": null,
        "senderStaffName": null,
        "content": "First (customer opener)",
        "sentAt": "2026-09-01T11:00:00+00:00"
      }
    ]
    """;

    // Only the Contact's opening message — no Staff content (satisfies neither the gate).
    private const string ContactOnlyMessagesJson = """
    [
      {
        "id": "44444444-4444-4444-4444-444444444444",
        "ticketId": "11111111-1111-1111-1111-111111111111",
        "senderType": "Contact",
        "senderContactId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "senderStaffId": null,
        "senderStaffName": null,
        "content": "Only the customer opener — no staff reply yet",
        "sentAt": "2026-09-01T11:00:00+00:00"
      }
    ]
    """;

    [Fact]
    public async Task Returns_NotFound_when_ticket_does_not_exist()
    {
        var reader = BuildReader(new RouteResponses { TicketStatus = HttpStatusCode.NotFound });

        var result = await reader.GetTicketDetailForCustomerAsync(TicketId, "me@example.com");

        result.Access.Should().Be(CustomerTicketAccess.NotFound);
        result.Messages.Should().BeEmpty();
    }

    [Fact]
    public async Task Returns_NotOwner_when_email_does_not_match()
    {
        var reader = BuildReader(new RouteResponses
        {
            TicketStatus = HttpStatusCode.OK,
            TicketBody = TicketJson("owner@example.com"),
            MessagesBody = MessagesJson,
        });

        var result = await reader.GetTicketDetailForCustomerAsync(TicketId, "someone-else@example.com");

        result.Access.Should().Be(CustomerTicketAccess.NotOwner);
    }

    [Fact]
    public async Task Owner_match_is_case_insensitive()
    {
        var reader = BuildReader(new RouteResponses
        {
            TicketStatus = HttpStatusCode.OK,
            TicketBody = TicketJson("owner@example.com"),
            MessagesBody = MessagesJson,
        });

        var result = await reader.GetTicketDetailForCustomerAsync(TicketId, "OWNER@Example.com");

        // Owner + a staff reply present → Open (#145 split).
        result.Access.Should().Be(CustomerTicketAccess.Open);
    }

    [Fact]
    public async Task Returns_NotOwner_when_contact_has_no_email_on_file()
    {
        // Fail closed: a Ticket whose Contact has no email can never be matched by any
        // session, rather than becoming an access hole.
        var reader = BuildReader(new RouteResponses
        {
            TicketStatus = HttpStatusCode.OK,
            TicketBody = TicketJson(null),
            MessagesBody = MessagesJson,
        });

        var result = await reader.GetTicketDetailForCustomerAsync(TicketId, "me@example.com");

        result.Access.Should().Be(CustomerTicketAccess.NotOwner);
    }

    [Fact]
    public async Task Owner_with_a_staff_reply_returns_Open_with_full_history_in_chronological_order()
    {
        var reader = BuildReader(new RouteResponses
        {
            TicketStatus = HttpStatusCode.OK,
            TicketBody = TicketJson("owner@example.com"),
            MessagesBody = MessagesJson,
        });

        var result = await reader.GetTicketDetailForCustomerAsync(TicketId, "owner@example.com");

        result.Access.Should().Be(CustomerTicketAccess.Open);
        result.TicketId.Should().Be(TicketId);
        result.Subject.Should().Be("[Complain] Late delivery");
        result.Status.Should().Be("Unclaimed");
        result.Messages.Select(m => m.Content).Should().ContainInOrder(
            "First (customer opener)", "Second (staff reply)");
    }

    [Fact]
    public async Task Owner_with_only_contact_messages_returns_AwaitingStaffReply()
    {
        // A Conversation whose only message is the Contact's opener — the message that
        // created the ticket — does NOT satisfy the staff-reply gate (#145).
        var reader = BuildReader(new RouteResponses
        {
            TicketStatus = HttpStatusCode.OK,
            TicketBody = TicketJson("owner@example.com"),
            MessagesBody = ContactOnlyMessagesJson,
        });

        var result = await reader.GetTicketDetailForCustomerAsync(TicketId, "owner@example.com");

        result.Access.Should().Be(CustomerTicketAccess.AwaitingStaffReply);
    }

    [Fact]
    public async Task A_staff_message_while_status_is_Unclaimed_still_resolves_to_Open()
    {
        // The staff-reply gate is independent of Status: TicketJson is Unclaimed, yet a
        // Staff-authored message unlocks the Conversation to Open (#145).
        var reader = BuildReader(new RouteResponses
        {
            TicketStatus = HttpStatusCode.OK,
            TicketBody = TicketJson("owner@example.com"),
            MessagesBody = MessagesJson, // contains a Staff message
        });

        var result = await reader.GetTicketDetailForCustomerAsync(TicketId, "owner@example.com");

        result.Status.Should().Be("Unclaimed");
        result.Access.Should().Be(CustomerTicketAccess.Open);
    }

    private static ICustomerTicketDetailReader BuildReader(RouteResponses responses)
    {
        var handler = new RoutingHandler(responses);
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:5035/") };
        var factory = new StubHttpClientFactory(client);
        return new CustomerTicketDetailReader(factory, NullLogger<CustomerTicketDetailReader>.Instance);
    }

    private sealed class RouteResponses
    {
        public HttpStatusCode TicketStatus { get; init; } = HttpStatusCode.OK;
        public string TicketBody { get; init; } = "";
        public string MessagesBody { get; init; } = "[]";
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class RoutingHandler(RouteResponses responses) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var path = request.RequestUri!.AbsolutePath;
            HttpResponseMessage response;
            if (path.EndsWith("/messages", StringComparison.Ordinal))
            {
                response = new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent(responses.MessagesBody, Encoding.UTF8, "application/json"),
                };
            }
            else
            {
                response = new HttpResponseMessage(responses.TicketStatus)
                {
                    Content = new StringContent(responses.TicketBody, Encoding.UTF8, "application/json"),
                };
            }
            return Task.FromResult(response);
        }
    }
}

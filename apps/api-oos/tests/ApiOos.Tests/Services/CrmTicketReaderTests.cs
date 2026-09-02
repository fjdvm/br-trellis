using System.Net;
using System.Text;
using ApiOos.Interfaces.Services;
using ApiOos.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace ApiOos.Tests.Services;

/// <summary>
/// CrmTicketReader lists tickets from api-crms and returns only the ones belonging to
/// the signed-in shopper (matched by Contact email), with the "[Type] " subject prefix
/// stripped back to the title the shopper typed. This is what makes a submitted ticket
/// appear in the web-shop support table.
/// </summary>
public sealed class CrmTicketReaderTests
{
    private const string CrmJson = """
    [
      {
        "id": "11111111-1111-1111-1111-111111111111",
        "subject": "[Complain] Late delivery",
        "status": "Unclaimed",
        "assignedToName": null,
        "contact": { "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", "name": "Me", "email": "me@example.com" },
        "createdAt": "2026-09-01T10:00:00+00:00",
        "updatedAt": "2026-09-01T10:00:00+00:00"
      },
      {
        "id": "22222222-2222-2222-2222-222222222222",
        "subject": "[Inquiry] Where is my order",
        "status": "Claimed",
        "assignedToName": "Amelia",
        "contact": { "id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "name": "Someone Else", "email": "other@example.com" },
        "createdAt": "2026-09-02T10:00:00+00:00",
        "updatedAt": "2026-09-02T11:00:00+00:00"
      }
    ]
    """;

    [Fact]
    public async Task GetTicketsByEmail_returns_only_the_callers_tickets_with_title_cleaned()
    {
        var reader = BuildReader(HttpStatusCode.OK, CrmJson);

        var tickets = await reader.GetTicketsByEmailAsync("ME@example.com");

        tickets.Should().ContainSingle("only the caller's ticket matches (case-insensitive)");
        var ticket = tickets.Single();
        ticket.Id.Should().Be("11111111-1111-1111-1111-111111111111");
        ticket.Title.Should().Be("Late delivery", "the '[Complain] ' prefix is stripped");
        ticket.Status.Should().Be("Unclaimed");
    }

    [Fact]
    public async Task GetTicketsByEmail_returns_empty_when_crms_errors()
    {
        var reader = BuildReader(HttpStatusCode.InternalServerError, "");

        var tickets = await reader.GetTicketsByEmailAsync("me@example.com");

        tickets.Should().BeEmpty();
    }

    [Fact]
    public async Task GetTicketsByEmail_returns_empty_for_blank_email()
    {
        var reader = BuildReader(HttpStatusCode.OK, CrmJson);

        (await reader.GetTicketsByEmailAsync("")).Should().BeEmpty();
    }

    [Fact]
    public async Task GetTicketsByEmail_sets_HasStaffReplied_from_the_tickets_messages()
    {
        // The caller's ticket (11111...) has a Staff message; another ticket has none.
        var messages = new Dictionary<string, IReadOnlyList<CrmMessage>>
        {
            ["11111111-1111-1111-1111-111111111111"] = new[]
            {
                new CrmMessage { Id = "m1", SenderType = "Contact", Content = "hi", SentAt = DateTimeOffset.UtcNow },
                new CrmMessage { Id = "m2", SenderType = "Staff", Content = "reply", SentAt = DateTimeOffset.UtcNow },
            },
        };
        var reader = BuildReader(HttpStatusCode.OK, CrmJson, new StubMessageReader(messages));

        var ticket = (await reader.GetTicketsByEmailAsync("me@example.com")).Single();

        ticket.HasStaffReplied.Should().BeTrue("the ticket has a Staff-authored message");
    }

    [Fact]
    public async Task GetTicketsByEmail_HasStaffReplied_is_false_when_only_contact_messages()
    {
        var messages = new Dictionary<string, IReadOnlyList<CrmMessage>>
        {
            ["11111111-1111-1111-1111-111111111111"] = new[]
            {
                new CrmMessage { Id = "m1", SenderType = "Contact", Content = "hi", SentAt = DateTimeOffset.UtcNow },
            },
        };
        var reader = BuildReader(HttpStatusCode.OK, CrmJson, new StubMessageReader(messages));

        var ticket = (await reader.GetTicketsByEmailAsync("me@example.com")).Single();

        ticket.HasStaffReplied.Should().BeFalse("only the customer has messaged");
    }

    private static ISupportTicketReader BuildReader(
        HttpStatusCode status, string body, ICrmMessageReader? messageReader = null)
    {
        var handler = new StubHandler(status, body);
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost:5035/") };
        var factory = new StubHttpClientFactory(client);
        return new CrmTicketReader(
            factory,
            messageReader ?? new StubMessageReader(new Dictionary<string, IReadOnlyList<CrmMessage>>()),
            NullLogger<CrmTicketReader>.Instance);
    }

    private sealed class StubHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class StubMessageReader(Dictionary<string, IReadOnlyList<CrmMessage>> byTicket)
        : ICrmMessageReader
    {
        public Task<IReadOnlyList<CrmMessage>> GetMessagesSinceAsync(
            string conversationId, DateTimeOffset? since, CancellationToken cancellationToken = default) =>
            Task.FromResult(byTicket.TryGetValue(conversationId, out var m) ? m : []);
    }

    private sealed class StubHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var response = new HttpResponseMessage(status)
            {
                Content = new StringContent(body, Encoding.UTF8, "application/json"),
            };
            return Task.FromResult(response);
        }
    }
}

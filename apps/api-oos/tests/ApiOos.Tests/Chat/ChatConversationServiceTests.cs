using ApiOos.DTOs.Chat;
using ApiOos.DTOs.Webhooks;
using ApiOos.Interfaces.Services;
using ApiOos.Services;
using FluentAssertions;
using Xunit;

namespace ApiOos.Tests.Chat;

/// <summary>
/// Covers #124: a live-agent chat message sent through the hub is (a) delivered to
/// api-crms via the Tickets webhook with the correct payload AND (b) broadcast to the
/// conversation's connected clients — proving relay, not just that the webhook fired.
/// The Identity Handshake gate rejects messages with no identifying email.
/// </summary>
public sealed class ChatConversationServiceTests
{
    [Fact]
    public async Task HandleCustomerMessage_dispatches_ticket_webhook_with_message_payload()
    {
        var webhook = new FakeTicketWebhookClient();
        var broadcaster = new FakeChatBroadcaster();
        var service = new ChatConversationService(broadcaster, webhook);

        await service.HandleCustomerMessageAsync(new SendChatMessageInput
        {
            ConversationId = "conv-1",
            CustomerEmail = "Shopper@Example.com",
            CustomerName = "A Shopper",
            Content = "Where is my order?",
        });

        webhook.Sent.Should().ContainSingle();
        var evt = webhook.Sent.Single();
        evt.EventType.Should().Be("ticket.message.received");
        evt.EventId.Should().NotBeNullOrWhiteSpace();
        evt.Data.ConversationId.Should().Be("conv-1");
        evt.Data.CustomerEmail.Should().Be("shopper@example.com", "email is normalised to lowercase");
        evt.Data.MessageBody.Should().Be("Where is my order?");
    }

    [Fact]
    public async Task HandleCustomerMessage_broadcasts_message_to_conversation()
    {
        var webhook = new FakeTicketWebhookClient();
        var broadcaster = new FakeChatBroadcaster();
        var service = new ChatConversationService(broadcaster, webhook);

        var result = await service.HandleCustomerMessageAsync(new SendChatMessageInput
        {
            ConversationId = "conv-1",
            CustomerEmail = "shopper@example.com",
            Content = "Hello there",
        });

        // (b) the message is observable on the hub for the conversation.
        broadcaster.Broadcasts.Should().ContainSingle();
        var (conversationId, message) = broadcaster.Broadcasts.Single();
        conversationId.Should().Be("conv-1");
        message.Content.Should().Be("Hello there");
        message.SenderType.Should().Be("customer");
        message.Id.Should().Be(result.Id);
    }

    [Fact]
    public async Task HandleCustomerMessage_without_email_is_rejected_and_sends_nothing()
    {
        var webhook = new FakeTicketWebhookClient();
        var broadcaster = new FakeChatBroadcaster();
        var service = new ChatConversationService(broadcaster, webhook);

        var act = () => service.HandleCustomerMessageAsync(new SendChatMessageInput
        {
            ConversationId = "conv-1",
            CustomerEmail = "   ",
            Content = "sneaky anonymous message",
        });

        await act.Should().ThrowAsync<ArgumentException>();
        webhook.Sent.Should().BeEmpty();
        broadcaster.Broadcasts.Should().BeEmpty();
    }

    [Fact]
    public async Task HandleCustomerMessage_without_content_is_rejected()
    {
        var service = new ChatConversationService(
            new FakeChatBroadcaster(), new FakeTicketWebhookClient());

        var act = () => service.HandleCustomerMessageAsync(new SendChatMessageInput
        {
            ConversationId = "conv-1",
            CustomerEmail = "shopper@example.com",
            Content = "   ",
        });

        await act.Should().ThrowAsync<ArgumentException>();
    }

    private sealed class FakeTicketWebhookClient : ITicketWebhookClient
    {
        public List<TicketWebhookEvent> Sent { get; } = [];

        public Task SendAsync(TicketWebhookEvent webhookEvent, CancellationToken cancellationToken = default)
        {
            Sent.Add(webhookEvent);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeChatBroadcaster : IChatBroadcaster
    {
        public List<(string ConversationId, ChatMessageDto Message)> Broadcasts { get; } = [];

        public Task BroadcastMessageAsync(
            string conversationId, ChatMessageDto message, CancellationToken cancellationToken = default)
        {
            Broadcasts.Add((conversationId, message));
            return Task.CompletedTask;
        }
    }
}
